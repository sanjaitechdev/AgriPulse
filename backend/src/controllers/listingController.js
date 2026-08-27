const CropListing = require('../models/CropListing');
const BuyerDemand = require('../models/BuyerDemand');
const Crop = require('../models/Crop');
const { emitEvent } = require('../socket');
const { createNotification } = require('../services/notificationService');
const { computeBuyerMatches } = require('../services/matchingService');

// @GET /api/listings
exports.getListings = async (req, res, next) => {
  try {
    const { crop, district, state, minPrice, maxPrice, grade, page = 1, limit = 20 } = req.query;
    const query = { status: 'active' };

    if (crop) query.cropName = { $regex: crop, $options: 'i' };
    if (district) query.pickupDistrict = { $regex: district, $options: 'i' };
    if (state) query.pickupState = { $regex: state, $options: 'i' };
    if (minPrice) query.askingPrice = { ...query.askingPrice, $gte: parseFloat(minPrice) };
    if (maxPrice) query.askingPrice = { ...query.askingPrice, $lte: parseFloat(maxPrice) };
    if (grade) query.grade = grade;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      CropListing.find(query)
        .populate('farmer', 'name')
        .populate('crop', 'name category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CropListing.countDocuments(query),
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

// @POST /api/listings
exports.createListing = async (req, res, next) => {
  try {
    const { cropName, cropId, farmId, cycleId, quantity, askingPrice, minAcceptablePrice,
      grade, availableFrom, availableTill, pickupLocation, pickupDistrict, pickupState,
      lat, lng, description } = req.body;

    // Find or match crop by name
    let crop = cropId ? await Crop.findById(cropId) : await Crop.findOne({ name: { $regex: `^${cropName}$`, $options: 'i' } });
    if (!crop) {
      crop = await Crop.create({
        name: cropName,
        category: 'other',
        seasons: ['kharif', 'rabi', 'zaid'],
        waterRequirement: 'moderate'
      });
    }

    const listing = await CropListing.create({
      farmer: req.user._id,
      farm: farmId,
      crop: crop?._id,
      cropName: crop?.name || cropName,
      cropCycle: cycleId,
      quantity,
      availableQuantity: quantity,
      askingPrice,
      minAcceptablePrice,
      grade,
      availableFrom,
      availableTill,
      pickupLocation,
      pickupDistrict,
      pickupState,
      pickupCoordinates: lat && lng ? { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] } : undefined,
      description,
    });

    await listing.populate('crop', 'name category');

    // Emit real-time event to buyers
    emitEvent('listing:new', { listing: listing.toObject() });

    // Trigger async buyer matching
    computeBuyerMatches(listing._id).catch(console.error);

    res.status(201).json({ success: true, data: listing, message: 'Listing created successfully' });
  } catch (err) {
    next(err);
  }
};

// @GET /api/listings/:id
exports.getListingById = async (req, res, next) => {
  try {
    const listing = await CropListing.findById(req.params.id)
      .populate('farmer', 'name phone')
      .populate('crop', 'name category shelfLifeDays');
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    listing.viewCount += 1;
    await listing.save();
    res.json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/listings/:id
exports.updateListing = async (req, res, next) => {
  try {
    const listing = await CropListing.findOne({ _id: req.params.id, farmer: req.user._id });
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found or unauthorized' });

    const allowed = ['quantity', 'askingPrice', 'minAcceptablePrice', 'status', 'availableTill', 'description'];
    allowed.forEach((f) => { if (req.body[f] !== undefined) listing[f] = req.body[f]; });
    await listing.save();

    res.json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
};

// @GET /api/listings/:id/matches — find matching buyer demands
exports.getListingMatches = async (req, res, next) => {
  try {
    const listing = await CropListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });

    const matches = await computeBuyerMatches(listing._id, { returnOnly: true });
    res.json({ success: true, data: matches });
  } catch (err) {
    next(err);
  }
};
