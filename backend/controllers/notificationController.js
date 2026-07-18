const { PriceWatch, RecurringSuggestion, Notification } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all active unseen notifications for the logged-in patient.
 * Merges alerts from:
 * 1. Price Watch drops (alert_seen = false, alert_message not null)
 * 2. Recurring Suggestions (dismissed = false)
 * 3. General Notifications / Trip Reminders (seen = false)
 * Sorted newest first.
 * @route GET /api/notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch PriceWatch alerts
    const priceWatches = await PriceWatch.findAll({
      where: {
        user_id: userId,
        alert_seen: false,
        alert_message: {
          [Op.ne]: null
        }
      }
    });

    const formattedPriceWatches = priceWatches.map(w => ({
      id: w.id,
      type: 'price_drop',
      message: w.alert_message,
      link: '/price-watch',
      createdAt: w.updatedAt
    }));

    // 2. Fetch RecurringSuggestions
    const recurringSuggestions = await RecurringSuggestion.findAll({
      where: {
        patient_id: userId,
        dismissed: false
      }
    });

    const formattedRecurringSuggestions = recurringSuggestions.map(s => {
      const dateObj = new Date(s.suggested_date);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = days[dateObj.getDay()];

      return {
        id: s.id,
        type: 'recurring',
        message: `🔁 It's almost time for your ${dayOfWeek} trip to ${s.route_to} — Book the same ambulance again?`,
        link: '#', // Trigger pre-fill client-side
        route_from: s.route_from,
        route_to: s.route_to,
        vehicle_type: s.vehicle_type,
        createdAt: s.createdAt
      };
    });

    // 3. Fetch general Notifications (reminders)
    const reminders = await Notification.findAll({
      where: {
        patient_id: userId,
        seen: false
      }
    });

    const formattedReminders = reminders.map(r => ({
      id: r.id,
      type: 'reminder',
      message: r.message,
      link: r.link,
      createdAt: r.createdAt
    }));

    // Merge all lists
    const allNotifications = [
      ...formattedPriceWatches,
      ...formattedRecurringSuggestions,
      ...formattedReminders
    ];

    // Sort newest first
    allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      notifications: allNotifications
    });

  } catch (error) {
    console.error('❌ Fetch Notifications Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

/**
 * Mark a notification as seen / dismissed.
 * Handles different tables depending on notification type.
 * @route PATCH /api/notifications/seen/:id
 */
exports.markSeen = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'price_drop', 'recurring', or 'reminder'
    const userId = req.user.id;

    if (!type) {
      return res.status(400).json({ success: false, message: 'Notification type is required.' });
    }

    if (type === 'price_drop') {
      const watch = await PriceWatch.findOne({ where: { id, user_id: userId } });
      if (watch) {
        watch.alert_seen = true;
        watch.alert_message = null;
        await watch.save();
      }
    } else if (type === 'recurring') {
      const suggestion = await RecurringSuggestion.findOne({ where: { id, patient_id: userId } });
      if (suggestion) {
        suggestion.dismissed = true;
        await suggestion.save();
      }
    } else if (type === 'reminder') {
      const notification = await Notification.findOne({ where: { id, patient_id: userId } });
      if (notification) {
        notification.seen = true;
        await notification.save();
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid notification type.' });
    }

    res.json({
      success: true,
      message: 'Notification marked as seen successfully.'
    });

  } catch (error) {
    console.error('❌ Mark Seen Error:', error);
    res.status(500).json({ success: false, message: 'Failed to dismiss notification.' });
  }
};
