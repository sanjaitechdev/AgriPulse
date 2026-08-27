require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Crop = require('../models/Crop');

const { MONGO_URI } = process.env;

const rawCrops = [
  // CEREALS & MILLETS
  { name: 'Rice', category: 'cereal', sub: 'Kharif Cereal', seasons: ['kharif','rabi'], water: 'high', ph: [5.5, 7.0], temp: [20, 38], rain: [1000, 2500] },
  { name: 'Wheat', category: 'cereal', sub: 'Rabi Cereal', seasons: ['rabi'], water: 'moderate', ph: [6.0, 7.5], temp: [10, 25], rain: [400, 800] },
  { name: 'Maize', category: 'cereal', sub: 'Coarse Cereal', seasons: ['kharif','rabi','zaid'], water: 'moderate', ph: [5.8, 7.2], temp: [18, 35], rain: [500, 1000] },
  { name: 'Sorghum', category: 'cereal', sub: 'Millet', seasons: ['kharif','rabi'], water: 'low', ph: [6.0, 7.5], temp: [25, 32], rain: [350, 700] },
  { name: 'Pearl Millet', category: 'cereal', sub: 'Millet', seasons: ['kharif'], water: 'low', ph: [6.5, 8.0], temp: [25, 35], rain: [250, 500] },
  { name: 'Finger Millet', category: 'cereal', sub: 'Millet', seasons: ['kharif'], water: 'low', ph: [5.0, 8.2], temp: [20, 30], rain: [500, 1000] },
  { name: 'Foxtail Millet', category: 'cereal', sub: 'Minor Millet', seasons: ['kharif'], water: 'low', ph: [6.0, 7.5], temp: [20, 32], rain: [300, 600] },
  { name: 'Little Millet', category: 'cereal', sub: 'Minor Millet', seasons: ['kharif'], water: 'low', ph: [5.5, 7.5], temp: [20, 35], rain: [250, 550] },
  { name: 'Kodo Millet', category: 'cereal', sub: 'Minor Millet', seasons: ['kharif'], water: 'low', ph: [5.5, 7.8], temp: [22, 35], rain: [250, 600] },
  { name: 'Barnyard Millet', category: 'cereal', sub: 'Minor Millet', seasons: ['kharif'], water: 'low', ph: [5.5, 8.0], temp: [20, 32], rain: [300, 600] },
  { name: 'Proso Millet', category: 'cereal', sub: 'Minor Millet', seasons: ['kharif','zaid'], water: 'low', ph: [6.0, 7.5], temp: [20, 35], rain: [200, 450] },
  { name: 'Barley', category: 'cereal', sub: 'Rabi Cereal', seasons: ['rabi'], water: 'low', ph: [6.0, 8.0], temp: [12, 24], rain: [350, 500] },
  { name: 'Oats', category: 'cereal', sub: 'Rabi Cereal', seasons: ['rabi'], water: 'moderate', ph: [5.5, 7.0], temp: [10, 22], rain: [400, 700] },

  // PULSES
  { name: 'Chickpea', category: 'pulse', sub: 'Bengal Gram', seasons: ['rabi'], water: 'low', ph: [6.0, 8.0], temp: [15, 25], rain: [350, 500] },
  { name: 'Pigeon Pea', category: 'pulse', sub: 'Red Gram', seasons: ['kharif'], water: 'moderate', ph: [5.5, 7.5], temp: [20, 30], rain: [600, 1000] },
  { name: 'Green Gram', category: 'pulse', sub: 'Moong', seasons: ['kharif','rabi','zaid'], water: 'low', ph: [6.0, 7.5], temp: [25, 35], rain: [450, 750] },
  { name: 'Black Gram', category: 'pulse', sub: 'Urad', seasons: ['kharif','rabi','zaid'], water: 'low', ph: [6.0, 7.5], temp: [25, 35], rain: [600, 1000] },
  { name: 'Lentil', category: 'pulse', sub: 'Masoor', seasons: ['rabi'], water: 'low', ph: [5.8, 7.5], temp: [15, 25], rain: [350, 500] },
  { name: 'Field Pea', category: 'pulse', sub: 'Peas', seasons: ['rabi'], water: 'moderate', ph: [6.0, 7.5], temp: [10, 20], rain: [400, 600] },
  { name: 'Cowpea', category: 'pulse', sub: 'Lobia', seasons: ['kharif','rabi','zaid'], water: 'moderate', ph: [5.5, 7.5], temp: [20, 35], rain: [450, 700] },
  { name: 'Moth Bean', category: 'pulse', sub: 'Moth', seasons: ['kharif'], water: 'very_low', ph: [6.5, 8.0], temp: [25, 40], rain: [200, 400] },
  { name: 'Horse Gram', category: 'pulse', sub: 'Kollu', seasons: ['rabi','kharif'], water: 'low', ph: [5.5, 8.0], temp: [20, 32], rain: [300, 500] },
  { name: 'Lablab Bean', category: 'pulse', sub: 'Avarai', seasons: ['rabi'], water: 'moderate', ph: [6.0, 7.5], temp: [18, 30], rain: [500, 800] },
  { name: 'Rajma', category: 'pulse', sub: 'Kidney Beans', seasons: ['rabi'], water: 'moderate', ph: [5.5, 6.5], temp: [15, 25], rain: [600, 1000] },
  { name: 'Grass Pea', category: 'pulse', sub: 'Khesari', seasons: ['rabi'], water: 'very_low', ph: [6.0, 8.5], temp: [10, 28], rain: [250, 400] },

  // OILSEEDS
  { name: 'Groundnut', category: 'oilseed', sub: 'Peanut', seasons: ['kharif','rabi'], water: 'moderate', ph: [6.0, 7.0], temp: [22, 30], rain: [500, 1000] },
  { name: 'Soybean', category: 'oilseed', sub: 'Soya', seasons: ['kharif'], water: 'moderate', ph: [6.0, 7.5], temp: [20, 32], rain: [600, 1000] },
  { name: 'Sunflower', category: 'oilseed', sub: 'Helianthus', seasons: ['kharif','rabi','zaid'], water: 'moderate', ph: [6.5, 8.0], temp: [20, 30], rain: [500, 800] },
  { name: 'Sesame', category: 'oilseed', sub: 'Til', seasons: ['kharif','zaid'], water: 'low', ph: [5.5, 8.0], temp: [25, 35], rain: [300, 500] },
  { name: 'Mustard', category: 'oilseed', sub: 'Sarson', seasons: ['rabi'], water: 'low', ph: [6.0, 7.5], temp: [10, 25], rain: [300, 500] },
  { name: 'Rapeseed', category: 'oilseed', sub: 'Toria', seasons: ['rabi'], water: 'low', ph: [6.0, 7.5], temp: [10, 25], rain: [300, 500] },
  { name: 'Safflower', category: 'oilseed', sub: 'Kardi', seasons: ['rabi'], water: 'low', ph: [6.0, 8.0], temp: [15, 30], rain: [300, 500] },
  { name: 'Linseed', category: 'oilseed', sub: 'Flaxseed', seasons: ['rabi'], water: 'moderate', ph: [5.5, 7.5], temp: [10, 25], rain: [450, 750] },
  { name: 'Niger Seed', category: 'oilseed', sub: 'Ramtil', seasons: ['kharif'], water: 'moderate', ph: [5.5, 7.5], temp: [20, 30], rain: [600, 1000] },
  { name: 'Castor', category: 'oilseed', sub: 'Arandi', seasons: ['kharif','rabi'], water: 'low', ph: [5.0, 8.0], temp: [20, 35], rain: [500, 800] },

  // FIBRE / COMMERCIAL
  { name: 'Cotton', category: 'fiber', sub: 'Kapás', seasons: ['kharif'], water: 'high', ph: [6.0, 8.0], temp: [21, 35], rain: [500, 1100] },
  { name: 'Jute', category: 'fiber', sub: 'Patson', seasons: ['kharif'], water: 'high', ph: [6.0, 7.5], temp: [24, 38], rain: [1200, 2000] },
  { name: 'Mesta', category: 'fiber', sub: 'Kenaf', seasons: ['kharif'], water: 'moderate', ph: [6.0, 7.0], temp: [20, 35], rain: [800, 1200] },
  { name: 'Sugarcane', category: 'commercial', sub: 'Ganna', seasons: ['perennial'], water: 'very_high', ph: [6.5, 7.5], temp: [20, 35], rain: [1500, 2500] },
  { name: 'Tobacco', category: 'commercial', sub: 'Tambaku', seasons: ['rabi'], water: 'moderate', ph: [5.5, 7.5], temp: [20, 32], rain: [500, 800] },
  { name: 'Kenaf', category: 'fiber', sub: 'Commercial Fiber', seasons: ['kharif'], water: 'moderate', ph: [6.0, 7.5], temp: [22, 35], rain: [600, 1000] },

  // VEGETABLES
  { name: 'Tomato', category: 'vegetable', sub: 'Solanaceous', seasons: ['kharif','rabi','zaid'], water: 'moderate', ph: [6.0, 7.0], temp: [18, 30], rain: [400, 700] },
  { name: 'Onion', category: 'vegetable', sub: 'Bulb', seasons: ['kharif','rabi'], water: 'moderate', ph: [5.8, 6.8], temp: [15, 25], rain: [350, 600] },
  { name: 'Potato', category: 'vegetable', sub: 'Tuber', seasons: ['rabi'], water: 'moderate', ph: [5.2, 6.5], temp: [15, 20], rain: [450, 600] },
  { name: 'Brinjal', category: 'vegetable', sub: 'Eggplant', seasons: ['kharif','rabi','zaid'], water: 'moderate', ph: [5.5, 6.8], temp: [20, 32], rain: [500, 800] },
  { name: 'Chilli', category: 'spice', sub: 'Solanaceous', seasons: ['kharif','rabi'], water: 'moderate', ph: [6.0, 7.0], temp: [20, 30], rain: [600, 1000] },
  { name: 'Capsicum', category: 'vegetable', sub: 'Bell Pepper', seasons: ['rabi','zaid'], water: 'moderate', ph: [6.0, 6.8], temp: [15, 25], rain: [500, 800] },
  { name: 'Okra', category: 'vegetable', sub: 'Bhindi', seasons: ['kharif','zaid'], water: 'moderate', ph: [6.0, 6.8], temp: [22, 35], rain: [450, 750] },
  { name: 'Cabbage', category: 'vegetable', sub: 'Cole Crop', seasons: ['rabi'], water: 'moderate', ph: [6.0, 7.0], temp: [15, 20], rain: [500, 800] },
  { name: 'Cauliflower', category: 'vegetable', sub: 'Cole Crop', seasons: ['rabi'], water: 'moderate', ph: [6.0, 7.0], temp: [15, 20], rain: [500, 800] },
  { name: 'Carrot', category: 'vegetable', sub: 'Root Crop', seasons: ['rabi'], water: 'moderate', ph: [6.0, 7.0], temp: [10, 20], rain: [400, 600] },
  { name: 'Radish', category: 'vegetable', sub: 'Root Crop', seasons: ['rabi','zaid'], water: 'moderate', ph: [6.0, 7.5], temp: [10, 22], rain: [300, 500] },
  { name: 'Beetroot', category: 'vegetable', sub: 'Root Crop', seasons: ['rabi'], water: 'moderate', ph: [6.0, 7.5], temp: [12, 22], rain: [400, 600] },
  { name: 'Spinach', category: 'vegetable', sub: 'Leafy', seasons: ['kharif','rabi','zaid'], water: 'moderate', ph: [6.0, 7.5], temp: [15, 25], rain: [300, 500] },
  { name: 'Amaranth', category: 'vegetable', sub: 'Leafy', seasons: ['kharif','zaid'], water: 'moderate', ph: [5.5, 7.0], temp: [22, 35], rain: [400, 600] },
  { name: 'Drumstick', category: 'vegetable', sub: 'Moringa', seasons: ['perennial'], water: 'low', ph: [6.0, 7.5], temp: [25, 35], rain: [300, 700] },
  { name: 'Bitter Gourd', category: 'vegetable', sub: 'Cucurbit', seasons: ['kharif','zaid'], water: 'moderate', ph: [6.0, 7.0], temp: [24, 35], rain: [400, 700] },
  { name: 'Bottle Gourd', category: 'vegetable', sub: 'Cucurbit', seasons: ['kharif','zaid'], water: 'moderate', ph: [6.0, 7.0], temp: [24, 35], rain: [400, 700] },
  { name: 'Ridge Gourd', category: 'vegetable', sub: 'Cucurbit', seasons: ['kharif','zaid'], water: 'moderate', ph: [6.0, 7.0], temp: [24, 35], rain: [400, 700] },
  { name: 'Snake Gourd', category: 'vegetable', sub: 'Cucurbit', seasons: ['kharif','zaid'], water: 'moderate', ph: [6.0, 7.0], temp: [24, 35], rain: [400, 700] },
  { name: 'Ash Gourd', category: 'vegetable', sub: 'Cucurbit', seasons: ['kharif','zaid'], water: 'moderate', ph: [6.0, 7.0], temp: [24, 35], rain: [400, 700] },
  { name: 'Cucumber', category: 'vegetable', sub: 'Cucurbit', seasons: ['zaid','kharif'], water: 'moderate', ph: [6.0, 7.0], temp: [20, 30], rain: [300, 500] },
  { name: 'Pumpkin', category: 'vegetable', sub: 'Cucurbit', seasons: ['kharif','zaid'], water: 'moderate', ph: [5.5, 7.5], temp: [20, 32], rain: [400, 800] },
  { name: 'Beans', category: 'vegetable', sub: 'Legume', seasons: ['rabi','zaid'], water: 'moderate', ph: [6.0, 7.5], temp: [15, 25], rain: [450, 700] },
  { name: 'Cluster Bean', category: 'vegetable', sub: 'Guar', seasons: ['kharif','zaid'], water: 'low', ph: [7.0, 8.0], temp: [25, 35], rain: [300, 500] },
  { name: 'Peas', category: 'vegetable', sub: 'Legume', seasons: ['rabi'], water: 'moderate', ph: [6.0, 7.5], temp: [10, 20], rain: [300, 500] },
  { name: 'Sweet Corn', category: 'vegetable', sub: 'Maize Variety', seasons: ['kharif','rabi','zaid'], water: 'moderate', ph: [6.0, 7.0], temp: [18, 30], rain: [500, 900] },
  { name: 'Knol Khol', category: 'vegetable', sub: 'Cole Crop', seasons: ['rabi'], water: 'moderate', ph: [6.0, 7.5], temp: [15, 20], rain: [400, 600] },
  { name: 'Turnip', category: 'vegetable', sub: 'Root Crop', seasons: ['rabi'], water: 'moderate', ph: [6.0, 7.0], temp: [10, 18], rain: [300, 500] },
  { name: 'Sweet Potato', category: 'vegetable', sub: 'Tuber', seasons: ['kharif','rabi'], water: 'moderate', ph: [5.6, 6.6], temp: [20, 30], rain: [500, 800] },
  { name: 'Tapioca', category: 'vegetable', sub: 'Cassava', seasons: ['perennial'], water: 'low', ph: [5.5, 6.5], temp: [22, 35], rain: [600, 1500] },
  { name: 'Yam', category: 'vegetable', sub: 'Tuber', seasons: ['perennial'], water: 'moderate', ph: [5.5, 7.0], temp: [25, 35], rain: [800, 1200] },
  { name: 'Colocasia', category: 'vegetable', sub: 'Taro', seasons: ['kharif'], water: 'high', ph: [5.5, 6.5], temp: [20, 30], rain: [800, 1500] },
  { name: 'Garlic', category: 'vegetable', sub: 'Bulb', seasons: ['rabi'], water: 'moderate', ph: [6.0, 7.0], temp: [12, 22], rain: [300, 500] },
  { name: 'Ginger', category: 'vegetable', sub: 'Rhizome', seasons: ['kharif'], water: 'high', ph: [5.5, 6.8], temp: [20, 30], rain: [1200, 2000] },

  // FRUITS
  { name: 'Banana', category: 'fruit', sub: 'Tropical', seasons: ['perennial'], water: 'very_high', ph: [6.0, 7.5], temp: [20, 35], rain: [1200, 2200] },
  { name: 'Mango', category: 'fruit', sub: 'Tropical Orchard', seasons: ['perennial'], water: 'moderate', ph: [5.5, 7.5], temp: [24, 35], rain: [750, 1500] },
  { name: 'Guava', category: 'fruit', sub: 'Tropical', seasons: ['perennial'], water: 'low', ph: [4.5, 8.2], temp: [15, 35], rain: [600, 1000] },
  { name: 'Papaya', category: 'fruit', sub: 'Tropical', seasons: ['perennial'], water: 'moderate', ph: [6.0, 6.5], temp: [22, 32], rain: [800, 1200] },
  { name: 'Pineapple', category: 'fruit', sub: 'Tropical Bromeliad', seasons: ['perennial'], water: 'moderate', ph: [5.0, 6.0], temp: [22, 32], rain: [1000, 1600] },
  { name: 'Watermelon', category: 'fruit', sub: 'Cucurbit Fruit', seasons: ['zaid'], water: 'moderate', ph: [6.0, 7.0], temp: [24, 35], rain: [250, 450] },
  { name: 'Muskmelon', category: 'fruit', sub: 'Cucurbit Fruit', seasons: ['zaid'], water: 'moderate', ph: [6.0, 7.0], temp: [24, 35], rain: [250, 450] },
  { name: 'Grapes', category: 'fruit', sub: 'Vineyard', seasons: ['perennial'], water: 'moderate', ph: [6.5, 7.5], temp: [15, 35], rain: [400, 600] },
  { name: 'Pomegranate', category: 'fruit', sub: 'Arid Fruit', seasons: ['perennial'], water: 'low', ph: [6.5, 7.5], temp: [20, 38], rain: [300, 600] },
  { name: 'Orange', category: 'fruit', sub: 'Citrus Orchard', seasons: ['perennial'], water: 'moderate', ph: [5.5, 7.5], temp: [15, 30], rain: [800, 1200] },
  { name: 'Sweet Lime', category: 'fruit', sub: 'Citrus Orchard', seasons: ['perennial'], water: 'moderate', ph: [5.5, 7.5], temp: [15, 30], rain: [800, 1200] },
  { name: 'Lemon', category: 'fruit', sub: 'Citrus', seasons: ['perennial'], water: 'moderate', ph: [5.5, 7.5], temp: [15, 35], rain: [600, 1000] },
  { name: 'Sapota', category: 'fruit', sub: 'Chiku', seasons: ['perennial'], water: 'moderate', ph: [6.0, 8.0], temp: [18, 35], rain: [800, 1500] },
  { name: 'Jackfruit', category: 'fruit', sub: 'Tropical Tree', seasons: ['perennial'], water: 'low', ph: [5.5, 7.0], temp: [20, 35], rain: [1000, 2000] },
  { name: 'Amla', category: 'fruit', sub: 'Indian Gooseberry', seasons: ['perennial'], water: 'low', ph: [6.5, 8.5], temp: [15, 40], rain: [400, 800] },
  { name: 'Custard Apple', category: 'fruit', sub: 'Sitaphal', seasons: ['perennial'], water: 'low', ph: [6.0, 7.5], temp: [20, 35], rain: [350, 650] },
  { name: 'Strawberry', category: 'fruit', sub: 'Berries', seasons: ['rabi'], water: 'high', ph: [5.5, 6.5], temp: [10, 25], rain: [600, 900] },
  { name: 'Litchi', category: 'fruit', sub: 'Sub-tropical Fruit', seasons: ['perennial'], water: 'high', ph: [5.5, 6.5], temp: [15, 32], rain: [1200, 1600] },
  { name: 'Ber', category: 'fruit', sub: 'Jujube', seasons: ['perennial'], water: 'very_low', ph: [6.5, 8.5], temp: [15, 42], rain: [200, 500] },
  { name: 'Coconut', category: 'fruit', sub: 'Coastal Plantation', seasons: ['perennial'], water: 'high', ph: [5.2, 8.0], temp: [22, 32], rain: [1000, 2500] },

  // SPICES
  { name: 'Turmeric', category: 'spice', sub: 'Rhizome Spice', seasons: ['kharif'], water: 'high', ph: [5.5, 7.5], temp: [20, 35], rain: [1200, 2000] },
  { name: 'Coriander', category: 'spice', sub: 'Seed Spice', seasons: ['rabi'], water: 'moderate', ph: [6.0, 8.0], temp: [15, 28], rain: [300, 500] },
  { name: 'Cumin', category: 'spice', sub: 'Seed Spice', seasons: ['rabi'], water: 'low', ph: [6.8, 8.0], temp: [15, 28], rain: [200, 350] },
  { name: 'Black Pepper', category: 'spice', sub: 'Vine Spice', seasons: ['perennial'], water: 'high', ph: [5.0, 6.5], temp: [20, 32], rain: [1500, 2500] },
  { name: 'Cardamom', category: 'spice', sub: 'Hills Spice', seasons: ['perennial'], water: 'high', ph: [5.0, 6.5], temp: [15, 28], rain: [1800, 3000] },
  { name: 'Clove', category: 'spice', sub: 'Tree Spice', seasons: ['perennial'], water: 'high', ph: [5.0, 6.0], temp: [20, 32], rain: [1500, 2200] },
  { name: 'Fenugreek', category: 'spice', sub: 'Seed Spice', seasons: ['rabi'], water: 'moderate', ph: [6.0, 7.5], temp: [10, 25], rain: [300, 500] },
  { name: 'Fennel', category: 'spice', sub: 'Seed Spice', seasons: ['rabi'], water: 'moderate', ph: [6.5, 8.0], temp: [15, 25], rain: [400, 600] },
  { name: 'Tamarind', category: 'spice', sub: 'Spice Tree', seasons: ['perennial'], water: 'low', ph: [5.5, 8.0], temp: [20, 40], rain: [400, 800] },

  // PLANTATION / COMMERCIAL
  { name: 'Tea', category: 'plantation', sub: 'Beverage Crop', seasons: ['perennial'], water: 'high', ph: [4.5, 5.5], temp: [15, 30], rain: [1500, 2500] },
  { name: 'Coffee', category: 'plantation', sub: 'Beverage Crop', seasons: ['perennial'], water: 'high', ph: [5.5, 6.5], temp: [18, 28], rain: [1200, 2000] },
  { name: 'Rubber', category: 'plantation', sub: 'Industrial Latex', seasons: ['perennial'], water: 'high', ph: [4.5, 6.0], temp: [25, 34], rain: [1800, 3000] },
  { name: 'Cashew', category: 'plantation', sub: 'Nut Tree', seasons: ['perennial'], water: 'low', ph: [5.5, 7.5], temp: [20, 35], rain: [600, 1500] },
  { name: 'Arecanut', category: 'plantation', sub: 'Betel Nut', seasons: ['perennial'], water: 'high', ph: [5.0, 7.5], temp: [18, 35], rain: [1500, 2500] },
  { name: 'Cocoa', category: 'plantation', sub: 'Chocolate Seed', seasons: ['perennial'], water: 'high', ph: [6.0, 7.5], temp: [20, 32], rain: [1200, 1800] }
];

