const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const BuyerProfile = require('../models/BuyerProfile');
const Order = require('../models/Order');

router.use(protect);
router.use(authorize('buyer'));

router.get('/profile', async (req, res, next) => {
  try {
    let profile = await BuyerProfile.findOne({ user: req.user._id }).populate('user', 'name email phone');
    if (!profile) profile = await BuyerProfile.create({ user: req.user._id, orgName: '', orgType: 'trader' });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

router.put('/profile', async (req, res, next) => {
  try {
    const allowed = ['orgName', 'orgType', 'gstNumber', 'district', 'state', 'address', 'bio', 'preferredCrops', 'maxDistanceKm'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (req.body.lat && req.body.lng) updates.location = { type: 'Point', coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)] };
    const profile = await BuyerProfile.findOneAndUpdate({ user: req.user._id }, { $set: updates }, { new: true, upsert: true });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

router.get('/dashboard', async (req, res, next) => {
  try {
    const buyerId = req.user._id;
    const [activeDemands, pendingOrders, completedOrders] = await Promise.all([
      require('../models/BuyerDemand').find({ buyer: buyerId, status: 'active' }).limit(5),
      Order.find({ buyer: buyerId, status: { $in: ['pending', 'accepted', 'confirmed'] } }).limit(5),
      Order.countDocuments({ buyer: buyerId, status: 'completed' }),
    ]);
    res.json({ success: true, data: { activeDemands, pendingOrders, completedOrders } });
  } catch (err) { next(err); }
});

module.exports = router;
