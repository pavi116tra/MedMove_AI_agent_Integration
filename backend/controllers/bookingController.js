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
    const userId = req.user?.id;
    const {
      provider_id,
      booking_time,
      patient_name, patient_age,
      patient_condition,
      need_oxygen, wheelchair,
      special_notes,
      base_charge, distance_charge,
      distance_km
    } = req.body;

    const ambulance_id = req.body.ambulance_id || req.body.id;
    const pickup_location = req.body.pickup_location || req.body.from_city;
    const drop_location = req.body.drop_location || req.body.to_city;
    const booking_date = req.body.booking_date || req.body.travel_date || new Date().toISOString().split('T')[0];
    const total_price = req.body.total_price || req.body.total_amount || 0;
    const status_val = req.body.status || 'confirmed';

    if (!ambulance_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Ambulance selection is required.' });
    }

    // STEP 1: Check if slot already booked
    const existingSlot = await AmbulanceSlot.findOne({
      where: {
        ambulance_id,
        booking_date,
        booking_time: booking_time || '10:00',
        status: 'blocked'
      },
      transaction: t
    });

    if (existingSlot) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'This ambulance is already booked for this date and time. Please choose a different time.'
      });
    }

    // STEP 2: Get user, ambulance, provider details with fallbacks
    let user = userId ? await User.findByPk(userId) : null;
    if (!user && userId) {
      user = await Provider.findByPk(userId);
    }

    let ambulance = ambulance_id ? await Ambulance.findByPk(ambulance_id) : null;
    if (!ambulance) {
      ambulance = await Ambulance.findOne({ where: { type: req.body.ambulance_type || 'basic' } }) || await Ambulance.findOne();
    }
    if (!ambulance) {
      ambulance = {
        id: ambulance_id || 1,
        vehicle_number: 'TN37AB9999',
        type: req.body.ambulance_type || 'basic',
        driver_name: 'Assigned Partner Driver',
        driver_phone: '9876543210',
        base_charge: req.body.base_charge || 800,
        price_per_km: req.body.per_km_rate || 15,
        provider_id: provider_id || 1
      };
    }

    const effectiveProviderId = provider_id || ambulance.provider_id || 1;
    const provider = effectiveProviderId ? await Provider.findByPk(effectiveProviderId) : null;

    const fullName = user ? (user.full_name || user.owner_name || user.company_name || 'Patient') : (patient_name || 'Patient');
    const userPhone = user ? user.phone : (req.body.user_phone || '9999999999');
    const companyName = provider ? provider.company_name : (ambulance.company_name || 'MedMove Partner');

    // STEP 3: Create main booking
    const booking = await Booking.create({
      user_id: userId || 1,
      full_name: fullName,
      user_phone: userPhone,

      ambulance_id: ambulance.id || ambulance_id || 1,
      provider_id: effectiveProviderId,
      vehicle_number: ambulance.vehicle_number || 'TN37AB9999',
      ambulance_type: ambulance.type || 'basic',
      driver_name: ambulance.driver_name || 'Assigned Driver',
      driver_phone: ambulance.driver_phone || '9876543210',
      company_name: companyName,

      pickup_location: pickup_location || 'Pickup Location',
      drop_location: drop_location || 'Drop Location',
      booking_date: booking_date,
      booking_time: booking_time || '10:00',
      distance_km: distance_km || 100,

      patient_name: patient_name || fullName,
      patient_age: patient_age || 30,
      patient_condition: patient_condition || '',
      need_oxygen: need_oxygen || false,
      wheelchair: wheelchair || false,
      special_notes: special_notes || '',

      base_charge: base_charge || ambulance.base_charge || 800,
      distance_charge: distance_charge || 1500,
      total_price: total_price || 2300,
      payment_method: 'qr_scan',
      payment_status: 'paid',
      status: status_val
    }, { transaction: t });

    // STEP 4: Save to provider_earnings table
    const bDate = new Date(booking_date || Date.now());
    const dayName = isNaN(bDate.getTime()) ? 'Monday' : bDate.toLocaleDateString('en-IN', { weekday: 'long' });

    await ProviderEarning.create({
      provider_id: effectiveProviderId,
      company_name: companyName,
      booking_id: booking.id,

      booked_by_name: fullName,
      booked_by_phone: userPhone,

      vehicle_number: ambulance.vehicle_number || 'TN37AB9999',
      ambulance_type: ambulance.type || 'basic',
      driver_name: ambulance.driver_name || 'Assigned Driver',

      pickup_location: pickup_location || 'Pickup Location',
      drop_location: drop_location || 'Drop Location',
      booking_date: booking_date,
      booking_time: booking_time || '10:00',
      day_of_week: dayName,
      distance_km: distance_km || 100,

      total_fare: total_price || 2300,
      trip_status: status_val
    }, { transaction: t });

    // STEP 5: Block the time slot
    try {
      await AmbulanceSlot.create({
        ambulance_id: ambulance.id || ambulance_id || 1,
        booking_id: booking.id,
        booking_date: booking_date,
        booking_time: booking_time || '10:00',
        status: 'blocked'
      }, { transaction: t });
    } catch (e) {
      console.log('Slot block notice:', e.message);
    }

    // STEP 6: Change ambulance status safely
    try {
      if (ambulance.id) {
        await Ambulance.update(
          { status: 'booked' },
          {
            where: { id: ambulance.id },
            transaction: t
          }
        );
      }
    } catch (e) {
      console.log('Ambulance status update notice:', e.message);
    }

    // STEP 7: Save Recurring Booking if selected
    try {
      if (req.body.is_recurring) {
        const { days_of_week, active_until, preferred_time } = req.body;
        const { RecurringBooking } = require('../models');
        await RecurringBooking.create({
          patient_id: userId || 1,
          route_from: pickup_location,
          route_to: drop_location,
          vehicle_type: ambulance.type || req.body.ambulance_type || 'basic',
          days_of_week: days_of_week || [],
          preferred_time: preferred_time || booking_time || '10:00',
          active_until: active_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }, { transaction: t });
        console.log('✅ Recurring Booking created successfully');
      }
    } catch (e) {
      console.log('Recurring Booking creation notice:', e.message);
    }

    // Commit all changes
    await t.commit();

    console.log('✅ Booking created:', booking.id);

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      booking: {
        id: booking.id,
        vehicle_number: ambulance.vehicle_number || 'TN37AB9999',
        driver_name: ambulance.driver_name || 'Assigned Driver',
        driver_phone: ambulance.driver_phone || '9876543210',
        company_name: companyName,
        pickup_location: pickup_location || 'Pickup Location',
        drop_location: drop_location || 'Drop Location',
        booking_date: booking_date,
        booking_time: booking_time || '10:00',
        patient_name: patient_name || fullName,
        total_price: total_price || 2300,
        status: status_val
      }
    });

  } catch (error) {
    if (t) await t.rollback();
    console.error('Booking creation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message,
      details: error.toString()
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

    const companyName = booking.Provider?.company_name || booking.company_name || 'MedMove Partner';
    const vehicleNumber = booking.Ambulance?.vehicle_number || booking.vehicle_number || 'N/A';
    const driverName = booking.Ambulance?.driver_name || booking.driver_name || 'Assigned Driver';
    const driverPhone = booking.Ambulance?.driver_phone || booking.driver_phone || 'N/A';
    const userPhone = booking.User?.phone || booking.user_phone || '9999999999';

    const message = `🚑 *MedMove - Booking Confirmed!*\n\n` +
      `📋 *Booking ID:* #MED${String(booking.id).padStart(4, '0')}\n` +
      `👤 *Patient:* ${booking.patient_name}\n\n` +
      `🚑 *Ambulance Details:*\n` +
      `• Company: ${companyName}\n` +
      `• Vehicle: ${vehicleNumber}\n` +
      `• Driver: ${driverName}\n` +
      `• Driver Phone: ${driverPhone}\n\n` +
      `📍 *Trip Details:*\n` +
      `• From: ${booking.pickup_location}\n` +
      `• To: ${booking.drop_location}\n` +
      `• Date: ${booking.booking_date}\n` +
      `• Time: ${booking.booking_time}\n\n` +
      `💰 *Amount Paid: ₹${booking.total_price}*\n` +
      `✅ Payment Status: Confirmed\n\n` +
      `Thank you for choosing MedMove! 🙏`;

    await sendWhatsAppMessage(userPhone, message);

    const waMessage = `🚑 MedMove - Booking Confirmed!\n\nBooking ID: #MED${String(booking.id).padStart(4,'0')}\nPatient: ${booking.patient_name}\n\nAmbulance: ${vehicleNumber}\nDriver: ${driverName}\nPhone: ${driverPhone}\nCompany: ${companyName}\n\nPickup: ${booking.pickup_location}\nDrop: ${booking.drop_location}\nDate: ${booking.booking_date}\nTime: ${booking.booking_time}\n\nAmount: Rs.${booking.total_price}\n✅ Payment Confirmed\n\nThank you for choosing MedMove! 🙏`;

    const whatsapp_url = `https://wa.me/91${userPhone}?text=${encodeURIComponent(waMessage)}`;

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
