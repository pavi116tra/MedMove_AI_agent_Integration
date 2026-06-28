const { PriceWatch } = require('../models');
const { executeAmbulanceSearch } = require('./ambulanceController');

// @desc    Add a new price watch
// @route   POST /api/price-watch/add
exports.addWatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { route_from, route_to, travel_date, vehicle_type, watched_price } = req.body;

    if (!route_from || !route_to || !vehicle_type || !watched_price) {
      return res.status(400).json({ success: false, message: 'All price watch details are required.' });
    }

    const watch = await PriceWatch.create({
      user_id: userId,
      route_from,
      route_to,
      travel_date: travel_date || new Date().toISOString().split('T')[0],
      vehicle_type,
      watched_price,
      alert_seen: false
    });

    // Run agent immediately after adding watch so alert triggers instantly if cheaper rate exists
    setTimeout(() => {
      exports.runPricingAgent().catch(err => console.error('Immediate agent run error:', err));
    }, 500);

    res.status(201).json({
      success: true,
      message: 'Price watch added successfully! Agent is monitoring for price drops.',
      watch
    });
  } catch (error) {
    console.error('❌ Add Price Watch Error:', error);
    res.status(500).json({ success: false, message: 'Failed to add price watch.' });
  }
};

// @desc    Get all price watches for logged in user with enriched ambulance details matching search layout
// @route   GET /api/price-watch/my-watches
exports.getMyWatches = async (req, res) => {
  try {
    const userId = req.user.id;
    const watches = await PriceWatch.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']]
    });

    const enrichedWatches = await Promise.all(watches.map(async (watch) => {
      const wObj = watch.toJSON();
      try {
        const searchRes = await executeAmbulanceSearch({
          pickup: watch.route_from,
          drop: watch.route_to,
          type: watch.vehicle_type,
          date: watch.travel_date
        });
        const results = Array.isArray(searchRes) ? searchRes : (searchRes?.results || []);
        if (results && results.length > 0) {
          const amb = results[0];
          wObj.ambulance_details = {
            company_name: amb.company_name || 'MedMove Partner',
            vehicle_number: amb.vehicle_number || 'TN56AB5673',
            driver_name: amb.driver_name || 'Assigned Driver',
            base_location: amb.base_location || watch.route_from.toLowerCase(),
            service_area: amb.service_area || watch.route_from,
            base_charge: amb.base_charge || Math.round(Number(watch.watched_price) * 0.1),
            price_per_km: amb.price_per_km || amb.per_km_rate || 10,
            distance_charge: amb.distance_charge || Math.round(Number(watch.watched_price) * 0.9),
            distance_km: searchRes.distance_km || 505,
            equipment: amb.equipment || ['First Aid Kit', 'Oxygen Cylinder', 'Ventilator', 'ECG Monitor', 'Wheelchair Support', 'Stretcher']
          };
        } else {
          wObj.ambulance_details = {
            company_name: 'MedMove Partner',
            vehicle_number: 'TN56AB5673',
            driver_name: 'Assigned Driver',
            base_location: watch.route_from.toLowerCase(),
            service_area: watch.route_from,
            base_charge: 500,
            price_per_km: 10,
            distance_charge: Math.round(Number(watch.watched_price) - 500),
            distance_km: 505,
            equipment: ['First Aid Kit', 'Oxygen Cylinder', 'Ventilator', 'ECG Monitor', 'Wheelchair Support', 'Stretcher']
          };
        }
      } catch (e) {
        wObj.ambulance_details = {
          company_name: 'MedMove Partner',
          vehicle_number: 'TN56AB5673',
          driver_name: 'Assigned Driver',
          base_location: watch.route_from.toLowerCase(),
          service_area: watch.route_from,
          base_charge: 500,
          price_per_km: 10,
          distance_charge: Math.round(Number(watch.watched_price) - 500),
          distance_km: 505,
          equipment: ['First Aid Kit', 'Oxygen Cylinder', 'Ventilator', 'ECG Monitor', 'Wheelchair Support', 'Stretcher']
        };
      }
      return wObj;
    }));

    res.json({
      success: true,
      watches: enrichedWatches
    });
  } catch (error) {
    console.error('❌ Get Price Watches Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch price watches.' });
  }
};

