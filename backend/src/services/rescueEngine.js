const axios = require('axios');
const Crop = require('../models/Crop');
const Farm = require('../models/Farm');
const FarmerProfile = require('../models/FarmerProfile');
const CropCycle = require('../models/CropCycle');
const CropListing = require('../models/CropListing');
const MarketPrice = require('../models/MarketPrice');
const BuyerDemand = require('../models/BuyerDemand');
const RescueRecommendation = require('../models/RescueRecommendation');

// ── Perishability & Baseline Shelf Life in Days at standard conditions ────────
const CROP_SHELF_LIFE_DAYS = {
  // Highly Perishable (2 - 5 days)
  'Spinach': 2.5,
  'Amaranth': 2.5,
  'Coriander': 3.0,
  'Tomato': 6.0,
  'Capsicum': 7.0,
  'Strawberry': 3.5,
  'Mushroom': 2.5,
  'Grapes': 6.0,
  'Banana': 7.0,
  'Papaya': 6.0,
  'Guava': 6.0,
  'Cucumber': 5.0,
  'Bitter Gourd': 5.0,
  'Bottle Gourd': 6.0,
  'Ridge Gourd': 5.0,
  'Snake Gourd': 5.0,
  'Okra': 4.0,
  'Beans': 6.0,
  'Peas': 5.0,
  'Cauliflower': 7.0,
  'Cabbage': 10.0,
  'Eggplant': 6.0,
  'Brinjal': 6.0,
  'Drumstick': 7.0,

  // Semi Perishable (10 - 30 days)
  'Carrot': 14.0,
  'Radish': 10.0,
  'Beetroot': 18.0,
  'Ash Gourd': 25.0,
  'Pumpkin': 30.0,
  'Sweet Potato': 25.0,
  'Yam': 35.0,
  'Ginger': 30.0,
  'Garlic': 60.0,
  'Onion': 45.0,
  'Potato': 45.0,
  'Amla': 15.0,
  'Pomegranate': 20.0,
  'Orange': 18.0,
  'Lemon': 20.0,

  // Durable / Grains / Pulses / Oilseeds (60 - 365 days)
  'Rice': 180.0,
  'Paddy': 180.0,
  'Wheat': 180.0,
  'Maize': 120.0,
  'Barley': 180.0,
  'Sorghum': 180.0,
  'Pearl Millet': 180.0,
  'Finger Millet': 240.0,
  'Chickpea': 240.0,
  'Pigeon Pea': 240.0,
  'Green Gram': 240.0,
  'Black Gram': 240.0,
  'Groundnut': 120.0,
  'Soybean': 180.0,
  'Mustard': 240.0,
  'Cotton': 180.0,
  'Turmeric': 240.0,
  'Chilli': 90.0,
  'Coconut': 60.0,
};

// ── Great-circle Haversine Distance (km) ──────────────────────────────────────
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 25; // fallback default
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// ── Live Weather Fetch via Open-Meteo ─────────────────────────────────────────
async function fetchLiveWeather(lat, lng) {
  if (!lat || !lng) return null;
  try {
    const res = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lng,
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
        daily: 'precipitation_sum,precipitation_probability_max,temperature_2m_max',
        timezone: 'Asia/Kolkata',
        forecast_days: 3,
      },
      timeout: 6000,
    });

    const current = res.data?.current || {};
    const daily = res.data?.daily || {};

    const temp = current.temperature_2m ?? 28;
    const humidity = current.relative_humidity_2m ?? 65;
    const rainSum = daily.precipitation_sum?.[0] ?? 0;
    const rainProb = daily.precipitation_probability_max?.[0] ?? 10;

    const alerts = [];
    if (rainSum > 10 || rainProb > 65) alerts.push(`High rainfall probability (${rainProb}% / ${rainSum}mm)`);
    if (temp > 37) alerts.push(`Extreme heat stress (${temp}°C)`);
    if (humidity > 80) alerts.push(`High humidity (${humidity}%) accelerating microbial spoilage`);

    return {
      temperature: temp,
      humidity,
      precipitationSum: rainSum,
      precipitationProb: rainProb,
      alerts,
      source: 'Open-Meteo Live API',
      timestamp: new Date(),
    };
  } catch (err) {
    console.warn('Weather fetch error in rescueEngine:', err.message);
    return null;
  }
}

