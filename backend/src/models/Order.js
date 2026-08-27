const mongoose = require('mongoose');

const orderStatusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorRole: { type: String, enum: ['farmer', 'buyer', 'admin', 'system'] },
  timestamp: { type: Date, default: Date.now },
  notes: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    proposal: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal', required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'CropListing' },
    demand: { type: mongoose.Schema.Types.ObjectId, ref: 'BuyerDemand' },
    crop: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop', required: true },
    cropName: { type: String, required: true },
    quantity: { type: Number, required: true }, // kg
    agreedPrice: { type: Number, required: true }, // ₹/kg
    totalValue: { type: Number, required: true },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'confirmed', 'pickup_scheduled', 'in_transit', 'delivered', 'completed', 'disputed', 'cancelled'],
      default: 'pending',
    },

    pickupDate: { type: Date },
    deliveryDate: { type: Date },
    actualDeliveryDate: { type: Date },

    pickupLocation: { type: String },
    deliveryLocation: { type: String },
    transportDetails: {
      provider: String,
      vehicleNumber: String,
      driverContact: String,
      estimatedCost: Number,
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded'],
      default: 'pending',
    },
    paymentMethod: { type: String },

    statusHistory: [orderStatusHistorySchema],

    farmerRating: { type: Number, min: 1, max: 5 },
    buyerRating: { type: Number, min: 1, max: 5 },
    farmerReview: { type: String },
    buyerReview: { type: String },

    disputeReason: { type: String },
    cancelReason: { type: String },

    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-compute totalValue
orderSchema.pre('save', function (next) {
  if (this.quantity && this.agreedPrice) {
    this.totalValue = this.quantity * this.agreedPrice;
  }
  next();
});

orderSchema.index({ farmer: 1, status: 1 });
orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
