const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'demand_new', 'listing_new', 'match_new', 'proposal_received', 'proposal_accepted',
        'proposal_rejected', 'proposal_counter', 'order_status', 'risk_alert', 'rescue_ready',
        'weather_advisory', 'market_update', 'verification', 'system', 'admin_alert',
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed }, // extra context
    relatedEntity: {
      type: { type: String },
      id: { type: mongoose.Schema.Types.ObjectId },
    },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
