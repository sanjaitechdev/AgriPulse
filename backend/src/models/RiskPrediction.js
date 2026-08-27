const mongoose = require('mongoose');

const riskPredictionSchema = new mongoose.Schema(
  {
    cropCycle: { type: mongoose.Schema.Types.ObjectId, ref: 'CropCycle', required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    crop: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' },
    cropName: { type: String },

    // Demand gap analysis
    estimatedProduction: { type: Number }, // kg
    estimatedDemand: { type: Number }, // kg
    demandGap: { type: Number }, // production - demand (positive = oversupply)
    demandGapPercent: { type: Number },

    // Unsold risk
    unsoldProbability: { type: Number, min: 0, max: 1 }, // 0.0 to 1.0
    riskCategory: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },

    // Price risk
    currentMarketPrice: { type: Number },
    forecastedPrice: { type: Number },
    priceRisk: { type: String, enum: ['stable', 'declining', 'volatile', 'unknown'] },

    // Shelf life risk
    shelfLifeDays: { type: Number },
    daysToHarvest: { type: Number },
    spoilageRisk: { type: String, enum: ['low', 'medium', 'high'] },

    // Active buyers
    confirmedBuyerQuantity: { type: Number, default: 0 },
    pendingProposalQuantity: { type: Number, default: 0 },

    inputFeatures: { type: mongoose.Schema.Types.Mixed },
    modelVersion: { type: String },
    computedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

riskPredictionSchema.index({ cropCycle: 1, computedAt: -1 });
riskPredictionSchema.index({ farmer: 1, riskCategory: 1 });
riskPredictionSchema.index({ riskCategory: 1, isActive: 1 });

module.exports = mongoose.model('RiskPrediction', riskPredictionSchema);
