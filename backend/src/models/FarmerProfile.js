const mongoose = require('mongoose');

const farmerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    district: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    village: { type: String, trim: true },
    pincode: { type: String, trim: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    farmerLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      locality: { type: String },
      village: { type: String },
      city: { type: String },
      district: { type: String },
      state: { type: String },
      country: { type: String },
      pincode: { type: String },
      source: { type: String },
      accuracy: { type: Number },
      updatedAt: { type: Date, default: Date.now }
    },
    totalLandSize: { type: Number, required: true }, // in acres
    irrigatedLand: { type: Number, default: 0 },
    primaryWaterSource: {
      type: String,
      enum: ['borewell', 'canal', 'rain_fed', 'river', 'pond', 'drip', 'other'],
    },
    waterAvailability: {
      type: String,
      enum: ['abundant', 'adequate', 'limited', 'scarce'],
    },
    primarySoilType: {
      type: String,
      enum: ['red', 'black', 'alluvial', 'laterite', 'loamy', 'sandy', 'clay', 'other'],
    },
    aadhaarNumber: { type: String, select: false },
    bankAccount: {
      accountNumber: { type: String, select: false },
      ifsc: { type: String },
      bankName: { type: String },
    },
    kccHolder: { type: Boolean, default: false },
    pmFasalBima: { type: Boolean, default: false },
    bio: { type: String, maxlength: 500 },
    experienceYears: { type: Number },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    completionRate: { type: Number, default: 0 }, // % orders completed
    responseRate: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
  },
  { timestamps: true }
);

farmerProfileSchema.index({ location: '2dsphere' });
farmerProfileSchema.index({ district: 1, state: 1 });

module.exports = mongoose.model('FarmerProfile', farmerProfileSchema);
