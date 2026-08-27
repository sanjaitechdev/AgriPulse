const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getRescueRadar,
  getRescuePlan,
  chooseRescueOption,
  refreshRescueRadar,
} = require('../controllers/rescueController');

router.use(protect);
router.use(authorize('farmer', 'admin'));

// Live Rescue Radar Overview for all farmer crops
router.get('/radar', getRescueRadar);

// Live Rescue Plan for a specific crop/cycle
router.get('/plan/:cycleId', getRescuePlan);

// Activate / choose a rescue option
router.post('/choose', chooseRescueOption);

// Force refresh live data from APIs
router.post('/refresh', refreshRescueRadar);

module.exports = router;