// ── Fetch Live Market Prices for Crop ─────────────────────────────────────────
async function fetchLiveMarketData(cropName, district, state) {
  const clean = cropName.trim();
  const query = {
    $or: [
      { crop: new RegExp(`^${clean}$`, 'i') },
      { commodity: new RegExp(`^${clean}$`, 'i') },
    ],
  };

  // 1. Try local district first
  let prices = await MarketPrice.find({ ...query, district: new RegExp(`^${district}$`, 'i') }).sort({ date: -1 }).limit(10);

  // 2. If empty, search within state
  if (!prices || prices.length === 0) {
    prices = await MarketPrice.find({ ...query, state: new RegExp(`^${state}$`, 'i') }).sort({ date: -1 }).limit(15);
  }

  // 3. If still empty, search all recent prices for this crop
  if (!prices || prices.length === 0) {
    prices = await MarketPrice.find(query).sort({ date: -1 }).limit(15);
  }

  if (!prices || prices.length === 0) {
    return {
      available: false,
      currentPrice: null,
      minPrice: null,
      maxPrice: null,
      modalPrice: null,
      priceTrend: 'stable',
      trendPct: 0,
      mandis: [],
      source: 'Data unavailable',
      timestamp: null,
    };
  }

  // Calculate modal, min, max
  const sortedByPrice = [...prices].sort((a, b) => (b.modalPrice || 0) - (a.modalPrice || 0));
  const currentPrice = prices[0].modalPrice || prices[0].minPrice || 25;
  const minPrice = Math.min(...prices.map(p => p.minPrice || p.modalPrice));
  const maxPrice = Math.max(...prices.map(p => p.maxPrice || p.modalPrice));

  // Determine trend by comparing latest with older price entries
  let trend = 'stable';
  let trendPct = 0;
  if (prices.length >= 2) {
    const latest = prices[0].modalPrice || prices[0].minPrice;
    const previous = prices[prices.length - 1].modalPrice || prices[prices.length - 1].minPrice;
    if (previous > 0) {
      trendPct = Math.round(((latest - previous) / previous) * 100 * 10) / 10;
      if (trendPct <= -5) trend = 'falling';
      else if (trendPct >= 5) trend = 'rising';
    }
  }

  return {
    available: true,
    currentPrice,
    minPrice,
    maxPrice,
    modalPrice: currentPrice,
    priceTrend: trend,
    trendPct,
    mandis: prices.map(p => ({
      market: p.market,
      district: p.district,
      state: p.state,
      modalPrice: p.modalPrice,
      minPrice: p.minPrice,
      maxPrice: p.maxPrice,
      date: p.date,
      source: p.source || 'APMC AGMARKNET Live',
    })),
    source: prices[0].source || 'APMC AGMARKNET Live',
    timestamp: prices[0].date || new Date(),
  };
}

// ── Search Live Active Buyers with Radius Expansion ───────────────────────────
async function fetchNearbyBuyers(cropName, farmLat, farmLng, district, state) {
  const clean = cropName.trim();
  
  // Find crop ID if exists
  const cropDoc = await Crop.findOne({ name: new RegExp(`^${clean}$`, 'i') });

  const orConditions = [
    { cropName: new RegExp(`^${clean}$`, 'i') },
  ];
  if (cropDoc) {
    orConditions.push({ crop: cropDoc._id });
  }

  // Find demands
  const demands = await BuyerDemand.find({
    status: 'active',
    $or: orConditions,
  }).populate('buyer', 'name organization phone email').limit(20);

  const candidateBuyers = [];

  for (const d of demands) {
    let buyerLat = d.deliveryCoordinates?.coordinates?.[1] || 11.00;
    let buyerLng = d.deliveryCoordinates?.coordinates?.[0] || 77.50;

    const distanceKm = calculateDistanceKm(farmLat, farmLng, buyerLat, buyerLng);
    const targetPrice = d.targetPriceMax || d.targetPriceMin || 30;

    candidateBuyers.push({
      demandId: d._id,
      buyerName: d.buyer?.organization || d.buyer?.name || 'Verified Agro Processor',
      contactPhone: d.buyer?.phone || '+91 98400 12345',
      requiredQuantity: d.quantity || 1000,
      offeredPrice: targetPrice,
      distanceKm,
      qualitySpecs: d.gradeRequired || 'Fair Average Quality (FAQ)',
      urgency: 'high',
      source: 'AgriConnect Verified Buyer Network',
      updatedAt: d.updatedAt || new Date(),
    });
  }

  // Sort candidate buyers by distance
  return candidateBuyers.sort((a, b) => a.distanceKm - b.distanceKm);
}

