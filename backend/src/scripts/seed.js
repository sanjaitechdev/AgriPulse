/**
 * AgriConnect Database Seed Script
 * Run: node src/scripts/seed.js
 *
 * Seeds: Users (farmer, buyer, admin), Crops, FarmerProfile, BuyerProfile,
 *        Farms, MarketPrice data, AIModelVersion entries
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
// Note: do NOT import bcrypt here — User model's pre-save hook handles hashing

const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const BuyerProfile = require('../models/BuyerProfile');
const Crop = require('../models/Crop');
const Farm = require('../models/Farm');
const MarketPrice = require('../models/MarketPrice');
const AIModelVersion = require('../models/AIModelVersion');

const { MONGO_URI } = process.env;

async function seed() {
  console.log('🌱 AgriConnect Seeder starting…');
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connected');

  // ─── Clear existing seed data ───────────────────────────────────────────────
  console.log('🗑  Clearing existing seed collections…');
  await Promise.all([
    User.deleteMany({ email: { $in: ['farmer@demo.com', 'buyer@demo.com', 'admin@demo.com'] } }),
    Crop.deleteMany({}),
    MarketPrice.deleteMany({}),
    AIModelVersion.deleteMany({}),
  ]);

  // ─── 1. Users ─────────────────────────────────────────────────────────────
  console.log('👤 Creating demo users…');
  // Use plain password — mongoose pre-save hook will hash it automatically
  const DEMO_PASS = 'demo1234';

  const [farmer, buyer, admin] = await User.create([
    { name: 'Ravi Kumar', email: 'farmer@demo.com', password: DEMO_PASS, role: 'farmer', phone: '9876543210', isVerified: true, profileCompleted: true },
    { name: 'Sree Traders', email: 'buyer@demo.com', password: DEMO_PASS, role: 'buyer', phone: '9123456780', isVerified: true, profileCompleted: true },
    { name: 'AgriConnect Admin', email: 'admin@demo.com', password: DEMO_PASS, role: 'admin', phone: '9000000001', isVerified: true, profileCompleted: true },
  ]);

  // ─── 2. Farmer Profile ───────────────────────────────────────────────────
  const farmerProfile = await FarmerProfile.create({
    user: farmer._id, district: 'Krishna', state: 'Andhra Pradesh', village: 'Vuyyuru',
    totalLandSize: 8.5, irrigatedLand: 6, primarySoilType: 'alluvial',
    waterAvailability: 'adequate', primaryWaterSource: 'canal',
    experienceYears: 15, bio: 'Third-generation paddy and vegetable farmer near Krishna river.',
    rating: { average: 4.3, count: 18 },
  });

  // ─── 3. Buyer Profile ───────────────────────────────────────────────────
  const buyerProfile = await BuyerProfile.create({
    user: buyer._id, orgName: 'Sree Traders Pvt Ltd', orgType: 'trader',
    district: 'Kurnool', state: 'Andhra Pradesh',
    preferredCrops: ['Tomato', 'Onion', 'Chilli', 'Brinjal'],
    maxDistanceKm: 300,
    rating: { average: 4.1, count: 11 },
  });

  // ─── 4. Farm ─────────────────────────────────────────────────────────────
  const farm = await Farm.create({
    farmer: farmer._id, name: 'Main Field — Vuyyuru', totalArea: 5,
    irrigatedArea: 4, district: 'Krishna', state: 'Andhra Pradesh',
    village: 'Vuyyuru', soilType: 'alluvial',
    waterSource: 'canal', waterAvailability: 'adequate',
    soilRecords: [{ N: 82, P: 48, K: 43, pH: 6.8, organicMatter: 1.4, source: 'lab', labName: 'ANGRAU Soil Lab', recordedAt: new Date() }],
    location: { type: 'Point', coordinates: [80.845, 16.359] },
  });

  // ─── 5. Crops master data ────────────────────────────────────────────────
  console.log('🌾 Creating crop master data…');
  const crops = await Crop.create([
    { name: 'Tomato',      localNames: { te: 'టమాట', hi: 'टमाटर' },         category: 'vegetable', seasons: ['kharif','rabi'],        optimalTemp: { min: 18, max: 29 }, optimalPH: { min: 6.0, max: 7.0 }, waterRequirement: 'moderate',  avgYieldPerAcre: 8000,  shelfLifeDays: 7,   durationDays: { min: 70,  max: 90  } },
    { name: 'Onion',       localNames: { te: 'ఉల్లిపాయ', hi: 'प्याज' },     category: 'vegetable', seasons: ['rabi','kharif'],         optimalTemp: { min: 13, max: 24 }, optimalPH: { min: 6.0, max: 7.5 }, waterRequirement: 'low',       avgYieldPerAcre: 6000,  shelfLifeDays: 30,  durationDays: { min: 90,  max: 120 } },
    { name: 'Chilli',      localNames: { te: 'మిర్చి', hi: 'मिर्च' },        category: 'spice',     seasons: ['kharif','rabi'],        optimalTemp: { min: 20, max: 30 }, optimalPH: { min: 6.0, max: 7.0 }, waterRequirement: 'moderate',  avgYieldPerAcre: 1200,  shelfLifeDays: 7,   durationDays: { min: 75,  max: 100 } },
    { name: 'Brinjal',     localNames: { te: 'వంకాయ', hi: 'बैंगन' },         category: 'vegetable', seasons: ['kharif','rabi','zaid'],  optimalTemp: { min: 22, max: 32 }, optimalPH: { min: 5.5, max: 7.0 }, waterRequirement: 'moderate',  avgYieldPerAcre: 7000,  shelfLifeDays: 5,   durationDays: { min: 65,  max: 80  } },
    { name: 'Potato',      localNames: { te: 'బంగాళాదుంప', hi: 'आलू' },     category: 'vegetable', seasons: ['rabi'],                  optimalTemp: { min: 10, max: 20 }, optimalPH: { min: 5.0, max: 6.5 }, waterRequirement: 'moderate',  avgYieldPerAcre: 9000,  shelfLifeDays: 60,  durationDays: { min: 75,  max: 100 } },
    { name: 'Rice',        localNames: { te: 'వరి', hi: 'धान' },             category: 'cereal',    seasons: ['kharif','rabi'],        optimalTemp: { min: 22, max: 32 }, optimalPH: { min: 5.5, max: 7.0 }, waterRequirement: 'very_high', avgYieldPerAcre: 1600,  shelfLifeDays: 365, durationDays: { min: 90,  max: 150 } },
    { name: 'Maize',       localNames: { te: 'మొక్కజొన్న', hi: 'मक्का' },   category: 'cereal',    seasons: ['kharif','zaid'],        optimalTemp: { min: 21, max: 32 }, optimalPH: { min: 5.8, max: 7.0 }, waterRequirement: 'moderate',  avgYieldPerAcre: 2000,  shelfLifeDays: 180, durationDays: { min: 80,  max: 110 } },
    { name: 'Groundnut',   localNames: { te: 'వేరుశెనగ', hi: 'मूंगफली' },   category: 'oilseed',   seasons: ['kharif','rabi'],        optimalTemp: { min: 25, max: 35 }, optimalPH: { min: 6.0, max: 7.0 }, waterRequirement: 'low',       avgYieldPerAcre: 800,   shelfLifeDays: 180, durationDays: { min: 110, max: 130 } },
    { name: 'Cotton',      localNames: { te: 'పత్తి', hi: 'कपास' },          category: 'fiber',     seasons: ['kharif'],               optimalTemp: { min: 25, max: 35 }, optimalPH: { min: 6.0, max: 7.5 }, waterRequirement: 'moderate',  avgYieldPerAcre: 500,   shelfLifeDays: 365, durationDays: { min: 150, max: 180 } },
    { name: 'Cabbage',     localNames: { te: 'క్యాబేజీ', hi: 'पत्तागोभी' }, category: 'vegetable', seasons: ['rabi'],                  optimalTemp: { min: 10, max: 20 }, optimalPH: { min: 6.0, max: 7.0 }, waterRequirement: 'moderate',  avgYieldPerAcre: 12000, shelfLifeDays: 14,  durationDays: { min: 70,  max: 100 } },
    { name: 'Cauliflower', localNames: { te: 'కాలీఫ్లవర్', hi: 'गोभी' },    category: 'vegetable', seasons: ['rabi'],                  optimalTemp: { min: 15, max: 20 }, optimalPH: { min: 6.0, max: 7.0 }, waterRequirement: 'moderate',  avgYieldPerAcre: 10000, shelfLifeDays: 7,   durationDays: { min: 65,  max: 85  } },
    { name: 'Wheat',       localNames: { te: 'గోధుమ', hi: 'गेहूं' },         category: 'cereal',    seasons: ['rabi'],                  optimalTemp: { min: 12, max: 25 }, optimalPH: { min: 6.0, max: 7.5 }, waterRequirement: 'moderate',  avgYieldPerAcre: 1500,  shelfLifeDays: 365, durationDays: { min: 100, max: 130 } },
  ]);

  // ─── 6. Market Price data (synthetic but realistic) ──────────────────────
  console.log('📊 Generating market price data…');
  const markets = [
    { market: 'Kurnool APMC', district: 'Kurnool', state: 'Andhra Pradesh' },
    { market: 'Krishna Mandi', district: 'Krishna', state: 'Andhra Pradesh' },
    { market: 'Guntur Yard', district: 'Guntur', state: 'Andhra Pradesh' },
    { market: 'Hyderabad APMC', district: 'Hyderabad', state: 'Telangana' },
    { market: 'Pune Market', district: 'Pune', state: 'Maharashtra' },
  ];

  const cropPriceBase = {
    'Tomato': 2500, 'Onion': 2200, 'Chilli': 9000, 'Brinjal': 1800,
    'Potato': 1800, 'Rice': 2200, 'Maize': 1900, 'Groundnut': 5500,
    'Cotton': 6500, 'Cabbage': 1400, 'Cauliflower': 2000, 'Wheat': 2400,
  };

  const marketPrices = [];
  const now = new Date();
  for (let d = 45; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);

    for (const cropName of Object.keys(cropPriceBase)) {
      const base = cropPriceBase[cropName];
      const trend = d > 30 ? 0.9 : d > 15 ? 1.0 : 1.05; // slight uptrend
      for (const mkt of markets.slice(0, 2)) { // 2 markets per crop/day
        const variation = 0.85 + Math.random() * 0.3;
        const modal = Math.round(base * trend * variation / 50) * 50;
        marketPrices.push({
          crop: cropName, market: mkt.market, district: mkt.district, state: mkt.state,
          date, minPrice: Math.round(modal * 0.85), modalPrice: modal, maxPrice: Math.round(modal * 1.15),
          arrivalQuantity: Math.round(100 + Math.random() * 500),
          unit: 'quintal', syncedAt: now,
        });
      }
    }
  }
  await MarketPrice.insertMany(marketPrices);
  console.log(`   ✅ Inserted ${marketPrices.length} market price records`);

  // ─── 7. AI Model versions ─────────────────────────────────────────────────
  console.log('🤖 Creating AI model version records…');
  await AIModelVersion.create([
    { modelName: 'crop_suitability', version: 'v1.0.0', algorithm: 'Random Forest', features: ['N', 'P', 'K', 'pH', 'temperature', 'humidity', 'rainfall', 'soilType', 'season', 'waterAvailability'], metrics: { accuracy: 0.84, f1Score: 0.82, cv_score: 0.81 }, trainedAt: new Date(Date.now() - 7*86400000), isActive: true, filePath: 'models/crop_suitability_v1.pkl', notes: 'Trained on 12,000 crop-season-soil records across Andhra Pradesh and Telangana' },
    { modelName: 'demand_forecast', version: 'v1.0.0', algorithm: 'LSTM', features: ['market_price', 'arrival_quantity', 'season', 'crop'], metrics: { mae: 0.12, rmse: 0.18 }, trainedAt: new Date(Date.now() - 14*86400000), isActive: true, filePath: 'models/demand_forecast_v1.pkl', notes: 'LSTM trained on 3 years of Agmarknet data' },
    { modelName: 'unsold_risk', version: 'v1.0.0', algorithm: 'XGBoost', features: ['crop', 'quantity', 'shelf_life_days', 'days_to_harvest', 'current_price', 'demand_score'], metrics: { accuracy: 0.78, auc: 0.82 }, trainedAt: new Date(Date.now() - 10*86400000), isActive: true, filePath: 'models/unsold_risk_v1.pkl', notes: 'Binary classification: high risk vs. manageable' },
    { modelName: 'buyer_matching', version: 'v1.0.0', algorithm: 'Custom Scoring', features: ['crop', 'quantity', 'price', 'grade', 'distance', 'date'], metrics: { precision: 0.91, recall: 0.85 }, trainedAt: new Date(Date.now() - 5*86400000), isActive: true, filePath: 'models/buyer_matching_v1.pkl', notes: 'Rule-based scoring with learned weights' },
  ]);

  console.log('\n✅ Seed complete!\n');
  console.log('   Demo accounts:');
  console.log('   Farmer  → farmer@demo.com / demo1234');
  console.log('   Buyer   → buyer@demo.com  / demo1234');
  console.log('   Admin   → admin@demo.com  / demo1234\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
