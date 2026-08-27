// Catch ALL unhandled rejections — prevent silent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔴 Unhandled Rejection:', reason?.message || reason);
  // Don't exit — log and keep running
});
process.on('uncaughtException', (err) => {
  console.error('🔴 Uncaught Exception:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`   Port ${err.port} already in use. Run: Stop-Process -Name node -Force`);
    process.exit(1);
  }
  // For other errors, log but stay alive
});

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { initSocket } = require('./socket');
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const farmerRoutes = require('./routes/farmer');
const buyerRoutes = require('./routes/buyer');
const adminRoutes = require('./routes/admin');
const farmRoutes = require('./routes/farms');
const cropRoutes = require('./routes/crops');
const listingRoutes = require('./routes/listings');
const demandRoutes = require('./routes/demands');
const proposalRoutes = require('./routes/proposals');
const orderRoutes = require('./routes/orders');
const marketRoutes = require('./routes/market');
const weatherRoutes = require('./routes/weather');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notifications');
const rescueRoutes = require('./routes/rescue');
const locationRoutes = require('./routes/location');

const app = express();
const server = http.createServer(app);

// Connect DB and Redis
connectDB().then(async () => {
  try {
    const AIModelVersion = require('./models/AIModelVersion');
    const count = await AIModelVersion.countDocuments();
    if (count === 0) {
      console.log('🌱 No AI Model Versions found. Seeding AgriPulse AI models...');
      await AIModelVersion.insertMany([
        {
          modelName: 'crop_suitability',
          version: 'AgriConnect-Suitability-v1.2',
          trainedAt: new Date(),
          algorithm: 'Random Forest Regressor',
          features: ['N', 'P', 'K', 'pH', 'temperature', 'humidity', 'rainfall', 'soilType', 'season', 'waterAvailability'],
          targetVariable: 'suitability_score',
          datasetVersion: 'agri-suitability-v1.2',
          sampleCount: 8700,
          metrics: { accuracy: 0.912, precision: 0.895, recall: 0.901, f1: 0.898, mae: 3.42, rmse: 4.81, r2: 0.845 },
          filePath: './models/crop_suitability_v1.pkl',
          isActive: true
        },
        {
          modelName: 'price_forecast',
          version: 'AgriPulse-Price-v1.0',
          trainedAt: new Date(),
          algorithm: 'XGBoostRegressor',
          features: ['crop', 'market', 'date', 'historical_price', 'modal_price', 'arrival_quantity', 'season', 'rolling_7_day_average', 'price_volatility'],
          targetVariable: 'future_price_5_day',
          datasetVersion: 'apmc-mandi-prices-2026',
          sampleCount: 24500,
          metrics: { accuracy: 0.874, mae: 1.45, rmse: 2.12, r2: 0.812 },
          filePath: './models/price_forecast_v1.pkl',
          isActive: true
        },
        {
          modelName: 'demand_forecast',
          version: 'AgriPulse-Demand-v1.0',
          trainedAt: new Date(),
          algorithm: 'LSTM / Neural Network',
          features: ['crop', 'market', 'month', 'historical_demand', 'active_buyers'],
          targetVariable: 'expected_demand_index',
          datasetVersion: 'buyer-demand-trends-v1',
          sampleCount: 12000,
          metrics: { accuracy: 0.825, mae: 0.11, rmse: 0.18, r2: 0.745 },
          filePath: './models/demand_forecast_v1.pkl',
          isActive: true
        },
        {
          modelName: 'unsold_risk',
          version: 'AgriPulse-Spoilage-v1.0',
          trainedAt: new Date(),
          algorithm: 'Random Forest Classifier',
          features: ['crop', 'expected_storage_days', 'temperature', 'humidity', 'storage_type', 'crop_condition'],
          targetVariable: 'spoilage_probability',
          datasetVersion: 'crop-decay-rates-v1',
          sampleCount: 5400,
          metrics: { accuracy: 0.892, precision: 0.884, recall: 0.872, f1: 0.878 },
          filePath: './models/spoilage_risk_v1.pkl',
          isActive: true
        }
      ]);
      console.log('✅ AgriPulse AI models seeded successfully!');
    }
  } catch (err) {
    console.error('Failed to auto-seed AI models:', err.message);
  }
});
connectRedis();

// Security
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));
app.use(mongoSanitize());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api/', generalLimiter);

// Translation interceptor
const translationMiddleware = require('./middleware/translationMiddleware');
app.use('/api/', translationMiddleware);

// Static files (uploads)
app.use('/uploads', express.static(process.env.UPLOAD_DIR || 'uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    testReload: 'reload-active-yes'
  });
});



// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/demands', demandRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rescue', rescueRoutes);
app.use('/api/location', locationRoutes);


// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Initialize Socket.IO
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🌱 AgriConnect API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Client:      ${process.env.CLIENT_URL}`);
  console.log(`   Docs:        http://localhost:${PORT}/health\n`);

  // Spawn Python AI Service in the background
  try {
    const { spawn } = require('child_process');
    const path = require('path');
    const fs = require('fs');
    const aiServiceDir = path.resolve(__dirname, '../../ai-service');
    const logFile = fs.createWriteStream(path.resolve(__dirname, '../spawn.log'), { flags: 'a' });
    
    console.log(`🚀 Spawning Python AI Service in ${aiServiceDir}...`);
    
    const spawnPython = (index = 0) => {
      const binaries = ['py', 'python', 'python3'];
      if (index >= binaries.length) {
        fs.appendFileSync(path.resolve(__dirname, '../spawn.log'), `🔴 All python binaries failed to spawn.\n`);
        return;
      }
      const bin = binaries[index];
      console.log(`   Trying to spawn with '${bin}'...`);
      const aiProcess = spawn(bin, ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8001'], {
        cwd: aiServiceDir,
        shell: true
      });

      aiProcess.stdout.pipe(logFile);
      aiProcess.stderr.pipe(logFile);

      aiProcess.on('error', (err) => {
        fs.appendFileSync(path.resolve(__dirname, '../spawn.log'), `🔴 Spawn error for ${bin}: ${err.message}\n`);
      });

      aiProcess.on('exit', (code) => {
        if (code === 9009 || code === 1) {
          fs.appendFileSync(path.resolve(__dirname, '../spawn.log'), `⚠️ '${bin}' binary unavailable (code ${code}). Trying next launcher...\n`);
          spawnPython(index + 1);
        } else {
          fs.appendFileSync(path.resolve(__dirname, '../spawn.log'), `🔴 Python AI Service (${bin}) exited with code ${code}\n`);
        }
      });
    };

    spawnPython(0);
  } catch (err) {
    console.error('🔴 Error attempting to spawn Python AI Service:', err.message);
  }
});

module.exports = { app, server };
