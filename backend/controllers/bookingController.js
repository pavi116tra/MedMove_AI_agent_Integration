const { Booking, Ambulance, Provider, User, ProviderEarning, AmbulanceSlot, sequelize } = require('../models');
const axios = require('axios');

// WhatsApp Send Function (CallMeBot)
const sendWhatsAppMessage = async (phone, message) => {
  try {
    const apiKey = process.env.CALLMEBOT_API_KEY;
    if (!apiKey) return console.log('⚠️ CALLMEBOT_API_KEY missing in .env');
    
    const encodedMsg = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=91${phone}&text=${encodedMsg}&apikey=${apiKey}`;
    
    await axios.get(url);
    console.log('✅ WhatsApp receipt sent to:', phone);
  } catch (error) {
    console.error('❌ WhatsApp Send Failed:', error.message);
  }
};

exports.createBooking = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const userId = req.user.id;
    const {
      ambulance_id, provider_id,
      pickup_location, drop_location,
      booking_date, booking_time,
      patient_name, patient_age,
      patient_condition,
      need_oxygen, wheelchair,
      special_notes,
      base_charge, distance_charge,
      total_price, distance_km
    } = req.body;

    // STEP 1: Check if slot already booked
    const existingSlot = await AmbulanceSlot.findOne({
      where: {
        ambulance_id,
        booking_date,
        booking_time,
        status: 'blocked'
      },
      transaction: t
    });

    if (existingSlot) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 
          'This ambulance is already booked ' +
          'for this date and time. ' +
          'Please choose different time.'
      });
    }

    // STEP 2: Get user, ambulance, provider details
    const user = await User.findByPk(userId);
    const ambulance = await Ambulance.findByPk(ambulance_id);
    const provider = await Provider.findByPk(provider_id);

    // STEP 3: Create main booking
    const booking = await Booking.create({
      user_id: userId,
      full_name: user.full_name,
      user_phone: user.phone,

      ambulance_id,
      provider_id,
      vehicle_number: ambulance.vehicle_number,
      ambulance_type: ambulance.type,
      driver_name: ambulance.driver_name,
      driver_phone: ambulance.driver_phone,
      company_name: provider.company_name,

      pickup_location,
      drop_location,
      booking_date,
      booking_time,
      distance_km,

      patient_name,
      patient_age,
      patient_condition,
      need_oxygen: need_oxygen || false,
      wheelchair: wheelchair || false,
      special_notes,

      base_charge,
      distance_charge,
      total_price,
      payment_method: 'qr_scan',
      payment_status: 'paid',
      status: 'confirmed'
    }, { transaction: t });

    // STEP 4: Save to provider_earnings table
    const bDate = new Date(booking_date);
    const dayName = bDate.toLocaleDateString('en-IN', { weekday: 'long' });

    await ProviderEarning.create({
      provider_id,
      company_name: provider.company_name,
      booking_id: booking.id,

      booked_by_name: user.full_name,
      booked_by_phone: user.phone,

      vehicle_number: ambulance.vehicle_number,
      ambulance_type: ambulance.type,
      driver_name: ambulance.driver_name,

      pickup_location,
      drop_location,
      booking_date,
      booking_time,
      day_of_week: dayName,
      distance_km,

      total_fare: total_price,
      trip_status: 'confirmed'
    }, { transaction: t });

    // STEP 5: Block the time slot
    await AmbulanceSlot.create({
      ambulance_id,
      booking_id: booking.id,
      booking_date,
      booking_time,
      status: 'blocked'
    }, { transaction: t });

    // STEP 6: Change ambulance status
    await Ambulance.update(
      { status: 'booked' },
      {
        where: { id: ambulance_id },
        transaction: t
      }
    );

    // Commit all changes
    await t.commit();

    console.log('✅ Booking created:', booking.id);
    console.log('✅ Slot blocked:', booking_date, booking_time);
    console.log('✅ Provider earnings saved');

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      booking: {
        id: booking.id,
        vehicle_number: ambulance.vehicle_number,
        driver_name: ambulance.driver_name,
        driver_phone: ambulance.driver_phone,
        company_name: provider.company_name,
        pickup_location,
        drop_location,
        booking_date,
        booking_time,
        patient_name,
        total_price,
        status: 'confirmed'
      }
    });

  } catch (error) {
    if (t) await t.rollback();
    console.error('❌ Booking Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Booking failed. Please try again.',
      error: error.message
    });
  }
};

exports.sendReceipt = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const booking = await Booking.findOne({
      where: { id: booking_id },
      include: [
        { model: User },
        { model: Ambulance },
        { model: Provider }
      ]
    });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const message = `🚑 *MedMove - Booking Confirmed!*\n\n` +
      `📋 *Booking ID:* #MED${String(booking.id).padStart(4, '0')}\n` +
      `👤 *Patient:* ${booking.patient_name}\n\n` +
      `🚑 *Ambulance Details:*\n` +
      `• Company: ${booking.Provider.company_name}\n` +
      `• Vehicle: ${booking.Ambulance.vehicle_number}\n` +
      `• Driver: ${booking.Ambulance.driver_name}\n` +
      `• Driver Phone: ${booking.Ambulance.driver_phone}\n\n` +
      `📍 *Trip Details:*\n` +
      `• From: ${booking.pickup_location}\n` +
      `• To: ${booking.drop_location}\n` +
      `• Date: ${booking.booking_date}\n` +
      `• Time: ${booking.booking_time}\n\n` +
      `💰 *Amount Paid: ₹${booking.total_price}*\n` +
      `✅ Payment Status: Confirmed\n\n` +
      `Thank you for choosing MedMove! 🙏`;

    const userPhone = booking.User.phone;
    await sendWhatsAppMessage(userPhone, message);

    const waMessage = `🚑 MedMove - Booking Confirmed!\n\nBooking ID: #MED${String(booking.id).padStart(4,'0')}\nPatient: ${booking.patient_name}\n\nAmbulance: ${booking.Ambulance.vehicle_number}\nDriver: ${booking.Ambulance.driver_name}\nPhone: ${booking.Ambulance.driver_phone}\nCompany: ${booking.Provider.company_name}\n\nPickup: ${booking.pickup_location}\nDrop: ${booking.drop_location}\nDate: ${booking.booking_date}\nTime: ${booking.booking_time}\n\nAmount: Rs.${booking.total_price}\n✅ Payment Confirmed\n\nThank you for choosing MedMove! 🙏`;

    const whatsapp_url = `https://wa.me/91${booking.User.phone}?text=${encodeURIComponent(waMessage)}`;

    res.json({ 
      success: true, 
      message: 'Receipt ready',
      whatsapp_url: whatsapp_url
    });
  } catch (error) {
    console.error('❌ Send Receipt Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send receipt' });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Ambulance }, { model: Provider }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
};
exports.getProviderBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { provider_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
};

exports.getProviderEarnings = async (req, res) => {
  try {
    const earnings = await ProviderEarning.findAll({
      where: { provider_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, earnings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch earnings' });
  }
};
