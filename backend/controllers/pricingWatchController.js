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

    res.status(201).json({
      success: true,
      message: 'Price watch added successfully!',
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

// @desc    Background Agent running every hour checking for cheaper provider rates
exports.runPricingAgent = async () => {
  console.log('🤖 [Pricing Watch Agent] Running hourly price comparison agent...');
  try {
    const watches = await PriceWatch.findAll();
    if (!watches || watches.length === 0) {
      console.log('🤖 [Pricing Watch Agent] No active price watches found.');
      return;
    }

    let alertsTriggered = 0;

    for (const watch of watches) {
      const { distance_km, results } = await executeAmbulanceSearch({
        pickup: watch.route_from,
        drop: watch.route_to,
        type: watch.vehicle_type,
        date: watch.travel_date
      });

      if (results && results.length > 0) {
        const cheapest = results[0]; // Already sorted ASC by estimated_total
        const currentCheapestPrice = Number(cheapest.estimated_total);
        const watchedPrice = Number(watch.watched_price);

        if (currentCheapestPrice < watchedPrice) {
          const alertMsg = `Price dropped! ${watch.vehicle_type.toUpperCase()} on your ${watch.route_from} to ${watch.route_to} route is now cheaper at ₹${currentCheapestPrice} (offered by ${cheapest.company_name}).`;
          
          if (watch.alert_message !== alertMsg) {
            watch.alert_message = alertMsg;
            watch.alert_seen = false;
            await watch.save();
            alertsTriggered++;
            console.log(`🤖 [Pricing Watch Agent] Alert triggered for user ${watch.user_id}: ₹${currentCheapestPrice} < ₹${watchedPrice}`);
          }
        }
      }
    }

    console.log(`🤖 [Pricing Watch Agent] Finished checking ${watches.length} watches. Alerts triggered/updated: ${alertsTriggered}`);
  } catch (error) {
    console.error('❌ [Pricing Watch Agent] Error during agent execution:', error.message);
  }
};
