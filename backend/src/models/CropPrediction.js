const mongoose = require('mongoose');

// Score breakdown components
const scoreComponentSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Soil Compatibility"
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  description: { type: String },
});

const cropPredictionSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },

    // Input parameters used for this prediction
    inputFeatures: {
      N: Number,
      P: Number,
      K: Number,
      pH: Number,
      temperature: Number,
      humidity: Number,
      rainfall: Number,
      soilType: String,
      season: String,
      waterAvailability: String,
      district: String,
      landArea: Number,
    },

    // Top crop recommendations
    recommendations: [
      {
        crop: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' },
        cropName: { type: String },
        overallScore: { type: Number }, // 0-100
        marketOpportunity: { type: Number }, // Combined Score
        rank: { type: Number },
        confidence: { type: Number }, // 0-1
        components: [scoreComponentSchema],
        humanExplanation: { type: String },
        estimatedYield: { type: Number }, // kg/acre
        estimatedRevenue: { type: Number },
        estimatedProfitability: { type: Number },
        priceOutlook: { type: String, enum: ['bullish', 'neutral', 'bearish', 'uncertain'] },
        demandOutlook: { type: String, enum: ['strong', 'moderate', 'weak', 'uncertain'] },
        riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
      },
    ],

    modelVersion: { type: String, required: true },
    modelName: { type: String, default: 'crop_suitability' },
    computedAt: { type: Date, default: Date.now },
    isStale: { type: Boolean, default: false }, // mark when inputs change
  },
  { timestamps: true }
);

cropPredictionSchema.index({ farmer: 1, createdAt: -1 });
cropPredictionSchema.index({ farm: 1 });

module.exports = mongoose.model('CropPrediction', cropPredictionSchema);
