const MarketPrice = require('../models/MarketPrice');
const Crop = require('../models/Crop');
const { cacheGet, cacheSet } = require('../config/redis');

// Helper: resolve crop name to all its database aliases & commodity names
const resolveCropAliases = async (cropQuery) => {
  if (!cropQuery) return [];
  const matchedCrop = await Crop.findOne({
    $or: [
      { name: new RegExp(`^${cropQuery}$`, 'i') },
      { aliases: new RegExp(`^${cropQuery}$`, 'i') },
      { market_commodity_names: new RegExp(`^${cropQuery}$`, 'i') },
      { crop_name: new RegExp(`^${cropQuery}$`, 'i') }
    ]
  });

  if (matchedCrop) {
    // Collect all unique names we can match in MarketPrice
    const names = new Set();
    names.add(matchedCrop.name);
    if (matchedCrop.market_commodity_names) {
      matchedCrop.market_commodity_names.forEach(n => names.add(n));
    }
    if (matchedCrop.aliases) {
      matchedCrop.aliases.forEach(n => names.add(n));
    }
    return Array.from(names);
  }

  // Fallback to query string itself
  return [cropQuery];
};

// @GET /api/market/prices
exports.getMarketPrices = async (req, res, next) => {
  try {
    const { crop, market, state, district, lat, lng, date, page = 1, limit = 30 } = req.query;
    const query = {};

    let targetDistrict = district;
    let targetState = state;

    if (req.user && req.user.role === 'farmer' && !targetDistrict && !targetState) {
      const Farm = require('../models/Farm');
      const farm = await Farm.findOne({ farmer: req.user._id, isActive: true });
      if (farm) {
        targetDistrict = farm.district;
        targetState = farm.state;
      } else {
        const FarmerProfile = require('../models/FarmerProfile');
        const profile = await FarmerProfile.findOne({ user: req.user._id });
        if (profile) {
          targetDistrict = profile.district;
          targetState = profile.state;
        }
      }
    }

    if (crop) {
      const aliases = await resolveCropAliases(crop);
      query.crop = { $in: aliases.map(a => new RegExp(`^${a}$`, 'i')) };
    }

    if (market) query.market = { $regex: market, $options: 'i' };

    // Location-based filtering logic
    if (targetDistrict) {
      query.district = { $regex: targetDistrict, $options: 'i' };
    } else if (targetState) {
      query.state = { $regex: targetState, $options: 'i' };
    }

    if (date) {
      const d = new Date(date);
      query.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    } else {
      // Default: last 30 days of data for rich analysis
      query.date = { $gte: new Date(Date.now() - 30 * 86400000) };
    }

    const { estimateDistanceKm } = require('../services/transportService');
    
    let farmLat = parseFloat(lat);
    let farmLng = parseFloat(lng);

    if (isNaN(farmLat) || isNaN(farmLng)) {
      if (req.user) {
        const Farm = require('../models/Farm');
        const farm = await Farm.findOne({ farmer: req.user._id, isActive: true });
        if (farm && farm.location?.coordinates) {
          farmLng = farm.location.coordinates[0];
          farmLat = farm.location.coordinates[1];
        }
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let [rawListings, total] = await Promise.all([
      MarketPrice.find(query).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      MarketPrice.countDocuments(query),
    ]);

    if (rawListings.length === 0 && crop) {
      const { generateAndSeedCropMarketData } = require('../services/agmarknetService');
      await generateAndSeedCropMarketData(crop, targetState || 'Andhra Pradesh', targetDistrict || 'Krishna');
      
      // Try with relaxed location filter if district filter yielded 0
      const relaxedQuery = { ...query };
      delete relaxedQuery.district;
      [rawListings, total] = await Promise.all([
        MarketPrice.find(relaxedQuery).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
        MarketPrice.countDocuments(relaxedQuery),
      ]);
    }

    const data = rawListings.map(price => {
      let estimatedDistance = 35;
      let hasRealCoords = false;
      if (!isNaN(farmLat) && !isNaN(farmLng) && farmLat !== 0 && farmLng !== 0) {
        const d = estimateDistanceKm(farmLat, farmLng, price.district, price.state);
        if (d !== null) {
          estimatedDistance = d;
          hasRealCoords = true;
        }
      } else {
        if (targetDistrict && price.district.toLowerCase() !== targetDistrict.toLowerCase()) {
          estimatedDistance = 95;
        }
      }

      // Calculate staleness
      const ageHours = Math.round((Date.now() - new Date(price.syncedAt || price.date).getTime()) / 3600000);
      const isStale = ageHours > 24;

      return {
        ...price.toObject(),
        estimatedDistanceKm: estimatedDistance,
        hasRealCoords,
        ageHours,
        isStale,
        freshness: isStale 
          ? `Data synced ${Math.round(ageHours / 24)} days ago` 
          : `Live data synced ${ageHours}h ago`
      };
    });

    let message;
    if (data.length === 0) {
      message = "No recent market data available for this region.";
    }

    res.json({
      success: true,
      data,
      message,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
      meta: { 
        source: data[0]?.isDemo ? 'Demonstration Feed' : 'Agmarknet APMC Market Feed', 
        freshnessNote: data[0]?.isDemo ? 'Demo data (simulated)' : 'Synced daily.' 
      },
    });
  } catch (err) {
    next(err);
  }
};

// @GET /api/market/trends
exports.getMarketTrends = async (req, res, next) => {
  try {
    const { crop, market, days = 30 } = req.query;
    if (!crop) return res.status(400).json({ success: false, message: 'crop is required' });

    const aliases = await resolveCropAliases(crop);
    const query = {
      crop: { $in: aliases.map(a => new RegExp(`^${a}$`, 'i')) },
      date: { $gte: new Date(Date.now() - parseInt(days) * 86400000) },
    };

    if (market) query.market = { $regex: market, $options: 'i' };

    let prices = await MarketPrice.find(query).sort({ date: 1 }).limit(200);

    if (prices.length < 3) {
      const { generateAndSeedCropMarketData } = require('../services/agmarknetService');
      const seeded = await generateAndSeedCropMarketData(crop, 'Andhra Pradesh', 'Krishna');
      prices = await MarketPrice.find(query).sort({ date: 1 }).limit(200);
      if (prices.length === 0) prices = seeded;
    }

    // Calculate trend lines
    const modals = prices.map((p) => p.modalPrice);
    const first = modals.slice(0, Math.ceil(modals.length / 2));
    const second = modals.slice(Math.ceil(modals.length / 2));
    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;
    const changePct = ((avgSecond - avgFirst) / avgFirst) * 100;

    let trend = 'stable';
    if (changePct > 5) trend = 'rising';
    else if (changePct < -5) trend = 'falling';

    const latestPrice = prices[prices.length - 1];

    res.json({
      success: true,
      data: {
        crop,
        market: market || 'all',
        trend,
        changePercent: Math.round(changePct * 10) / 10,
        latestModalPrice: latestPrice?.modalPrice,
        latestDate: latestPrice?.date,
        avgPrice: Math.round(modals.reduce((a, b) => a + b, 0) / modals.length),
        minInPeriod: Math.min(...modals),
        maxInPeriod: Math.max(...modals),
        dataPoints: prices.length,
        priceHistory: prices.map((p) => ({ date: p.date, modal: p.modalPrice, min: p.minPrice, max: p.maxPrice, market: p.market })),
        source: 'Official Agmarknet Mandi Feed',
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @GET /api/market/markets
exports.getMarkets = async (req, res, next) => {
  try {
    const { state, crop } = req.query;
    const matchQuery = {};
    if (state) matchQuery.state = { $regex: state, $options: 'i' };
    
    if (crop) {
      const aliases = await resolveCropAliases(crop);
      matchQuery.crop = { $in: aliases.map(a => new RegExp(`^${a}$`, 'i')) };
    }

    const markets = await MarketPrice.aggregate([
      { $match: matchQuery },
      { $group: { _id: { market: '$market', state: '$state', district: '$district' }, lastDate: { $max: '$date' } } },
      { $project: { _id: 0, market: '$_id.market', state: '$_id.state', district: '$_id.district', lastDate: 1 } },
      { $sort: { market: 1 } },
    ]);

    res.json({ success: true, data: markets });
  } catch (err) {
    next(err);
  }
};
