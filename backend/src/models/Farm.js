const mongoose = require('mongoose');

const soilRecordSchema = new mongoose.Schema({
  N: { type: Number }, // Nitrogen kg/ha
  P: { type: Number }, // Phosphorus kg/ha
  K: { type: Number }, // Potassium kg/ha
  pH: { type: Number, min: 0, max: 14 },
  organicMatter: { type: Number },
  recordedAt: { type: Date, default: Date.now },
  source: { type: String, enum: ['self', 'soil_test', 'lab', 'estimate'], default: 'estimate' },
  labName: { type: String },
});

const farmSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
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
    district: { type: String, required: true },
    state: { type: String, required: true },
    village: { type: String },
    totalArea: { type: Number, required: true }, // acres
    irrigatedArea: { type: Number, default: 0 },
    soilType: {
      type: String,
      enum: ['red', 'black', 'alluvial', 'laterite', 'loamy', 'sandy', 'clay', 'other'],
    },
    waterSource: {
      type: String,
      enum: ['borewell', 'canal', 'rain_fed', 'river', 'pond', 'drip', 'other'],
    },
    waterAvailability: {
      type: String,
      enum: ['abundant', 'adequate', 'limited', 'scarce'],
    },
    elevation: { type: Number }, // meters
    soilRecords: [soilRecordSchema],
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

farmSchema.index({ location: '2dsphere' });
farmSchema.index({ farmer: 1 });
farmSchema.index({ district: 1, state: 1 });

module.exports = mongoose.model('Farm', farmSchema);