async function seed() {
  console.log('🌱 Seeding 110 Indian Crops with extended agricultural metadata...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Wiping existing Crop list to start clean
  await Crop.deleteMany({});
  console.log('🗑  Cleared Crop collection');

  const formatted = rawCrops.map((c, idx) => {
    // Determine typical cost and yield ranges based on category
    let yieldMin = 1000, yieldMax = 2000, costMin = 12000, costMax = 20000;
    if (c.category === 'cereal') { yieldMin = 1500; yieldMax = 3000; costMin = 15000; costMax = 22000; }
    else if (c.category === 'pulse') { yieldMin = 400; yieldMax = 800; costMin = 8000; costMax = 12000; }
    else if (c.category === 'oilseed') { yieldMin = 600; yieldMax = 1200; costMin = 10000; costMax = 16000; }
    else if (c.category === 'vegetable') { yieldMin = 4000; yieldMax = 12000; costMin = 20000; costMax = 45000; }
    else if (c.category === 'fruit') { yieldMin = 6000; yieldMax = 18000; costMin = 30000; costMax = 70000; }
    else if (c.category === 'spice') { yieldMin = 800; yieldMax = 1800; costMin = 18000; costMax = 35000; }
    
    const cropId = `CROP_${(idx + 1).toString().padStart(3, '0')}`;
    const cleanName = c.name;

    return {
      name: cleanName,
      crop_id: cropId,
      crop_name: cleanName,
      localNames: {
        te: `${cleanName} (te)`,
        ta: `${cleanName} (ta)`,
        hi: `${cleanName} (hi)`
      },
      telugu_name: `${cleanName} (Telugu)`,
      tamil_name: `${cleanName} (Tamil)`,
      hindi_name: `${cleanName} (Hindi)`,
      category: c.category,
      sub_category: c.sub,
      seasons: c.seasons,
      season: c.seasons.join(', '),
      sowing_window: c.seasons.includes('kharif') ? 'June - July' : 'October - November',
      harvest_window: c.seasons.includes('kharif') ? 'September - October' : 'February - March',
      durationDays: { min: 90, max: 150 },
      duration_days: 120,
      soilCompatibility: ['loamy', 'black', 'red', 'alluvial'],
      soil_types: ['loamy', 'black', 'red', 'alluvial'],
      optimalPH: { min: c.ph[0], max: c.ph[1] },
      min_ph: c.ph[0],
      max_ph: c.ph[1],
      optimalTemp: { min: c.temp[0], max: c.temp[1] },
      temperature_min: c.temp[0],
      temperature_max: c.temp[1],
      optimalRainfall: { min: c.rain[0], max: c.rain[1] },
      rainfall_min: c.rain[0],
      rainfall_max: c.rain[1],
      waterRequirement: c.water === 'high' || c.water === 'very_high' ? 'high' : (c.water === 'low' ? 'low' : 'moderate'),
      water_requirement: c.water,
      drought_tolerance: c.water === 'low' || c.water === 'very_low' ? 'high' : 'medium',
      waterlogging_tolerance: c.water === 'high' || c.water === 'very_high' ? 'high' : 'low',
      suitable_states: ['Tamil Nadu', 'Andhra Pradesh', 'Telangana', 'Karnataka', 'Maharashtra'],
      suitable_districts: ['Vellore', 'Krishna', 'Chittoor', 'Kurnool', 'Guntur'],
      agro_climatic_regions: ['Southern Plateau and Hills region', 'East Coast Plains and Hills region'],
      avgYieldPerAcre: Math.round((yieldMin + yieldMax)/2),
      expected_yield_range: { min: yieldMin, max: yieldMax },
      cultivation_cost_range: { min: costMin, max: costMax },
      shelfLifeDays: c.category === 'vegetable' || c.category === 'fruit' ? 14 : 180,
      shelf_life_days: c.category === 'vegetable' || c.category === 'fruit' ? 14 : 180,
      market_commodity_names: [cleanName, `${cleanName} Local`, `${cleanName} Hybrid`],
      agmarknet_names: [cleanName, `${cleanName} Local`],
      aliases: [cleanName, `${cleanName} Desi`, `${cleanName} Common`],
      varieties: ['Hybrid v1', 'Local Selection'],
      disease_risk: 'medium',
      weather_risk: 'medium',
      market_risk: 'medium',
      isActive: true,
      active: true,
      data_source: 'AgriConnect National Crop Catalog',
      last_verified: new Date()
    };
  });

  await Crop.insertMany(formatted);
  console.log(`✅ Successfully seeded ${formatted.length} crops!`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
