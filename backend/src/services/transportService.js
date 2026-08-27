/**
 * AgriPulse AI — Transport Service
 * Calculates farm→market distance via Haversine formula
 * and derives transport cost from configurable parameters.
 *
 * Road factor: straight-line × 1.35 (standard Indian road correction)
 * Default vehicle: medium truck (5-10 tonne capacity)
 */

// ~650 Indian district centroids (lat/lng) for distance estimation
// when exact market GPS is unavailable.
const districtCentroids = require('../data/district_centroids.json');

/**
 * Haversine great-circle distance between two GPS points.
 * Returns distance in kilometres.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) { return deg * (Math.PI / 180); }

/**
 * Estimate road distance from a farm to a market district.
 *
 * Priority:
 *   1. Use exact market GPS if provided (marketLat/marketLng)
 *   2. Lookup district centroid from JSON table
 *   3. If district not found: return null (unknown)
 *
 * Applies Indian road correction factor of 1.35.
 */
function estimateDistanceKm(farmLat, farmLng, marketDistrict, marketState, marketLat = null, marketLng = null) {
  let straightLine;

  if (marketLat && marketLng) {
    straightLine = haversineKm(farmLat, farmLng, marketLat, marketLng);
  } else if (marketDistrict) {
    const key = marketDistrict.toLowerCase().trim();
    const centroid = districtCentroids[key];
    if (!centroid) return null; // unknown district
    straightLine = haversineKm(farmLat, farmLng, centroid.lat, centroid.lng);
  } else {
    return null;
  }

  return Math.round(straightLine * 1.35 * 10) / 10; // road correction, 1 decimal
}

/**
 * Calculate transport cost per kg.
 *
 * Formula (transparent):
 *   cost_per_kg = (distanceKm × costPerKmPerTonne) / 1000
 *
 * Default parameters:
 *   costPerKmPerTonne: ₹8/km/tonne (medium truck, fuel + driver)
 *   minCostPerKg: ₹0.5 (loading/unloading floor)
 *   maxCostPerKg: ₹15 (reasonable cap)
 *
 * These are shown to the farmer as assumptions, not hidden.
 */
function calculateTransportCostPerKg(distanceKm, {
  costPerKmPerTonne = 8,      // ₹ per km per tonne
  vehicleCapacityTonnes = 5,  // for info only
  minCostPerKg = 0.5,
  maxCostPerKg = 15,
} = {}) {
  if (!distanceKm || distanceKm <= 0) return { costPerKg: null, unknown: true };

  const raw = (distanceKm * costPerKmPerTonne) / 1000;
  const costPerKg = Math.min(Math.max(raw, minCostPerKg), maxCostPerKg);

  return {
    costPerKg: Math.round(costPerKg * 100) / 100,
    distanceKm,
    costPerKmPerTonne,
    vehicleCapacityTonnes,
    formula: `${distanceKm} km × ₹${costPerKmPerTonne}/km/tonne ÷ 1000 = ₹${Math.round(raw * 100) / 100}/kg`,
    unknown: false,
  };
}

/**
 * Full netback calculation for a single market.
 *
 * Netback = selling_price - transport - handling - storage - spoilage_cost
 *
 * All costs per kg.
 */
function calculateNetback({
  sellingPricePerKg,
  distanceKm,
  transportParams = {},
  handlingCostPerKg = 1.5,     // ₹/kg loading + unloading
  storageDays = 0,
  storageCostPerKgPerDay = 0.05,
  spoilageProbability = 0.02,  // fraction (0-1)
}) {
  const transport = calculateTransportCostPerKg(distanceKm, transportParams);
  const transportCost = transport.unknown ? null : transport.costPerKg;
  const storageCost = storageDays * storageCostPerKgPerDay;
  const spoilageCost = spoilageProbability * sellingPricePerKg;

  if (transportCost === null) {
    return {
      netbackPerKg: null,
      unknown: true,
      reason: 'Distance to market unknown — cannot calculate transport cost.',
      breakdown: {
        sellingPrice: sellingPricePerKg,
        transport: null,
        handling: handlingCostPerKg,
        storage: storageCost,
        spoilage: spoilageCost,
      }
    };
  }

  const netback = sellingPricePerKg - transportCost - handlingCostPerKg - storageCost - spoilageCost;

  return {
    netbackPerKg: Math.round(netback * 100) / 100,
    unknown: false,
    breakdown: {
      sellingPrice: sellingPricePerKg,
      transport: Math.round(transportCost * 100) / 100,
      handling: handlingCostPerKg,
      storage: Math.round(storageCost * 100) / 100,
      spoilage: Math.round(spoilageCost * 100) / 100,
    },
    transportDetail: transport,
    assumptions: {
      handlingNote: 'Loading + unloading: ₹1.5/kg (standard mandi rate)',
      storageNote: storageDays > 0 ? `₹${storageCostPerKgPerDay}/kg/day × ${storageDays} days` : 'No storage',
      spoilageNote: `${(spoilageProbability * 100).toFixed(1)}% estimated spoilage`,
      transportNote: transport.formula,
    }
  };
}

module.exports = {
  haversineKm,
  estimateDistanceKm,
  calculateTransportCostPerKg,
  calculateNetback,
};
