const { Ambulance, Provider, AmbulanceSlot } = require('../models');

// Mock Distance Calculator
const calculateDistance = (pickup, drop) => {
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

// Reusable search helper for HTTP routes & Background Pricing Agent
const executeAmbulanceSearch = async ({ pickup, drop, from_city, to_city, type, vehicle_type, date, travel_date, time }) => {
  const pLocation = pickup || from_city;
  const dLocation = drop || to_city;
  const vType = type || vehicle_type;
  const tDate = date || travel_date;

  if (!pLocation || !dLocation) return { distance_km: 0, results: [] };

  const whereConditions = { status: 'available' };
  if (vType && vType.toLowerCase() !== 'all') {
    whereConditions.type = vType.toLowerCase();
  }

  whereConditions.base_location = pLocation.trim().toLowerCase();

  const ambulances = await Ambulance.findAll({
    where: whereConditions,
    include: [
      {
        model: Provider,
        where: { is_approved: true },
        attributes: ['id', 'company_name', 'phone', 'service_area', 'email']
      }
    ],
    order: [['base_charge', 'ASC']]
  });

  const availableAmbulances = [];

  if (!date || !time || date === "" || time === "") {
    availableAmbulances.push(...ambulances);
  } else {
    for (const amb of ambulances) {
      const blockedSlot = await AmbulanceSlot.findOne({
        where: {
          ambulance_id: amb.id,
          booking_date: date,
          booking_time: time,
          status: 'blocked'
        }
      });

      if (!blockedSlot) {
        availableAmbulances.push(amb);
      }
    }
  }

  const distance_km = calculateDistance(pickup, drop);

  const results = availableAmbulances.map(amb => {
    const distance_charge = distance_km * amb.price_per_km;
    const estimated_total = amb.base_charge + distance_charge;

    return {
      id: amb.id,
      vehicle_number: amb.vehicle_number,
      type: amb.type.toLowerCase(),
      driver_name: amb.driver_name,
      driver_phone: '*** hidden until booked ***',
      base_location: amb.base_location,
      base_charge: amb.base_charge,
      price_per_km: amb.price_per_km,
      distance_km,
      distance_charge,
      estimated_total,
      status: amb.status,
      equipment: amb.equipment || [],
      company_name: amb.Provider.company_name,
      service_area: amb.Provider.service_area,
      provider_id: amb.Provider.id
    };
  });

  results.sort((a, b) => a.estimated_total - b.estimated_total);

  return { distance_km, results };
};

// @desc    Search available ambulances
exports.searchAmbulances = async (req, res) => {
  try {
    const { pickup, drop, type, date, time } = req.query;

    if (!pickup || !drop) {
      return res.status(400).json({ success: false, message: 'Pickup and drop locations are required' });
    }

    const { distance_km, results } = await executeAmbulanceSearch({ pickup, drop, type, date, time });

    res.json({
      success: true,
      pickup,
      drop,
      distance_km,
      total_results: results.length,
      ambulances: results
    });

  } catch (error) {
    console.error('❌ Search Error:', error);
    res.status(500).json({ success: false, message: 'Ambulance search failed. Please try again later.' });
  }
};

exports.calculateDistance = calculateDistance;
exports.executeAmbulanceSearch = executeAmbulanceSearch;
