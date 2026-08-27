const { generateRescueRadar } = require('../services/rescueEngine');
const RescueRecommendation = require('../models/RescueRecommendation');
const Notification = require('../models/Notification');

// @GET /api/rescue/radar
// Returns live Rescue Radar monitoring for all crops of the authenticated farmer
exports.getRescueRadar = async (req, res, next) => {
  try {
    const radar = await generateRescueRadar(req.user._id);
    res.json({
      success: true,
      data: radar,
    });
  } catch (err) {
    console.error('Error generating rescue radar:', err);
    next(err);
  }
};

// @GET /api/rescue/plan/:cycleId
// Returns deep-dive rescue action plan for a specific crop cycle
exports.getRescuePlan = async (req, res, next) => {
  try {
    const { cycleId } = req.params;
    const radar = await generateRescueRadar(req.user._id);
    
    const cropItem = radar.crops.find(c => c.cycleId.toString() === cycleId.toString() || c.cropName.toLowerCase() === cycleId.toLowerCase());
    
    if (!cropItem) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found in your monitored lots',
      });
    }

    res.json({
      success: true,
      data: {
        crop: cropItem,
        weather: radar.weather,
        farmerLocation: radar.farmerLocation,
        generatedAt: radar.generatedAt,
      },
    });
  } catch (err) {
    console.error('Error fetching rescue plan:', err);
    next(err);
  }
};

// @POST /api/rescue/choose
// Confirms and activates a selected rescue option
exports.chooseRescueOption = async (req, res, next) => {
  try {
    const { cycleId, optionTitle, channelName, netRecovery, pricePerKg } = req.body;

    // Create / Log Rescue notification
    await Notification.create({
      user: req.user._id,
      type: 'rescue_ready',
      title: `🚨 Rescue Action Activated: ${channelName || 'Dispatched'}`,
      body: `You have locked in ${optionTitle || 'Rescue Channel'} at ₹${pricePerKg}/kg with estimated net recovery of ₹${netRecovery?.toLocaleString('en-IN')}. Logistics assistance is now active.`,
      priority: 'high',
      data: { cycleId, optionTitle, netRecovery },
    });

    res.json({
      success: true,
      message: `Rescue strategy "${channelName || optionTitle}" confirmed. APMC Logistics & Escrow support initiated.`,
    });
  } catch (err) {
    console.error('Error choosing rescue option:', err);
    next(err);
  }
};

// @POST /api/rescue/refresh
// Forces an immediate live refresh of weather, mandi prices, and risk scores
exports.refreshRescueRadar = async (req, res, next) => {
  try {
    const radar = await generateRescueRadar(req.user._id);
    res.json({
      success: true,
      data: radar,
      message: 'Rescue Radar refreshed with live APIs',
    });
  } catch (err) {
    console.error('Error refreshing rescue radar:', err);
    next(err);
  }
};
