const mongoose = require('mongoose');

const cropListingSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm' },
    crop: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop', required: true },
    cropName: { type: String, required: true },
    cropCycle: { type: mongoose.Schema.Types.ObjectId, ref: 'CropCycle' },
    quantity: { type: Number, required: true }, // kg
    availableQuantity: { type: Number }, // remaining
    askingPrice: { type: Number, required: true }, // ₹/kg
    minAcceptablePrice: { type: Number },
    grade: { type: String, enum: ['A', 'B', 'C', 'organic', 'export_quality'] },
    availableFrom: { type: Date, required: true },
    availableTill: { type: Date },
    pickupLocation: { type: String, required: true },
    pickupDistrict: { type: String },
    pickupState: { type: String },
    pickupCoordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    description: { type: String, maxlength: 500 },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ['active', 'partially_sold', 'sold', 'expired', 'cancelled', 'under_negotiation'],
      default: 'active',
    },
    soldQuantity: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

cropListingSchema.index({ pickupCoordinates: '2dsphere' });
cropListingSchema.index({ crop: 1, status: 1 });
cropListingSchema.index({ farmer: 1, createdAt: -1 });
cropListingSchema.index({ availableFrom: 1 });
cropListingSchema.index({ pickupDistrict: 1, pickupState: 1 });

module.exports = mongoose.model('CropListing', cropListingSchema);
