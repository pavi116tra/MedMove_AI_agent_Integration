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
    const userId = req.user.id;
    const watchId = req.params.id;

    const watch = await PriceWatch.findOne({
      where: { id: watchId, user_id: userId }
    });

    if (!watch) {
      return res.status(404).json({ success: false, message: 'Price watch not found.' });
    }

    watch.alert_seen = true;
    await watch.save();

    res.json({
      success: true,
      message: 'Alert marked as seen.',
      watch
    });
  } catch (error) {
    console.error('❌ Mark Alert Seen Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update alert status.' });
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
    // 1. Get active watches
    const watches = await PriceWatch.findAll();
    if (!watches || watches.length === 0) {
      console.log('🤖 [Pricing Watch Agent] No active price watches found.');
      return;
    }

    let alertsTriggered = 0;

    for (const watch of watches) {
      // Skip if watch is already dismissed by user
      if (watch.alert_seen && watch.alert_message) continue;

      // 2. Run executeAmbulanceSearch with the route
      const { distance_km, results } = await executeAmbulanceSearch({
        pickup: watch.route_from,
        drop: watch.route_to,
        type: watch.vehicle_type,
        date: watch.travel_date
      });

      if (results && results.length > 0) {
        // 3. Find the MINIMUM price ambulance from results using reduce
        const minPriceAmbulance = results.reduce((min, amb) => {
          const ambPrice = Number(amb.estimated_total != null ? amb.estimated_total : ((amb.base_charge || 0) + ((amb.price_per_km || amb.per_km_rate || 15) * 100)));
          const minPrice = Number(min.estimated_total != null ? min.estimated_total : ((min.base_charge || 0) + ((min.price_per_km || min.per_km_rate || 15) * 100)));
          return ambPrice < minPrice ? amb : min;
        }, results[0]);

        // 4. Calculate watched price total & minimum found total
        const watchedTotal = Number(watch.watched_price);
        const minTotal = Number(minPriceAmbulance.estimated_total != null ? minPriceAmbulance.estimated_total : ((minPriceAmbulance.base_charge || 0) + ((minPriceAmbulance.price_per_km || minPriceAmbulance.per_km_rate || 15) * 100)));

        // 5. Compare: Trigger alert if minimum found is strictly less than watched price
        if (minTotal < watchedTotal) {
          const vehicleTypeStr = (minPriceAmbulance.type || minPriceAmbulance.vehicle_type || watch.vehicle_type).toUpperCase();
          const alertMsg = `Price drop! ${vehicleTypeStr} ambulance now available at ₹${minTotal} (you watched ₹${watchedTotal})`;
          
          if (watch.alert_message !== alertMsg) {
            watch.alert_message = alertMsg;
            watch.alert_seen = false;
            await watch.save();
            alertsTriggered++;
            console.log(`🤖 [Pricing Watch Agent] Alert triggered for watch #${watch.id}: ₹${minTotal} < ₹${watchedTotal}`);
          }
        } else {
          // Clear stale alert message if min price is not below watched price
          if (watch.alert_message !== null) {
            watch.alert_message = null;
            watch.alert_seen = true;
            await watch.save();
          }
        }
      }
    }

    console.log(`🤖 [Pricing Watch Agent] Finished checking watches. Alerts triggered/updated: ${alertsTriggered}`);
  } catch (error) {
    console.error('❌ [Pricing Watch Agent] Error during agent execution:', error.message);
  }
};
