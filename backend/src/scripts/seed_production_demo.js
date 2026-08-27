/**
 * AgriPulse Master Production Demo Seeder
 * Run: node src/scripts/seed_production_demo.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const BuyerProfile = require('../models/BuyerProfile');
const Crop = require('../models/Crop');
const Farm = require('../models/Farm');
const CropCycle = require('../models/CropCycle');
const CropListing = require('../models/CropListing');
const BuyerDemand = require('../models/BuyerDemand');
const Proposal = require('../models/Proposal');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const FarmPlan = require('../models/FarmPlan');

const { MONGO_URI } = process.env;

async function seedProductionDemo() {
  console.log('🚀 Seeding comprehensive production-ready data for Farmer & Buyer...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const DEMO_PASS = 'demo1234';

  // ── 1. Users ────────────────────────────────────────────────────────────────
  console.log('👤 Seeding Users & Profiles...');

  // Farmer User
  let farmer = await User.findOne({ email: 'farmer@demo.com' });
  if (!farmer) {
    farmer = await User.create({
      name: 'Ravi Kumar',
      email: 'farmer@demo.com',
      password: DEMO_PASS,
      role: 'farmer',
      phone: '9876543210',
      isVerified: true,
      profileCompleted: true,
    });
  } else {
    farmer.name = 'Ravi Kumar';
    farmer.isVerified = true;
    farmer.profileCompleted = true;
    await farmer.save();
  }

  await FarmerProfile.findOneAndUpdate(
    { user: farmer._id },
    {
      user: farmer._id,
      district: 'Tiruppur',
      state: 'Tamil Nadu',
      village: 'Nathakadaiyur',
      totalLandSize: 10.0,
      irrigatedLand: 8.5,
      primarySoilType: 'alluvial',
      waterAvailability: 'adequate',
      primaryWaterSource: 'borewell',
      storageType: 'ambient',
      experienceYears: 18,
      bio: 'Cultivating premium horticultural crops and organic produce in the Kangeyam-Tiruppur agricultural belt.',
      rating: { average: 4.9, count: 24 },
      location: { type: 'Point', coordinates: [77.652427, 11.071472] },
    },
    { upsert: true, new: true }
  );

  // Buyer 1: Sree Traders
  let buyer = await User.findOne({ email: 'buyer@demo.com' });
  if (!buyer) {
    buyer = await User.create({
      name: 'Sree Traders & Agro Exports',
      email: 'buyer@demo.com',
      password: DEMO_PASS,
      role: 'buyer',
      phone: '9123456780',
      isVerified: true,
      profileCompleted: true,
    });
  }

  await BuyerProfile.findOneAndUpdate(
    { user: buyer._id },
    {
      user: buyer._id,
      orgName: 'Sree Traders & Agro Exports Pvt Ltd',
      orgType: 'wholesaler',
      district: 'Tiruppur',
      state: 'Tamil Nadu',
      preferredCrops: ['Tomato', 'Capsicum', 'Chilli', 'Banana', 'Onion', 'Amla'],
      maxDistanceKm: 250,
      rating: { average: 4.8, count: 32 },
    },
    { upsert: true, new: true }
  );

  // Buyer 2: Coimbatore Fresh
  let buyer2 = await User.findOne({ email: 'coimbatore.fresh@demo.com' });
  if (!buyer2) {
    buyer2 = await User.create({
      name: 'Coimbatore Fresh Retail Network',
      email: 'coimbatore.fresh@demo.com',
      password: DEMO_PASS,
      role: 'buyer',
      phone: '9840011223',
      isVerified: true,
      profileCompleted: true,
    });
  }

  await BuyerProfile.findOneAndUpdate(
    { user: buyer2._id },
    {
      user: buyer2._id,
      orgName: 'Coimbatore Fresh Retail Network Ltd',
      orgType: 'retailer',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      preferredCrops: ['Tomato', 'Banana', 'Beans', 'Coriander', 'Spinach'],
      maxDistanceKm: 150,
      rating: { average: 4.9, count: 48 },
    },
    { upsert: true, new: true }
  );

  // Buyer 3: Erode Spices
  let buyer3 = await User.findOne({ email: 'erode.spices@demo.com' });
  if (!buyer3) {
    buyer3 = await User.create({
      name: 'Erode Agro Processing Consortium',
      email: 'erode.spices@demo.com',
      password: DEMO_PASS,
      role: 'buyer',
      phone: '9443322110',
      isVerified: true,
      profileCompleted: true,
    });
  }

  await BuyerProfile.findOneAndUpdate(
    { user: buyer3._id },
    {
      user: buyer3._id,
      orgName: 'Erode Agro Processing Consortium',
      orgType: 'processor',
      district: 'Erode',
      state: 'Tamil Nadu',
      preferredCrops: ['Chilli', 'Turmeric', 'Ginger', 'Garlic', 'Amla'],
      maxDistanceKm: 300,
      rating: { average: 4.7, count: 19 },
    },
    { upsert: true, new: true }
  );

  // ── 2. Farms ────────────────────────────────────────────────────────────────
  console.log('🚜 Seeding Farms...');
  await Farm.deleteMany({ farmer: farmer._id });

  const farm1 = await Farm.create({
    farmer: farmer._id,
    name: 'Main Field · Nathakadaiyur Hub',
    totalArea: 4.5,
    irrigatedArea: 4.0,
    district: 'Tiruppur',
    state: 'Tamil Nadu',
    village: 'Nathakadaiyur',
    soilType: 'alluvial',
    waterSource: 'borewell',
    waterAvailability: 'adequate',
    soilRecords: [
      { N: 88, P: 52, K: 48, pH: 6.8, organicMatter: 1.6, source: 'lab', labName: 'TNAU Soil Testing Center', recordedAt: new Date() },
    ],
    location: { type: 'Point', coordinates: [77.652427, 11.071472] },
    isActive: true,
  });

  const farm2 = await Farm.create({
    farmer: farmer._id,
    name: 'Polyhouse Unit 2 · Kangeyam Ridge',
    totalArea: 2.5,
    irrigatedArea: 2.5,
    district: 'Tiruppur',
    state: 'Tamil Nadu',
    village: 'Kangeyam',
    soilType: 'red',
    waterSource: 'drip',
    waterAvailability: 'abundant',
    soilRecords: [
      { N: 94, P: 60, K: 55, pH: 6.5, organicMatter: 1.8, source: 'soil_test', labName: 'AgriPulse Soil Probe', recordedAt: new Date() },
    ],
    location: { type: 'Point', coordinates: [77.561000, 11.004000] },
    isActive: true,
  });

  const farm3 = await Farm.create({
    farmer: farmer._id,
    name: 'South Orchard · Vellakoil Grove',
    totalArea: 3.0,
    irrigatedArea: 2.8,
    district: 'Tiruppur',
    state: 'Tamil Nadu',
    village: 'Vellakoil',
    soilType: 'loamy',
    waterSource: 'canal',
    waterAvailability: 'adequate',
    location: { type: 'Point', coordinates: [77.712000, 10.934000] },
    isActive: true,
  });

  // ── 3. Crops ────────────────────────────────────────────────────────────────
  const tomatoCrop = await Crop.findOne({ name: /Tomato/i });
  const capsicumCrop = await Crop.findOne({ name: /Capsicum/i });
  const chilliCrop = await Crop.findOne({ name: /Chilli/i });
  const bananaCrop = await Crop.findOne({ name: /Banana/i });
  const amlaCrop = await Crop.findOne({ name: /Amla/i });
  const onionCrop = await Crop.findOne({ name: /Onion/i });

  // ── 4. Crop Cycles ──────────────────────────────────────────────────────────
  console.log('🌾 Seeding Crop Cycles...');
  await CropCycle.deleteMany({ farmer: farmer._id });

  const cycleTomato = await CropCycle.create({
    farmer: farmer._id,
    farm: farm1._id,
    crop: tomatoCrop._id,
    fieldName: 'Field 1 · North Alluvial Plot',
    landArea: 2.0,
    sowingDate: new Date(Date.now() - 86400000 * 75),
    actualHarvestAt: new Date(Date.now() - 86400000 * 2),
    expectedYield: 5000,
    actualProduction: 5000,
    currentStage: 'harvest_ready',
    growthProgressPercent: 95,
    status: 'harvest_ready',
    fertilizerLogs: [
      { name: 'Organic NPK & Vermicompost', quantityKg: 250, appliedDate: new Date(Date.now() - 86400000 * 45) },
      { name: 'Potash & Micronutrient Spray', quantityKg: 50, appliedDate: new Date(Date.now() - 86400000 * 20) },
    ],
    irrigationLogs: [
      { method: 'drip', durationHours: 3, date: new Date(Date.now() - 86400000 * 5) },
    ],
  });

  const cycleCapsicum = await CropCycle.create({
    farmer: farmer._id,
    farm: farm2._id,
    crop: capsicumCrop._id,
    fieldName: 'Polyhouse 2 · Climate Controlled Bay',
    landArea: 1.5,
    sowingDate: new Date(Date.now() - 86400000 * 48),
    expectedYield: 3200,
    currentStage: 'flowering',
    growthProgressPercent: 65,
    status: 'growing',
  });

  const cycleChilli = await CropCycle.create({
    farmer: farmer._id,
    farm: farm1._id,
    crop: chilliCrop._id,
    fieldName: 'Field 3 · South Ridge',
    landArea: 1.0,
    sowingDate: new Date(Date.now() - 86400000 * 30),
    expectedYield: 1800,
    currentStage: 'vegetative',
    growthProgressPercent: 40,
    status: 'growing',
  });

  const cycleBanana = await CropCycle.create({
    farmer: farmer._id,
    farm: farm3._id,
    crop: bananaCrop._id,
    fieldName: 'Orchard Grove · Plot B',
    landArea: 2.5,
    sowingDate: new Date(Date.now() - 86400000 * 260),
    expectedHarvestAt: new Date(Date.now() + 86400000 * 4),
    expectedYield: 8500,
    currentStage: 'harvest_ready',
    growthProgressPercent: 92,
    status: 'harvest_approaching',
  });

  // ── 5. Crop Listings ────────────────────────────────────────────────────────
  console.log('📦 Seeding Crop Listings...');
  await CropListing.deleteMany({ farmer: farmer._id });

  const listingTomato = await CropListing.create({
    farmer: farmer._id,
    farm: farm1._id,
    crop: tomatoCrop._id,
    cropName: 'Tomato',
    cropCycle: cycleTomato._id,
    quantity: 5000,
    availableQuantity: 5000,
    askingPrice: 26.50,
    minAcceptablePrice: 24.00,
    grade: 'A',
    availableFrom: new Date(),
    availableTill: new Date(Date.now() + 86400000 * 6),
    pickupLocation: 'Nathakadaiyur Farm Gate, Tiruppur',
    pickupDistrict: 'Tiruppur',
    pickupState: 'Tamil Nadu',
    pickupCoordinates: { type: 'Point', coordinates: [77.652427, 11.071472] },
    description: 'Fresh Grade-A Shivam Hybrid Tomato picked from drip-irrigated alluvial field.',
    status: 'active',
  });

  const listingBanana = await CropListing.create({
    farmer: farmer._id,
    farm: farm3._id,
    crop: bananaCrop._id,
    cropName: 'Banana',
    cropCycle: cycleBanana._id,
    quantity: 8000,
    availableQuantity: 8000,
    askingPrice: 18.00,
    minAcceptablePrice: 16.50,
    grade: 'export_quality',
    availableFrom: new Date(Date.now() + 86400000 * 3),
    availableTill: new Date(Date.now() + 86400000 * 14),
    pickupLocation: 'Vellakoil Farm Hub, Tiruppur',
    pickupDistrict: 'Tiruppur',
    pickupState: 'Tamil Nadu',
    pickupCoordinates: { type: 'Point', coordinates: [77.712000, 10.934000] },
    description: 'Grand Naine (G9) Export Grade Bananas with high brix sweetness.',
    status: 'active',
  });

  const listingChilli = await CropListing.create({
    farmer: farmer._id,
    farm: farm1._id,
    crop: chilliCrop._id,
    cropName: 'Chilli',
    cropCycle: cycleChilli._id,
    quantity: 1800,
    availableQuantity: 1800,
    askingPrice: 92.00,
    minAcceptablePrice: 85.00,
    grade: 'A',
    availableFrom: new Date(Date.now() + 86400000 * 25),
    availableTill: new Date(Date.now() + 86400000 * 90),
    pickupLocation: 'Kangeyam Road, Nathakadaiyur',
    pickupDistrict: 'Tiruppur',
    pickupState: 'Tamil Nadu',
    pickupCoordinates: { type: 'Point', coordinates: [77.652427, 11.071472] },
    description: 'Guntur Sannam Red Hot Chilli pre-harvest contract.',
    status: 'active',
  });

  // ── 6. Buyer Demands ────────────────────────────────────────────────────────
  console.log('🤝 Seeding Buyer Demands...');
  await BuyerDemand.deleteMany({});

  const demand1 = await BuyerDemand.create({
    buyer: buyer._id,
    crop: tomatoCrop._id,
    cropName: 'Tomato',
    quantity: 10000,
    gradeRequired: 'A',
    targetPriceMin: 25.00,
    targetPriceMax: 28.50,
    requiredByDate: new Date(Date.now() + 86400000 * 7),
    deliveryLocation: 'Tiruppur Wholesale Terminal',
    deliveryDistrict: 'Tiruppur',
    deliveryState: 'Tamil Nadu',
    deliveryCoordinates: { type: 'Point', coordinates: [77.3411, 11.1085] },
    maxDistanceKm: 120,
    requirements: 'Firm texture for inter-state dispatch to Kerala.',
    status: 'active',
    isAggregatable: true,
  });

  const demand2 = await BuyerDemand.create({
    buyer: buyer2._id,
    crop: bananaCrop._id,
    cropName: 'Banana',
    quantity: 12000,
    gradeRequired: 'export_quality',
    targetPriceMin: 17.50,
    targetPriceMax: 20.00,
    requiredByDate: new Date(Date.now() + 86400000 * 10),
    deliveryLocation: 'Coimbatore MGR Wholesale Market',
    deliveryDistrict: 'Coimbatore',
    deliveryState: 'Tamil Nadu',
    deliveryCoordinates: { type: 'Point', coordinates: [76.9558, 11.0168] },
    maxDistanceKm: 150,
    requirements: 'Unblemished skin, calibrated size, packed in foam-lined boxes.',
    status: 'active',
    isAggregatable: true,
  });

  const demand3 = await BuyerDemand.create({
    buyer: buyer3._id,
    crop: chilliCrop._id,
    cropName: 'Chilli',
    quantity: 4000,
    gradeRequired: 'A',
    targetPriceMin: 88.00,
    targetPriceMax: 95.00,
    requiredByDate: new Date(Date.now() + 86400000 * 15),
    deliveryLocation: 'Erode Perundurai Industrial Estate',
    deliveryDistrict: 'Erode',
    deliveryState: 'Tamil Nadu',
    deliveryCoordinates: { type: 'Point', coordinates: [77.5833, 11.2833] },
    maxDistanceKm: 200,
    requirements: 'For oleoresin extraction. Moisture content strictly below 10%.',
    status: 'active',
    isAggregatable: true,
  });

  const demand4 = await BuyerDemand.create({
    buyer: buyer._id,
    crop: capsicumCrop._id,
    cropName: 'Capsicum',
    quantity: 3500,
    gradeRequired: 'A',
    targetPriceMin: 42.00,
    targetPriceMax: 46.00,
    requiredByDate: new Date(Date.now() + 86400000 * 12),
    deliveryLocation: 'Palladam Uzhavar Aggregation Point',
    deliveryDistrict: 'Tiruppur',
    deliveryState: 'Tamil Nadu',
    deliveryCoordinates: { type: 'Point', coordinates: [77.2800, 11.0000] },
    maxDistanceKm: 100,
    requirements: 'Four-lobed dark green blocky capsicum. Zero damage.',
    status: 'active',
    isAggregatable: true,
  });

  // ── 7. Proposals ────────────────────────────────────────────────────────────
  console.log('📜 Seeding Proposals...');
  await Proposal.deleteMany({});

  const prop1 = await Proposal.create({
    listing: listingTomato._id,
    farmer: farmer._id,
    buyer: buyer._id,
    fromRole: 'buyer',
    crop: tomatoCrop._id,
    cropName: 'Tomato',
    quantity: 3000,
    offeredPrice: 26.00,
    totalValue: 78000,
    deliveryDate: new Date(Date.now() + 86400000 * 2),
    deliveryLocation: 'Nathakadaiyur Farm Gate',
    message: 'Can arrange 14-foot truck pickup directly at Nathakadaiyur farm gate tomorrow morning.',
    status: 'pending',
  });

  const prop2 = await Proposal.create({
    listing: listingBanana._id,
    farmer: farmer._id,
    buyer: buyer2._id,
    fromRole: 'buyer',
    crop: bananaCrop._id,
    cropName: 'Banana',
    quantity: 4000,
    offeredPrice: 18.50,
    totalValue: 74000,
    deliveryDate: new Date(Date.now() + 86400000 * 5),
    deliveryLocation: 'Coimbatore MGR Market',
    message: 'Premium pricing approved. Delivery to Coimbatore MGR yard before 05:00 AM.',
    status: 'accepted',
  });

  // ── 8. Orders ───────────────────────────────────────────────────────────────
  console.log('🚚 Seeding Orders...');
  await Order.deleteMany({});

  // Realized Revenue Completed Order (₹1,48,500)
  await Order.create({
    proposal: prop2._id,
    farmer: farmer._id,
    buyer: buyer._id,
    crop: tomatoCrop._id,
    cropName: 'Tomato',
    quantity: 5500,
    agreedPrice: 27.00,
    totalValue: 148500,
    status: 'completed',
    paymentStatus: 'paid',
    deliveryLocation: 'Tiruppur Wholesale Hub',
    actualDeliveryDate: new Date(Date.now() - 86400000 * 5),
    statusHistory: [
      { status: 'confirmed', timestamp: new Date(Date.now() - 86400000 * 7), notes: 'Trade agreement locked' },
      { status: 'in_transit', timestamp: new Date(Date.now() - 86400000 * 6), notes: 'Loaded on truck' },
      { status: 'delivered', timestamp: new Date(Date.now() - 86400000 * 5), notes: 'Delivered and verified' },
      { status: 'completed', timestamp: new Date(Date.now() - 86400000 * 5), notes: 'Escrow payment released' },
    ],
  });

  // Active In-Transit Order
  await Order.create({
    proposal: prop2._id,
    farmer: farmer._id,
    buyer: buyer2._id,
    crop: bananaCrop._id,
    cropName: 'Banana',
    quantity: 3000,
    agreedPrice: 18.50,
    totalValue: 55500,
    status: 'in_transit',
    paymentStatus: 'pending',
    deliveryLocation: 'Coimbatore MGR Wholesale Market',
    statusHistory: [
      { status: 'confirmed', timestamp: new Date(Date.now() - 86400000 * 2), notes: 'Order confirmed' },
      { status: 'in_transit', timestamp: new Date(Date.now() - 86400000 * 1), notes: 'Shipment dispatched' },
    ],
  });

  // ── 9. Notifications ────────────────────────────────────────────────────────
  console.log('🔔 Seeding Notifications...');
  await Notification.deleteMany({ user: { $in: [farmer._id, buyer._id] } });

  await Notification.create([
    {
      user: farmer._id,
      type: 'proposal_received',
      title: 'New Buyer Bid: ₹26.00/kg for Tomato',
      body: 'Sree Traders submitted a verified bid for 3,000 kg with direct farm gate pickup.',
      read: false,
      priority: 'high',
      createdAt: new Date(Date.now() - 3600000 * 2),
    },
    {
      user: farmer._id,
      type: 'order_status',
      title: 'Order In Transit to Coimbatore',
      body: '3,000 kg Banana shipment is en route to Coimbatore MGR Market. Driver: M. Selvam.',
      read: false,
      priority: 'normal',
      createdAt: new Date(Date.now() - 3600000 * 5),
    },
    {
      user: farmer._id,
      type: 'market_update',
      title: '₹1,48,500 Settled to Bank Account',
      body: 'Escrow payment for Order #AGR-8841 successfully credited to SBI A/C ending in 4108.',
      read: true,
      priority: 'high',
      createdAt: new Date(Date.now() - 86400000 * 5),
    },
    {
      user: farmer._id,
      type: 'risk_alert',
      title: '🚨 Rescue Radar Alert: High Spoilage Risk',
      body: 'Tomato harvest lot (5,000 kg) is approaching critical shelf life under 84% RH. Best action: Sell Now at Dharapuram Mandi.',
      read: false,
      priority: 'urgent',
      createdAt: new Date(Date.now() - 3600000 * 8),
    },
    {
      user: buyer._id,
      type: 'listing_new',
      title: 'New High-Quality Crop Listing in Tiruppur',
      body: 'Ravi Kumar listed 5,000 kg Grade-A Tomato matching your active procurement criteria.',
      read: false,
      priority: 'normal',
      createdAt: new Date(Date.now() - 3600000 * 4),
    },
  ]);

  console.log('✅ ALL PRODUCTION DEMO DATA SEEDED SUCCESSFULLY!');
  await mongoose.disconnect();
}

seedProductionDemo().catch(console.error);
