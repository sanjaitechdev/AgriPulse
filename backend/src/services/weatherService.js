const axios = require('axios');

/**
 * Fetches live weather context from Open-Meteo for given coordinates
 */
async function getWeatherByCoords(lat, lon) {
  try {
    if (!lat || !lon) {
      return {
        current: { temperature: 28, humidity: 65, condition: 'Clear', rainfall: 0 },
        source: 'Standard Agro-Climatic Baseline'
      };
    }

    const res = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,weather_code,rain,wind_speed_10m',
        daily: 'temperature_2m_max,temperature_2m_min,rain_sum',
        timezone: 'auto'
      },
      timeout: 4000
    });

    const c = res.data?.current;
    if (c) {
      let condition = 'Clear';
      const code = c.weather_code;
      if (code >= 1 && code <= 3) condition = 'Partly Cloudy';
      else if (code >= 51 && code <= 67) condition = 'Rainy';
      else if (code >= 80 && code <= 82) condition = 'Showers';
      else if (code >= 95) condition = 'Thunderstorm';

      return {
        current: {
          temperature: Math.round(c.temperature_2m || 28),
          humidity: Math.round(c.relative_humidity_2m || 65),
          condition,
          rainfall: c.rain || 0,
          windSpeed: c.wind_speed_10m || 8
        },
        source: 'Open-Meteo Live API'
      };
    }
  } catch (err) {
    // Graceful fallback
  }

  return {
    current: { temperature: 28, humidity: 65, condition: 'Clear', rainfall: 0 },
    source: 'Standard Agro-Climatic Baseline'
  };
}

module.exports = {
  getWeatherByCoords
};
