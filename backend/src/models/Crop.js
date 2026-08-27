const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema(
  {
    // Primary identification (backward compatible with 'name')
    name: { type: String, required: true, unique: true, trim: true },
    crop_id: { type: String, unique: true, sparse: true },
    crop_name: { type: String },

    // Localized names
    localNames: {
      type: Map,
      of: String,
      default: {}
    },
    telugu_name: { type: String },
    tamil_name: { type: String },
    hindi_name: { type: String },

    // Categorization
    category: {
      type: String,
      enum: ['vegetable', 'fruit', 'cereal', 'pulse', 'oilseed', 'spice', 'fiber', 'fodder', 'flower', 'plantation', 'commercial', 'millet', 'other'],
      required: true,
    },
    sub_category: { type: String },

    // Seasonal & timelines
    seasons: [{ type: String, enum: ['kharif', 'rabi', 'zaid', 'perennial'] }],
    season: { type: String },
    sowing_window: { type: String },
    harvest_window: { type: String },
    durationDays: { min: Number, max: Number },
    duration_days: { type: Number },

    // Soil & climate parameters
    soilCompatibility: [{ type: String }],
    soil_types: [{ type: String }],
    optimalPH: { min: Number, max: Number },
    min_ph: { type: Number },
    max_ph: { type: Number },
    optimalTemp: { min: Number, max: Number },
    temperature_min: { type: Number },
    temperature_max: { type: Number },
    optimalRainfall: { min: Number, max: Number },
    rainfall_min: { type: Number },
    rainfall_max: { type: Number },

    // Water & tolerance parameters
    waterRequirement: {
      type: String,
      enum: ['very_low', 'low', 'moderate', 'high', 'very_high'],
    },
    water_requirement: { type: String },
    drought_tolerance: { type: String, enum: ['high', 'medium', 'low', 'none'], default: 'medium' },
    waterlogging_tolerance: { type: String, enum: ['high', 'medium', 'low', 'none'], default: 'medium' },

    // Region suitability
    suitable_states: [{ type: String }],
    suitable_districts: [{ type: String }],
    agro_climatic_regions: [{ type: String }],

    // Output yields and cost variables
    avgYieldPerAcre: { type: Number }, // legacy support
    expected_yield_range: { min: Number, max: Number }, // kg per acre
    cultivation_cost_range: { min: Number, max: Number }, // INR per acre
    shelfLifeDays: { type: Number }, // legacy support
    shelf_life_days: { type: Number },

    // Commodity Mapping & API Sync Aliases
    market_commodity_names: [{ type: String }],
    agmarknet_names: [{ type: String }],
    aliases: [{ type: String }],
    varieties: [{ type: String }],

    // Risk profiles
    disease_risk: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    weather_risk: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    market_risk: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },

    // Metadata
    isActive: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    data_source: { type: String, default: 'AgriConnect Crop Master' },
    last_verified: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

cropSchema.index({ category: 1, seasons: 1 });
cropSchema.index({ aliases: 1 });
cropSchema.index({ market_commodity_names: 1 });

module.exports = mongoose.model('Crop', cropSchema);
