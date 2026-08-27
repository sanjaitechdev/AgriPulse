const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getNotifications, markRead, markAllRead } = require('../controllers/notificationController');

router.use(protect);
router.get('/', getNotifications);
router.put('/:id/read', markRead);
router.post('/read-all', markAllRead);

module.exports = router;