// ── Rescue Risk Engine (0 - 100) ───────────────────────────────────────────────
function calculateRescueRisk({
  cropName,
  cropAgeDays,
  storageType,
  weather,
  marketData,
  quantity,
}) {
  const baseShelfLife = CROP_SHELF_LIFE_DAYS[cropName] || 10.0;
  const drivingFactors = [];

  // 1. Crop Age & Shelf Life Factor (0 - 35 pts)
  const ageRatio = Math.min(1.5, cropAgeDays / Math.max(1, baseShelfLife));
  let ageScore = ageRatio * 35;
  if (ageRatio >= 0.8) {
    drivingFactors.push({
      type: 'shelf_life',
      severity: ageRatio >= 1.0 ? 'critical' : 'high',
      description: `Crop age is ${cropAgeDays.toFixed(1)} days (normal shelf life is ~${baseShelfLife} days).`,
    });
  } else if (ageRatio >= 0.5) {
    drivingFactors.push({
      type: 'shelf_life',
      severity: 'medium',
      description: `Crop is midway through safe shelf life (${cropAgeDays.toFixed(1)} of ${baseShelfLife} days).`,
    });
  }

  // 2. Weather & Spoilage Stress Factor (0 - 25 pts)
  let weatherScore = 5;
  if (weather) {
    const { temperature, humidity, precipitationProb, precipitationSum } = weather;
    
    // Storage modifier
    const isColdStorage = storageType === 'cold';
    const isOpenYard = storageType === 'none' || storageType === 'open';

    if (!isColdStorage) {
      if (temperature > 32) {
        weatherScore += 8;
        drivingFactors.push({
          type: 'temperature',
          severity: temperature > 36 ? 'high' : 'medium',
          description: `Ambient temperature (${temperature}°C) increases respiration and decay rate.`,
        });
      }
      if (humidity > 75) {
        weatherScore += 10;
        drivingFactors.push({
          type: 'humidity',
          severity: 'high',
          description: `Elevated humidity (${humidity}%) promotes rapid fungal and rot vulnerability.`,
        });
      }
      if (precipitationProb > 50 || precipitationSum > 5) {
        weatherScore += 7;
        drivingFactors.push({
          type: 'rain',
          severity: 'high',
          description: `Rain forecast (${precipitationProb}% probability, ${precipitationSum}mm) creates transit & loading moisture risk.`,
        });
      }
    } else {
      weatherScore = 2; // Controlled cold storage protects produce
    }

    if (isOpenYard && !isColdStorage) {
      weatherScore += 5;
      drivingFactors.push({
        type: 'storage',
        severity: 'high',
        description: 'Uncovered / open yard storage exposes lot to direct sun & weather shifts.',
      });
    }
  }

  // 3. Market & Price Crash Factor (0 - 25 pts)
  let marketScore = 5;
  if (marketData && marketData.available) {
    if (marketData.priceTrend === 'falling') {
      const drop = Math.abs(marketData.trendPct || 8);
      marketScore += Math.min(20, drop * 1.5);
      drivingFactors.push({
        type: 'price_crash',
        severity: drop >= 12 ? 'critical' : 'high',
        description: `Market price is falling by ${drop}% across nearby APMC mandis.`,
      });
    } else if (marketData.priceTrend === 'stable') {
      marketScore += 4;
    }
  } else {
    marketScore += 12;
    drivingFactors.push({
      type: 'market_absence',
      severity: 'medium',
      description: 'Local APMC mandi live bidding is inactive or data is constrained.',
    });
  }

  // 4. Quantity / Exposure Factor (0 - 15 pts)
  let quantityScore = 5;
  if (quantity > 3000) {
    quantityScore = 15;
    drivingFactors.push({
      type: 'volume_exposure',
      severity: 'medium',
      description: `Large lot volume (${quantity.toLocaleString('en-IN')} kg) requires immediate multi-buyer or bulk logistics.`,
    });
  } else if (quantity > 1000) {
    quantityScore = 10;
  }

  // Total Score (0 - 100)
  const rawScore = Math.round(ageScore + weatherScore + marketScore + quantityScore);
  const totalScore = Math.min(100, Math.max(0, rawScore));

  // Determine Level
  let level = 'LOW';
  let status = 'SAFE';
  if (totalScore >= 81) {
    level = 'CRITICAL';
    status = 'CRITICAL';
  } else if (totalScore >= 61) {
    level = 'HIGH';
    status = 'HIGH RISK';
  } else if (totalScore >= 31) {
    level = 'MEDIUM';
    status = 'MONITOR';
  }

  // Calculate Time-to-Rescue
  // Remaining Safe Hours based on remaining shelf life and risk factor
  const remainingLifeDays = Math.max(0.2, baseShelfLife - cropAgeDays);
  const weatherDeteriorationMultiplier = weather && weather.humidity > 80 ? 0.65 : 1.0;
  const safeHours = Math.round(remainingLifeDays * 24 * weatherDeteriorationMultiplier);

  let timeToRescueText = '';
  if (safeHours <= 12) {
    timeToRescueText = `🚨 Immediate Action Required: Safe selling window closes in ${safeHours} hours`;
  } else if (safeHours <= 36) {
    timeToRescueText = `Estimated safe selling window: ${safeHours} hours`;
  } else {
    const days = Math.round(safeHours / 24);
    timeToRescueText = `Safe selling window: ~${days} days remaining`;
  }

  return {
    score: totalScore,
    level,
    status,
    drivingFactors,
    safeHours,
    timeToRescueText,
    baseShelfLifeDays: baseShelfLife,
  };
}