// @desc    Mark alert as seen
// @route   PATCH /api/price-watch/seen/:id
exports.markAlertSeen = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const watch = await PriceWatch.findOne({ 
      where: { id, user_id: userId } 
    });
    
    if (!watch) {
      return res.status(404).json({ 
        success: false, 
        message: 'Watch not found' 
      });
    }
    
    watch.alert_seen = true;
    watch.alert_message = null;
    await watch.save();
    
    return res.json({ 
      success: true, 
      message: 'Alert dismissed' 
    });
  } catch (error) {
    console.error('Mark seen error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Manual Trigger Endpoint for Pricing Agent
// @route   POST /api/price-watch/trigger-agent
exports.triggerAgent = async (req, res) => {
  try {
    await exports.runPricingAgent();
    res.json({ success: true, message: 'Pricing Watch Agent executed successfully.' });
  } catch (error) {
    console.error('❌ Trigger Agent Error:', error);
    res.status(500).json({ success: false, message: 'Agent execution failed.' });
  }
};

// @desc    Background Agent running periodically checking for cheaper provider rates
exports.runPricingAgent = async () => {
  console.log('🤖 [Pricing Watch Agent] Running price comparison agent inspection...');
  try {
    const activeWatches = await PriceWatch.findAll();
    if (!activeWatches || activeWatches.length === 0) {
      console.log('🤖 [Pricing Watch Agent] No active price watches found.');
      return;
    }

    for (const watch of activeWatches) {
      try {
        const resultsRes = await executeAmbulanceSearch({
          from_city: watch.route_from,
          to_city: watch.route_to,
          travel_date: watch.travel_date,
          vehicle_type: watch.vehicle_type,
          pickup: watch.route_from,
          drop: watch.route_to,
          type: watch.vehicle_type
        });

        const results = Array.isArray(resultsRes) ? resultsRes : (resultsRes?.results || []);

        if (!results || results.length === 0) {
          console.log(`No results for watch ${watch.id}`);
          continue;
        }

        // Step 1: Find the minimum price from ALL search results
        let minimumPrice = Infinity;
        let cheapestAmbulance = null;

        for (const amb of results) {
          const ambTotal = parseFloat(amb.estimated_total || 
                           (amb.base_charge + ((amb.per_km_rate || amb.price_per_km || 15) * 100)));
          
          if (ambTotal < minimumPrice) {
            minimumPrice = ambTotal;
            cheapestAmbulance = amb;
          }
        }

        const watchedPrice = parseFloat(watch.watched_price);

        console.log(`Watch ${watch.id}: watched=₹${watchedPrice}, currentMin=₹${minimumPrice}`);

        // Step 2: Only alert if minimum price is STRICTLY LESS than watched price
        if (cheapestAmbulance && minimumPrice < watchedPrice) {
          // There IS a cheaper option available right now
          const ambType = (cheapestAmbulance.vehicle_type || cheapestAmbulance.type || watch.vehicle_type).toUpperCase();
          watch.alert_message = `Price drop! ${ambType} ambulance now available at ₹${Math.round(minimumPrice)} (you watched ₹${Math.round(watchedPrice)})`;
          watch.alert_seen = false;
          await watch.save();
          console.log(`✅ Alert SET for watch ${watch.id}`);
        } else {
          // Minimum price is >= watched price — no cheaper option
          // Clear any existing alert
          if (watch.alert_message) {
            watch.alert_message = null;
            watch.alert_seen = true;
            await watch.save();
            console.log(`🔄 Alert CLEARED for watch ${watch.id} - no cheaper option`);
          }
        }
      } catch (err) {
        console.error(`Error processing watch ${watch.id}:`, err.message);
      }
    }
  } catch (error) {
    console.error('❌ [Pricing Watch Agent] Error during agent execution:', error.message);
  }
};
