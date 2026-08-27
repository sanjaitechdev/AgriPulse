const mongoose = require('mongoose');

const cropCycleSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
    crop: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop', required: true },
    fieldName: { type: String, default: 'Field 1', trim: true },
    variety: { type: String, trim: true },
    season: { type: String, enum: ['kharif', 'rabi', 'zaid', 'perennial'], default: 'kharif' },
    year: { type: Number, default: () => new Date().getFullYear() },
    landArea: { type: Number, required: true, min: 0.05 }, // acres
    
    // Dates & Timeline
    sowingDate: { type: Date, default: Date.now },
    plantedAt: { type: Date, default: Date.now }, // legacy support
    expectedHarvestAt: { type: Date },
    actualHarvestAt: { type: Date },

    // Irrigation & Soil
    irrigationType: {
      type: String,
      enum: ['drip', 'canal', 'sprinkler', 'rain_fed', 'borewell', 'flood', 'other'],
      default: 'drip'
    },
    soilInfo: { type: String },

    // Yields
    expectedYield: { type: Number }, // kg
    estimatedProduction: { type: Number }, // kg (legacy)
    actualProduction: { type: Number }, // kg

    // Dynamic Lifecycle State
    currentStage: {
      type: String,
      enum: ['sowing', 'germination', 'vegetative', 'flowering', 'fruiting', 'maturity', 'harvest_ready', 'harvested'],
      default: 'vegetative'
    },
    growthProgressPercent: { type: Number, min: 0, max: 100, default: 0 },
    
    // Overall Crop Status
    status: {
      type: String,
      enum: [
        'healthy', 'growing', 'needs_attention', 'harvest_approaching',
        'harvest_ready', 'harvested', 'at_risk', 'data_insufficient',
        'planning', 'planted', 'sold', 'cancelled'
      ],
      default: 'growing',
    },

    // AI Harvest Forecast
    harvestForecast: {
      expectedHarvestStart: { type: Date },
      expectedHarvestEnd: { type: Date },
      confidence: { type: Number, min: 0, max: 100, default: 80 },
      reason: { type: String },
      calculatedAt: { type: Date, default: Date.now }
    },

    // AI Explanation: "Why is my crop at this stage?"
    stageExplanation: { type: String },

    // Live Telemetry Context (Weather, Mandi, Water, Freshness)
    liveContext: {
      temperature: { type: Number },
      humidity: { type: Number },
      weatherCondition: { type: String },
      waterStatus: { type: String, default: 'adequate' },
      riskLevel: { type: String, default: 'low' },
      riskReason: { type: String },
      marketStatus: { type: String, default: 'stable' },
      currentMandiPrice: { type: Number },
      mandiName: { type: String },
      source: { type: String, default: 'AgriPulse Live Farm Sync' },
      lastSyncedAt: { type: Date, default: Date.now }
    },

    soldQuantity: { type: Number, default: 0 },
    unsoldQuantity: { type: Number, default: 0 },
    notes: { type: String },
    farmPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'FarmPlan' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

cropCycleSchema.index({ farmer: 1, status: 1 });
cropCycleSchema.index({ farm: 1, isActive: 1 });
cropCycleSchema.index({ crop: 1, season: 1, year: 1 });
cropCycleSchema.index({ expectedHarvestAt: 1 });

module.exports = mongoose.model('CropCycle', cropCycleSchema);

