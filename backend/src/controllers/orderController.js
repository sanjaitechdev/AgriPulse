const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');
const { emitToUser, emitToAdmin } = require('../socket');
const { createNotification } = require('../services/notificationService');

const STATUS_TRANSITIONS = {
  pending: ['accepted', 'cancelled'],
  accepted: ['confirmed', 'cancelled'],
  confirmed: ['pickup_scheduled', 'cancelled'],
  pickup_scheduled: ['in_transit'],
  in_transit: ['delivered'],
  delivered: ['completed', 'disputed'],
  completed: [],
  disputed: ['completed', 'cancelled'],
  cancelled: [],
};

// @GET /api/orders
exports.getOrders = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const query = role === 'admin' ? {} : (role === 'farmer' ? { farmer: userId } : { buyer: userId });
    if (req.query.status) query.status = req.query.status;

    const orders = await Order.find(query)
      .populate('farmer', 'name phone')
      .populate('buyer', 'name phone')
      .populate('crop', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

// @POST /api/orders (manual creation, usually auto-created from proposal accept)
exports.createOrder = async (req, res, next) => {
  try {
    const { proposalId } = req.body;
    const proposal = await require('../models/Proposal').findById(proposalId);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });
    if (proposal.status !== 'accepted') return res.status(400).json({ success: false, message: 'Proposal not yet accepted' });

    const order = await Order.create({
      proposal: proposalId,
      farmer: proposal.farmer,
      buyer: proposal.buyer,
      crop: proposal.crop,
      cropName: proposal.cropName,
      quantity: proposal.quantity,
      agreedPrice: proposal.offeredPrice,
      statusHistory: [{ status: 'pending', actor: req.user._id, actorRole: req.user.role, timestamp: new Date() }],
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, notes, transportDetails } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const userId = req.user._id;
    const role = req.user.role;
    const isParty = order.farmer.equals(userId) || order.buyer.equals(userId) || role === 'admin';
    if (!isParty) return res.status(403).json({ success: false, message: 'Not authorized' });

    // Validate transition
    const allowed = STATUS_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${order.status}' to '${status}'. Allowed: ${allowed.join(', ')}`,
      });
    }

    const prev = order.status;
    order.status = status;
    if (transportDetails) order.transportDetails = transportDetails;
    order.statusHistory.push({ status, actor: userId, actorRole: role, timestamp: new Date(), notes });

    await order.save();

    // Notify the other party
    const notifyFarmer = !order.farmer.equals(userId);
    const notifyBuyer = !order.buyer.equals(userId);

    const msg = `Order for ${order.cropName} moved to: ${status.replace(/_/g, ' ')}`;
    if (notifyFarmer) await createNotification(order.farmer, 'order_status', 'Order Update', msg, { orderId: order._id });
    if (notifyBuyer) await createNotification(order.buyer, 'order_status', 'Order Update', msg, { orderId: order._id });

    emitToUser(order.farmer.toString(), 'order:status', { orderId: order._id, status, previous: prev });
    emitToUser(order.buyer.toString(), 'order:status', { orderId: order._id, status, previous: prev });
    emitToAdmin('admin:order_update', { orderId: order._id, status });

    await AuditLog.create({
      actor: userId, actorRole: role, action: `order.status.${status}`,
      entity: 'Order', entityId: order._id, changes: { from: prev, to: status },
    });

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// @GET /api/orders/:id/history
exports.getOrderHistory = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('statusHistory.actor', 'name role');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order.statusHistory });
  } catch (err) {
    next(err);
  }
};
