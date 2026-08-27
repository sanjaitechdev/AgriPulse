const mongoose = require('mongoose');

// Farm plan milestone
const milestoneSchema = new mongoose.Schema({
  week: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String },
  activities: [{ type: String }],
  alertType: { type: String, enum: ['info', 'warning', 'critical'] },
});

const farmPlanSchema = new mongoose.Schema(
  {
    cropCycle: { type: mongoose.Schema.Types.ObjectId, ref: 'CropCycle', required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
    crop: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop', required: true },

    // Input requirements
    landArea: { type: Number, required: true }, // acres
    seedRequirement: { quantity: Number, unit: String, estimatedCost: Number },
    fertilizerRequirement: [{ name: String, quantity: Number, unit: String, estimatedCost: Number }],
    irrigationRequirement: { schedule: String, totalWater: Number, estimatedCost: Number },
    laborRequirement: { manDays: Number, estimatedCost: Number },
    pesticidesRequirement: { estimatedCost: Number },
    otherCosts: { type: Number, default: 0 },

    // Financials (all marked as estimates)
    totalEstimatedCost: { type: Number },
    estimatedProduction: { type: Number }, // kg
    estimatedRevenue: { type: Number },
    estimatedProfitMin: { type: Number },
    estimatedProfitMax: { type: Number },
    breakEvenPrice: { type: Number }, // per kg

    // Dates
    plantingDate: { type: Date },
    expectedHarvestStart: { type: Date },
    expectedHarvestEnd: { type: Date },

    // Milestones
    milestones: [milestoneSchema],

    // Risks
    weatherRisks: [{ type: String }],
    pestRisks: [{ type: String }],
    marketRisks: [{ type: String }],

    generatedBy: { type: String, enum: ['system', 'ai', 'manual'], default: 'system' },
    notes: { type: String },
  },
  { timestamps: true }
);

farmPlanSchema.index({ farmer: 1, createdAt: -1 });
farmPlanSchema.index({ cropCycle: 1 });

module.exports = mongoose.model('FarmPlan', farmPlanSchema);
