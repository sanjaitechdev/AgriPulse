const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getFarmerProfile, updateFarmerProfile, getDashboard, getMyStats,
} = require('../controllers/farmerController');
const {
  getMyCrops, addCropToField, getCropDetails, updateCrop, deleteCrop
} = require('../controllers/cropTrackingController');

router.use(protect);
router.use(authorize('farmer'));

router.get('/profile', getFarmerProfile);
router.put('/profile', [
  body('district').optional().notEmpty(),
  body('state').optional().notEmpty(),
  body('totalLandSize').optional().isFloat({ min: 0.1 }),
  body('waterAvailability').optional().isIn(['abundant', 'adequate', 'limited', 'scarce']),
  body('primarySoilType').optional().isIn(['red', 'black', 'alluvial', 'laterite', 'loamy', 'sandy', 'clay', 'other']),
], validate, updateFarmerProfile);
router.get('/dashboard', getDashboard);
router.get('/stats', getMyStats);

// ── MY CROPS / CROP TRACKING ────────────────────────────────────────────────
router.get('/crops', getMyCrops);
router.post('/crops', addCropToField);
router.get('/crops/:id', getCropDetails);
router.put('/crops/:id', updateCrop);
router.delete('/crops/:id', deleteCrop);

module.exports = router;
