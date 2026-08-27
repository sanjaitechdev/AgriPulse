const FarmerProfile = require('../models/FarmerProfile');
const CropCycle = require('../models/CropCycle');
const CropListing = require('../models/CropListing');
const Order = require('../models/Order');
const RiskPrediction = require('../models/RiskPrediction');
const Notification = require('../models/Notification');

// @GET /api/farmer/profile
exports.getFarmerProfile = async (req, res, next) => {
  try {
    let profile = await FarmerProfile.findOne({ user: req.user._id }).populate('user', 'name email phone');
    if (!profile) {
      // Auto-create skeleton profile on first access
      profile = await FarmerProfile.create({ user: req.user._id, district: '', state: '', totalLandSize: 0 });
    }
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/farmer/profile
exports.updateFarmerProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'district', 'state', 'village', 'pincode', 'totalLandSize', 'irrigatedLand',
      'primaryWaterSource', 'waterAvailability', 'primarySoilType', 'bio',
      'experienceYears', 'kccHolder', 'pmFasalBima', 'bankAccount',
      'farmerLocation'
    ];
    const updates = {};
    allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    // Geocode from district/state/farmerLocation if provided
    let lat = req.body.lat;
    let lng = req.body.lng;
    
    if (updates.farmerLocation) {
      lat = updates.farmerLocation.latitude;
      lng = updates.farmerLocation.longitude;
      updates.district = updates.farmerLocation.district || updates.district;
      updates.state = updates.farmerLocation.state || updates.state;
      updates.village = updates.farmerLocation.village || updates.village;
      updates.pincode = updates.farmerLocation.pincode || updates.pincode;
      updates.farmerLocation.updatedAt = new Date();
    }

    if (lat && lng) {
      updates.location = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
    }

    const profile = await FarmerProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    // Sync ALL Farms for this farmer to their updated location
    const Farm = require('../models/Farm');
    const farmUpdates = {
      district: updates.district || 'Tiruppur',
      state: updates.state || 'Tamil Nadu',
      village: updates.village || '',
      ...(lat && lng ? { location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] } } : {}),
      ...(updates.farmerLocation ? { farmerLocation: updates.farmerLocation } : {})
    };

    const updateResult = await Farm.updateMany({ farmer: req.user._id }, { $set: farmUpdates });

    // If no farm existed at all, create a default one
    const count = await Farm.countDocuments({ farmer: req.user._id });
    if (count === 0) {
      const farmData = {
        farmer: req.user._id,
        name: `Main Farm (${updates.village || updates.district || 'Field'})`,
        totalArea: updates.totalLandSize || 1.0,
        district: updates.district || 'Tiruppur',
        state: updates.state || 'Tamil Nadu',
        village: updates.village || '',
        farmerLocation: updates.farmerLocation || undefined,
        isActive: true,
        isDefault: true,
      };
      if (lat && lng) {
        farmData.location = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
      }
      await Farm.create(farmData);
    }

    // Emit FARM_LOCATION_UPDATED event via Socket.IO
    try {
      const { emitEvent } = require('../socket');
      emitEvent('FARM_LOCATION_UPDATED', {
        farmerId: req.user._id,
        latitude: lat || (updates.farmerLocation?.latitude),
        longitude: lng || (updates.farmerLocation?.longitude),
        district: updates.district,
        state: updates.state,
      });
    } catch (socketErr) {
      console.error('Socket notification for location update failed:', socketErr.message);
    }

    // Mark profile completed
    const isComplete = profile.district && profile.state && profile.totalLandSize > 0;
    if (isComplete && !req.user.profileCompleted) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user._id, { profileCompleted: true, onboardingStep: 3 });
    }

    res.json({ success: true, data: profile, message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
};

// @GET /api/farmer/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const farmerId = req.user._id;

    const [activeCycles, activeListings, pendingOrders, highRisks, unreadCount] = await Promise.all([
      CropCycle.find({ farmer: farmerId, isActive: true, status: { $nin: ['cancelled', 'sold'] } })
        .populate('crop', 'name tamil_name telugu_name hindi_name category')
        .populate('farm', 'name district state')
        .sort({ updatedAt: -1, expectedHarvestAt: 1 }).limit(10),
      CropListing.find({ farmer: farmerId, status: 'active' }).populate('crop', 'name').limit(5),
      Order.find({ farmer: farmerId, status: { $in: ['pending', 'accepted', 'confirmed', 'pickup_scheduled'] } })
        .populate('buyer', 'name').limit(5),
      RiskPrediction.find({ farmer: farmerId, riskCategory: { $in: ['high', 'critical'] }, isActive: true })
        .populate('crop', 'name').limit(3),
      Notification.countDocuments({ user: farmerId, read: false }),
    ]);

    // Build dynamic Today's Farm Intelligence
    let lat = 22.5726; // default West Bengal coords
    let lng = 88.3639;
    let district = 'Nadia';
    let state = 'West Bengal';

    const FarmerProfile = require('../models/FarmerProfile');
    const profile = await FarmerProfile.findOne({ user: farmerId });
    if (profile) {
      if (profile.location?.coordinates && profile.location.coordinates[0] !== 0) {
        lng = profile.location.coordinates[0];
        lat = profile.location.coordinates[1];
      }
      district = profile.district || district;
      state = profile.state || state;
    }

    let weatherAlert = 'Conditions are clear';
    try {
      const axios = require('axios');
      const weatherRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: { latitude: lat, longitude: lng, daily: 'precipitation_sum,precipitation_probability_max', forecast_days: 1, timezone: 'Asia/Kolkata' },
        timeout: 2000
      });
      if (weatherRes.data?.daily?.precipitation_probability_max?.[0] > 40) {
        weatherAlert = `Rain expected today (Probability: ${weatherRes.data.daily.precipitation_probability_max[0]}%)`;
      } else {
        weatherAlert = 'Clear weather. Maintain regular watering schedules.';
      }
    } catch (e) {
      weatherAlert = 'Weather forecasts are normal today.';
    }

    let marketAlert = 'Mandi prices stable';
    try {
      const MarketPrice = require('../models/MarketPrice');
      const latestPrice = await MarketPrice.findOne({ district: new RegExp(`^${district}$`, 'i') }, {}, { sort: { date: -1 } });
      if (latestPrice) {
        marketAlert = `${latestPrice.crop} price is trending upwards at ₹${latestPrice.modalPrice}/qtl`;
      }
    } catch (e) {
      marketAlert = 'Market prices stable';
    }

    const BuyerDemand = require('../models/BuyerDemand');
    const buyerCount = await BuyerDemand.countDocuments({ status: 'active' });
    let buyerAlert = `${buyerCount} active buyer demand requests live`;

    let recAction = 'Create a crop listing to begin matching with buyers.';
    if (activeListings.length > 0) {
      recAction = `Respond to active matching buyers for your listed crops.`;
    } else if (activeCycles.length > 0) {
      recAction = `Listing your harvest early increases buyer matching odds.`;
    }

    res.json({
      success: true,
      data: {
        activeCropCycles: activeCycles,
        activeListings,
        pendingOrders,
        highRiskAlerts: highRisks,
        unreadNotifications: unreadCount,
        farmIntelligence: {
          weather: weatherAlert,
          market: marketAlert,
          buyerDemand: buyerAlert,
          risk: highRisks.length > 0 ? `High unsold-risk alert on ${highRisks[0].cropName}` : 'No critical crop risks identified',
          recommendedAction: recAction
        },
        summaryAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @GET /api/farmer/stats
exports.getMyStats = async (req, res, next) => {
  try {
    const farmerId = req.user._id;
    const [totalOrders, completedOrders, totalRevenue] = await Promise.all([
      Order.countDocuments({ farmer: farmerId }),
      Order.countDocuments({ farmer: farmerId, status: 'completed' }),
      Order.aggregate([
        { $match: { farmer: farmerId, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalValue' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};
