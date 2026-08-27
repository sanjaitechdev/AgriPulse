const mongoose = require('mongoose');

const aiModelVersionSchema = new mongoose.Schema(
  {
    modelName: {
      type: String,
      required: true,
      enum: ['crop_suitability', 'price_forecast', 'demand_forecast', 'unsold_risk', 'buyer_matching'],
    },
    version: { type: String, required: true },
    trainedAt: { type: Date, required: true },
    algorithm: { type: String }, // e.g. "XGBoostClassifier"
    features: [{ type: String }],
    targetVariable: { type: String },
    datasetVersion: { type: String },
    sampleCount: { type: Number },
    metrics: {
      accuracy: Number,
      precision: Number,
      recall: Number,
      f1: Number,
      mae: Number,
      rmse: Number,
      r2: Number,
    },
    filePath: { type: String }, // path to saved model
    isActive: { type: Boolean, default: false }, // only one active per modelName
    notes: { type: String },
    deployedAt: { type: Date },
    deployedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

aiModelVersionSchema.index({ modelName: 1, isActive: 1 });
aiModelVersionSchema.index({ trainedAt: -1 });

module.exports = mongoose.model('AIModelVersion', aiModelVersionSchema);
