const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getProposals, createProposal, updateProposal,
} = require('../controllers/proposalController');

router.use(protect);

router.get('/', getProposals);
router.post('/', [
  body('listingId').optional().isMongoId(),
  body('demandId').optional().isMongoId(),
  body('quantity').isFloat({ min: 1 }),
  body('offeredPrice').isFloat({ min: 0.1 }),
  body('cropName').trim().notEmpty(),
], validate, createProposal);
router.put('/:id', updateProposal);

module.exports = router;
