const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Order = require('../models/Order');
const CropListing = require('../models/CropListing');
const BuyerDemand = require('../models/BuyerDemand');
const RiskPrediction = require('../models/RiskPrediction');
const AuditLog = require('../models/AuditLog');
const AIModelVersion = require('../models/AIModelVersion');

router.use(protect);
router.use(authorize('admin'));

// Platform overview analytics
router.get('/analytics', async (req, res, next) => {
  try {
    const [
      totalUsers, totalFarmers, totalBuyers,
      totalListings, totalDemands, totalOrders,
      completedOrders, highRiskCycles,
      recentOrders, modelVersions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'buyer' }),
      CropListing.countDocuments(),
      BuyerDemand.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: 'completed' }),
      RiskPrediction.countDocuments({ riskCategory: { $in: ['high', 'critical'] }, isActive: true }),
      Order.find().sort({ createdAt: -1 }).limit(10).populate('farmer', 'name').populate('buyer', 'name'),
      AIModelVersion.find({ isActive: true }),
    ]);

    const totalRevenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalValue' } } },
    ]);

    res.json({
      success: true,
      data: {
        platform: { totalUsers, totalFarmers, totalBuyers, totalListings, totalDemands, totalOrders, completedOrders, highRiskCycles },
        totalRevenue: totalRevenue[0]?.total || 0,
        recentOrders,
        activeModels: modelVersions,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) { next(err); }
});

// User list
router.get('/users', async (req, res, next) => {
  try {
    const { role, verified, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (verified !== undefined) query.isVerified = verified === 'true';
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(query).select('-password -refreshToken').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query),
    ]);
    res.json({ success: true, data: users, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// Verify user
router.put('/users/:id/verify', async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: action === 'approve', verificationStatus: action === 'approve' ? 'verified' : 'rejected' },
      { new: true }
    );
    await AuditLog.create({ actor: req.user._id, actorRole: 'admin', action: `user.verification.${action}`, entity: 'User', entityId: req.params.id });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// Data health panel
router.get('/data-health', async (req, res, next) => {
  try {
    const MarketPrice = require('../models/MarketPrice');
    const latestMarket = await MarketPrice.findOne({}).sort({ syncedAt: -1 }).lean();
    const now = new Date();
    const marketAgeHours = latestMarket ? (now - new Date(latestMarket.syncedAt)) / (1000 * 60 * 60) : 999;

    res.json({
      success: true,
      data: {
        sources: [
          { name: 'MongoDB', type: 'database', status: 'healthy', refreshRate: 'Real-time', lastSync: now, note: 'Primary datastore' },
          { name: 'Agmarknet (Market Prices)', type: 'external_api', status: marketAgeHours < 25 ? 'healthy' : 'seeded', refreshRate: 'Daily', lastSync: latestMarket?.syncedAt, note: marketAgeHours < 25 ? 'Live' : 'Using seeded historical data (run seed script to refresh)' },
          { name: 'Open-Meteo (Weather)', type: 'external_api', status: 'healthy', refreshRate: '30 min', lastSync: now, note: 'Free real-time weather API, no key required' },
          { name: 'Python AI Service', type: 'ai_model', status: 'seeded', refreshRate: 'On-demand', lastSync: null, note: 'Rule-based fallback active. Start localhost:8001 for ML models.' },
          { name: 'Redis (Cache)', type: 'cache', status: process.env.REDIS_URL ? 'healthy' : 'seeded', refreshRate: 'Real-time', lastSync: now, note: process.env.REDIS_URL ? 'Connected' : 'Not configured — optional for development' },
        ],
        checkedAt: now.toISOString(),
      },
    });
  } catch (err) { next(err); }
});

// Audit logs
router.get('/audit-logs', async (req, res, next) => {
  try {
    const { action, page = 1, limit = 50 } = req.query;
    const query = {};
    if (action) query.action = { $regex: action, $options: 'i' };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const logs = await AuditLog.find(query)
      .populate('actor', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
});

// AI model versions
router.get('/ai-models', async (req, res, next) => {
  try {
    const models = await AIModelVersion.find().sort({ trainedAt: -1 });
    res.json({ success: true, data: models });
  } catch (err) { next(err); }
});

// Risk alerts
router.get('/risk-alerts', async (req, res, next) => {
  try {
    const risks = await RiskPrediction.find({ riskCategory: { $in: ['high', 'critical'] }, isActive: true })
      .populate('farmer', 'name')
      .populate('crop', 'name')
      .sort({ computedAt: -1 })
      .limit(50);
    res.json({ success: true, data: risks });
  } catch (err) { next(err); }
});

module.exports = router;
