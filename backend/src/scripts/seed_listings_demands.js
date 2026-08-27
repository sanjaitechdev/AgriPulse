require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Crop = require('../models/Crop');
const Farm = require('../models/Farm');
const CropListing = require('../models/CropListing');
const BuyerDemand = require('../models/BuyerDemand');
const MarketPrice = require('../models/MarketPrice');

const { MONGO_URI } = process.env;

async function seed() {
  console.log('🌱 AgriConnect Listing & Demand Seeder starting…');
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connected');

  // Find demo users
  const farmer = await User.findOne({ email: 'farmer@demo.com' });
  const buyer = await User.findOne({ email: 'buyer@demo.com' });

  if (!farmer || !buyer) {
    console.error('❌ Demo users not found. Run seed.js and upgrade_crops.js first.');
    process.exit(1);
  }

  // Get Crops
  const tomato = await Crop.findOne({ name: /Tomato/i }) || await Crop.create({ name: 'Tomato', category: 'vegetable', seasons: ['kharif','rabi','zaid'] });
  const onion = await Crop.findOne({ name: /Onion/i }) || await Crop.create({ name: 'Onion', category: 'vegetable', seasons: ['kharif','rabi'] });
  const chilli = await Crop.findOne({ name: /Chilli/i }) || await Crop.create({ name: 'Chilli', category: 'spice', seasons: ['kharif','rabi'] });

  // Clear existing listings and demands
  console.log('🗑  Clearing existing listings and demands…');
  await CropListing.deleteMany({});
  await BuyerDemand.deleteMany({});
  await MarketPrice.deleteMany({ district: 'Vellore' });

  // Get or Create Farm for Farmer
  let farm = await Farm.findOne({ farmer: farmer._id });
  if (!farm) {
    farm = await Farm.create({
      farmer: farmer._id,
      name: 'Ravi Kumar Vellore Farm',
      totalArea: 2.5,
      district: 'Vellore',
      state: 'Tamil Nadu',
      village: 'Gudiyatham',
      soilType: 'loamy',
      waterAvailability: 'adequate',
      location: { type: 'Point', coordinates: [79.1378, 12.9165] }
    });
  }

  // 1. Create Crop Listings (Farmer)
  console.log('🌾 Seeding crop listings for farmer…');
  const listings = await CropListing.create([
    {
      farmer: farmer._id,
      farm: farm._id,
      crop: tomato._id,
      cropName: tomato.name,
      quantity: 2500,
      availableQuantity: 2500,
      askingPrice: 22,
      minAcceptablePrice: 18,
      grade: 'A',
      availableFrom: new Date(),
      availableTill: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      pickupLocation: 'Gudiyatham, Vellore',
      pickupDistrict: 'Vellore',
      pickupState: 'Tamil Nadu',
      pickupCoordinates: { type: 'Point', coordinates: [79.1378, 12.9165] },
      description: 'Fresh organic A-grade tomatoes, harvested yesterday.',
    },
    {
      farmer: farmer._id,
      farm: farm._id,
      crop: onion._id,
      cropName: onion.name,
      quantity: 3500,
      availableQuantity: 3500,
      askingPrice: 34,
      minAcceptablePrice: 30,
      grade: 'A',
      availableFrom: new Date(),
      availableTill: new Date(Date.now() + 60 * 24 * 3600 * 1000),
      pickupLocation: 'Gudiyatham, Vellore',
      pickupDistrict: 'Vellore',
      pickupState: 'Tamil Nadu',
      pickupCoordinates: { type: 'Point', coordinates: [79.1378, 12.9165] },
      description: 'Excellent grade red onions, sun-dried and ready for transit.',
    },
    {
      farmer: farmer._id,
      farm: farm._id,
      crop: chilli._id,
      cropName: chilli.name,
      quantity: 1200,
      availableQuantity: 1200,
      askingPrice: 110,
      minAcceptablePrice: 95,
      grade: 'A',
      availableFrom: new Date(),
      availableTill: new Date(Date.now() + 90 * 24 * 3600 * 1000),
      pickupLocation: 'Gudiyatham, Vellore',
      pickupDistrict: 'Vellore',
      pickupState: 'Tamil Nadu',
      pickupCoordinates: { type: 'Point', coordinates: [79.1378, 12.9165] },
      description: 'Guntur variety red chillies, highly spicy and premium dried quality.',
    }
  ]);

  // 2. Create Buyer Demands (Buyer)
  console.log('🛍  Seeding buyer demands…');
  const requiredDate = new Date();
  requiredDate.setDate(requiredDate.getDate() + 15);
  const expiresAt = new Date(requiredDate);
  expiresAt.setDate(expiresAt.getDate() - 2);

  await BuyerDemand.create([
    {
      buyer: buyer._id,
      crop: tomato._id,
      cropName: tomato.name,
      quantity: 5000,
      gradeRequired: 'A',
      targetPriceMin: 20,
      targetPriceMax: 24,
      requiredByDate: requiredDate,
      deliveryLocation: 'Sree Warehouse, Vellore',
      deliveryDistrict: 'Vellore',
      deliveryState: 'Tamil Nadu',
      deliveryCoordinates: { type: 'Point', coordinates: [79.0611, 12.9022] },
      maxDistanceKm: 150,
      requirements: 'Need daily deliveries of fully mature red tomatoes.',
      expiresAt,
    },
    {
      buyer: buyer._id,
      crop: chilli._id,
      cropName: chilli.name,
      quantity: 2000,
      gradeRequired: 'A',
      targetPriceMin: 100,
      targetPriceMax: 120,
      requiredByDate: requiredDate,
      deliveryLocation: 'Sree Warehouse, Vellore',
      deliveryDistrict: 'Vellore',
      deliveryState: 'Tamil Nadu',
      deliveryCoordinates: { type: 'Point', coordinates: [79.0611, 12.9022] },
      maxDistanceKm: 250,
      requirements: 'Moisture content must be below 10%.',
      expiresAt,
    },
    {
      buyer: buyer._id,
      crop: onion._id,
      cropName: onion.name,
      quantity: 4000,
      gradeRequired: 'A',
      targetPriceMin: 30,
      targetPriceMax: 36,
      requiredByDate: requiredDate,
      deliveryLocation: 'Sree Warehouse, Vellore',
      deliveryDistrict: 'Vellore',
      deliveryState: 'Tamil Nadu',
      deliveryCoordinates: { type: 'Point', coordinates: [79.0611, 12.9022] },
      maxDistanceKm: 150,
      requirements: 'Dry red onions, size 45mm+.',
      expiresAt,
    }
  ]);

  // 3. Create Mandi prices for Vellore (Agmarknet daily sync simulations)
  console.log('📈 Seeding local APMC mandi prices…');
  await MarketPrice.create([
    {
      crop: 'Tomato',
      market: 'Vellore APMC Mandi',
      district: 'Vellore',
      state: 'Tamil Nadu',
      minPrice: 2000,
      maxPrice: 2400,
      modalPrice: 2200,
      date: new Date(),
    },
    {
      crop: 'Onion',
      market: 'Vellore APMC Mandi',
      district: 'Vellore',
      state: 'Tamil Nadu',
      minPrice: 3000,
      maxPrice: 3800,
      modalPrice: 3400,
      date: new Date(),
    },
    {
      crop: 'Chilli',
      market: 'Vellore APMC Mandi',
      district: 'Vellore',
      state: 'Tamil Nadu',
      minPrice: 10000,
      maxPrice: 12000,
      modalPrice: 11000,
      date: new Date(),
    }
  ]);

  console.log('✅ Listing and Demand Seeding Complete!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seeder failed:', err);
  process.exit(1);
});
