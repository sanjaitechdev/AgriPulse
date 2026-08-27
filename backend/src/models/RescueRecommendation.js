const mongoose = require('mongoose');

const rescueOptionSchema = new mongoose.Schema({
  rank: { type: Number, required: true },
  type: {
    type: String,
    enum: ['alternate_buyer', 'alternate_market', 'processor', 'cold_storage', 'aggregation', 'price_adjustment', 'split_quantity'],
    required: true,
  },
  label: { type: String, required: true }, // e.g. "Sell to Buyer B"
  buyerName: { type: String },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  marketName: { type: String },
  processorName: { type: String },
  offeredPrice: { type: Number }, // ₹/kg
  quantity: { type: Number }, // kg
  distanceKm: { type: Number },
  transportCost: { type: Number },
  handlingCost: { type: Number },
  estimatedSpoilageLoss: { type: Number },
  expectedNetReturn: { type: Number }, // final ₹ after all deductions
  netReturnPerKg: { type: Number },
  riskLevel: { type: String, enum: ['very_low', 'low', 'medium', 'high'] },
  rationale: { type: String },
  actionSteps: [{ type: String }],
  validTill: { type: Date },
});

const rescueRecommendationSchema = new mongoose.Schema(
  {
    cropCycle: { type: mongoose.Schema.Types.ObjectId, ref: 'CropCycle', required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    riskPrediction: { type: mongoose.Schema.Types.ObjectId, ref: 'RiskPrediction' },
    trigger: { type: String, enum: ['high_risk', 'critical_risk', 'manual', 'admin'] },
    options: [rescueOptionSchema],
    chosenOption: { type: Number }, // rank of chosen option
    chosenAt: { type: Date },
    outcome: { type: String, enum: ['resolved', 'partial', 'failed', 'pending'] },
    computedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

rescueRecommendationSchema.index({ farmer: 1, isActive: 1 });
rescueRecommendationSchema.index({ cropCycle: 1 });

module.exports = mongoose.model('RescueRecommendation', rescueRecommendationSchema);
