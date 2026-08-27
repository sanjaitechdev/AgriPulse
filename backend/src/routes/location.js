const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

// Location routes are public to support onboarding/pre-login lookup

// @GET /api/location/search?query=...
router.get('/search', async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ success: false, message: 'Query parameter is required' });

    console.log(`🔍 Nominatim Geocoding Search: "${query}"`);
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        countrycodes: 'in', // Limit to India
        addressdetails: 1,
        limit: 8
      },
      headers: {
        'User-Agent': 'AgriConnect/1.0.0 (contact@agriconnect.org)'
      },
      timeout: 8000
    });

    const results = (response.data || []).map(item => {
      const addr = item.address || {};
      let district = addr.state_district || addr.district || addr.county || addr.city || addr.town || '';
      district = district.replace(/\s*(District|Corporation|Taluk|Mandal)$/i, '').trim();

      return {
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        village: addr.village || addr.suburb || addr.neighbourhood || addr.locality || addr.hamlet || '',
        mandal: addr.county || addr.subdistrict || addr.taluk || '',
        district,
        state: addr.state || '',
        country: addr.country || 'India',
        pincode: addr.postcode || ''
      };
    });

    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Geocoding error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to search location' });
  }
});

// @GET /api/location/reverse?lat=...&lng=...
router.get('/reverse', async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng are required' });

    console.log(`📍 Reverse Geocoding Coordinates: ${lat}, ${lng}`);
    
    // 1. Try Nominatim with high accuracy address details
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat,
          lon: lng,
          format: 'json',
          addressdetails: 1,
          zoom: 16
        },
        headers: {
          'User-Agent': 'AgriConnect/1.0.0 (contact@agriconnect.org)',
          'Accept-Language': 'en'
        },
        timeout: 6000
      });

      const item = response.data;
      if (item && item.address) {
        const addr = item.address;
        const village = addr.village || addr.suburb || addr.neighbourhood || addr.locality || addr.hamlet || addr.town || '';
        const mandal = addr.county || addr.subdistrict || addr.taluk || '';
        let district = addr.state_district || addr.district || addr.county || addr.city || addr.town || '';
        district = district.replace(/\s*(District|Corporation|Taluk|Mandal)$/i, '').trim();
        const state = addr.state || '';
        const country = addr.country || 'India';
        const pincode = addr.postcode || '';

        return res.json({
          success: true,
          data: {
            display_name: item.display_name,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            village,
            mandal,
            district,
            state,
            country,
            pincode
          }
        });
      }
    } catch (nominatimErr) {
      console.warn('Nominatim reverse failed, trying BigDataCloud fallback:', nominatimErr.message);
    }

    // 2. Fallback: BigDataCloud Free Reverse Geocode API
    try {
      const bdcRes = await axios.get(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`, {
        timeout: 5000
      });
      const bdcData = bdcRes.data;
      if (bdcData) {
        let district = bdcData.locality || bdcData.principalSubdivisionCode || bdcData.city || '';
        district = district.replace(/\s*(District|Corporation|Taluk|Mandal)$/i, '').trim();

        return res.json({
          success: true,
          data: {
            display_name: `${bdcData.locality || ''}, ${bdcData.principalSubdivision || ''}, ${bdcData.countryName || 'India'}`,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            village: bdcData.locality || '',
            mandal: bdcData.locality || '',
            district: bdcData.principalSubdivision || district,
            state: bdcData.principalSubdivision || '',
            country: bdcData.countryName || 'India',
            pincode: bdcData.postcode || ''
          }
        });
      }
    } catch (bdcErr) {
      console.warn('BigDataCloud reverse geocode error:', bdcErr.message);
    }

    res.status(500).json({ success: false, message: 'Could not resolve location coordinates' });
  } catch (err) {
    console.error('Reverse geocoding error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to reverse geocode coordinates' });
  }
});

module.exports = router;
