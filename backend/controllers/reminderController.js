const { Booking, Notification } = require('../models');

/**
 * Robust helper to parse booking_date and booking_time into a local Date object.
 */
const parseTravelDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  let cleanTime = timeStr.trim();
  
  // Handle 12-hour format e.g. "10:00 AM" or "10:00 PM"
  const match = cleanTime.match(/^(\d+):(\d+)(?:\s*(AM|PM))?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3];
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    cleanTime = `${hoursStr}:${minutesStr}:00`;
  } else if (/^\d{2}:\d{2}$/.test(cleanTime)) {
    cleanTime = `${cleanTime}:00`;
  }
  
  const dt = new Date(`${dateStr}T${cleanTime}`);
  return dt;
};

/**
 * Background Agent: Runs every 15 minutes to check for bookings happening in ~2 hours.
 */
exports.runReminderAgent = async () => {
  console.log('🤖 [Reminder Agent] Scanning for upcoming bookings...');
  try {
    const now = new Date();
    const targetMin = new Date(now.getTime() + 105 * 60 * 1000); // 1h 45m from now
    const targetMax = new Date(now.getTime() + 135 * 60 * 1000); // 2h 15m from now

    console.log(`🤖 [Reminder Agent] Target travel window: ${targetMin.toISOString()} to ${targetMax.toISOString()}`);

    // Fetch all confirmed bookings that have not sent a reminder yet
    const bookings = await Booking.findAll({
      where: {
        status: 'confirmed',
        reminder_sent: false
      }
    });

    console.log(`🤖 [Reminder Agent] Found ${bookings.length} unsent confirmed bookings to inspect.`);

    let remindersSent = 0;

    for (const booking of bookings) {
      try {
        const travelDateTime = parseTravelDateTime(booking.booking_date, booking.booking_time);
        if (!travelDateTime || isNaN(travelDateTime.getTime())) {
          console.warn(`[Reminder Agent] Invalid datetime for booking #${booking.id}: ${booking.booking_date} ${booking.booking_time}`);
          continue;
        }

        // Check if booking falls within the 1h45m to 2h15m window
        if (travelDateTime >= targetMin && travelDateTime <= targetMax) {
          console.log(`[Reminder Agent] Booking #${booking.id} to ${booking.drop_location} is due at ${travelDateTime.toISOString()}`);

          // Formulate WhatsApp Deep Link
          const rawPhone = booking.driver_phone || '9876543210';
          let cleanPhone = rawPhone.replace(/\D/g, '');
          if (cleanPhone.length === 10) {
            cleanPhone = `91${cleanPhone}`;
          }

          // Build url-encoded message
          const waMessageText = `Hello driver ${booking.driver_name || ''}! This is a reminder for my MedMove ambulance booking from ${booking.pickup_location} to ${booking.drop_location} scheduled for ${booking.booking_date} at ${booking.booking_time}. Please confirm your status.`;
          const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessageText)}`;

          // Create Notification record for dashboard alert
          const messageText = `🔔 Your ambulance to ${booking.drop_location} arrives in 2 hours — Message driver on WhatsApp →`;
          await Notification.create({
            patient_id: booking.user_id,
            type: 'reminder',
            message: messageText,
            link: waLink,
            seen: false
          });

          // Mark booking as processed
          booking.reminder_sent = true;
          await booking.save();

          remindersSent++;
          console.log(`✅ Sent reminder alert to notification panel for booking #${booking.id}`);
        }
      } catch (err) {
        console.error(`Error processing reminder for booking #${booking.id}:`, err.message);
      }
    }

    console.log(`🤖 [Reminder Agent] Scan finished. Sent ${remindersSent} notifications.`);
  } catch (error) {
    console.error('❌ [Reminder Agent] Scanning failed:', error.message);
  }
};
