const { RecurringBooking, RecurringSuggestion } = require('../models');
const { Op } = require('sequelize');

/**
 * Background Agent: Runs daily to check for recurring bookings scheduled for tomorrow.
 */
exports.runRecurringAgent = async () => {
  console.log('🤖 [Recurring Trip Agent] Starting checking of recurring schedules...');
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const tomorrowDateStr = tomorrow.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const tomorrowDayName = daysOfWeek[tomorrow.getDay()]; // e.g. "Tuesday"
    const tomorrowDayShort = tomorrowDayName.substring(0, 3); // e.g. "Tue"

    console.log(`🤖 [Recurring Trip Agent] Tomorrow is ${tomorrowDayName} (${tomorrowDateStr})`);

    // Fetch active recurring bookings
    const activeBookings = await RecurringBooking.findAll({
      where: {
        active_until: {
          [Op.gte]: tomorrowDateStr
        }
      }
    });

    console.log(`🤖 [Recurring Trip Agent] Found ${activeBookings.length} active recurring bookings to inspect.`);

    let suggestionsCreated = 0;

    for (const booking of activeBookings) {
      try {
        let days = booking.days_of_week;
        if (typeof days === 'string') {
          days = JSON.parse(days);
        }

        // Check if tomorrow is one of the scheduled days
        const isScheduledTomorrow = days.some(d => {
          const cleanD = d.trim().toLowerCase();
          return cleanD === tomorrowDayName.toLowerCase() || cleanD === tomorrowDayShort.toLowerCase();
        });

        if (isScheduledTomorrow) {
          // Check if suggestion already exists for this patient, route, and tomorrow's date
          const existing = await RecurringSuggestion.findOne({
            where: {
              patient_id: booking.patient_id,
              route_from: booking.route_from,
              route_to: booking.route_to,
              suggested_date: tomorrowDateStr
            }
          });

          if (!existing) {
            await RecurringSuggestion.create({
              patient_id: booking.patient_id,
              route_from: booking.route_from,
              route_to: booking.route_to,
              vehicle_type: booking.vehicle_type,
              suggested_date: tomorrowDateStr,
              dismissed: false
            });
            suggestionsCreated++;
            console.log(`✅ Suggestion created for patient ${booking.patient_id}: ${booking.route_from} -> ${booking.route_to} on ${tomorrowDateStr}`);
          }
        }
      } catch (err) {
        console.error(`Error processing recurring booking ${booking.id}:`, err.message);
      }
    }

    console.log(`🤖 [Recurring Trip Agent] Finished run. Created ${suggestionsCreated} suggestions.`);
  } catch (error) {
    console.error('❌ [Recurring Trip Agent] Execution failed:', error.message);
  }
};

/**
 * Get all un-dismissed recurring suggestions for the logged-in user.
 * @route GET /api/recurring-suggestions
 */
exports.getSuggestions = async (req, res) => {
  try {
    const patientId = req.user.id;
    const suggestions = await RecurringSuggestion.findAll({
      where: {
        patient_id: patientId,
        dismissed: false
      },
      order: [['suggested_date', 'ASC']]
    });

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error fetching recurring suggestions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch suggestions.' });
  }
};

/**
 * Dismiss a recurring suggestion (mark dismissed = true)
 * @route PATCH /api/recurring-suggestions/:id
 */
exports.dismissSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = req.user.id;

    const suggestion = await RecurringSuggestion.findOne({
      where: { id, patient_id: patientId }
    });

    if (!suggestion) {
      return res.status(404).json({ success: false, message: 'Suggestion not found.' });
    }

    suggestion.dismissed = true;
    await suggestion.save();

    res.json({
      success: true,
      message: 'Suggestion dismissed successfully.'
    });
  } catch (error) {
    console.error('Error dismissing suggestion:', error);
    res.status(500).json({ success: false, message: 'Failed to dismiss suggestion.' });
  }
};
