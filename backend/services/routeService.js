const axios = require('axios');
const { CityCoordinate } = require('../models');

// In-memory route cache keyed by "originCity-destCity"
const routeCache = {};

// Fallback static distance map matching the one in ambulanceController.js
const calculateStaticDistance = (pickup, drop) => {
  const distanceMap = {
    'sivakasi-coimbatore': 142,
    'coimbatore-sivakasi': 142,
    'sivakasi-madurai': 80,
    'madurai-sivakasi': 80,
    'sivakasi-chennai': 560,
    'chennai-sivakasi': 560,
    'sivakasi-trichy': 200,
    'trichy-sivakasi': 200,
    'sivakasi-tirunelveli': 65,
    'tirunelveli-sivakasi': 65,
    'sivakasi-virudhunagar': 20,
    'virudhunagar-sivakasi': 20,
    
    // Common Tamil Nadu routes
    'madurai-chennai': 462,
    'chennai-madurai': 462,
    'coimbatore-chennai': 505,
    'chennai-coimbatore': 505,
    'trichy-chennai': 320,
    'chennai-trichy': 320,
    'salem-chennai': 340,
    'chennai-salem': 340,
    'vellore-chennai': 145,
    'chennai-vellore': 145,
    'madurai-trichy': 140,
    'trichy-madurai': 140,
    'coimbatore-madurai': 160,
    'madurai-coimbatore': 160
  };

  const key = `${pickup.trim().toLowerCase()}-${drop.trim().toLowerCase()}`;
  return distanceMap[key] || 100; // Default 100km if not in map
};

/**
 * Geocode a city name using Nominatim and cache it in the database.
 * @param {string} cityName 
 * @returns {Promise<{lat: number, lon: number}>}
 */
const geocodeCity = async (cityName) => {
  if (!cityName) throw new Error('City name is required for geocoding.');
  const normalizedCity = cityName.trim().toLowerCase();

  try {
    // 1. Check database cache
    const cached = await CityCoordinate.findOne({ where: { city_name: normalizedCity } });
    if (cached) {
      return { lat: parseFloat(cached.lat), lon: parseFloat(cached.lon) };
    }

    // 2. Fetch from Nominatim API
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)},Tamil Nadu,India&format=json&limit=1`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'MedMove-Ambulance-Routing-Agent/1.0' },
      timeout: 5000
    });

    if (response.data && response.data.length > 0) {
      const lat = parseFloat(response.data[0].lat);
      const lon = parseFloat(response.data[0].lon);

      // Save to database cache
      await CityCoordinate.create({
        city_name: normalizedCity,
        lat,
        lon
      }).catch(dbErr => console.error('Failed to cache city coordinates in DB:', dbErr.message));

      return { lat, lon };
    }

    throw new Error(`City ${cityName} not found via Nominatim.`);
  } catch (error) {
    console.error(`Geocoding failed for ${cityName}:`, error.message);
    throw error;
  }
};

/**
 * Get route details (distance in km and duration in minutes) from OSRM.
 * @param {string} originCity 
 * @param {string} destCity 
 * @returns {Promise<{distance_km: number, duration_minutes: number}>}
 */
const getRouteDetails = async (originCity, destCity) => {
  const originClean = originCity.trim().toLowerCase();
  const destClean = destCity.trim().toLowerCase();
  const cacheKey = `${originClean}-${destClean}`;
  const todayStr = new Date().toDateString();

  // 1. Check in-memory cache
  if (routeCache[cacheKey] && routeCache[cacheKey].date === todayStr) {
    return routeCache[cacheKey].data;
  }

  try {
    // 2. Geocode origin and destination
    const originCoords = await geocodeCity(originCity);
    const destCoords = await geocodeCity(destCity);

    // 3. Query OSRM Driving API
    const url = `https://router.project-osrm.org/route/v1/driving/${originCoords.lon},${originCoords.lat};${destCoords.lon},${destCoords.lat}?overview=false`;
    const response = await axios.get(url, { timeout: 5000 });

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const distance_km = parseFloat((route.distance / 1000).toFixed(1));
      const duration_minutes = Math.round(route.duration / 60);

      const result = { distance_km, duration_minutes };

      // Save to in-memory cache
      routeCache[cacheKey] = {
        date: todayStr,
        data: result
      };

      return result;
    }

    throw new Error('No route returned from OSRM.');
  } catch (error) {
    console.warn(`OSRM Routing failed for ${originCity} -> ${destCity}, falling back to static calculation:`, error.message);

    // Safe fallback to static distance
    const distance_km = calculateStaticDistance(originCity, destCity);
    // Fallback duration: 1.5 minutes per km (~40 km/h average for ambulance traffic)
    const duration_minutes = Math.round(distance_km * 1.5);
    const fallbackResult = { distance_km, duration_minutes };

    // Save fallback to cache as well to prevent spamming failed APIs
    routeCache[cacheKey] = {
      date: todayStr,
      data: fallbackResult
    };

    return fallbackResult;
  }
};

module.exports = {
  geocodeCity,
  getRouteDetails
};
