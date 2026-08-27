
// ─── MULTI-CROP DECISION ENGINE ───────────────────────────────────────────────
// @POST /api/ai/decision/analyze-all
// Analyzes ALL active crops for a given farm and returns ranked decisions.
exports.analyzeAllCrops = async (req, res, next) => {
  try {
    const {
      farmId,
      farmArea = 1.0,
      storageCapacity = 5000,
      storageDays = 5,
      storageType = 'ambient',
      storageCostPerUnitPerDay = 0.05,
      handlingCostPerUnit = 0.40,
      highlightCrop = '',
    } = req.body;

    if (!farmId) {
      return res.status(400).json({ success: false, message: 'farmId is required' });
    }

    const farm = await Farm.findOne({ _id: farmId, farmer: req.user._id });
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });

    const lng = farm.location?.coordinates?.[0];
    const lat = farm.location?.coordinates?.[1];

    if (!lng || !lat || (lng === 0 && lat === 0)) {
      return res.status(400).json({
        success: false,
        error: 'LOCATION_REQUIRED',
        message: 'Farm location not set. Please configure your farm coordinates in My Farm first!'
      });
    }

    // ── 1. Fetch weather ONCE (shared across all crops) ───────────────────
    let temperature = 27.0;
    let humidity = 65.0;
    let weatherAlerts = [];
    let weatherSource = 'default';
    let weatherTimestamp = null;

    try {
      const weatherRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: lat, longitude: lng,
          current: 'temperature_2m,relative_humidity_2m,weather_code',
          daily: 'precipitation_sum',
          timezone: 'Asia/Kolkata',
          forecast_days: 1
        },
        timeout: 5000
      });
      if (weatherRes.data?.current) {
        temperature = weatherRes.data.current.temperature_2m;
        humidity = weatherRes.data.current.relative_humidity_2m;
        const code = weatherRes.data.current.weather_code;
        if (code >= 51 && code <= 67) weatherAlerts.push('Light Rain');
        if (code >= 80 && code <= 99) weatherAlerts.push('Heavy Rain Storm');
        weatherSource = 'Open-Meteo';
        weatherTimestamp = new Date().toISOString();
      }
    } catch (err) {
      console.warn('Weather fetch failed in multi-crop analysis, using defaults:', err.message);
      weatherSource = 'unavailable';
    }

    // ── 2. Load ALL active crops ──────────────────────────────────────────
    const allCrops = await Crop.find({ isActive: true }).lean();
    if (allCrops.length === 0) {
      return res.status(400).json({ success: false, message: 'Crop catalog is empty. Please seed crop data.' });
    }

    // ── 3. Current season ─────────────────────────────────────────────────
    const month = new Date().getMonth() + 1;
    const currentSeason = (month >= 6 && month <= 10) ? 'kharif'
      : (month >= 11 || month <= 2) ? 'rabi'
      : 'zaid';

    // ── 4. Buyer demands (bulk, one query) ────────────────────────────────
    let demandMap = {};
    try {
      const allDemands = await BuyerDemand.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: { $toLower: '$cropName' }, count: { $sum: 1 }, totalQty: { $sum: '$quantity' }, maxPrice: { $max: '$targetPriceMax' } } }
      ]);
      allDemands.forEach(d => { demandMap[d._id] = d; });
    } catch (e) {
      console.warn('Buyer demand aggregation failed:', e.message);
    }

    // ── 5. Analyze each crop in batches ───────────────────────────────────
    const { getMarketPricesProgressive } = require('../services/agmarknetService');
    const { analyzeDecision: runEngine } = require('../services/decisionEngine');

    const batchSize = 10;
    const decisions = [];

    for (let i = 0; i < allCrops.length; i += batchSize) {
      const batch = allCrops.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(batch.map(async (crop) => {
        const cropName = crop.name;
        const avgYield = crop.avgYieldPerAcre || crop.expected_yield_range?.max || 1000;
        const quantity = (parseFloat(farmArea) || 1) * avgYield;

        // Suitability score
        let suitability = 80;
        const cropSeasons = crop.seasons || [];
        if (cropSeasons.length > 0 && !cropSeasons.includes(currentSeason) && !cropSeasons.includes('perennial')) {
          suitability -= 30;
        }
        const waterMap = { abundant: 3, adequate: 2, limited: 1, scarce: 0 };
        const cropWaterMap = { very_high: 3, high: 3, moderate: 2, low: 1, very_low: 0 };
        const farmWater = waterMap[farm.waterAvailability] ?? 2;
        const cropWater = cropWaterMap[crop.waterRequirement] ?? 2;
        if (farmWater < cropWater) suitability -= (cropWater - farmWater) * 10;
        const soilCompat = crop.soilCompatibility || crop.soil_types || [];
        if (soilCompat.length > 0 && farm.soilType && !soilCompat.map(s => s.toLowerCase()).includes(farm.soilType.toLowerCase())) {
          suitability -= 15;
        }
        const tMin = crop.optimalTemp?.min || crop.temperature_min || 15;
        const tMax = crop.optimalTemp?.max || crop.temperature_max || 40;
        if (temperature < tMin) suitability -= Math.min(20, (tMin - temperature) * 2);
        if (temperature > tMax) suitability -= Math.min(20, (temperature - tMax) * 2);
        suitability = Math.max(5, Math.min(100, Math.round(suitability)));

        const demand = demandMap[cropName.toLowerCase()] || { count: 0, totalQty: 0, maxPrice: null };

        // Progressive market search
        const marketResult = await getMarketPricesProgressive({
          crop: cropName, state: farm.state, district: farm.district
        });

        // No market data anywhere → DATA_INSUFFICIENT
        if (!marketResult.available && (!marketResult.prices || marketResult.prices.length === 0)) {
          return {
            crop: cropName,
            cropId: crop._id,
            category: crop.category,
            decision: 'DATA_INSUFFICIENT',
            decisionLabel: 'Data Insufficient',
            expectedNetReturn: null,
            riskLevel: 'unknown',
            riskScore: null,
            confidence: 15,
            reason: `Reliable market data is currently unavailable for ${cropName}. No price records found at district, state, or national level.`,
            suitability,
            buyerDemand: demand.count,
            bestMarket: null,
            marketSource: marketResult.sourceLabel || 'No data',
            searchLevel: marketResult.searchLevel || 'none',
            dataTimestamp: null,
            breakdown: null,
            forecast: null,
          };
        }

        // Run decision engine
        try {
          const result = await runEngine({
            farmLat: lat, farmLng: lng,
            crop: cropName,
            quantity,
            storageCapacity: parseFloat(storageCapacity) || 5000,
            storageDays: parseFloat(storageDays) || 5,
            storageType,
            storageCostPerKgPerDay: parseFloat(storageCostPerUnitPerDay) || 0.05,
            handlingCostPerKg: parseFloat(handlingCostPerUnit) || 0.40,
            temperature, humidity,
            rainProbability: weatherAlerts.length > 0 ? 0.8 : 0.1,
            weatherAlerts,
            historicalYieldPerAcre: avgYield,
            farmArea: parseFloat(farmArea) || 1,
            state: farm.state, district: farm.district,
          });

          if (!result.success) {
            return {
              crop: cropName,
              cropId: crop._id,
              category: crop.category,
              decision: 'DATA_INSUFFICIENT',
              decisionLabel: 'Data Insufficient',
              expectedNetReturn: null,
              riskLevel: 'unknown',
              riskScore: null,
              confidence: 15,
              reason: result.message || `Analysis could not be completed for ${cropName}.`,
              suitability,
              buyerDemand: demand.count,
              bestMarket: null,
              marketSource: marketResult.sourceLabel || 'No data',
              searchLevel: marketResult.searchLevel || 'none',
              dataTimestamp: null,
              breakdown: null,
              forecast: null,
            };
          }

          const d = result.decision;
          const engineAction = d.recommendation || 'HARVEST_NOW';
          const riskScore = d.riskScore || 0;
          const confidence = Math.round((d.confidence || 0.5) * 100);
          const netReturn = d.expectedProfit || 0;
          const bestMarket = result.markets?.[0] || null;
          const altMarket = result.markets?.[1] || null;

          // Map action → user-facing decision type
          let decisionType = 'SELL_NOW';
          let decisionLabel = 'Sell Now';

          if (riskScore > 65) {
            decisionType = 'RESCUE';
            decisionLabel = 'Rescue';
          } else if (engineAction === 'SPLIT_HARVEST') {
            decisionType = 'SPLIT_SELL';
            decisionLabel = 'Split Sell';
          } else if (engineAction.startsWith('WAIT')) {
            decisionType = 'WAIT_HOLD';
            decisionLabel = 'Wait / Hold';
          } else if (engineAction === 'HARVEST_NOW') {
            if (altMarket && bestMarket && altMarket.distanceKm && bestMarket.distanceKm && altMarket.distanceKm < bestMarket.distanceKm * 0.6) {
              decisionType = 'ALTERNATE_MARKET';
              decisionLabel = 'Sell to Alternate Market';
            } else if (demand.maxPrice && bestMarket?.currentPricePerKg && demand.maxPrice > bestMarket.currentPricePerKg * 1.05) {
              decisionType = 'FIND_BUYER';
              decisionLabel = 'Find Buyer';
            } else {
              decisionType = 'SELL_NOW';
              decisionLabel = 'Sell Now';
            }
          }

          // Flag for NOT_RECOMMENDED post-processing
          const notRecommendedCandidate = suitability < 40;

          // Cost breakdown (use real values from engine)
          const breakdown = {
            currentPrice: bestMarket?.currentPricePerKg ? Math.round(bestMarket.currentPricePerKg * 100) / 100 : null,
            futurePrice: result.forecast?.forecasts?.[3]?.price ? Math.round(result.forecast.forecasts[3].price * 100) / 100 : null,
            expectedYield: Math.round(quantity),
            grossRevenue: d.expectedRevenue ? Math.round(d.expectedRevenue) : null,
            totalCost: d.totalCost ? Math.round(d.totalCost) : null,
            transport: null, storage: null, spoilage: null,
          };
          // Try to get real cost breakdown from engine's alternative strategies
          const topAlt = result.alternatives?.[0];
          if (topAlt?.costs) {
            breakdown.transport = Math.round(topAlt.costs.transport || 0) || null;
            breakdown.storage = Math.round(topAlt.costs.storage || 0) || null;
            breakdown.spoilage = Math.round(topAlt.costs.spoilage || 0) || null;
          } else if (d.totalCost) {
            breakdown.transport = Math.round(d.totalCost * 0.35);
            breakdown.storage = Math.round(d.totalCost * 0.20);
            breakdown.spoilage = Math.round(d.totalCost * 0.25);
          }

          return {
            crop: cropName,
            cropId: crop._id,
            category: crop.category,
            decision: decisionType,
            decisionLabel,
            expectedNetReturn: Math.round(netReturn),
            riskLevel: d.riskLevel || (riskScore <= 30 ? 'low' : riskScore <= 60 ? 'medium' : 'high'),
            riskScore,
            confidence,
            reason: d.explanation || `${decisionLabel} recommended based on current market and weather conditions.`,
            suitability,
            buyerDemand: demand.count,
            bestMarket: d.bestMarket || bestMarket?.marketName || null,
            marketSource: result.marketSource?.sourceLabel || 'APMC Database',
            searchLevel: marketResult.searchLevel || 'district',
            dataTimestamp: result.marketSource?.dataTimestamp || null,
            breakdown,
            notRecommendedCandidate,
            forecast: result.forecast ? {
              day3: result.forecast.forecasts?.[3]?.price ? Math.round(result.forecast.forecasts[3].price * 100) / 100 : null,
              day7: result.forecast.forecasts?.[7]?.price ? Math.round(result.forecast.forecasts[7].price * 100) / 100 : null,
              volatility: result.forecast.volatility,
              confidence: result.forecast.confidence,
              modelType: result.forecast.modelType,
            } : null,
          };
        } catch (engineErr) {
          console.error(`Engine error for ${cropName}:`, engineErr.message);
          return {
            crop: cropName, cropId: crop._id, category: crop.category,
            decision: 'DATA_INSUFFICIENT', decisionLabel: 'Data Insufficient',
            expectedNetReturn: null, riskLevel: 'unknown', riskScore: null, confidence: 10,
            reason: `Analysis failed for ${cropName}: ${engineErr.message}`,
            suitability, buyerDemand: demand.count, bestMarket: null,
            marketSource: 'Error', searchLevel: 'none', dataTimestamp: null,
            breakdown: null, forecast: null,
          };
        }
      }));

      for (const r of batchResults) {
        if (r.status === 'fulfilled' && r.value) decisions.push(r.value);
      }
    }

    // ── 6. Post-process: NOT_RECOMMENDED ─────────────────────────────────
    const validReturns = decisions
      .filter(d => d.expectedNetReturn !== null && d.expectedNetReturn > 0)
      .map(d => d.expectedNetReturn)
      .sort((a, b) => a - b);
    const q25 = validReturns[Math.floor(validReturns.length * 0.25)] || 0;

    for (const d of decisions) {
      if (d.notRecommendedCandidate && d.decision !== 'DATA_INSUFFICIENT') {
        if (d.expectedNetReturn === null || d.expectedNetReturn <= q25) {
          d.decision = 'NOT_RECOMMENDED';
          d.decisionLabel = 'Not Recommended';
          d.reason = `Low suitability (${d.suitability}%) for current season, soil, and water conditions. Expected return is also in the bottom 25% compared to other crops — not recommended at this time.`;
        }
      }
      delete d.notRecommendedCandidate;
    }

    // ── 7. Post-process: STORE_AND_SELL ──────────────────────────────────
    for (const d of decisions) {
      if (d.decision === 'SELL_NOW' && d.forecast?.day3 && d.breakdown?.currentPrice) {
        const priceDiff = d.forecast.day3 - d.breakdown.currentPrice;
        const gainPct = (priceDiff / d.breakdown.currentPrice) * 100;
        if (gainPct > 8 && parseFloat(storageCapacity) > 0) {
          d.decision = 'STORE_AND_SELL';
          d.decisionLabel = 'Store and Sell';
          d.reason = `Price forecast shows +${gainPct.toFixed(1)}% increase in 3 days (₹${d.breakdown.currentPrice}/kg → ₹${d.forecast.day3}/kg). Storing and selling later gives better net return, given available storage capacity.`;
        }
      }
    }

    // ── 8. Sort — DATA_INSUFFICIENT last, rest by net return ─────────────
    decisions.sort((a, b) => {
      if (a.decision === 'DATA_INSUFFICIENT' && b.decision !== 'DATA_INSUFFICIENT') return 1;
      if (b.decision === 'DATA_INSUFFICIENT' && a.decision !== 'DATA_INSUFFICIENT') return -1;
      return (b.expectedNetReturn || 0) - (a.expectedNetReturn || 0);
    });
    decisions.forEach((d, i) => { d.rank = i + 1; });

    // ── 9. Summary counts ─────────────────────────────────────────────────
    const summary = {
      totalCrops: decisions.length,
      sellNow: decisions.filter(d => d.decision === 'SELL_NOW').length,
      waitHold: decisions.filter(d => d.decision === 'WAIT_HOLD').length,
      storeAndSell: decisions.filter(d => d.decision === 'STORE_AND_SELL').length,
      alternateMarket: decisions.filter(d => d.decision === 'ALTERNATE_MARKET').length,
      findBuyer: decisions.filter(d => d.decision === 'FIND_BUYER').length,
      splitSell: decisions.filter(d => d.decision === 'SPLIT_SELL').length,
      rescue: decisions.filter(d => d.decision === 'RESCUE').length,
      notRecommended: decisions.filter(d => d.decision === 'NOT_RECOMMENDED').length,
      dataInsufficient: decisions.filter(d => d.decision === 'DATA_INSUFFICIENT').length,
    };

    res.json({
      success: true,
      data: {
        decisions,
        summary,
        highlightCrop: highlightCrop || null,
        farm: { name: farm.name, district: farm.district, state: farm.state, area: parseFloat(farmArea) || 1 },
        weather: { temperature, humidity, alerts: weatherAlerts, source: weatherSource, timestamp: weatherTimestamp },
        season: currentSeason,
        generatedAt: new Date().toISOString(),
      }
    });
  } catch (err) {
    next(err);
  }
};
