const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getOrders, createOrder, updateOrderStatus, getOrderHistory } = require('../controllers/orderController');

router.use(protect);
router.get('/', getOrders);
router.post('/', createOrder);
router.put('/:id/status', updateOrderStatus);
router.get('/:id/history', getOrderHistory);

module.exports = router;
