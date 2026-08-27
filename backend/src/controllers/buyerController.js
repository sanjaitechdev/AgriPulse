const BuyerProfile = require('../models/BuyerProfile');
const BuyerDemand = require('../models/BuyerDemand');
const Order = require('../models/Order');

// GET /api/buyer/profile
exports.getProfile = async (req, res, next) => {
  try {
    let profile = await BuyerProfile.findOne({ user: req.user.id }).lean();
    if (!profile) profile = {};
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

// PUT /api/buyer/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const profile = await BuyerProfile.findOneAndUpdate(
      { user: req.user.id },
      { ...req.body, user: req.user.id },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

// GET /api/buyer/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const [activeDemands, pendingOrders, completedOrdersCount] = await Promise.all([
      BuyerDemand.find({ buyer: req.user.id, status: 'active' }).limit(5).lean(),
      Order.find({ buyer: req.user.id, status: { $in: ['pending','accepted','confirmed','pickup_scheduled','in_transit'] } })
        .populate('farmer', 'name').limit(10).lean(),
      Order.countDocuments({ buyer: req.user.id, status: 'completed' }),
    ]);
    res.json({ success: true, data: { activeDemands, pendingOrders, completedOrders: completedOrdersCount } });
  } catch (err) { next(err); }
};
