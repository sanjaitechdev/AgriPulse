// AgriConnect Crop Database Upgrade Script
// Run: node src/scripts/upgrade_crops.js

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Crop = require('../models/Crop');

const { MONGO_URI } = process.env;

const expandedCrops = [
  // Vegetables
  {
    name: 'Tomato',
    localNames: { te: '\u0c1f\u0c2e\u0c3e\u0c1f\u0c3e', hi: '\u0c1f\u0c2e\u0c3e\u0c1f\u0c30' },
    category: 'vegetable',
    seasons: ['kharif', 'rabi', 'zaid'],
    optimalTemp: { min: 18, max: 29 },
    optimalPH: { min: 6.0, max: 7.0 },
    waterRequirement: 'moderate',
    avgYieldPerAcre: 8000,
    shelfLifeDays: 7,
    durationDays: { min: 70, max: 90 },
    soilCompatibility: ['loamy', 'red', 'black', 'sandy'],
    minN: 60, minP: 50, minK: 50,
    optimalRainfall: { min: 400, max: 800 }
  },
  {
    name: 'Onion',
    localNames: { te: '\u0c09\u0c32\u0c4d\u0c32\u0c3f\u0c2a\u0c3e\u0c2f', hi: '\u0c2a\u0c4d\u0c2f\u0c3e\u0c1c' },
    category: 'vegetable',
    seasons: ['rabi', 'kharif'],
    optimalTemp: { min: 13, max: 24 },
    optimalPH: { min: 6.0, max: 7.5 },
    waterRequirement: 'low',
    avgYieldPerAcre: 6000,
    shelfLifeDays: 30,
    durationDays: { min: 90, max: 120 },
    soilCompatibility: ['loamy', 'alluvial', 'sandy'],
    minN: 50, minP: 40, minK: 60,
    optimalRainfall: { min: 350, max: 700 }
  },
  {
    name: 'Potato',
    localNames: { te: '\u0c2c\u0c02\u0c17\u0c3e\u0c33\u0c3e\u0c26\u0c4d\u0c22\u0c41\u0c02\u0c2a', hi: '\u0c06\u0c32\u0c42' },
    category: 'vegetable',
    seasons: ['rabi'],
    optimalTemp: { min: 10, max: 20 },
    optimalPH: { min: 5.0, max: 6.5 },
    waterRequirement: 'moderate',
    avgYieldPerAcre: 9000,
    shelfLifeDays: 60,
    durationDays: { min: 75, max: 100 },
    soilCompatibility: ['loamy', 'alluvial', 'sandy'],
    minN: 70, minP: 60, minK: 90,
    optimalRainfall: { min: 400, max: 600 }
  },
  {
    name: 'Brinjal',
    localNames: { te: '\u0c35\u0c02\u0c15\u0c3e\u0c2f', hi: '\u0c2c\u0c48\u0c02\u0c17\u0c28' },
    category: 'vegetable',
    seasons: ['kharif', 'rabi', 'zaid'],
    optimalTemp: { min: 22, max: 32 },
    optimalPH: { min: 5.5, max: 7.0 },
    waterRequirement: 'moderate',
    avgYieldPerAcre: 7000,
    shelfLifeDays: 5,
    durationDays: { min: 65, max: 80 },
    soilCompatibility: ['loamy', 'clay', 'black', 'red'],
    minN: 55, minP: 45, minK: 45,
    optimalRainfall: { min: 500, max: 1000 }
  },
  {
    name: 'Okra',
    localNames: { te: '\u0c2c\u0c46\u0c02\u0c21\u0c15\u0c3e\u0c2f', hi: '\u0c2d\u0c3f\u0c02\u0c21\u0c40' },
    category: 'vegetable',
    seasons: ['kharif', 'zaid'],
    optimalTemp: { min: 22, max: 35 },
    optimalPH: { min: 6.0, max: 6.8 },
    waterRequirement: 'moderate',
    avgYieldPerAcre: 4000,
    shelfLifeDays: 4,
    durationDays: { min: 60, max: 75 },
    soilCompatibility: ['loamy', 'alluvial', 'red'],
    minN: 45, minP: 35, minK: 35,
    optimalRainfall: { min: 450, max: 900 }
  },
  {
    name: 'Cabbage',
    localNames: { te: '\u0c15\u0c4d\u0c2f\u0c3e\u0c2c\u0c47\u0c1c\u0c40', hi: '\u0c2a\u0c24\u0c4d\u0c24\u0c3e\u0c17\u0c4b\u0c2d\u0c40' },
    category: 'vegetable',
    seasons: ['rabi'],
    optimalTemp: { min: 10, max: 20 },
    optimalPH: { min: 6.0, max: 7.0 },
    waterRequirement: 'moderate',
    avgYieldPerAcre: 12000,
    shelfLifeDays: 14,
    durationDays: { min: 70, max: 100 },
    soilCompatibility: ['loamy', 'alluvial', 'clay'],
    minN: 80, minP: 50, minK: 60,
    optimalRainfall: { min: 500, max: 800 }
  },
  {
    name: 'Cauliflower',
    localNames: { te: '\u0c15\u0c3e\u0c32\u0c40\u0c2b\u0c4d\u0c32\u0c35\u0c30\u0c4d', hi: '\u0c17\u0c4b\u0c2d\u0c40' },
    category: 'vegetable',
    seasons: ['rabi'],
    optimalTemp: { min: 15, max: 20 },
    optimalPH: { min: 6.0, max: 7.0 },
    waterRequirement: 'moderate',
    avgYieldPerAcre: 10000,
    shelfLifeDays: 7,
    durationDays: { min: 65, max: 85 },
    soilCompatibility: ['loamy', 'alluvial', 'clay'],
    minN: 80, minP: 50, minK: 60,
    optimalRainfall: { min: 500, max: 800 }
  },
  // Cereals & Millets
  {
    name: 'Rice',
    localNames: { te: '\u0c35\u0c30\u0c3f', hi: '\u0c27\u0c3e\u0c28' },
    category: 'cereal',
    seasons: ['kharif', 'rabi'],
    optimalTemp: { min: 22, max: 32 },
    optimalPH: { min: 5.5, max: 7.0 },
    waterRequirement: 'very_high',
    avgYieldPerAcre: 1600,
    shelfLifeDays: 365,
    durationDays: { min: 90, max: 150 },
    soilCompatibility: ['clay', 'alluvial', 'black'],
    minN: 80, minP: 40, minK: 40,
    optimalRainfall: { min: 1000, max: 2500 }
  },
  {
    name: 'Wheat',
    localNames: { te: '\u0c17\u0c4b\u0c27\u0c4d\u0c2f\u0c41\u0c2e', hi: '\u0c17\u0c47\u0c39\u0c42\u0c02' },
    category: 'cereal',
    seasons: ['rabi'],
    optimalTemp: { min: 12, max: 25 },
    optimalPH: { min: 6.0, max: 7.5 },
    waterRequirement: 'moderate',
    avgYieldPerAcre: 1500,
    shelfLifeDays: 365,
    durationDays: { min: 100, max: 130 },
    soilCompatibility: ['loamy', 'alluvial', 'black'],
    minN: 70, minP: 40, minK: 30,
    optimalRainfall: { min: 600, max: 1000 }
  },
  {
    name: 'Maize',
    localNames: { te: '\u0c2e\u0c4a\u0c15\u0c4d\u0c15\u0c1c\u0c4a\u0c28\u0c4d\u0c28', hi: '\u0c2e\u0c15\u0c4d\u0c15\u0c3e' },
    category: 'cereal',
    seasons: ['kharif', 'rabi', 'zaid'],
    optimalTemp: { min: 21, max: 32 },
    optimalPH: { min: 5.8, max: 7.0 },
    waterRequirement: 'moderate',
    avgYieldPerAcre: 2000,
    shelfLifeDays: 180,
    durationDays: { min: 80, max: 110 },
    soilCompatibility: ['loamy', 'alluvial', 'red'],
    minN: 60, minP: 40, minK: 35,
    optimalRainfall: { min: 500, max: 800 }
  },
  {
    name: 'Sorghum',
    localNames: { te: '\u0c1c\u0c4a\u0c28\u0c4d\u0c28\u0c32\u0c4d', hi: '\u0c1c\u0c4d\u0c35\u0c3e\u0c30' },
    category: 'cereal',
    seasons: ['kharif', 'rabi'],
    optimalTemp: { min: 25, max: 32 },
    optimalPH: { min: 6.0, max: 7.5 },
    waterRequirement: 'low',
    avgYieldPerAcre: 1100,
    shelfLifeDays: 365,
    durationDays: { min: 100, max: 120 },
    soilCompatibility: ['black', 'red', 'loamy'],
    minN: 40, minP: 30, minK: 25,
    optimalRainfall: { min: 400, max: 650 }
  },
  {
    name: 'Pearl Millet',
    localNames: { te: '\u0c38\u0c1c\u0c4d\u0c1c\u0c32\u0c41', hi: '\u0c2c\u0c3e\u0c1c\u0c30\u0c3e' },
    category: 'cereal',
    seasons: ['kharif'],
    optimalTemp: { min: 25, max: 35 },
    optimalPH: { min: 6.5, max: 7.5 },
    waterRequirement: 'very_low',
    avgYieldPerAcre: 900,
    shelfLifeDays: 180,
    durationDays: { min: 80, max: 95 },
    soilCompatibility: ['sandy', 'red', 'laterite'],
    minN: 35, minP: 25, minK: 25,
    optimalRainfall: { min: 300, max: 500 }
  },
  {
    name: 'Finger Millet',
    localNames: { te: '\u0c30\u0c3e\u0c17\u0c41\u0c32\u0c41', hi: '\u0c30\u0c3e\u0c17\u0c40' },
    category: 'cereal',
    seasons: ['kharif', 'rabi'],
    optimalTemp: { min: 20, max: 30 },
    optimalPH: { min: 5.5, max: 7.0 },
    waterRequirement: 'low',
    avgYieldPerAcre: 1000,
    shelfLifeDays: 365,
    durationDays: { min: 95, max: 120 },
    soilCompatibility: ['red', 'laterite', 'loamy'],
    minN: 30, minP: 25, minK: 25,
    optimalRainfall: { min: 500, max: 800 }
  },
  // Pulses
  {
    name: 'Chickpea',
    localNames: { te: '\u0c36\u0c28\u0c17\u0c32\u0c41', hi: '\u0c1a\u0c28\u0c3e' },
    category: 'pulse',
    seasons: ['rabi'],
    optimalTemp: { min: 15, max: 25 },
    optimalPH: { min: 6.0, max: 7.2 },
    waterRequirement: 'low',
    avgYieldPerAcre: 700,
    shelfLifeDays: 365,
    durationDays: { min: 90, max: 110 },
    soilCompatibility: ['black', 'alluvial', 'loamy'],
    minN: 20, minP: 40, minK: 20,
    optimalRainfall: { min: 350, max: 500 }
  },
  {
    name: 'Pigeon Pea',
    localNames: { te: '\u0c15\u0c02\u0c26\u0c41\u0c32\u0c41', hi: '\u0c05\u0c30\u0c39\u0c30' },
    category: 'pulse',
    seasons: ['kharif'],
    optimalTemp: { min: 20, max: 30 },
    optimalPH: { min: 6.0, max: 7.0 },
    waterRequirement: 'low',
    avgYieldPerAcre: 650,
    shelfLifeDays: 365,
    durationDays: { min: 140, max: 180 },
    soilCompatibility: ['red', 'black', 'loamy'],
    minN: 20, minP: 40, minK: 20,
    optimalRainfall: { min: 450, max: 750 }
  },
  {
    name: 'Black Gram',
    localNames: { te: '\u0c2e\u0c3f\u0c28\u0c4d\u0c28\u0c41\u0c2e\u0c41\u0c32\u0c41', hi: '\u0c0a\u0c21\u0c26' },
    category: 'pulse',
    seasons: ['kharif', 'rabi', 'zaid'],
    optimalTemp: { min: 25, max: 35 },
    optimalPH: { min: 6.5, max: 7.5 },
    waterRequirement: 'low',
    avgYieldPerAcre: 500,
    shelfLifeDays: 365,
    durationDays: { min: 70, max: 85 },
    soilCompatibility: ['black', 'clay', 'alluvial'],
    minN: 15, minP: 35, minK: 15,
    optimalRainfall: { min: 400, max: 650 }
  },
  {
    name: 'Green Gram',
    localNames: { te: '\u0c2a\u0c46\u0c38\u0c32\u0c41', hi: '\u0c2e\u0c42\u0c02\u0c17' },
    category: 'pulse',
    seasons: ['kharif', 'rabi', 'zaid'],
    optimalTemp: { min: 25, max: 35 },
    optimalPH: { min: 6.5, max: 7.5 },
    waterRequirement: 'very_low',
    avgYieldPerAcre: 450,
    shelfLifeDays: 365,
    durationDays: { min: 60, max: 75 },
    soilCompatibility: ['alluvial', 'loamy', 'sandy'],
    minN: 15, minP: 30, minK: 15,
    optimalRainfall: { min: 300, max: 500 }
  },
  // Oilseeds
  {
    name: 'Groundnut',
    localNames: { te: '\u0c35\u0c47\u0c30\u0c4d\u0c37\u0c46\u0c28\u0c17', hi: '\u0c2e\u0c42\u0c02\u0c17\u0c2b\u0c32\u0c40' },
    category: 'oilseed',
    seasons: ['kharif', 'rabi'],
    optimalTemp: { min: 22, max: 30 },
    optimalPH: { min: 6.0, max: 6.5 },
    waterRequirement: 'low',
    avgYieldPerAcre: 900,
    shelfLifeDays: 180,
    durationDays: { min: 100, max: 120 },
    soilCompatibility: ['sandy', 'red', 'loamy'],
    minN: 25, minP: 50, minK: 40,
    optimalRainfall: { min: 500, max: 700 }
  },
  {
    name: 'Mustard',
    localNames: { te: '\u0c06\u0c35\u0c3e\u0c32\u0c41', hi: '\u0c38\u0c30\u0c38\u0c4b\u0c02' },
    category: 'oilseed',
    seasons: ['rabi'],
    optimalTemp: { min: 10, max: 25 },
    optimalPH: { min: 6.0, max: 7.5 },
    waterRequirement: 'low',
    avgYieldPerAcre: 600,
    shelfLifeDays: 365,
    durationDays: { min: 100, max: 120 },
    soilCompatibility: ['alluvial', 'loamy', 'clay'],
    minN: 45, minP: 30, minK: 20,
    optimalRainfall: { min: 350, max: 500 }
  },
  {
    name: 'Soybean',
    localNames: { te: '\u0c38\u0c4b\u0c2f\u0c3e\u0c2c\u0c40\u0c28\u0c4d', hi: '\u0c38\u0c4b\u0c2f\u0c3e\u0c2c\u0c40\u0c28' },
    category: 'oilseed',
    seasons: ['kharif'],
    optimalTemp: { min: 20, max: 30 },
    optimalPH: { min: 6.0, max: 7.5 },
    waterRequirement: 'moderate',
    avgYieldPerAcre: 800,
    shelfLifeDays: 180,
    durationDays: { min: 90, max: 110 },
    soilCompatibility: ['black', 'alluvial', 'loamy'],
    minN: 30, minP: 60, minK: 40,
    optimalRainfall: { min: 600, max: 900 }
  },
  // Spices
  {
    name: 'Chilli',
    localNames: { te: '\u0c2e\u0c3f\u0c30\u0c4d\u0c1a\u0c3f', hi: '\u0c2e\u0c3f\u0c30\u0c4d\u0c1a' },
    category: 'spice',
    seasons: ['kharif', 'rabi'],
    optimalTemp: { min: 20, max: 30 },
    optimalPH: { min: 6.0, max: 7.0 },
    waterRequirement: 'moderate',
    avgYieldPerAcre: 1200,
    shelfLifeDays: 7,
    durationDays: { min: 75, max: 100 },
    soilCompatibility: ['black', 'red', 'loamy'],
    minN: 60, minP: 40, minK: 40,
    optimalRainfall: { min: 600, max: 1000 }
  },
  {
    name: 'Turmeric',
    localNames: { te: '\u0c2a\u0c38\u0c41\u0c2a\u0c41', hi: '\u0c39\u0c32\u0c4d\u0c26\u0c40' },
    category: 'spice',
    seasons: ['kharif'],
    optimalTemp: { min: 20, max: 30 },
    optimalPH: { min: 5.5, max: 6.5 },
    waterRequirement: 'high',
    avgYieldPerAcre: 3000,
    shelfLifeDays: 365,
    durationDays: { min: 210, max: 270 },
    soilCompatibility: ['loamy', 'laterite', 'alluvial'],
    minN: 50, minP: 50, minK: 90,
    optimalRainfall: { min: 1500, max: 2500 }
  },
  {
    name: 'Ginger',
    localNames: { te: '\u0c05\u0c32\u0c4d\u0c32\u0c02', hi: '\u0c05\u0c26\u0c30\u0c15' },
    category: 'spice',
    seasons: ['kharif'],
    optimalTemp: { min: 18, max: 30 },
    optimalPH: { min: 6.0, max: 6.5 },
    waterRequirement: 'high',
    avgYieldPerAcre: 2500,
    shelfLifeDays: 60,
    durationDays: { min: 240, max: 270 },
    soilCompatibility: ['loamy', 'laterite', 'red'],
    minN: 60, minP: 50, minK: 100,
    optimalRainfall: { min: 1200, max: 1800 }
  },
  // Fruits
  {
    name: 'Banana',
    localNames: { te: '\u0c05\u0c30\u0c1f\u0c3f', hi: '\u0c15\u0c47\u0c32\u0c3e' },
    category: 'fruit',
    seasons: ['perennial'],
    optimalTemp: { min: 15, max: 35 },
    optimalPH: { min: 6.0, max: 7.5 },
    waterRequirement: 'very_high',
    avgYieldPerAcre: 25000,
    shelfLifeDays: 5,
    durationDays: { min: 300, max: 360 },
    soilCompatibility: ['loamy', 'clay', 'alluvial'],
    minN: 110, minP: 35, minK: 150,
    optimalRainfall: { min: 1200, max: 2200 }
  },
  {
    name: 'Papaya',
    localNames: { te: '\u0c2c\u0c4a\u0c2a\u0c4d\u0c2a\u0c3e\u0c2f\u0c3f', hi: '\u0c2a\u0c2a\u0c40\u0c24\u0c3e' },
    category: 'fruit',
    seasons: ['perennial'],
    optimalTemp: { min: 20, max: 35 },
    optimalPH: { min: 6.0, max: 6.5 },
    waterRequirement: 'moderate',
    avgYieldPerAcre: 15000,
    shelfLifeDays: 5,
    durationDays: { min: 240, max: 300 },
    soilCompatibility: ['sandy', 'loamy', 'alluvial'],
    minN: 80, minP: 80, minK: 120,
    optimalRainfall: { min: 800, max: 1200 }
  },
  // Commercial/Fiber & Plantation
  {
    name: 'Cotton',
    localNames: { te: '\u0c2a\u0c24\u0c4d\u0c24\u0c3f', hi: '\u0c15\u0c2a\u0c3e\u0c38' },
    category: 'fiber',
    seasons: ['kharif'],
    optimalTemp: { min: 25, max: 35 },
    optimalPH: { min: 6.0, max: 7.5 },
    waterRequirement: 'moderate',
    avgYieldPerAcre: 500,
    shelfLifeDays: 365,
    durationDays: { min: 150, max: 180 },
    soilCompatibility: ['black', 'alluvial', 'red'],
    minN: 50, minP: 35, minK: 35,
    optimalRainfall: { min: 600, max: 1200 }
  },
  {
    name: 'Sugarcane',
    localNames: { te: '\u0c1a\u0c2e\u0c30\u0c41\u0c15\u0c41', hi: '\u0c17\u0c28\u0c4d\u0c28\u0c3e' },
    category: 'other',
    seasons: ['perennial'],
    optimalTemp: { min: 20, max: 35 },
    optimalPH: { min: 6.0, max: 7.5 },
    waterRequirement: 'very_high',
    avgYieldPerAcre: 35000,
    shelfLifeDays: 10,
    durationDays: { min: 300, max: 365 },
    soilCompatibility: ['alluvial', 'black', 'clay'],
    minN: 120, minP: 50, minK: 60,
    optimalRainfall: { min: 1500, max: 2500 }
  },
  {
    name: 'Coconut',
    localNames: { te: '\u0c15\u0c4a\u0c2d\u0c4d\u0c2c\u0c30\u0c3f', hi: '\u0c28\u0c3e\u0c30\u0c3f\u0c2f\u0c32' },
    category: 'other',
    seasons: ['perennial'],
    optimalTemp: { min: 22, max: 32 },
    optimalPH: { min: 5.2, max: 8.0 },
    waterRequirement: 'high',
    avgYieldPerAcre: 6000,
    shelfLifeDays: 90,
    durationDays: { min: 360, max: 360 },
    soilCompatibility: ['sandy', 'loamy', 'laterite'],
    minN: 60, minP: 40, minK: 120,
    optimalRainfall: { min: 1300, max: 2300 }
  }
];

async function update() {
  console.log('🌱 AgriConnect Seeder: Upgrading crop catalogue...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connected');

  // Insert or update crops
  for (const c of expandedCrops) {
    await Crop.findOneAndUpdate(
      { name: c.name },
      { $set: c },
      { upsert: true, new: true }
    );
    console.log(`   Processed crop: ${c.name}`);
  }

  console.log('✅ Crop catalogue update completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

update().catch(err => {
  console.error('❌ Upgrade failed:', err);
  process.exit(1);
});
