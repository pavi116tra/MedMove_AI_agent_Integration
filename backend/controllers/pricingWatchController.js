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

// @desc    Get all price watches for logged in user
// @route   GET /api/price-watch/my-watches
exports.getMyWatches = async (req, res) => {
  try {
    const userId = req.user.id;
    const watches = await PriceWatch.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      watches
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
        // Search for ambulances on this route
        const searchRes = await executeAmbulanceSearch({
          from_city: watch.route_from,
          to_city: watch.route_to,
          travel_date: watch.travel_date,
          vehicle_type: watch.vehicle_type,
          pickup: watch.route_from,
          drop: watch.route_to,
          type: watch.vehicle_type
        });

        const results = Array.isArray(searchRes) ? searchRes : (searchRes?.results || []);

        if (!results || results.length === 0) continue;

        // Find the MINIMUM price from all results
        let minPrice = Infinity;
        let cheapestAmbulance = null;

        for (const amb of results) {
          const distanceKm = 100; // default
          const base = parseFloat(amb.base_charge || 0);
          const rate = parseFloat(amb.per_km_rate || amb.price_per_km || 15);
          const total = amb.estimated_total != null ? parseFloat(amb.estimated_total) : (base + (rate * distanceKm));
          if (total < minPrice) {
            minPrice = total;
            cheapestAmbulance = amb;
          }
        }

        const watchedPrice = parseFloat(watch.watched_price);

        // ONLY alert if strictly LESS THAN watched price
        // Do NOT alert if equal or higher
        if (cheapestAmbulance && minPrice < watchedPrice) {
          const vehicleTypeStr = (cheapestAmbulance.vehicle_type || cheapestAmbulance.type || watch.vehicle_type).toUpperCase();
          watch.alert_message = `Price drop! ${vehicleTypeStr} ambulance now available at ₹${Math.round(minPrice)} (you watched ₹${Math.round(watchedPrice)})`;
          watch.alert_seen = false;
          await watch.save();
          console.log(`Alert set for watch ${watch.id}: ₹${minPrice} < ₹${watchedPrice}`);
        } else {
          // Clear any old alert if price is no longer cheaper
          if (watch.alert_message && minPrice >= watchedPrice) {
            watch.alert_message = null;
            watch.alert_seen = true;
            await watch.save();
            console.log(`Alert cleared for watch ${watch.id}: ₹${minPrice} >= ₹${watchedPrice}`);
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
