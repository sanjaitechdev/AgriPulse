const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getListings, createListing, getListingById, updateListing, getListingMatches,
} = require('../controllers/listingController');

router.use(protect);

// Farmers create listings; everyone can read
router.post('/', authorize('farmer'), [
  body('cropName').trim().notEmpty().withMessage('Crop name required'),
  body('quantity').isFloat({ min: 1 }).withMessage('Quantity must be positive'),
  body('askingPrice').isFloat({ min: 0.5 }).withMessage('Asking price required'),
  body('availableFrom').isISO8601().withMessage('Available from date required'),
  body('pickupLocation').notEmpty().withMessage('Pickup location required'),
], validate, createListing);

router.get('/', getListings);
router.get('/:id', getListingById);
router.put('/:id', authorize('farmer'), updateListing);
router.get('/:id/matches', getListingMatches);

module.exports = router;
