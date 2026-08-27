const Farm = require('../models/Farm');

// GET /api/farms
exports.getFarms = async (req, res, next) => {
  try {
    const farms = await Farm.find({ farmer: req.user.id }).lean();
    res.json({ success: true, data: farms });
  } catch (err) { next(err); }
};

// GET /api/farms/:id
exports.getFarm = async (req, res, next) => {
  try {
    const farm = await Farm.findOne({ _id: req.params.id, farmer: req.user.id }).lean();
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
    res.json({ success: true, data: farm });
  } catch (err) { next(err); }
};

// POST /api/farms
exports.createFarm = async (req, res, next) => {
  try {
    const farm = await Farm.create({ ...req.body, farmer: req.user.id });
    res.status(201).json({ success: true, data: farm });
  } catch (err) { next(err); }
};

// PUT /api/farms/:id
exports.updateFarm = async (req, res, next) => {
  try {
    const farm = await Farm.findOneAndUpdate(
      { _id: req.params.id, farmer: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
    res.json({ success: true, data: farm });
  } catch (err) { next(err); }
};

// DELETE /api/farms/:id
exports.deleteFarm = async (req, res, next) => {
  try {
    const farm = await Farm.findOneAndDelete({ _id: req.params.id, farmer: req.user.id });
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
    res.json({ success: true, message: 'Farm deleted' });
  } catch (err) { next(err); }
};
