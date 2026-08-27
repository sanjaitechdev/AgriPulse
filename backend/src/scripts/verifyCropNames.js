require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Crop = require('../models/Crop');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const crops = await Crop.find({});
  const sample = crops.filter(c => ['Rice', 'Tomato', 'Cotton', 'Sugarcane', 'Turmeric'].includes(c.name));
  sample.forEach(c => {
    console.log(`${c.name} -> Tamil: ${c.tamil_name} | Telugu: ${c.telugu_name} | Hindi: ${c.hindi_name}`);
  });
  await mongoose.disconnect();
}
check().catch(console.error);
