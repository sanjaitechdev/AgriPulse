const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { aiLimiter } = require('../middleware/rateLimiter');
const {
  getCropOpportunity, getCropOpportunityById, getOpportunityExplanation,
  getDemandForecast, getRiskPrediction, getRescueRecommendations,
  getSoilExtraction, analyzeDecision, analyzeAllCrops
} = require('../controllers/aiController');

// Multer upload destination config
const upload = multer({ dest: 'uploads/' });

router.use(protect);
router.use(aiLimiter);

router.post('/crop-opportunity', [
  body('farmId').isMongoId().withMessage('Valid farm ID required'),
  body('season').isIn(['kharif', 'rabi', 'zaid', 'perennial']),
], validate, getCropOpportunity);

router.post('/decision/analyze', [
  body('farmId').isMongoId().withMessage('Valid farm ID required'),
  body('crop').notEmpty().withMessage('Crop is required'),
], validate, analyzeDecision);

// NEW: Multi-crop decision engine — analyzes ALL crops at once
router.post('/decision/analyze-all', [
  body('farmId').isMongoId().withMessage('Valid farm ID required'),
], validate, analyzeAllCrops);

router.get('/crop-opportunity/:id', getCropOpportunityById);
router.get('/crop-opportunity/:id/explanation', getOpportunityExplanation);
router.get('/demand-forecast', getDemandForecast);
router.get('/risk-prediction/:cycleId', getRiskPrediction);
router.post('/rescue-recommendations', getRescueRecommendations);
router.post('/soil-extract', upload.single('file'), getSoilExtraction);

module.exports = router;
