const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getWeatherCurrent, getWeatherForecast, getWeatherAdvisories } = require('../controllers/weatherController');

router.use(protect);
router.get('/current', getWeatherCurrent);
router.get('/forecast', getWeatherForecast);
router.get('/advisories', getWeatherAdvisories);

module.exports = router;
