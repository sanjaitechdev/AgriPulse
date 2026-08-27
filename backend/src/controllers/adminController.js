const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const BuyerProfile = require('../models/BuyerProfile');
const CropListing = require('../models/CropListing');
const BuyerDemand = require('../models/BuyerDemand');
const Order = require('../models/Order');
const CropCycle = require('../models/CropCycle');
const AIModelVersion = require('../models/AIModelVersion');
const RiskPrediction = require('../models/RiskPrediction');
const AuditLog = require('../models/AuditLog');
const MarketPrice = require('../models/MarketPrice');

// GET /api/admin/analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers, totalFarmers, totalBuyers,
      totalListings, totalDemands, totalOrders, completedOrders,
      highRiskCycles, activeModels, recentOrders,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'buyer' }),
      CropListing.countDocuments({ status: 'active' }),
      BuyerDemand.countDocuments({ status: 'active' }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'completed' }),
      RiskPrediction.countDocuments({ riskCategory: { $in: ['high', 'critical'] } }),
      AIModelVersion.find({ isActive: true }).lean(),
      Order.find().sort({ createdAt: -1 }).limit(10)
        .populate('farmer', 'name').populate('buyer', 'name').lean(),
    ]);

    // Total revenue from completed orders
    const revAgg = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$agreedPrice', '$quantity'] } } } },
    ]);
    const totalRevenue = revAgg[0]?.total || 0;

    res.json({
      success: true,
      data: {
        platform: { totalUsers, totalFarmers, totalBuyers, totalListings, totalDemands, totalOrders, completedOrders, highRiskCycles },
        activeModels,
        recentOrders,
        totalRevenue,
      },
    });
  } catch (err) { next(err); }
};

// GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const filter = role ? { role } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      User.find(filter).select('-password -refreshToken').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
};

// PUT /api/admin/users/:id/verify
exports.verifyUser = async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: action === 'approve' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Audit log
    await AuditLog.create({ actor: req.user.id, actorRole: 'admin', action: `user.${action}`, entity: 'User', entityId: user._id });

    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// GET /api/admin/risk-alerts
exports.getRiskAlerts = async (req, res, next) => {
  try {
    const alerts = await RiskPrediction.find({ riskCategory: { $in: ['high', 'critical'] } })
      .sort({ unsoldProbability: -1 }).limit(100)
      .populate('farmer', 'name email').lean();
    res.json({ success: true, data: alerts });
  } catch (err) { next(err); }
};

// GET /api/admin/data-health
exports.getDataHealth = async (req, res, next) => {
  try {
    const latestMarket = await MarketPrice.findOne().sort({ syncedAt: -1 }).lean();
    const now = new Date();
    const marketAge = latestMarket ? (now - new Date(latestMarket.syncedAt)) / (1000 * 60 * 60) : 999;

    let pythonStatus = 'seeded';
    let pythonNote = 'Rule-based fallback active; connect localhost:8001 for ML models';
    try {
      const axios = require('axios');
      const response = await axios.get('http://localhost:8001/health', { timeout: 2000 });
      if (response.data?.status === 'healthy') {
        pythonStatus = 'healthy';
        pythonNote = `Connected! Active: ${Object.keys(response.data.models).join(', ')}`;
      }
    } catch (err) {
      pythonNote = `Offline (fallback active): ${err.message}`;
    }

    const sources = [
      { name: 'MongoDB', type: 'database', status: 'healthy', refreshRate: 'Real-time', lastSync: now, note: 'Primary datastore' },
      { name: 'Agmarknet (Market Prices)', type: 'external_api', status: marketAge < 25 ? 'healthy' : 'seeded', refreshRate: 'Daily', lastSync: latestMarket?.syncedAt, note: marketAge < 25 ? 'Live' : 'Using seeded historical data' },
      { name: 'Open-Meteo (Weather)', type: 'external_api', status: 'healthy', refreshRate: '30 min', lastSync: now, note: 'Free, no API key required' },
      { name: 'Python AI Service', type: 'ai_model', status: pythonStatus, refreshRate: 'On-demand', lastSync: now, note: pythonNote },
      { name: 'Redis (Cache)', type: 'cache', status: process.env.REDIS_URL ? 'healthy' : 'seeded', refreshRate: 'Real-time', lastSync: now, note: process.env.REDIS_URL ? 'Connected' : 'Not configured (optional for dev)' },
    ];

    res.json({ success: true, data: { sources, checkedAt: now } });
  } catch (err) { next(err); }
};

// GET /api/admin/audit-logs
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { limit = 100 } = req.query;
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(parseInt(limit)).populate('actor', 'name role').lean();
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
};
