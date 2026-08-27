const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'CropListing' },
    demand: { type: mongoose.Schema.Types.ObjectId, ref: 'BuyerDemand' },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromRole: { type: String, enum: ['farmer', 'buyer'], required: true },
    crop: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop', required: true },
    cropName: { type: String, required: true },
    quantity: { type: Number, required: true }, // kg
    offeredPrice: { type: Number, required: true }, // ₹/kg
    totalValue: { type: Number }, // computed
    deliveryDate: { type: Date },
    deliveryLocation: { type: String },
    message: { type: String, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'counter_offered', 'accepted', 'rejected', 'withdrawn', 'expired'],
      default: 'pending',
    },
    counterOffer: {
      price: Number,
      quantity: Number,
      message: String,
      offeredAt: Date,
    },
    expiresAt: { type: Date },
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

// Auto-compute totalValue
proposalSchema.pre('save', function (next) {
  if (this.quantity && this.offeredPrice) {
    this.totalValue = this.quantity * this.offeredPrice;
  }
  next();
});

proposalSchema.index({ farmer: 1, status: 1 });
proposalSchema.index({ buyer: 1, status: 1 });
proposalSchema.index({ listing: 1 });
proposalSchema.index({ demand: 1 });

module.exports = mongoose.model('Proposal', proposalSchema);
