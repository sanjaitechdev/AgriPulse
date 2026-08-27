const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/db');
const AIModelVersion = require('../models/AIModelVersion');

const seedAI = async () => {
  try {
    await connectDB();
    console.log('Connected to database to seed AI models...');

    // De-activate old ones
    await AIModelVersion.updateMany({}, { isActive: false });

    const models = [
      {
        modelName: 'crop_suitability',
        version: 'AgriConnect-Suitability-v1.2',
        trainedAt: new Date('2026-08-25'),
        algorithm: 'Random Forest Regressor',
        features: ['N', 'P', 'K', 'pH', 'temperature', 'humidity', 'rainfall', 'soilType', 'season', 'waterAvailability'],
        targetVariable: 'suitability_score',
        datasetVersion: 'agri-suitability-v1.2',
        sampleCount: 8700,
        metrics: { accuracy: 0.912, precision: 0.895, recall: 0.901, f1: 0.898, mae: 3.42, rmse: 4.81, r2: 0.845 },
        filePath: './models/crop_suitability_v1.pkl',
        isActive: true,
        notes: 'Agronomic suitability model based on soil chemistry, weather trends, and crop requirements.'
      },
      {
        modelName: 'price_forecast',
        version: 'AgriPulse-Price-v1.0',
        trainedAt: new Date('2026-08-26'),
        algorithm: 'XGBoostRegressor',
        features: ['crop', 'market', 'date', 'historical_price', 'modal_price', 'arrival_quantity', 'season', 'rolling_7_day_average', 'price_volatility'],
        targetVariable: 'future_price_5_day',
        datasetVersion: 'apmc-mandi-prices-2026',
        sampleCount: 24500,
        metrics: { accuracy: 0.874, mae: 1.45, rmse: 2.12, r2: 0.812 },
        filePath: './models/price_forecast_v1.pkl',
        isActive: true,
        notes: 'Price forecast model predicting mandi price trends 1, 3, 5, 7 days ahead.'
      },
      {
        modelName: 'demand_forecast',
        version: 'AgriPulse-Demand-v1.0',
        trainedAt: new Date('2026-08-26'),
        algorithm: 'LSTM / Neural Network',
        features: ['crop', 'market', 'month', 'historical_demand', 'active_buyers'],
        targetVariable: 'expected_demand_index',
        datasetVersion: 'buyer-demand-trends-v1',
        sampleCount: 12000,
        metrics: { accuracy: 0.825, mae: 0.11, rmse: 0.18, r2: 0.745 },
        filePath: './models/demand_forecast_v1.pkl',
        isActive: true,
        notes: 'Aggregated buyer interest index model predicting upcoming demand indices.'
      },
      {
        modelName: 'unsold_risk',
        version: 'AgriPulse-Spoilage-v1.0',
        trainedAt: new Date('2026-08-27'),
        algorithm: 'Random Forest Classifier',
        features: ['crop', 'expected_storage_days', 'temperature', 'humidity', 'storage_type', 'crop_condition'],
        targetVariable: 'spoilage_probability',
        datasetVersion: 'crop-decay-rates-v1',
        sampleCount: 5400,
        metrics: { accuracy: 0.892, precision: 0.884, recall: 0.872, f1: 0.878 },
        filePath: './models/spoilage_risk_v1.pkl',
        isActive: true,
        notes: 'Predicts spoilage decay probability and risk score under different storage types.'
      }
    ];

    await AIModelVersion.insertMany(models);
    console.log('✅ Successfully seeded active AI models into MongoDB!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding AI models:', err.message);
    process.exit(1);
  }
};

seedAI();
