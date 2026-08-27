/**
 * AgriPulse AI — Centralized Decision Engine
 * 
 * ONE engine that evaluates:
 *   HARVEST_NOW | WAIT_1D..7D | SPLIT_HARVEST
 * 
 * All calculations transparent. No hardcoded confidence/risk.
 * Calls Python AI service for forecasts, falls back to statistical models.
 */

const axios = require('axios');
const { estimateDistanceKm, calculateNetback, calculateTransportCostPerKg } = require('./transportService');
const { getMarketPricesProgressive } = require('./agmarknetService');

const AI_SERVICE = process.env.AI_SERVICE_URL || 'http://localhost:8001';

// ─── Helper: call Python AI service ───────────────────────────────────────────
async function callPythonAI(endpoint, payload) {
  try {
    const res = await axios.post(`${AI_SERVICE}${endpoint}`, payload, { timeout: 12000 });
    return { ok: true, data: res.data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ─── Statistical price forecast fallback (no random noise) ────────────────────
function statisticalPriceForecast(currentPrice, history = []) {
  const base = currentPrice || 25;
  const prices = history.length > 0 ? history : [base];
  const n = prices.length;
  
  // Rolling averages
  const r7 = prices.slice(-7).reduce((a, b) => a + b, 0) / Math.min(n, 7);
  const r30 = prices.slice(-30).reduce((a, b) => a + b, 0) / Math.min(n, 30);
  
  // Volatility (coefficient of variation of last 7 values)
  const recent = prices.slice(-7);
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const variance = recent.reduce((a, b) => a + (b - mean) ** 2, 0) / recent.length;
  const volatility = mean > 0 ? Math.sqrt(variance) / mean : 0.06;
  
  // Linear trend (slope of last 7 points)
  let slope = 0;
  if (recent.length >= 3) {
    const xMean = (recent.length - 1) / 2;
    const yMean = mean;
    let num = 0, den = 0;
    recent.forEach((y, i) => {
      num += (i - xMean) * (y - yMean);
      den += (i - xMean) ** 2;
    });
    slope = den > 0 ? num / den : 0;
  }
  
  // Forecast: linear extrapolation (NO random noise)
  const forecasts = {};
  for (const d of [1, 2, 3, 5, 7]) {
    const predicted = base + slope * d;
    const interval = base * volatility * 1.96;
    forecasts[d] = {
      day: d,
      price: Math.round(predicted * 100) / 100,
      lower: Math.round((predicted - interval) * 100) / 100,
      upper: Math.round((predicted + interval) * 100) / 100,
    };
  }
  
  // Confidence derived from data quality (NOT fixed)
  let confidence = 0.50; // base with minimal data
  if (n >= 30) confidence += 0.20;
  else if (n >= 14) confidence += 0.12;
  else if (n >= 7) confidence += 0.06;
  
  if (volatility < 0.05) confidence += 0.15;
  else if (volatility < 0.10) confidence += 0.08;
  else confidence -= 0.05;
  
  confidence = Math.min(0.92, Math.max(0.25, confidence));
  
  return {
    forecasts,
    confidence: Math.round(confidence * 100) / 100,
    volatility: Math.round(volatility * 1000) / 1000,
    r7: Math.round(r7 * 100) / 100,
    r30: Math.round(r30 * 100) / 100,
    dataPoints: n,
    modelType: 'statistical_trend',
    modelVersion: 'AgriPulse-StatForecast-v1',
  };
}

// ─── Spoilage model (deterministic, no randomness) ────────────────────────────
function estimateSpoilage({ crop, storageDays, temperature, humidity, storageType = 'ambient' }) {
  // Base daily spoilage rate varies by storage
  const storageMultiplier = { cold: 0.15, dry: 0.40, ambient: 1.0, open: 2.0 }[storageType] || 1.0;
  
  const baseDailyRate = 0.012; // 1.2% per day base
  const tempFactor = temperature > 30 ? 1 + (temperature - 30) * 0.06 : 
                     temperature > 25 ? 1.0 : 0.7;
  const humFactor = humidity > 70 ? 1 + (humidity - 70) * 0.03 : 1.0;
  
  const dailyRate = baseDailyRate * storageMultiplier * tempFactor * humFactor;
  const totalProbability = Math.min(0.95, 1 - Math.pow(1 - dailyRate, storageDays));
  
  return {
    spoilageProbability: Math.round(totalProbability * 1000) / 1000,
    dailyRate: Math.round(dailyRate * 10000) / 10000,
    factors: { storageMultiplier, tempFactor: Math.round(tempFactor * 100) / 100, humFactor: Math.round(humFactor * 100) / 100 },
  };
}

// ─── Risk Score (from real factors, not hardcoded) ────────────────────────────
function calculateRiskScore({ priceVolatility, rainProbability, spoilageProbability, marketAvailability, predictionConfidence, storageOverload }) {
  const raw =
    (priceVolatility || 0.06) * 0.20 +
    (rainProbability || 0.1) * 0.20 +
    (spoilageProbability || 0.03) * 0.25 +
    (1 - (marketAvailability || 0.9)) * 0.15 +
    (1 - (predictionConfidence || 0.5)) * 0.10 +
    (storageOverload || 0) * 0.10;
  
  const score = Math.round(raw * 100);
  return {
    score: Math.min(100, Math.max(0, score)),
    level: score <= 30 ? 'low' : score <= 60 ? 'medium' : 'high',
    factors: {
      priceVolatility: Math.round((priceVolatility || 0.06) * 100) / 100,
      rainProbability: Math.round((rainProbability || 0.1) * 100) / 100,
      spoilageProbability: Math.round((spoilageProbability || 0.03) * 100) / 100,
      marketAvailability: Math.round((marketAvailability || 0.9) * 100) / 100,
      predictionConfidence: Math.round((predictionConfidence || 0.5) * 100) / 100,
    }
  };
}

// ─── Confidence (derived from real data quality) ──────────────────────────────
function calculateConfidence({ dataFreshnessHours, historicalDataPoints, forecastConfidence, forecastHorizonDays }) {
  let score = 0;
  
  // Freshness (0.30 weight)
  if (dataFreshnessHours <= 6) score += 0.30;
  else if (dataFreshnessHours <= 24) score += 0.22;
  else if (dataFreshnessHours <= 72) score += 0.12;
  else score += 0.05;
  
  // Historical data (0.30 weight)
  if (historicalDataPoints >= 100) score += 0.30;
  else if (historicalDataPoints >= 30) score += 0.20;
  else if (historicalDataPoints >= 7) score += 0.10;
  else score += 0.03;
  
  // Model accuracy (0.25 weight)
  score += (forecastConfidence || 0.5) * 0.25;
  
  // Horizon penalty (0.15 weight)
  const horizonPenalty = Math.max(0.02, 0.15 - (forecastHorizonDays || 1) * 0.015);
  score += horizonPenalty;
  
  return Math.round(Math.min(0.95, Math.max(0.15, score)) * 100) / 100;
}

// ─── Evaluate a single strategy (sell now or wait N days at a market) ─────────
function evaluateStrategy({ action, quantity, market, currentPricePerKg, futurePricePerKg, distanceKm, waitDays, spoilageProb, handlingCostPerKg, storageCostPerKgPerDay, transportParams }) {
  const effectivePrice = waitDays > 0 ? futurePricePerKg : currentPricePerKg;
  const transport = calculateTransportCostPerKg(distanceKm, transportParams);
  const transportCostPerKg = transport.unknown ? 2.0 : transport.costPerKg; // safe default if unknown
  const storageCost = waitDays * storageCostPerKgPerDay;
  const spoilageCost = spoilageProb * effectivePrice;
  
  const saleableQty = quantity * (1 - spoilageProb);
  const grossRevenue = saleableQty * effectivePrice;
  const totalTransport = transportCostPerKg * quantity;
  const totalHandling = handlingCostPerKg * quantity;
  const totalStorage = storageCost * quantity;
  const totalSpoilageLoss = quantity * spoilageProb * effectivePrice;
  const totalCost = totalTransport + totalHandling + totalStorage + totalSpoilageLoss;
  const netProfit = grossRevenue - totalTransport - totalHandling - totalStorage;
  
  return {
    action,
    waitDays,
    marketName: market.marketName || market.market,
    marketDistrict: market.district,
    pricePerKg: Math.round(effectivePrice * 100) / 100,
    quantity: Math.round(quantity),
    saleableQuantity: Math.round(saleableQty),
    grossRevenue: Math.round(grossRevenue),
    costs: {
      transport: Math.round(totalTransport),
      handling: Math.round(totalHandling),
      storage: Math.round(totalStorage),
      spoilage: Math.round(totalSpoilageLoss),
      total: Math.round(totalCost),
    },
    netProfit: Math.round(netProfit),
    netbackPerKg: Math.round((netProfit / Math.max(quantity, 1)) * 100) / 100,
    distanceKm: distanceKm || null,
    transportDetail: transport,
    spoilageProbability: spoilageProb,
  };
}

// ─── MAIN DECISION ANALYSIS ──────────────────────────────────────────────────
async function analyzeDecision({
  farmLat, farmLng,
  crop, quantity,
  storageCapacity = 5000,
  storageDays = 5,
  storageType = 'ambient',
  storageCostPerKgPerDay = 0.05,
  handlingCostPerKg = 1.5,
  temperature = 28,
  humidity = 65,
  rainProbability = 0.1,
  weatherAlerts = [],
  historicalYieldPerAcre,
  farmArea,
  state, district,
}) {
  // ── 1. Validate location ────────────────────────────────────────────────
  if (!farmLat || !farmLng || (farmLat === 0 && farmLng === 0)) {
    return {
      success: false,
      error: 'LOCATION_REQUIRED',
      message: 'Farm location not set. Please configure your farm coordinates.',
    };
  }
  
  // ── 2. Get market data ──────────────────────────────────────────────────
  const marketResult = await getMarketPricesProgressive({ crop, state, district });
  
  if (!marketResult.available && (!marketResult.prices || marketResult.prices.length === 0)) {
    return {
      success: false,
      error: 'NO_MARKET_DATA',
      message: `No market data available for ${crop}. ${marketResult.message || ''}`,
      marketSource: marketResult,
    };
  }
  
  const rawPrices = marketResult.prices || [];
  
  // ── 3. Deduplicate markets (latest price per market) ────────────────────
  const marketMap = {};
  rawPrices.forEach(p => {
    if (!marketMap[p.market] || new Date(p.date) > new Date(marketMap[p.market].date)) {
      marketMap[p.market] = p;
    }
  });
  const uniqueMarkets = Object.values(marketMap).slice(0, 8); // top 8 markets
  
  if (uniqueMarkets.length === 0) {
    return {
      success: false,
      error: 'NO_MARKETS',
      message: 'No active markets found for this crop in your region.',
    };
  }
  
  // ── 4. Enrich markets with distance + netback ───────────────────────────
  const enrichedMarkets = uniqueMarkets.map(m => {
    const distKm = estimateDistanceKm(farmLat, farmLng, m.district, m.state);
    const pricePerKg = m.modalPrice / 100; // quintal → kg
    return {
      marketName: m.market,
      district: m.district,
      state: m.state,
      currentPricePerKg: pricePerKg,
      minPricePerKg: m.minPrice ? m.minPrice / 100 : null,
      maxPricePerKg: m.maxPrice ? m.maxPrice / 100 : null,
      distanceKm: distKm,
      date: m.date,
      source: m.source,
      isDemo: m.isDemo,
    };
  });
  
  // ── 5. Get price forecast (Python AI → fallback to statistical) ─────────
  const historicalPrices = rawPrices
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(p => p.modalPrice / 100);
  
  const currentAvgPrice = enrichedMarkets.reduce((s, m) => s + m.currentPricePerKg, 0) / enrichedMarkets.length;
  
  let forecast;
  const aiResult = await callPythonAI('/predict/price-forecast', {
    crop,
    current_price: currentAvgPrice,
    history: historicalPrices,
  });
  
  if (aiResult.ok && aiResult.data?.forecasts) {
    forecast = aiResult.data;
  } else {
    forecast = statisticalPriceForecast(currentAvgPrice, historicalPrices);
  }
  
  // ── 6. Evaluate strategies ──────────────────────────────────────────────
  const strategies = [];
  
  for (const market of enrichedMarkets) {
    // A. HARVEST_NOW
    const nowSpoilage = estimateSpoilage({ crop, storageDays: 0, temperature, humidity, storageType: 'ambient' });
    strategies.push({
      ...evaluateStrategy({
        action: 'HARVEST_NOW',
        quantity,
        market,
        currentPricePerKg: market.currentPricePerKg,
        futurePricePerKg: market.currentPricePerKg,
        distanceKm: market.distanceKm,
        waitDays: 0,
        spoilageProb: nowSpoilage.spoilageProbability,
        handlingCostPerKg,
        storageCostPerKgPerDay,
      }),
    });
    
    // B. WAIT 1-7 days
    for (const waitD of [1, 2, 3, 5, 7]) {
      const futurePrice = forecast.forecasts[waitD]?.price || market.currentPricePerKg;
      const spoilage = estimateSpoilage({ crop, storageDays: waitD, temperature, humidity, storageType });
      
      strategies.push({
        ...evaluateStrategy({
          action: `WAIT_${waitD}_DAY${waitD > 1 ? 'S' : ''}`,
          quantity,
          market,
          currentPricePerKg: market.currentPricePerKg,
          futurePricePerKg: futurePrice,
          distanceKm: market.distanceKm,
          waitDays: waitD,
          spoilageProb: spoilage.spoilageProbability,
          handlingCostPerKg,
          storageCostPerKgPerDay,
        }),
      });
    }
  }
  
  // C. SPLIT HARVEST — optimize ratio
  if (enrichedMarkets.length >= 1 && quantity > 100) {
    const bestNowMarket = enrichedMarkets.reduce((best, m) => {
      const nb = calculateNetback({
        sellingPricePerKg: m.currentPricePerKg,
        distanceKm: m.distanceKm,
        handlingCostPerKg,
      });
      return (!best || (nb.netbackPerKg && nb.netbackPerKg > (best.nb || 0))) ? { ...m, nb: nb.netbackPerKg } : best;
    }, null);
    
    // Try 10 split ratios from 10% to 90%, pick optimal
    const bestWaitDays = 3;
    const futP = forecast.forecasts[bestWaitDays]?.price || currentAvgPrice;
    const spoilWait = estimateSpoilage({ crop, storageDays: bestWaitDays, temperature, humidity, storageType });
    
    let bestSplit = null;
    for (let sellNowPct = 0.1; sellNowPct <= 0.9; sellNowPct += 0.1) {
      const qNow = Math.round(quantity * sellNowPct);
      const qStore = Math.min(quantity - qNow, storageCapacity);
      
      const nowPart = evaluateStrategy({
        action: 'SPLIT_SELL_NOW', quantity: qNow, market: bestNowMarket || enrichedMarkets[0],
        currentPricePerKg: (bestNowMarket || enrichedMarkets[0]).currentPricePerKg,
        futurePricePerKg: (bestNowMarket || enrichedMarkets[0]).currentPricePerKg,
        distanceKm: (bestNowMarket || enrichedMarkets[0]).distanceKm,
        waitDays: 0, spoilageProb: 0.005, handlingCostPerKg, storageCostPerKgPerDay,
      });
      
      const storePart = evaluateStrategy({
        action: 'SPLIT_STORE', quantity: qStore, market: enrichedMarkets[0],
        currentPricePerKg: enrichedMarkets[0].currentPricePerKg,
        futurePricePerKg: futP,
        distanceKm: enrichedMarkets[0].distanceKm,
        waitDays: bestWaitDays, spoilageProb: spoilWait.spoilageProbability,
        handlingCostPerKg, storageCostPerKgPerDay,
      });
      
      const totalProfit = nowPart.netProfit + storePart.netProfit;
      if (!bestSplit || totalProfit > bestSplit.totalProfit) {
        bestSplit = {
          sellNowPct: Math.round(sellNowPct * 100),
          qNow, qStore,
          waitDays: bestWaitDays,
          nowPart, storePart,
          totalProfit,
          totalRevenue: nowPart.grossRevenue + storePart.grossRevenue,
          totalCosts: nowPart.costs.total + storePart.costs.total,
        };
      }
    }
    
    if (bestSplit) {
      strategies.push({
        action: 'SPLIT_HARVEST',
        waitDays: bestSplit.waitDays,
        marketName: `${bestSplit.nowPart.marketName} (${bestSplit.sellNowPct}% now) + Store ${100 - bestSplit.sellNowPct}%`,
        quantity,
        allocation: [
          { action: 'SELL_NOW', market: bestSplit.nowPart.marketName, quantity: bestSplit.qNow },
          { action: `STORE_${bestSplit.waitDays}_DAYS`, quantity: bestSplit.qStore },
        ],
        grossRevenue: Math.round(bestSplit.totalRevenue),
        costs: {
          transport: bestSplit.nowPart.costs.transport + bestSplit.storePart.costs.transport,
          handling: bestSplit.nowPart.costs.handling + bestSplit.storePart.costs.handling,
          storage: bestSplit.storePart.costs.storage,
          spoilage: bestSplit.nowPart.costs.spoilage + bestSplit.storePart.costs.spoilage,
          total: Math.round(bestSplit.nowPart.costs.total + bestSplit.storePart.costs.total),
        },
        netProfit: Math.round(bestSplit.totalProfit),
        netbackPerKg: Math.round((bestSplit.totalProfit / quantity) * 100) / 100,
        splitDetail: bestSplit,
      });
    }
  }
  
  // ── 7. Calculate risk for each strategy ─────────────────────────────────
  strategies.forEach(s => {
    const risk = calculateRiskScore({
      priceVolatility: forecast.volatility,
      rainProbability,
      spoilageProbability: s.spoilageProbability || 0.01,
      marketAvailability: 0.9,
      predictionConfidence: forecast.confidence,
      storageOverload: (s.waitDays || 0) > 0 && quantity > storageCapacity ? 0.5 : 0,
    });
    s.riskScore = risk.score;
    s.riskLevel = risk.level;
    s.riskFactors = risk.factors;
    
    // Risk-adjusted profit
    const riskPenalty = s.netProfit * (risk.score / 100) * 0.2;
    s.riskAdjustedProfit = Math.round(s.netProfit - riskPenalty);
  });
  
  // ── 8. Sort by risk-adjusted profit, pick best ──────────────────────────
  strategies.sort((a, b) => b.riskAdjustedProfit - a.riskAdjustedProfit);
  
  const best = strategies[0];
  const alternatives = strategies.slice(1, 6); // top 5 alternatives
  
  // ── 9. Overall confidence ───────────────────────────────────────────────
  const overallConfidence = calculateConfidence({
    dataFreshnessHours: marketResult.stalenessHours || 0,
    historicalDataPoints: historicalPrices.length,
    forecastConfidence: forecast.confidence,
    forecastHorizonDays: best.waitDays || 0,
  });
  
  // ── 10. Profit leakage ──────────────────────────────────────────────────
  const profitLeakage = [];
  if (best.costs) {
    const items = [
      { name: 'Transport', amount: best.costs.transport },
      { name: 'Handling', amount: best.costs.handling },
      { name: 'Storage', amount: best.costs.storage },
      { name: 'Spoilage', amount: best.costs.spoilage },
    ].sort((a, b) => b.amount - a.amount);
    
    const largest = items[0];
    profitLeakage.push(...items);
    if (largest.amount > 0) {
      profitLeakage.biggestLeakage = `${largest.name} is your largest cost: ₹${largest.amount.toLocaleString('en-IN')}`;
    }
  }
  
  // ── 11. Build explanation from data (NOT generated by LLM) ──────────────
  const explanation = buildExplanation(best, enrichedMarkets, forecast, overallConfidence);
  
  return {
    success: true,
    decision: {
      recommendation: best.action,
      bestMarket: best.marketName,
      allocation: best.allocation || [{ market: best.marketName, quantity, action: best.action }],
      expectedRevenue: best.grossRevenue,
      totalCost: best.costs?.total || 0,
      expectedProfit: best.netProfit,
      riskAdjustedProfit: best.riskAdjustedProfit,
      riskScore: best.riskScore,
      riskLevel: best.riskLevel,
      confidence: overallConfidence,
      explanation,
      profitLeakage,
    },
    alternatives,
    markets: enrichedMarkets,
    forecast,
    marketSource: {
      source: marketResult.source,
      sourceLabel: marketResult.sourceLabel,
      isLive: marketResult.isLive,
      isStale: marketResult.isStale,
      stalenessHours: marketResult.stalenessHours,
      dataTimestamp: marketResult.dataTimestamp,
    },
    weather: { temperature, humidity, rainProbability, alerts: weatherAlerts },
    modelVersion: forecast.modelVersion || 'AgriPulse-Decision-v2',
    generatedAt: new Date().toISOString(),
  };
}

// ─── Build data-driven explanation (no LLM hallucination) ────────────────────
function buildExplanation(best, markets, forecast, confidence) {
  const parts = [];
  
  if (best.action === 'HARVEST_NOW') {
    parts.push(`Selling now at ${best.marketName} gives the highest risk-adjusted return of ₹${best.riskAdjustedProfit?.toLocaleString('en-IN')}.`);
    if (forecast.forecasts[3]?.price < best.pricePerKg) {
      parts.push(`Price forecast shows a downward trend — waiting would likely reduce returns.`);
    }
  } else if (best.action.startsWith('WAIT')) {
    const days = best.waitDays;
    parts.push(`Waiting ${days} day${days > 1 ? 's' : ''} is expected to yield ₹${best.riskAdjustedProfit?.toLocaleString('en-IN')} — better than selling now.`);
    parts.push(`Forecast price: ₹${best.pricePerKg}/kg (currently ₹${markets[0]?.currentPricePerKg}/kg).`);
  } else if (best.action === 'SPLIT_HARVEST') {
    const detail = best.splitDetail;
    parts.push(`Splitting your harvest maximizes return: sell ${detail?.qNow} kg now, store ${detail?.qStore} kg for ${detail?.waitDays} days.`);
    parts.push(`Combined expected profit: ₹${best.netProfit?.toLocaleString('en-IN')}.`);
  }
  
  // Risk note
  if (best.riskScore > 50) {
    parts.push(`⚠️ Risk is elevated (${best.riskScore}/100). Consider selling sooner to reduce exposure.`);
  }
  
  // Confidence note
  if (confidence < 0.5) {
    parts.push(`Note: Prediction confidence is low (${Math.round(confidence * 100)}%) due to limited historical data. Results should be interpreted cautiously.`);
  }
  
  return parts.join(' ');
}

module.exports = { analyzeDecision, statisticalPriceForecast, estimateSpoilage, calculateRiskScore, calculateConfidence };
