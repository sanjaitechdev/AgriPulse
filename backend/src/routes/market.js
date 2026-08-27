const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMarketPrices, getMarketTrends, getMarkets } = require('../controllers/marketController');

router.use(protect);
router.get('/prices', getMarketPrices);
router.get('/trends', getMarketTrends);
router.get('/markets', getMarkets);

module.exports = router;
