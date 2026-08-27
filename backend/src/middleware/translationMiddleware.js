// Express translation interceptor middleware
// Scans outgoing response payload structures and recursively translates user-facing strings

const { translateText } = require('../services/translationService');

/**
 * Checks if a string contains critical numerical, unit, or system data that should NOT be translated.
 */
const shouldSkipTranslation = (text) => {
  if (typeof text !== 'string') return true;
  // Skip unit symbols, currency symbols, crop/buyer/order Mongo IDs, dates, codes, and URLs
  const clean = text.trim();
  if (!clean) return true;
  if (/^[0-9\s.,\/₹%°C°Fmmkga-z]+$/i.test(clean) && !/[a-z]{4,}/i.test(clean)) return true; // only numbers and symbols/units
  if (/^[0-9a-fA-F]{24}$/.test(clean)) return true; // MongoDB ObjectId
  if (/^http/i.test(clean)) return true; // URL
  return false;
};

/**
 * Recursively inspects and translates text fields in response objects.
 */
const translateObject = async (obj, lang) => {
  if (!obj) return obj;
  if (typeof obj === 'string') {
    if (shouldSkipTranslation(obj)) return obj;
    return await translateText(obj, lang);
  }
  
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = await translateObject(obj[i], lang);
    }
    return obj;
  }
  
  if (typeof obj === 'object') {
    // Preserve keys like _id, id, coordinates, email, phone, status, role
    const keysToSkip = ['_id', 'id', 'coordinates', 'email', 'phone', 'role', 'status', 'createdAt', 'updatedAt', 'date', 'syncedAt', 'priority', 'type'];
    for (const key of Object.keys(obj)) {
      if (keysToSkip.includes(key)) continue;
      
      // Preserve specific fields like business names, scientific names
      if (key === 'buyer' && obj[key] && obj[key].name) {
        // Only translate message text or explanation, leave business/buyer name alone
        if (obj[key].orgName) continue;
      }
      
      obj[key] = await translateObject(obj[key], lang);
    }
    return obj;
  }
  
  return obj;
};

const translationMiddleware = async (req, res, next) => {
  const lang = req.headers['x-user-language'] || req.query.lang || 'en';
  if (lang === 'en') return next();

  // Monkey patch res.send and res.json to translate payloads before sending
  const originalJson = res.json;
  
  res.json = async function (data) {
    if (data && data.success && data.data) {
      try {
        data.data = await translateObject(data.data, lang);
      } catch (err) {
        console.error('Translation middleware interception error:', err.message);
      }
    }
    return originalJson.call(this, data);
  };

  next();
};

module.exports = translationMiddleware;
