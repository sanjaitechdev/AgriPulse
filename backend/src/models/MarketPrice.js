const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema(
  {
    crop: { type: String, required: true, trim: true },
    cropRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' },
    market: { type: String, required: true, trim: true },
    state: { type: String, required: true },
    district: { type: String },
    minPrice: { type: Number }, // ₹ per quintal
    modalPrice: { type: Number, required: true },
    maxPrice: { type: Number },
    grade: { type: String },
    arrivals: { type: Number }, // in tonnes
    date: { type: Date, required: true },
    source: { type: String, default: 'agmarknet' }, // data source
    sourceUrl: { type: String },
    isDemo: { type: Boolean, default: false }, // flag demo/seeded data
    dataTimestamp: { type: Date }, // when source recorded it
    syncedAt: { type: Date, default: Date.now }, // when we synced it
  },
  { timestamps: true }
);

marketPriceSchema.index({ crop: 1, market: 1, date: -1 });
marketPriceSchema.index({ state: 1, date: -1 });
marketPriceSchema.index({ date: -1 });

module.exports = mongoose.model('MarketPrice', marketPriceSchema);
