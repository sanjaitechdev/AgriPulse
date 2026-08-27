const mongoose = require('mongoose');

const decisionSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
    crop: { type: String, required: true },
    cropRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' },
    recommendation: { type: String, required: true },
    bestMarket: { type: String },
    allocation: [
      {
        market: String,
        quantity: Number,
        storage: Boolean,
        action: String,
      }
    ],
    expectedRevenue: { type: Number },
    totalCost: { type: Number },
    expectedProfit: { type: Number },
    riskAdjustedProfit: { type: Number },
    riskScore: { type: Number },
    confidence: { type: Number },
    explanation: { type: String },
    shapBreakdown: [
      {
        factor: String,
        weight: Number,
        impact: String,
      }
    ],
    alternatives: [mongoose.Schema.Types.Mixed],
    weather: mongoose.Schema.Types.Mixed,
    modelVersion: { type: String, default: 'AgriPulse-Decision-v1' },
    dataSource: { type: String, default: 'APMC daily mandi sync + Open-Meteo' },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

decisionSchema.index({ farmer: 1, createdAt: -1 });

module.exports = mongoose.model('Decision', decisionSchema);
