const BuyerDemand = require('../models/BuyerDemand');
const Crop = require('../models/Crop');
const { emitEvent } = require('../socket');
const { computeListingMatches } = require('../services/matchingService');

// @GET /api/demands
exports.getDemands = async (req, res, next) => {
  try {
    const { crop, district, state, minQty, maxQty, status = 'active', page = 1, limit = 20 } = req.query;
    const query = { status };

    if (crop) query.cropName = { $regex: crop, $options: 'i' };
    if (district) query.deliveryDistrict = { $regex: district, $options: 'i' };
    if (state) query.deliveryState = { $regex: state, $options: 'i' };
    if (minQty) query.quantity = { ...query.quantity, $gte: parseFloat(minQty) };
    if (maxQty) query.quantity = { ...query.quantity, $lte: parseFloat(maxQty) };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      BuyerDemand.find(query)
        .populate('buyer', 'name')
        .populate('crop', 'name category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      BuyerDemand.countDocuments(query),
    ]);

    res.json({
      success: true,
      data,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

// @POST /api/demands
exports.createDemand = async (req, res, next) => {
  try {
    const { cropName, cropId, quantity, gradeRequired, targetPriceMin, targetPriceMax,
      requiredByDate, deliveryLocation, deliveryState, deliveryDistrict, lat, lng,
      maxDistanceKm, requirements, isAggregatable } = req.body;

    let crop = cropId ? await Crop.findById(cropId) : await Crop.findOne({ name: { $regex: `^${cropName}$`, $options: 'i' } });
    if (!crop) {
      crop = await Crop.create({
        name: cropName,
        category: 'other',
        seasons: ['kharif', 'rabi', 'zaid'],
        waterRequirement: 'moderate'
      });
    }

    const expiresAt = new Date(requiredByDate);
    expiresAt.setDate(expiresAt.getDate() - 2); // expire 2 days before required date

    const demand = await BuyerDemand.create({
      buyer: req.user._id,
      crop: crop?._id,
      cropName: crop?.name || cropName,
      quantity,
      gradeRequired,
      targetPriceMin,
      targetPriceMax,
      requiredByDate,
      deliveryLocation,
      deliveryState,
      deliveryDistrict,
      deliveryCoordinates: lat && lng ? { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] } : undefined,
      maxDistanceKm,
      requirements,
      isAggregatable: isAggregatable !== false,
      expiresAt,
    });

    await demand.populate('crop', 'name category');

    // Emit real-time to farmers
    emitEvent('demand:new', { demand: demand.toObject() });

    // Trigger async listing matching
    computeListingMatches(demand._id).catch(console.error);

    res.status(201).json({ success: true, data: demand, message: 'Demand posted successfully' });
  } catch (err) {
    next(err);
  }
};

// @GET /api/demands/:id
exports.getDemandById = async (req, res, next) => {
  try {
    const demand = await BuyerDemand.findById(req.params.id)
      .populate('buyer', 'name phone')
      .populate('crop', 'name category');
    if (!demand) return res.status(404).json({ success: false, message: 'Demand not found' });
    demand.viewCount += 1;
    await demand.save();
    res.json({ success: true, data: demand });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/demands/:id
exports.updateDemand = async (req, res, next) => {
  try {
    const demand = await BuyerDemand.findOne({ _id: req.params.id, buyer: req.user._id });
    if (!demand) return res.status(404).json({ success: false, message: 'Demand not found or unauthorized' });

    const allowed = ['quantity', 'targetPriceMin', 'targetPriceMax', 'status', 'requirements'];
    allowed.forEach((f) => { if (req.body[f] !== undefined) demand[f] = req.body[f]; });
    await demand.save();

    emitEvent('demand:updated', { demandId: demand._id });
    res.json({ success: true, data: demand });
  } catch (err) {
    next(err);
  }
};

// @GET /api/demands/:id/matches
exports.getDemandMatches = async (req, res, next) => {
  try {
    const demand = await BuyerDemand.findById(req.params.id);
    if (!demand) return res.status(404).json({ success: false, message: 'Demand not found' });
    const matches = await computeListingMatches(demand._id, { returnOnly: true });
    res.json({ success: true, data: matches });
  } catch (err) {
    next(err);
  }
};
