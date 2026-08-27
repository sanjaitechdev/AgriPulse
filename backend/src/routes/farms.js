const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Farm = require('../models/Farm');

router.use(protect);
router.use(authorize('farmer', 'admin'));

// GET all farms for current farmer
router.get('/', async (req, res, next) => {
  try {
    const farms = await Farm.find({ farmer: req.user._id, isActive: true });
    res.json({ success: true, data: farms });
  } catch (err) { next(err); }
});

// POST create farm
router.post('/', [
  body('name').trim().notEmpty(),
  body('totalArea').isFloat({ min: 0.1 }),
  body('district').notEmpty(),
  body('state').notEmpty(),
  body('lat').optional().isFloat(),
  body('lng').optional().isFloat(),
], validate, async (req, res, next) => {
  try {
    const { name, totalArea, irrigatedArea, district, state, village, soilType, waterSource, waterAvailability, lat, lng, notes } = req.body;
    const farm = await Farm.create({
      farmer: req.user._id, name, totalArea, irrigatedArea, district, state, village, soilType, waterSource, waterAvailability,
      location: lat && lng ? { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] } : undefined,
      notes,
    });
    res.status(201).json({ success: true, data: farm });
  } catch (err) { next(err); }
});

// GET single farm
router.get('/:id', async (req, res, next) => {
  try {
    const farm = await Farm.findOne({ _id: req.params.id, farmer: req.user._id });
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
    res.json({ success: true, data: farm });
  } catch (err) { next(err); }
});

// PUT update farm
router.put('/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'totalArea', 'irrigatedArea', 'soilType', 'waterSource', 'waterAvailability', 'notes', 'district', 'state', 'village', 'farmerLocation'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    let lat = req.body.lat;
    let lng = req.body.lng;

    if (updates.farmerLocation) {
      lat = updates.farmerLocation.latitude;
      lng = updates.farmerLocation.longitude;
      updates.district = updates.farmerLocation.district || updates.district;
      updates.state = updates.farmerLocation.state || updates.state;
      updates.village = updates.farmerLocation.village || updates.village;
      updates.farmerLocation.updatedAt = new Date();
    }

    if (lat && lng) {
      updates.location = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
    }

    const farm = await Farm.findOneAndUpdate({ _id: req.params.id, farmer: req.user._id }, { $set: updates }, { new: true });
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });

    // Also update FarmerProfile to stay in sync
    const FarmerProfile = require('../models/FarmerProfile');
    const profileUpdates = {};
    if (updates.district) profileUpdates.district = updates.district;
    if (updates.state) profileUpdates.state = updates.state;
    if (updates.village) profileUpdates.village = updates.village;
    if (updates.farmerLocation) profileUpdates.farmerLocation = updates.farmerLocation;
    if (lat && lng) profileUpdates.location = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };

    await FarmerProfile.findOneAndUpdate({ user: req.user._id }, { $set: profileUpdates });

    // Emit FARM_LOCATION_UPDATED event via Socket.IO
    try {
      const { emitEvent } = require('../socket');
      emitEvent('FARM_LOCATION_UPDATED', {
        farmerId: req.user._id,
        latitude: lat || (updates.farmerLocation?.latitude),
        longitude: lng || (updates.farmerLocation?.longitude),
        district: updates.district || farm.district,
        state: updates.state || farm.state,
      });
    } catch (socketErr) {
      console.error('Socket notification for location update failed:', socketErr.message);
    }

    res.json({ success: true, data: farm });
  } catch (err) { next(err); }
});

// DELETE farm
router.delete('/:id', async (req, res, next) => {
  try {
    const farm = await Farm.findOneAndDelete({ _id: req.params.id, farmer: req.user._id });
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
    res.json({ success: true, message: 'Farm deleted successfully' });
  } catch (err) { next(err); }
});

// POST sync all farms to farmer's profile location
router.post('/sync-all', async (req, res, next) => {
  try {
    const FarmerProfile = require('../models/FarmerProfile');
    const profile = await FarmerProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const updates = {
      district: profile.district || 'Tiruppur',
      state: profile.state || 'Tamil Nadu',
      village: profile.village || '',
      ...(profile.location ? { location: profile.location } : {}),
      ...(profile.farmerLocation ? { farmerLocation: profile.farmerLocation } : {})
    };

    await Farm.updateMany({ farmer: req.user._id }, { $set: updates });
    const farms = await Farm.find({ farmer: req.user._id, isActive: true });
    res.json({ success: true, message: 'All farms synchronized to profile location', data: farms });
  } catch (err) { next(err); }
});

module.exports = router;
