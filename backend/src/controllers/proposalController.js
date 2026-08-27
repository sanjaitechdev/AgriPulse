const Proposal = require('../models/Proposal');
const Order = require('../models/Order');
const { emitEvent } = require('../socket');
const { createNotification } = require('../services/notificationService');
const AuditLog = require('../models/AuditLog');

// @GET /api/proposals
exports.getProposals = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const query = role === 'farmer' ? { farmer: userId } : { buyer: userId };

    if (req.query.status) query.status = req.query.status;

    const proposals = await Proposal.find(query)
      .populate('farmer', 'name')
      .populate('buyer', 'name')
      .populate('crop', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: proposals });
  } catch (err) {
    next(err);
  }
};

// @POST /api/proposals
exports.createProposal = async (req, res, next) => {
  try {
    const { listingId, demandId, quantity, offeredPrice, cropName, deliveryDate, deliveryLocation, message } = req.body;
    const userId = req.user._id;
    const role = req.user.role;

    // Determine farmer and buyer from context
    let farmerId, buyerId;
    if (role === 'farmer') {
      farmerId = userId;
      // Get buyer from demand
      if (demandId) {
        const { BuyerDemand } = require('../models/BuyerDemand');
        const demand = await require('../models/BuyerDemand').findById(demandId);
        buyerId = demand?.buyer;
      }
    } else {
      buyerId = userId;
      if (listingId) {
        const listing = await require('../models/CropListing').findById(listingId);
        farmerId = listing?.farmer;
      }
    }

    if (!farmerId || !buyerId) {
      return res.status(400).json({ success: false, message: 'Cannot determine both parties for proposal' });
    }

    // Check for duplicate active proposal
    const existing = await Proposal.findOne({
      farmer: farmerId, buyer: buyerId, listing: listingId, status: { $in: ['pending', 'counter_offered'] }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An active proposal already exists for this pair' });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48h to respond

    const proposal = await Proposal.create({
      listing: listingId,
      demand: demandId,
      farmer: farmerId,
      buyer: buyerId,
      fromRole: role,
      crop: req.body.cropId,
      cropName,
      quantity,
      offeredPrice,
      deliveryDate,
      deliveryLocation,
      message,
      expiresAt,
    });

    // Notify counterparty
    const targetUserId = role === 'farmer' ? buyerId : farmerId;
    await createNotification(targetUserId, 'proposal_received', 'New Proposal Received',
      `${req.user.name} sent a proposal for ${cropName} — ₹${offeredPrice}/kg × ${quantity} kg`,
      { proposalId: proposal._id });

    // Real-time event
    emitEvent('proposal:new', { proposal: proposal.toObject(), targetUserId });

    // Audit
    await AuditLog.create({ actor: userId, actorRole: role, action: 'proposal.created', entity: 'Proposal', entityId: proposal._id });

    res.status(201).json({ success: true, data: proposal });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/proposals/:id
exports.updateProposal = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { action, counterPrice, counterQuantity, counterMessage, rejectionReason } = req.body;

    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });

    const isParty = proposal.farmer.equals(userId) || proposal.buyer.equals(userId);
    if (!isParty) return res.status(403).json({ success: false, message: 'Not authorized' });

    const now = new Date();

    if (action === 'accept') {
      proposal.status = 'accepted';
      proposal.acceptedAt = now;

      // Auto-create order
      const order = await Order.create({
        proposal: proposal._id,
        farmer: proposal.farmer,
        buyer: proposal.buyer,
        listing: proposal.listing,
        demand: proposal.demand,
        crop: proposal.crop,
        cropName: proposal.cropName,
        quantity: proposal.quantity,
        agreedPrice: proposal.offeredPrice,
        statusHistory: [{ status: 'pending', actor: userId, actorRole: req.user.role, timestamp: now }],
      });

      // Notify both
      const notifyId = proposal.farmer.equals(userId) ? proposal.buyer : proposal.farmer;
      await createNotification(notifyId, 'proposal_accepted', 'Proposal Accepted!',
        `Your proposal for ${proposal.cropName} has been accepted. Order created.`, { orderId: order._id });

      emitEvent('proposal:updated', { proposal: proposal.toObject() });
      emitEvent('order:status', { order: order.toObject() });

    } else if (action === 'reject') {
      proposal.status = 'rejected';
      proposal.rejectedAt = now;
      proposal.rejectionReason = rejectionReason;

      const notifyId = proposal.farmer.equals(userId) ? proposal.buyer : proposal.farmer;
      await createNotification(notifyId, 'proposal_rejected', 'Proposal Declined',
        `Your proposal for ${proposal.cropName} was declined.`, { proposalId: proposal._id });

      emitEvent('proposal:updated', { proposal: proposal.toObject() });

    } else if (action === 'counter') {
      proposal.status = 'counter_offered';
      proposal.counterOffer = { price: counterPrice, quantity: counterQuantity, message: counterMessage, offeredAt: now };
      proposal.offeredPrice = counterPrice || proposal.offeredPrice;

      const notifyId = proposal.farmer.equals(userId) ? proposal.buyer : proposal.farmer;
      await createNotification(notifyId, 'proposal_counter', 'Counter Offer Received',
        `${req.user.name} made a counter offer: ₹${counterPrice}/kg`, { proposalId: proposal._id });

      emitEvent('proposal:updated', { proposal: proposal.toObject() });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    await proposal.save();
    await AuditLog.create({ actor: userId, actorRole: req.user.role, action: `proposal.${action}`, entity: 'Proposal', entityId: proposal._id });

    res.json({ success: true, data: proposal });
  } catch (err) {
    next(err);
  }
};