// ── Calculate Net Recovery for Rescue Options ─────────────────────────────────
function buildRescueOptions({
  cropName,
  quantity,
  currentPrice,
  farmLat,
  farmLng,
  buyers,
  mandis,
  storageType,
  riskScore,
}) {
  const options = [];
  const handlingRatePerKg = 1.2; // ₹1.2/kg standard APMC handling
  const transportRatePerTonKm = 8.5; // ₹8.5 per ton per km
  const storageCostPerDayPerKg = storageType === 'cold' ? 0.15 : 0.04;
  const price = currentPrice || 25;

  // 1. Evaluate Direct Buyers & Processors
  for (const b of buyers) {
    const distance = Math.max(5, b.distanceKm || 15);
    const transportCost = Math.round(((distance * transportRatePerTonKm) / 1000) * quantity);
    const handlingCost = Math.round(handlingRatePerKg * quantity);
    
    // Direct buyer takes immediate delivery -> minimal spoilage loss (0.5% - 2%)
    const spoilagePct = Math.min(0.08, 0.008 + (distance > 50 ? 0.015 : 0.005));
    const saleableQty = quantity * (1 - spoilagePct);
    const grossRev = Math.round(saleableQty * b.offeredPrice);
    const spoilageLoss = Math.round(quantity * spoilagePct * b.offeredPrice);
    const netRecovery = grossRev - transportCost - handlingCost;

    options.push({
      type: 'direct_buyer',
      actionCategory: 'SELL NOW',
      title: `Direct Sale: ${b.buyerName}`,
      channelName: b.buyerName,
      buyerId: b.demandId,
      contactPhone: b.contactPhone,
      distanceKm: distance,
      pricePerKg: b.offeredPrice,
      grossRevenue: grossRev,
      transportCost,
      handlingCost,
      storageCost: 0,
      spoilageLoss,
      spoilagePct: Math.round(spoilagePct * 100 * 10) / 10,
      expectedNetRecovery: netRecovery,
      netPerKg: Math.round((netRecovery / quantity) * 100) / 100,
      riskRating: distance <= 30 ? 'Low' : 'Medium',
      rationale: `Procurement contract with ${b.buyerName} at ₹${b.offeredPrice}/kg. Direct dispatch bypasses mandi queue delays and minimizes transit spoilage.`,
      source: b.source,
      timestamp: b.updatedAt,
    });
  }

  // 2. Evaluate APMC Mandis & Alternate Markets
  for (const m of mandis) {
    const distance = 28; // regional transport distance
    const transportCost = Math.round(((distance * transportRatePerTonKm) / 1000) * quantity);
    const handlingCost = Math.round(handlingRatePerKg * quantity);
    
    // APMC mandi auction queue spoilage (2.5% - 4%)
    const spoilagePct = 0.028;
    const saleableQty = quantity * (1 - spoilagePct);
    const mandiPrice = m.modalPrice || price;
    const grossRev = Math.round(saleableQty * mandiPrice);
    const spoilageLoss = Math.round(quantity * spoilagePct * mandiPrice);
    const netRecovery = grossRev - transportCost - handlingCost;

    const isAlternate = distance > 35;

    options.push({
      type: 'apmc_mandi',
      actionCategory: isAlternate ? 'SELL TO ALTERNATE MARKET' : 'SELL NOW',
      title: `${isAlternate ? 'Alternate Market' : 'Nearby APMC Mandi'}: ${m.market}`,
      channelName: m.market,
      distanceKm: distance,
      pricePerKg: mandiPrice,
      grossRevenue: grossRev,
      transportCost,
      handlingCost,
      storageCost: 0,
      spoilageLoss,
      spoilagePct: Math.round(spoilagePct * 100 * 10) / 10,
      expectedNetRecovery: netRecovery,
      netPerKg: Math.round((netRecovery / quantity) * 100) / 100,
      riskRating: 'Medium',
      rationale: `Open competitive bidding at ${m.market}. Daily APMC yard auction with active buyer participation.`,
      source: m.source,
      timestamp: m.date,
    });
  }

  // Rank options strictly by Expected Net Recovery
  options.sort((a, b) => b.expectedNetRecovery - a.expectedNetRecovery);

  // Assign Rank Numbers (1, 2, 3...)
  options.forEach((opt, idx) => {
    opt.rank = idx + 1;
  });

  const bestOption = options[0] || null;

  // 3. Dynamic Split-Sell Rescue Optimization
  let splitOption = null;
  if (options.length >= 2 && quantity >= 1000) {
    const topBuyer = options.find(o => o.type === 'direct_buyer');
    const topMandi = options.find(o => o.type === 'apmc_mandi');

    if (topBuyer && topMandi) {
      // Dynamically calculate ratio based on buyer required capacity
      const buyerTargetQty = topBuyer.requiredQuantity || Math.round(quantity * 0.6);
      const buyerAllocation = Math.min(quantity * 0.75, Math.max(quantity * 0.35, buyerTargetQty));
      const mandiAllocation = quantity - buyerAllocation;

      const buyerPct = Math.round((buyerAllocation / quantity) * 100);
      const mandiPct = 100 - buyerPct;

      const buyerRev = buyerAllocation * topBuyer.pricePerKg * 0.99;
      const mandiRev = mandiAllocation * topMandi.pricePerKg * 0.97;
      const splitTransport = Math.round(topBuyer.transportCost * (buyerAllocation / quantity) + topMandi.transportCost * (mandiAllocation / quantity));
      const splitHandling = Math.round(handlingRatePerKg * quantity);
      const splitNetRecovery = Math.round(buyerRev + mandiRev - splitTransport - splitHandling);

      splitOption = {
        title: `Optimized Split Liquidation (${buyerPct}% Buyer + ${mandiPct}% Mandi)`,
        actionCategory: 'SPLIT SELL',
        buyerPct,
        mandiPct,
        isOptimal: splitNetRecovery > (bestOption?.expectedNetRecovery || 0),
        channel1: {
          name: topBuyer.channelName,
          allocationPct: buyerPct,
          quantityKg: Math.round(buyerAllocation),
          pricePerKg: topBuyer.pricePerKg,
          expectedGross: Math.round(buyerRev),
        },
        channel2: {
          name: topMandi.channelName,
          allocationPct: mandiPct,
          quantityKg: Math.round(mandiAllocation),
          pricePerKg: topMandi.pricePerKg,
          expectedGross: Math.round(mandiRev),
        },
        totalGrossRevenue: Math.round(buyerRev + mandiRev),
        totalTransportCost: splitTransport,
        totalHandlingCost: splitHandling,
        totalNetRecovery: splitNetRecovery,
        netPerKg: Math.round((splitNetRecovery / quantity) * 100) / 100,
        rationale: `Allocating ${buyerPct}% (${Math.round(buyerAllocation)} kg) to ${topBuyer.channelName} locks in immediate guaranteed procurement, while sending ${mandiPct}% (${Math.round(mandiAllocation)} kg) to ${topMandi.channelName} captures competitive peak APMC auction rates.`,
      };
    }
  }

  // Determine top Recommended Action
  let recommendedAction = 'SELL NOW';
  if (riskScore <= 30) {
    recommendedAction = 'WAIT';
  } else if (splitOption && splitOption.isOptimal) {
    recommendedAction = 'SPLIT SELL';
  } else if (bestOption?.actionCategory) {
    recommendedAction = bestOption.actionCategory;
  }

  return {
    options,
    bestOption,
    alternatives: options.slice(1, 4),
    splitOption,
    recommendedAction,
  };
}

