const axios = require('axios');
const { cacheGet, cacheSet } = require('../config/redis');

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';

// Helper: generate crop-relevant weather advisories from forecast data
const generateAdvisories = (current, daily, crop) => {
  const advisories = [];

  // Rain advisory
  if (daily?.precipitation_sum?.[0] > 20) {
    advisories.push({
      type: 'warning',
      category: 'irrigation',
      message: 'Heavy rainfall expected in the next 24 hours.',
      action: 'Avoid unnecessary irrigation. Check field drainage.',
      icon: 'cloud-rain',
    });
  } else if (daily?.precipitation_sum?.[0] > 5) {
    advisories.push({
      type: 'info',
      category: 'irrigation',
      message: 'Moderate rainfall expected.',
      action: 'Consider reducing or skipping irrigation today.',
      icon: 'drizzle',
    });
  }

  // High temperature
  if (current?.temperature_2m > 38) {
    advisories.push({
      type: 'warning',
      category: 'temperature',
      message: `High temperature: ${current.temperature_2m}°C.`,
      action: 'Ensure adequate irrigation. Avoid spraying pesticides during peak heat hours (11AM–3PM).',
      icon: 'thermometer-sun',
    });
  }

  // Frost risk
  if (daily?.temperature_2m_min?.[0] < 5) {
    advisories.push({
      type: 'critical',
      category: 'frost',
      message: 'Frost risk tonight.',
      action: 'Protect sensitive crops with covers. Irrigate in the evening to retain soil heat.',
      icon: 'snowflake',
    });
  }

  // Wind advisory
  if (current?.windspeed_10m > 30) {
    advisories.push({
      type: 'warning',
      category: 'wind',
      message: `Strong winds: ${current.windspeed_10m} km/h.`,
      action: 'Secure lightweight structures. Avoid spraying.',
      icon: 'wind',
    });
  }

  if (advisories.length === 0) {
    advisories.push({
      type: 'info',
      category: 'general',
      message: 'Weather conditions are favorable.',
      action: 'No special action needed today.',
      icon: 'sun',
    });
  }

  return advisories;
};

// @GET /api/weather/current
exports.getWeatherCurrent = async (req, res, next) => {
  try {
    let { lat, lon } = req.query;
    if (!lat || !lon) {
      if (req.user && req.user.role === 'farmer') {
        const Farm = require('../models/Farm');
        const farm = await Farm.findOne({ farmer: req.user._id, isActive: true });
        if (farm && farm.location?.coordinates) {
          lon = farm.location.coordinates[0];
          lat = farm.location.coordinates[1];
        } else {
          const FarmerProfile = require('../models/FarmerProfile');
          const profile = await FarmerProfile.findOne({ user: req.user._id });
          if (profile && profile.location?.coordinates) {
            lon = profile.location.coordinates[0];
            lat = profile.location.coordinates[1];
          }
        }
      }
    }
    if (!lat || !lon) return res.status(400).json({ success: false, message: 'lat and lon are required' });

    const cacheKey = `weather:current:${lat}:${lon}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const response = await axios.get(`${OPEN_METEO_BASE}/forecast`, {
      params: {
        latitude: lat, longitude: lon,
        current_weather: true,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weathercode,windspeed_10m,winddirection_10m,surface_pressure',
        timezone: 'Asia/Kolkata',
      },
      timeout: 8000,
    });

    const data = {
      source: 'Open-Meteo',
      sourceUrl: 'https://open-meteo.com',
      location: { lat: parseFloat(lat), lon: parseFloat(lon) },
      fetchedAt: new Date().toISOString(),
      current: response.data.current,
      currentWeather: response.data.current_weather,
      testField: "hello-reload-works"
    };

    await cacheSet(cacheKey, data, 1800); // 30 min cache
    res.json({ success: true, data });
  } catch (err) {
    if (err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        message: 'Weather data temporarily unavailable.',
        error: 'upstream_unavailable',
      });
    }
    next(err);
  }
};

// @GET /api/weather/forecast
exports.getWeatherForecast = async (req, res, next) => {
  try {
    let { lat, lon, days = 7 } = req.query;
    if (!lat || !lon) {
      if (req.user && req.user.role === 'farmer') {
        const Farm = require('../models/Farm');
        const farm = await Farm.findOne({ farmer: req.user._id, isActive: true });
        if (farm && farm.location?.coordinates) {
          lon = farm.location.coordinates[0];
          lat = farm.location.coordinates[1];
        } else {
          const FarmerProfile = require('../models/FarmerProfile');
          const profile = await FarmerProfile.findOne({ user: req.user._id });
          if (profile && profile.location?.coordinates) {
            lon = profile.location.coordinates[0];
            lat = profile.location.coordinates[1];
          }
        }
      }
    }
    if (!lat || !lon) return res.status(400).json({ success: false, message: 'lat and lon are required' });

    const cacheKey = `weather:forecast:${lat}:${lon}:${days}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const response = await axios.get(`${OPEN_METEO_BASE}/forecast`, {
      params: {
        latitude: lat, longitude: lon,
        daily: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,windspeed_10m_max',
        forecast_days: Math.min(parseInt(days), 14),
        timezone: 'Asia/Kolkata',
      },
      timeout: 8000,
    });

    const data = {
      source: 'Open-Meteo',
      sourceUrl: 'https://open-meteo.com',
      location: { lat: parseFloat(lat), lon: parseFloat(lon) },
      fetchedAt: new Date().toISOString(),
      daily: response.data.daily,
    };

    await cacheSet(cacheKey, data, 3600); // 1 hr cache
    res.json({ success: true, data });
  } catch (err) {
    if (err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND') {
      return res.status(503).json({ success: false, message: 'Forecast data temporarily unavailable.' });
    }
    next(err);
  }
};

// @GET /api/weather/advisories
exports.getWeatherAdvisories = async (req, res, next) => {
  try {
    let { lat, lon, crop } = req.query;
    if (!lat || !lon) {
      if (req.user && req.user.role === 'farmer') {
        const Farm = require('../models/Farm');
        const farm = await Farm.findOne({ farmer: req.user._id, isActive: true });
        if (farm && farm.location?.coordinates) {
          lon = farm.location.coordinates[0];
          lat = farm.location.coordinates[1];
        } else {
          const FarmerProfile = require('../models/FarmerProfile');
          const profile = await FarmerProfile.findOne({ user: req.user._id });
          if (profile && profile.location?.coordinates) {
            lon = profile.location.coordinates[0];
            lat = profile.location.coordinates[1];
          }
        }
      }
    }
    if (!lat || !lon) return res.status(400).json({ success: false, message: 'lat and lon are required' });

    // Get both current + daily for advisory generation
    const response = await axios.get(`${OPEN_METEO_BASE}/forecast`, {
      params: {
        latitude: lat, longitude: lon,
        current: 'temperature_2m,precipitation,windspeed_10m',
        daily: 'precipitation_sum,temperature_2m_min,temperature_2m_max',
        forecast_days: 3,
        timezone: 'Asia/Kolkata',
      },
      timeout: 8000,
    });

    const advisories = generateAdvisories(response.data.current, response.data.daily, crop);

    res.json({
      success: true,
      data: {
        advisories,
        generatedAt: new Date().toISOString(),
        basedOn: { source: 'Open-Meteo', lat, lon },
      },
    });
  } catch (err) {
    if (err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND') {
      return res.status(503).json({ success: false, message: 'Weather service unavailable. Using last known data.' });
    }
    next(err);
  }
};
