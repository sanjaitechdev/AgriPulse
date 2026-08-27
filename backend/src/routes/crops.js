const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Crop = require('../models/Crop');
const { CROP_TRANSLATIONS } = require('../data/cropTranslations');

router.use(protect);

router.get('/categories', (req, res) => {
  const categories = [
    { key: 'all', label: 'All Categories' },
    { key: 'cereal', label: 'Cereals', icon: '🌾' },
    { key: 'pulse', label: 'Pulses', icon: '🫘' },
    { key: 'oilseed', label: 'Oilseeds', icon: '🌻' },
    { key: 'vegetable', label: 'Vegetables', icon: '🥦' },
    { key: 'fruit', label: 'Fruits', icon: '🍎' },
    { key: 'spice', label: 'Spices', icon: '🌶️' },
    { key: 'commercial', label: 'Commercial Crops', icon: '🧵' },
    { key: 'plantation', label: 'Plantation Crops', icon: '☕' },
    { key: 'millet', label: 'Millets', icon: '🌱' },
    { key: 'fodder', label: 'Fodder Crops', icon: '🌿' }
  ];
  res.json({ success: true, data: categories });
});

router.get('/', async (req, res, next) => {
  try {
    const { category, season, search } = req.query;
    const query = { isActive: true };
    if (category && category !== 'all' && category !== 'ALL') {
      query.category = category;
    }
    if (season && season !== 'all' && season !== 'ALL') {
      query.seasons = season;
    }
    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { crop_name: { $regex: s, $options: 'i' } },
        { aliases: { $regex: s, $options: 'i' } },
        { telugu_name: { $regex: s, $options: 'i' } },
        { tamil_name: { $regex: s, $options: 'i' } },
        { hindi_name: { $regex: s, $options: 'i' } },
      ];
    }

    let crops = await Crop.find(query).sort({ name: 1 }).limit(300);

    // Enrich with multilingual names if missing in DB
    const enriched = crops.map(c => {
      const trans = CROP_TRANSLATIONS[c.name] || {};
      const obj = c.toObject();
      return {
        ...obj,
        tamil_name: obj.tamil_name?.includes('(Tamil)') ? (trans.ta || obj.tamil_name) : (obj.tamil_name || trans.ta),
        telugu_name: obj.telugu_name?.includes('(Telugu)') ? (trans.te || obj.telugu_name) : (obj.telugu_name || trans.te),
        hindi_name: obj.hindi_name?.includes('(Hindi)') ? (trans.hi || obj.hindi_name) : (obj.hindi_name || trans.hi),
        category: trans.category || obj.category || 'vegetable',
        durationDays: obj.durationDays || (trans.dur ? { min: trans.dur[0], max: trans.dur[1] } : { min: 90, max: 120 }),
        growthStages: [
          'Sowing', 'Germination', 'Vegetative Growth', 'Flowering',
          'Fruiting / Grain Formation', 'Maturity', 'Harvest Ready'
        ]
      };
    });

    res.json({ success: true, data: enriched, total: enriched.length });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });
    const trans = CROP_TRANSLATIONS[crop.name] || {};
    const obj = crop.toObject();
    res.json({
      success: true,
      data: {
        ...obj,
        tamil_name: obj.tamil_name?.includes('(Tamil)') ? (trans.ta || obj.tamil_name) : (obj.tamil_name || trans.ta),
        telugu_name: obj.telugu_name?.includes('(Telugu)') ? (trans.te || obj.telugu_name) : (obj.telugu_name || trans.te),
        hindi_name: obj.hindi_name?.includes('(Hindi)') ? (trans.hi || obj.hindi_name) : (obj.hindi_name || trans.hi),
        category: trans.category || obj.category,
        durationDays: obj.durationDays || (trans.dur ? { min: trans.dur[0], max: trans.dur[1] } : { min: 90, max: 120 })
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;

