const mongoose = require('mongoose');

const buyerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    orgName: { type: String, required: true, trim: true },
    orgType: {
      type: String,
      enum: ['trader', 'processor', 'exporter', 'retailer', 'wholesaler', 'cold_storage', 'aggregator', 'fpo', 'other'],
      required: true,
    },
    gstNumber: { type: String, trim: true },
    panNumber: { type: String, trim: true, select: false },
    fssaiNumber: { type: String, trim: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    address: { type: String },
    pincode: { type: String },
    bio: { type: String, maxlength: 500 },
    preferredCrops: [{ type: String }],
    preferredGrades: [{ type: String, enum: ['A', 'B', 'C', 'organic', 'export_quality'] }],
    maxDistanceKm: { type: Number, default: 200 }, // max distance willing to source from
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    completionRate: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 },
    cancellationRate: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
    totalPurchased: { type: Number, default: 0 }, // in kg
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

buyerProfileSchema.index({ location: '2dsphere' });
buyerProfileSchema.index({ district: 1, state: 1 });
buyerProfileSchema.index({ orgType: 1 });
buyerProfileSchema.index({ preferredCrops: 1 });

module.exports = mongoose.model('BuyerProfile', buyerProfileSchema);
