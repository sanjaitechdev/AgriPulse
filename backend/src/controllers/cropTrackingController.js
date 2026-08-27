const CropCycle = require('../models/CropCycle');
const Crop = require('../models/Crop');
const Farm = require('../models/Farm');
const { calculateCropMetrics, LIFECYCLE_STAGES } = require('../services/cropLifecycleService');
const { getMarketPricesProgressive } = require('../services/agmarknetService');
const { getWeatherByCoords } = require('../services/weatherService');

/**
 * @GET /api/farmer/crops
 * List all crops tracked by the authenticated farmer
 */
exports.getMyCrops = async (req, res, next) => {
  try {
    const farmerId = req.user._id;
    const { status, farmId, search } = req.query;

    const query = { farmer: farmerId, isActive: true };
    if (farmId) query.farm = farmId;

    let cycles = await CropCycle.find(query)
      .populate('crop')
      .populate('farm')
      .sort({ updatedAt: -1, createdAt: -1 });

    // In-memory enrichment with live farm data, weather, and real-time lifecycle calculations
    const enriched = await Promise.all(
      cycles.map(async (cycle) => {
        const cropDoc = cycle.crop;
        const farmDoc = cycle.farm;

        // Fetch live weather from farmer's actual farm coordinates if available
        let weatherContext = { temperature: 28, humidity: 65, condition: 'Clear' };
        if (farmDoc?.location?.coordinates?.length === 2) {
          try {
            const [lng, lat] = farmDoc.location.coordinates;
            const w = await getWeatherByCoords(lat, lng);
            if (w?.current) {
              weatherContext = {
                temperature: w.current.temperature || 28,
                humidity: w.current.humidity || 65,
                condition: w.current.condition || 'Clear'
              };
            }
          } catch (e) {
            // Weather fallback
          }
        }

        // Calculate dynamic AI lifecycle metrics
        const metrics = await calculateCropMetrics({
          cropDoc,
          sowingDate: cycle.sowingDate || cycle.plantedAt,
          farmDoc,
          variety: cycle.variety,
          manualStage: cycle.currentStage,
          weatherContext
        });

        // Market Price context for this crop
        let currentMandiPrice = cycle.liveContext?.currentMandiPrice;
        let mandiName = cycle.liveContext?.mandiName;
        if (!currentMandiPrice && cropDoc?.name) {
          try {
            const mkt = await getMarketPricesProgressive({
              crop: cropDoc.name,
              state: farmDoc?.state || 'Andhra Pradesh',
              district: farmDoc?.district || 'Krishna'
            });
            if (mkt?.prices?.length > 0) {
              currentMandiPrice = mkt.prices[0].modalPrice;
              mandiName = mkt.prices[0].market;
            }
          } catch (e) {}
        }

        const cycleObj = cycle.toObject();
        return {
          ...cycleObj,
          currentStage: metrics.currentStage,
          growthProgressPercent: metrics.growthProgressPercent,
          status: metrics.status,
          riskLevel: metrics.riskLevel,
          riskReason: metrics.riskReason,
          harvestForecast: metrics.harvestForecast,
          stageExplanation: metrics.stageExplanation,
          liveContext: {
            ...cycleObj.liveContext,
            temperature: weatherContext.temperature,
            humidity: weatherContext.humidity,
            weatherCondition: weatherContext.condition,
            currentMandiPrice: currentMandiPrice || cropDoc?.avgYieldPerAcre || 35,
            mandiName: mandiName || `${farmDoc?.district || 'Local'} APMC`,
            lastSyncedAt: new Date(),
            source: 'AgriPulse Live Farm Sync'
          }
        };
      })
    );

    // Filter by status if specified
    let filtered = enriched;
    if (status && status !== 'all' && status !== 'ALL') {
      filtered = filtered.filter(c => c.status?.toLowerCase() === status.toLowerCase() || c.currentStage?.toLowerCase() === status.toLowerCase());
    }

    // Search filter across crop names, local names, field names
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(c => {
        const nameMatch = c.crop?.name?.toLowerCase().includes(q);
        const taMatch = c.crop?.tamil_name?.toLowerCase().includes(q);
        const teMatch = c.crop?.telugu_name?.toLowerCase().includes(q);
        const hiMatch = c.crop?.hindi_name?.toLowerCase().includes(q);
        const fieldMatch = c.fieldName?.toLowerCase().includes(q) || c.farm?.name?.toLowerCase().includes(q);
        return nameMatch || taMatch || teMatch || hiMatch || fieldMatch;
      });
    }

    res.json({
      success: true,
      data: filtered,
      stages: LIFECYCLE_STAGES,
      totalCount: filtered.length
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @POST /api/farmer/crops
 * Register a new crop cycle on a farm/field
 */
exports.addCropToField = async (req, res, next) => {
  try {
    const farmerId = req.user._id;
    const {
      farmId,
      cropId,
      fieldName,
      variety,
      landArea,
      sowingDate,
      irrigationType,
      soilInfo,
      expectedYield,
      notes
    } = req.body;

    if (!farmId) {
      return res.status(400).json({ success: false, message: 'Please select a farm.' });
    }
    if (!cropId) {
      return res.status(400).json({ success: false, message: 'Please select a crop.' });
    }
    if (!landArea || parseFloat(landArea) <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid cultivable area (in acres).' });
    }
    if (!sowingDate) {
      return res.status(400).json({ success: false, message: 'Please select a sowing / planting date.' });
    }

    // Verify farm ownership
    const farm = await Farm.findOne({ _id: farmId, farmer: farmerId });
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found or unauthorized.' });
    }

    // Find crop
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop not found in master catalog.' });
    }

    // Calculate initial dynamic metrics
    const metrics = await calculateCropMetrics({
      cropDoc: crop,
      sowingDate,
      farmDoc: farm,
      variety
    });

    // Estimate expected yield if not provided
    const area = parseFloat(landArea);
    const avgYield = crop.avgYieldPerAcre || ((crop.expected_yield_range?.min + crop.expected_yield_range?.max) / 2) || 2000;
    const calculatedYield = expectedYield ? parseFloat(expectedYield) : Math.round(avgYield * area);

    const newCycle = await CropCycle.create({
      farmer: farmerId,
      farm: farmId,
      crop: cropId,
      fieldName: fieldName || 'Field 1',
      variety: variety || '',
      season: crop.seasons?.[0] || 'kharif',
      year: new Date(sowingDate).getFullYear(),
      landArea: area,
      sowingDate: new Date(sowingDate),
      plantedAt: new Date(sowingDate),
      irrigationType: irrigationType || 'drip',
      soilInfo: soilInfo || farm.soilType || 'loamy',
      expectedYield: calculatedYield,
      estimatedProduction: calculatedYield,
      currentStage: metrics.currentStage,
      growthProgressPercent: metrics.growthProgressPercent,
      status: metrics.status,
      harvestForecast: metrics.harvestForecast,
      stageExplanation: metrics.stageExplanation,
      liveContext: {
        riskLevel: metrics.riskLevel,
        riskReason: metrics.riskReason,
        waterStatus: farm.waterAvailability || 'adequate',
        source: 'AgriPulse Live Farm Sync',
        lastSyncedAt: new Date()
      },
      notes: notes || '',
      isActive: true
    });

    const populated = await CropCycle.findById(newCycle._id).populate('crop').populate('farm');

    res.status(201).json({
      success: true,
      data: populated,
      message: `Successfully registered ${crop.name} under ${farm.name}!`
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @GET /api/farmer/crops/:id
 * Get single crop tracking details
 */
exports.getCropDetails = async (req, res, next) => {
  try {
    const cycle = await CropCycle.findOne({ _id: req.params.id, farmer: req.user._id, isActive: true })
      .populate('crop')
      .populate('farm');

    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Crop tracking record not found.' });
    }

    const cropDoc = cycle.crop;
    const farmDoc = cycle.farm;

    let weatherContext = { temperature: 28, humidity: 65, condition: 'Clear' };
    if (farmDoc?.location?.coordinates?.length === 2) {
      try {
        const [lng, lat] = farmDoc.location.coordinates;
        const w = await getWeatherByCoords(lat, lng);
        if (w?.current) {
          weatherContext = {
            temperature: w.current.temperature || 28,
            humidity: w.current.humidity || 65,
            condition: w.current.condition || 'Clear'
          };
        }
      } catch (e) {}
    }

    const metrics = await calculateCropMetrics({
      cropDoc,
      sowingDate: cycle.sowingDate || cycle.plantedAt,
      farmDoc,
      variety: cycle.variety,
      manualStage: cycle.currentStage,
      weatherContext
    });

    let currentMandiPrice = 35;
    let mandiName = `${farmDoc?.district || 'Local'} Mandi`;
    try {
      const mkt = await getMarketPricesProgressive({
        crop: cropDoc.name,
        state: farmDoc?.state || 'Andhra Pradesh',
        district: farmDoc?.district || 'Krishna'
      });
      if (mkt?.prices?.length > 0) {
        currentMandiPrice = mkt.prices[0].modalPrice;
        mandiName = mkt.prices[0].market;
      }
    } catch (e) {}

    const resObj = {
      ...cycle.toObject(),
      currentStage: metrics.currentStage,
      growthProgressPercent: metrics.growthProgressPercent,
      status: metrics.status,
      riskLevel: metrics.riskLevel,
      riskReason: metrics.riskReason,
      harvestForecast: metrics.harvestForecast,
      stageExplanation: metrics.stageExplanation,
      liveContext: {
        temperature: weatherContext.temperature,
        humidity: weatherContext.humidity,
        weatherCondition: weatherContext.condition,
        waterStatus: farmDoc?.waterAvailability || 'adequate',
        currentMandiPrice,
        mandiName,
        source: 'AgriPulse Live Farm Sync',
        lastSyncedAt: new Date()
      },
      stages: LIFECYCLE_STAGES
    };

    res.json({ success: true, data: resObj });
  } catch (err) {
    next(err);
  }
};

/**
 * @PUT /api/farmer/crops/:id
 * Update crop tracking data & recalculate dynamic lifecycle
 */
exports.updateCrop = async (req, res, next) => {
  try {
    const {
      fieldName,
      landArea,
      sowingDate,
      variety,
      irrigationType,
      soilInfo,
      expectedYield,
      currentStage,
      status,
      notes
    } = req.body;

    const cycle = await CropCycle.findOne({ _id: req.params.id, farmer: req.user._id, isActive: true })
      .populate('crop')
      .populate('farm');

    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Crop tracking record not found.' });
    }

    if (fieldName !== undefined) cycle.fieldName = fieldName;
    if (landArea !== undefined && parseFloat(landArea) > 0) cycle.landArea = parseFloat(landArea);
    if (sowingDate !== undefined) {
      cycle.sowingDate = new Date(sowingDate);
      cycle.plantedAt = new Date(sowingDate);
    }
    if (variety !== undefined) cycle.variety = variety;
    if (irrigationType !== undefined) cycle.irrigationType = irrigationType;
    if (soilInfo !== undefined) cycle.soilInfo = soilInfo;
    if (expectedYield !== undefined) {
      cycle.expectedYield = parseFloat(expectedYield);
      cycle.estimatedProduction = parseFloat(expectedYield);
    }
    if (notes !== undefined) cycle.notes = notes;

    // Recalculate dynamic metrics
    const metrics = await calculateCropMetrics({
      cropDoc: cycle.crop,
      sowingDate: cycle.sowingDate,
      farmDoc: cycle.farm,
      variety: cycle.variety,
      manualStage: currentStage || cycle.currentStage
    });

    cycle.currentStage = currentStage || metrics.currentStage;
    cycle.growthProgressPercent = metrics.growthProgressPercent;
    cycle.status = status || metrics.status;
    cycle.harvestForecast = metrics.harvestForecast;
    cycle.stageExplanation = metrics.stageExplanation;

    if (cycle.currentStage === 'harvested') {
      cycle.status = 'harvested';
      cycle.actualHarvestAt = new Date();
    }

    await cycle.save();
    const updated = await CropCycle.findById(cycle._id).populate('crop').populate('farm');

    // Emit Socket notification
    try {
      const { emitEvent } = require('../socket');
      emitEvent('CROP_TRACKING_UPDATED', {
        farmerId: req.user._id,
        cropId: cycle._id,
        stage: cycle.currentStage,
        progress: cycle.growthProgressPercent
      });
    } catch (e) {}

    res.json({ success: true, data: updated, message: 'Crop updated successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * @DELETE /api/farmer/crops/:id
 * Remove / archive crop
 */
exports.deleteCrop = async (req, res, next) => {
  try {
    const cycle = await CropCycle.findOneAndUpdate(
      { _id: req.params.id, farmer: req.user._id },
      { isActive: false, status: 'cancelled' },
      { new: true }
    );

    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Crop not found.' });
    }

    res.json({ success: true, message: 'Crop tracking record removed.' });
  } catch (err) {
    next(err);
  }
};
