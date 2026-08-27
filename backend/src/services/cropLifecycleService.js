const { getMarketPricesProgressive } = require('./agmarknetService');
const Farm = require('../models/Farm');

/**
 * Standard Crop Lifecycle Stages & Relative Timeline Windows
 */
const LIFECYCLE_STAGES = [
  { key: 'sowing', label: 'Sowing', icon: '🌱', startPct: 0, endPct: 8 },
  { key: 'germination', label: 'Germination', icon: '🌿', startPct: 8, endPct: 18 },
  { key: 'vegetative', label: 'Vegetative Growth', icon: '🌾', startPct: 18, endPct: 45 },
  { key: 'flowering', label: 'Flowering', icon: '🌸', startPct: 45, endPct: 65 },
  { key: 'fruiting', label: 'Fruiting / Grain Formation', icon: '🍅', startPct: 65, endPct: 85 },
  { key: 'maturity', label: 'Maturity', icon: '🍂', startPct: 85, endPct: 95 },
  { key: 'harvest_ready', label: 'Harvest Ready', icon: '✨', startPct: 95, endPct: 100 },
  { key: 'harvested', label: 'Harvested', icon: '📦', startPct: 100, endPct: 100 }
];

/**
 * Calculates dynamic crop growth metrics, stages, and harvest forecast.
 */
async function calculateCropMetrics({ cropDoc, sowingDate, farmDoc, variety, manualStage, weatherContext }) {
  if (!sowingDate) {
    return {
      currentStage: 'sowing',
      growthProgressPercent: 0,
      status: 'data_insufficient',
      harvestForecast: {
        expectedHarvestStart: null,
        expectedHarvestEnd: null,
        confidence: 40,
        reason: 'Sowing date not provided. Please enter planting date for AI forecasting.'
      },
      stageExplanation: 'Crop recorded without a specific sowing date.'
    };
  }

  const sowTime = new Date(sowingDate).getTime();
  const nowTime = Date.now();
  const daysElapsed = Math.max(0, Math.floor((nowTime - sowTime) / (1000 * 60 * 60 * 24)));

  // Typical duration for crop
  const minDur = cropDoc?.durationDays?.min || cropDoc?.duration_days || 90;
  const maxDur = cropDoc?.durationDays?.max || cropDoc?.duration_days || 120;
  const avgDuration = Math.round((minDur + maxDur) / 2);

  // Weather impact factor on growth rate
  let tempFactor = 1.0;
  const currentTemp = weatherContext?.temperature || 28;
  const optMinTemp = cropDoc?.optimalTemp?.min || 20;
  const optMaxTemp = cropDoc?.optimalTemp?.max || 35;

  if (currentTemp > optMaxTemp + 4) {
    // High heat accelerates physiological maturity slightly but stresses plant
    tempFactor = 1.05;
  } else if (currentTemp < optMinTemp - 4) {
    // Cold slows vegetative progress
    tempFactor = 0.92;
  }

  const effectiveDays = daysElapsed * tempFactor;
  let progressPct = Math.min(100, Math.round((effectiveDays / avgDuration) * 100));

  // Determine Lifecycle Stage
  let determinedStage = 'sowing';
  if (manualStage === 'harvested' || progressPct >= 100) {
    determinedStage = progressPct >= 100 ? 'harvest_ready' : 'harvested';
  } else {
    for (const stage of LIFECYCLE_STAGES) {
      if (progressPct >= stage.startPct && progressPct < stage.endPct) {
        determinedStage = stage.key;
        break;
      }
    }
  }

  // Calculate dynamic harvest window
  const daysToStart = Math.max(0, Math.round(minDur - effectiveDays));
  const daysToEnd = Math.max(daysToStart + 5, Math.round(maxDur - effectiveDays));

  const harvestStartDate = new Date(nowTime + daysToStart * 24 * 60 * 60 * 1000);
  const harvestEndDate = new Date(nowTime + daysToEnd * 24 * 60 * 60 * 1000);

  // AI Confidence Calculation
  let confidence = 82;
  if (variety) confidence += 4;
  if (farmDoc?.soilType) confidence += 3;
  if (weatherContext?.temperature) confidence += 3;
  if (daysElapsed > 10) confidence += 2;
  confidence = Math.min(95, confidence);

  // AI Harvest Forecast Reason
  let forecastReason = `Based on sowing date (${new Date(sowingDate).toLocaleDateString('en-IN')}) and ${daysElapsed} days of growth, `;
  if (determinedStage === 'harvest_ready') {
    forecastReason += `the crop has achieved full physiological maturity (${progressPct}%). Harvesting is strongly recommended within the next 3–7 days for optimal grade & price.`;
  } else if (determinedStage === 'maturity') {
    forecastReason += `the crop is entering final ripening (${progressPct}% progress). Harvest window estimated between ${harvestStartDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} and ${harvestEndDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}.`;
  } else if (determinedStage === 'fruiting' || determinedStage === 'flowering') {
    forecastReason += `active ${determinedStage} observed under ${currentTemp}°C conditions. Current crop vigor indicates harvest readiness on track in ~${daysToStart}–${daysToEnd} days.`;
  } else {
    forecastReason += `crop is in early vegetative development (${daysElapsed} days old). Steady growth supported by local climate.`;
  }

  // Determine Overall Crop Status
  let status = 'growing';
  let riskLevel = 'low';
  let riskReason = 'Normal agronomic parameters.';

  if (determinedStage === 'harvest_ready') {
    status = 'harvest_ready';
  } else if (determinedStage === 'maturity' || daysToStart <= 10) {
    status = 'harvest_approaching';
  } else if (weatherContext?.humidity > 85 && currentTemp > 32) {
    status = 'needs_attention';
    riskLevel = 'medium';
    riskReason = 'High humidity combined with elevated temperature increases fungal & pest vulnerability.';
  } else if (farmDoc?.waterAvailability === 'scarce') {
    status = 'at_risk';
    riskLevel = 'high';
    riskReason = 'Water scarcity detected for this farm location.';
  } else if (progressPct >= 20 && progressPct <= 90) {
    status = 'healthy';
  }

  // Generate "Why is my crop at this stage?" explanation
  const stageExpl = generateStageExplanation({
    cropName: cropDoc?.name || 'Crop',
    stage: determinedStage,
    daysElapsed,
    progressPct,
    avgDuration,
    temp: currentTemp,
    humidity: weatherContext?.humidity || 65
  });

  return {
    currentStage: determinedStage,
    growthProgressPercent: progressPct,
    status,
    riskLevel,
    riskReason,
    harvestForecast: {
      expectedHarvestStart: harvestStartDate,
      expectedHarvestEnd: harvestEndDate,
      confidence,
      reason: forecastReason,
      calculatedAt: new Date()
    },
    stageExplanation: stageExpl
  };
}

