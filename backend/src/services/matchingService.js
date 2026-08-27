const CropListing = require('../models/CropListing');
const BuyerDemand = require('../models/BuyerDemand');
const BuyerProfile = require('../models/BuyerProfile');
const FarmerProfile = require('../models/FarmerProfile');

/**
 * Score a (listing, demand) pair — returns 0-100
 * Factors: crop match, quantity fit, price compatibility, distance, grade, date
 */
const scorePair = (listing, demand, buyerProfile) => {
  const scores = {};
  const reasons = [];

  // 1. Crop match (0 or 30)
  const cropMatch = listing.cropName?.toLowerCase() === demand.cropName?.toLowerCase();
  scores.cropMatch = cropMatch ? 30 : 0;
  if (!cropMatch) return { total: 0, breakdown: scores, reasons, distanceKm: 50 };
  reasons.push("Crop match");

  // 2. Quantity compatibility (0-20)
  const demandQty = demand.quantity;
  const listQty = listing.availableQuantity || listing.quantity;
  let qtyMatch = false;
  if (listQty >= demandQty) {
    scores.quantity = 20;
    qtyMatch = true;
  } else if (listQty >= demandQty * 0.5) {
    scores.quantity = 12; // partial
    qtyMatch = true;
  } else {
    scores.quantity = 5;
  }
  if (qtyMatch) reasons.push("Quantity match");

  // 3. Price compatibility (0-20)
  const askPrice = listing.askingPrice;
  const demandMax = demand.targetPriceMax;
  const demandMin = demand.targetPriceMin;
  let priceCompatible = false;
  if (!demandMax && !demandMin) {
    scores.price = 15;
    priceCompatible = true;
  } else if (demandMax && askPrice <= demandMax) {
    scores.price = 20;
    priceCompatible = true;
  } else if (demandMax && askPrice <= demandMax * 1.1) {
    scores.price = 12;
    priceCompatible = true;
  } else {
    scores.price = 3;
  }
  if (priceCompatible) reasons.push("Price compatible");

  // 4. Grade match (0-10)
  if (!demand.gradeRequired || demand.gradeRequired === 'any') {
    scores.grade = 10;
  } else if (listing.grade === demand.gradeRequired) {
    scores.grade = 10;
  } else {
    scores.grade = 4;
  }

  // 5. Date compatibility (0-10)
  const availFrom = new Date(listing.availableFrom);
  const requiredBy = new Date(demand.requiredByDate);
  if (availFrom <= requiredBy) {
    scores.dateMatch = 10;
    reasons.push("Delivery window compatible");
  } else {
    scores.dateMatch = 0;
  }

  // 6. Distance compatibility (0-10)
  let distanceKm = 45;
  if (listing.location?.coordinates && buyerProfile?.location?.coordinates) {
    const lat1 = listing.location.coordinates[1];
    const lon1 = listing.location.coordinates[0];
    const lat2 = buyerProfile.location.coordinates[1];
    const lon2 = buyerProfile.location.coordinates[0];
    if (lat1 && lat2 && lat1 !== 0 && lat2 !== 0) {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distanceKm = Math.round(R * c);
    }
  }
  if (distanceKm <= (buyerProfile?.maxDistanceKm || 200)) {
    scores.distance = 10;
    reasons.push("Location match");
  } else {
    scores.distance = 2;
  }

  // 7. Buyer reliability (0-10)
  const buyerRating = buyerProfile?.rating?.average || 3;
  scores.buyerReliability = Math.round((buyerRating / 5) * 10);

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  return { total: Math.min(total, 100), breakdown: scores, reasons, distanceKm };
};

/**
 * Find matching buyer demands for a given listing
 */
exports.computeBuyerMatches = async (listingId, opts = {}) => {
  const listing = await CropListing.findById(listingId);
  if (!listing) return [];

  // Find active demands for same crop within date range
  const demands = await BuyerDemand.find({
    cropName: { $regex: `^${listing.cropName}$`, $options: 'i' },
    status: 'active',
    requiredByDate: { $gte: new Date(listing.availableFrom) },
  }).populate('buyer', 'name').limit(50);

  const results = [];

  for (const demand of demands) {
    const buyerProfile = await BuyerProfile.findOne({ user: demand.buyer._id });
    const { total, breakdown, reasons, distanceKm } = scorePair(listing, demand, buyerProfile);
    if (total >= 40) { // minimum threshold
      results.push({
        demand: demand._id,
        demandData: demand,
        score: total,
        breakdown,
        reasons,
        distanceKm,
        buyerProfile,
        matchStrength: total >= 80 ? 'strong' : total >= 60 ? 'good' : 'potential',
      });
    }
  }

  results.sort((a, b) => b.score - a.score);

  if (opts.returnOnly) return results.slice(0, 10);
  return results.slice(0, 10);
};

/**
 * Find matching listings for a given demand
 */
exports.computeListingMatches = async (demandId, opts = {}) => {
  const demand = await BuyerDemand.findById(demandId);
  if (!demand) return [];

  const listings = await CropListing.find({
    cropName: { $regex: `^${demand.cropName}$`, $options: 'i' },
    status: 'active',
    availableFrom: { $lte: new Date(demand.requiredByDate) },
  }).populate('farmer', 'name').limit(50);

  const results = [];

  for (const listing of listings) {
    const { total, breakdown } = scorePair(listing, demand, null);
    if (total >= 40) {
      results.push({
        listing: listing._id,
        listingData: listing,
        score: total,
        breakdown,
        matchStrength: total >= 80 ? 'strong' : total >= 60 ? 'good' : 'potential',
      });
    }
  }

  results.sort((a, b) => b.score - a.score);

  // Check if demand can be fulfilled through aggregation
  let aggregationOption = null;
  const topListings = results.slice(0, 5);
  const totalAvailable = topListings.reduce((sum, r) => sum + (r.listingData.availableQuantity || 0), 0);
  if (totalAvailable >= demand.quantity && topListings.length >= 2 && demand.isAggregatable) {
    aggregationOption = {
      possible: true,
      farmers: topListings.map((r) => ({
        farmerId: r.listingData.farmer._id,
        farmerName: r.listingData.farmer.name,
        quantity: r.listingData.availableQuantity,
        listingId: r.listing,
      })),
      totalQuantity: totalAvailable,
      message: `Demand can be fulfilled through ${topListings.length} farmers`,
    };
  }

  if (opts.returnOnly) return { matches: results.slice(0, 10), aggregation: aggregationOption };
  return { matches: results.slice(0, 10), aggregation: aggregationOption };
};