// ── Master Function: Generate Complete Rescue Radar for Farmer ─────────────────
async function generateRescueRadar(farmerId) {
  // 1. Get farmer profile and coordinates
  const profile = await FarmerProfile.findOne({ user: farmerId });
  const farms = await Farm.find({ farmer: farmerId, isActive: true });
  
  const primaryFarm = farms[0] || null;
  const farmLat = primaryFarm?.location?.coordinates?.[1] || profile?.location?.coordinates?.[1] || 11.071472;
  const farmLng = primaryFarm?.location?.coordinates?.[0] || profile?.location?.coordinates?.[0] || 77.652427;
  const district = primaryFarm?.district || profile?.district || 'Tiruppur';
  const state = primaryFarm?.state || profile?.state || 'Tamil Nadu';
  const village = primaryFarm?.village || profile?.village || 'Nathakadaiyur';

  // 2. Fetch Live Weather Context
  const weather = await fetchLiveWeather(farmLat, farmLng);

  // 3. Find All Active Crops / Cycles / Lots for this farmer
  const cycles = await CropCycle.find({ farmer: farmerId, status: { $ne: 'sold' } }).populate('crop').populate('farm');

  const monitoredCrops = [];
  let totalPotentialLoss = 0;
  let cropsAtRiskCount = 0;
  let highestRiskCrop = null;
  let maxRiskScore = -1;
  let totalOpportunities = 0;

  for (const cycle of cycles) {
    const cropName = cycle.crop?.name || 'Crop';
    const quantity = cycle.expectedYieldKg || cycle.actualYieldKg || (cycle.landArea ? cycle.landArea * 2500 : 2000);
    
    // Compute dynamic crop age from actual sowing or harvest date
    const startDate = cycle.harvestDate || cycle.sowingDate || cycle.createdAt || new Date(Date.now() - 86400000 * 3);
    const cropAgeDays = Math.max(0.5, (Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    
    const storageType = cycle.storageType || profile?.storageType || 'ambient';

    // Fetch Live Market Data
    const marketData = await fetchLiveMarketData(cropName, district, state);
    const currentPrice = marketData.currentPrice || 25;

    // Calculate Rescue Risk Score
    const risk = calculateRescueRisk({
      cropName,
      cropAgeDays,
      storageType,
      weather,
      marketData,
      quantity,
    });

    if (risk.level === 'HIGH' || risk.level === 'CRITICAL') {
      cropsAtRiskCount++;
    }

    if (risk.score > maxRiskScore) {
      maxRiskScore = risk.score;
      highestRiskCrop = {
        name: cropName,
        score: risk.score,
        level: risk.level,
      };
    }

    // Fetch Real Available Buyers & Mandis
    const candidateBuyers = await fetchNearbyBuyers(cropName, farmLat, farmLng, district, state);
    
    // Build Rescue Options & Net Recovery
    const { options, bestOption, alternatives, splitOption, recommendedAction } = buildRescueOptions({
      cropName,
      quantity,
      currentPrice,
      farmLat,
      farmLng,
      buyers: candidateBuyers,
      mandis: marketData.mandis,
      storageType,
      riskScore: risk.score,
    });

    totalOpportunities += options.length;

    // Calculate Current Revenue = Quantity × Current Market Price
    const currentRevenue = Math.round(quantity * currentPrice);
    
    // Expected Net Recovery = Best Recoverable Net Return
    const recoverableValue = bestOption ? bestOption.expectedNetRecovery : Math.round(currentRevenue * 0.7);
    
    // Potential Loss = Current Expected Value - Expected Recoverable Value
    const potentialLoss = Math.max(0, currentRevenue - recoverableValue);
    totalPotentialLoss += potentialLoss;

    // 5 Core Rescue Plan Explanations
    const waitingSpoilageKg = Math.round(quantity * (risk.level === 'CRITICAL' ? 0.20 : risk.level === 'HIGH' ? 0.12 : 0.05));
    const waitingLossRupees = Math.round(waitingSpoilageKg * currentPrice + (quantity * (marketData.priceTrend === 'falling' ? 2.5 : 0.5)));

    const rescuePlanDetails = {
      whyAtRisk: risk.drivingFactors.map(f => f.description),
      whatIfFarmerWaits: `Holding this lot for 3–5 more days under ${weather?.temperature || 28}°C and ${weather?.humidity || 65}% RH will cause ~${waitingSpoilageKg.toLocaleString('en-IN')} kg (${Math.round((waitingSpoilageKg / quantity) * 100)}%) spoilage loss and estimated financial depreciation of -₹${waitingLossRupees.toLocaleString('en-IN')}.`,
      bestActionNow: recommendedAction,
      moneySaved: potentialLoss > 0 ? potentialLoss : Math.round(currentRevenue * 0.15),
      recommendedBuyerMarket: bestOption ? `${bestOption.channelName} (${bestOption.distanceKm} km away)` : `${district} APMC Mandi`,
    };

    // Construct Monitored Item
    monitoredCrops.push({
      cycleId: cycle._id,
      cropName,
      tamilName: cycle.crop?.tamil_name || '',
      category: cycle.crop?.category || 'vegetable',
      quantityKg: quantity,
      cropAgeDays: Math.round(cropAgeDays * 10) / 10,
      storageType,
      harvestDate: cycle.harvestDate,
      sowingDate: cycle.sowingDate,
      currentStage: cycle.currentStage || 'growing',
      
      // Live Market
      marketPrice: {
        price: marketData.available ? currentPrice : null,
        trend: marketData.priceTrend,
        trendPct: marketData.trendPct,
        available: marketData.available,
        source: marketData.available ? marketData.source : 'Live data unavailable',
        timestamp: marketData.timestamp,
      },

      // Risk Engine
      risk,
      
      // Financials
      baselineValue: currentRevenue,
      recoverableValue,
      potentialLoss,

      // Recommended Action & 5 Core Questions
      recommendedAction,
      rescuePlanDetails,

      // Rescue Action Plan
      bestOption,
      alternatives,
      splitOption,
      allOptions: options,
      opportunitiesCount: options.length,
    });
  }

  // Sort monitored crops by risk score descending (highest risk first)
  monitoredCrops.sort((a, b) => b.risk.score - a.risk.score);

  return {
    farmerLocation: {
      village,
      district,
      state,
      latitude: farmLat,
      longitude: farmLng,
    },
    weather,
    summary: {
      totalMonitoredCrops: monitoredCrops.length,
      cropsAtRisk: cropsAtRiskCount,
      totalPotentialLoss,
      highestRiskCrop: highestRiskCrop || (monitoredCrops[0] ? { name: monitoredCrops[0].cropName, score: monitoredCrops[0].risk.score, level: monitoredCrops[0].risk.level } : null),
      totalRescueOpportunities: totalOpportunities,
      isAllSafe: cropsAtRiskCount === 0,
    },
    crops: monitoredCrops,
    generatedAt: new Date(),
  };
}

module.exports = {
  generateRescueRadar,
  fetchLiveWeather,
  fetchLiveMarketData,
  fetchNearbyBuyers,
  calculateRescueRisk,
  buildRescueOptions,
  CROP_SHELF_LIFE_DAYS,
};