/**
 * Generates an empathetic, farmer-friendly explanation of the physiological stage.
 */
function generateStageExplanation({ cropName, stage, daysElapsed, progressPct, avgDuration, temp, humidity }) {
  switch (stage) {
    case 'sowing':
      return `${cropName} was recently planted (${daysElapsed} days ago). Seed imbibition and germination initiation are underway in the seedbed.`;
    case 'germination':
      return `Radicle and plumule emergence complete. Seedlings are establishing root contact with the soil at ${daysElapsed} days post-sowing.`;
    case 'vegetative':
      return `Crop is actively developing canopy, leaves, and stem elongation (${progressPct}% total cycle). Photosynthetic activity is robust under ${temp}°C conditions.`;
    case 'flowering':
      return `Reproductive phase initiated. Flower buds and pollination are progressing steadily at day ${daysElapsed}. Irrigation consistency is vital during this stage.`;
    case 'fruiting':
      return `Pod/fruit/grain filling is actively occurring. Biomass accumulation is at peak (${progressPct}% of ${avgDuration} day duration).`;
    case 'maturity':
      return `Crop has completed nutrient translocation into grains/fruits. Moisture content is reducing naturally, leading to harvest readiness.`;
    case 'harvest_ready':
      return `Crop has achieved 100% biological maturity (${daysElapsed} days). Color, moisture, and firmness are at prime harvest standards.`;
    case 'harvested':
      return `Crop cycle completed and harvest logged.`;
    default:
      return `${cropName} is progressing through its growth cycle (${daysElapsed} days elapsed).`;
  }
}

module.exports = {
  LIFECYCLE_STAGES,
  calculateCropMetrics,
  generateStageExplanation
};
