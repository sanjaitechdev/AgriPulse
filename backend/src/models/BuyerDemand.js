const mongoose = require('mongoose');

const buyerDemandSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    crop: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop', required: true },
    cropName: { type: String, required: true },
    quantity: { type: Number, required: true }, // kg
    gradeRequired: { type: String, enum: ['A', 'B', 'C', 'organic', 'export_quality', 'any'] },
    targetPriceMin: { type: Number }, // ₹/kg
    targetPriceMax: { type: Number },
    requiredByDate: { type: Date, required: true },
    deliveryLocation: { type: String, required: true },
    deliveryState: { type: String },
    deliveryDistrict: { type: String },
    deliveryCoordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    maxDistanceKm: { type: Number, default: 300 },
    requirements: { type: String, maxlength: 500 }, // specific notes
    status: {
      type: String,
      enum: ['active', 'partially_fulfilled', 'fulfilled', 'expired', 'cancelled'],
      default: 'active',
    },
    fulfilledQuantity: { type: Number, default: 0 },
    matchedListings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CropListing' }],
    expiresAt: { type: Date },
    isAggregatable: { type: Boolean, default: true }, // can multiple farmers fulfil?
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

buyerDemandSchema.index({ deliveryCoordinates: '2dsphere' });
buyerDemandSchema.index({ crop: 1, status: 1 });
buyerDemandSchema.index({ buyer: 1, createdAt: -1 });
buyerDemandSchema.index({ requiredByDate: 1, status: 1 });

module.exports = mongoose.model('BuyerDemand', buyerDemandSchema);
