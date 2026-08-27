const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getDemands, createDemand, getDemandById, updateDemand, getDemandMatches,
} = require('../controllers/demandController');

router.use(protect);

// Buyers create demands; everyone can read
router.post('/', authorize('buyer'), [
  body('cropName').trim().notEmpty().withMessage('Crop name required'),
  body('quantity').isFloat({ min: 1 }).withMessage('Quantity must be positive'),
  body('requiredByDate').isISO8601().withMessage('Required by date needed'),
  body('deliveryLocation').notEmpty().withMessage('Delivery location required'),
], validate, createDemand);

router.get('/', getDemands);
router.get('/:id', getDemandById);
router.put('/:id', authorize('buyer'), updateDemand);
router.get('/:id/matches', getDemandMatches);

module.exports = router;
