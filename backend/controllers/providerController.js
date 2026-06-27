const { Ambulance, Booking, Provider, User, ProviderEarning, AmbulanceSlot } = require('../models');

// @desc    Get all ambulances for a provider
exports.getAmbulances = async (req, res) => {
    try {
        const ambulances = await Ambulance.findAll({
            where: { provider_id: req.user.id }
        });
        res.json({ success: true, ambulances });
    } catch (err) {
        console.error('Get Ambulances Error:', err);
        res.status(500).json({ success: false, message: 'Server error while fetching ambulances' });
    }
};

// @desc    Add new ambulance
exports.addAmbulance = async (req, res) => {
    const { 
        vehicle_number, type, driver_name, driver_phone, 
        base_location, base_charge, price_per_km, status, equipment 
    } = req.body;

    try {
        const existing = await Ambulance.findOne({ where: { vehicle_number } });
        if (existing) return res.status(400).json({ success: false, message: 'Vehicle number already exists' });

    // Save to database
    const ambulance = await Ambulance.create({
      provider_id: req.user.id,
      vehicle_number: vehicle_number.toUpperCase(),
      type: type.toLowerCase(),
      driver_name,
      driver_phone,
      base_location: base_location.toLowerCase(),
      base_charge: parseFloat(base_charge),
      price_per_km: parseFloat(price_per_km),
      status: status || 'available',
      equipment: equipment || []
    });

    res.status(201).json({ 
      success: true, 
      message: 'Ambulance added successfully', 
      ambulance 
    });
    } catch (err) {
        console.error('Add Ambulance Error:', err);
        res.status(500).json({ success: false, message: 'Server error while adding ambulance' });
    }
};

// @desc    Update ambulance
exports.editAmbulance = async (req, res) => {
    const { id } = req.params;
    try {
        const ambulance = await Ambulance.findOne({
            where: { id, provider_id: req.user.id }
        });

        if (!ambulance) return res.status(404).json({ success: false, message: 'Ambulance not found' });

        await ambulance.update(req.body);
        res.json({ success: true, message: 'Ambulance updated successfully', ambulance });
    } catch (err) {
        console.error('Edit Ambulance Error:', err);
        res.status(500).json({ success: false, message: 'Server error while updating ambulance' });
    }
};

// @desc    Delete ambulance
exports.deleteAmbulance = async (req, res) => {
    const { id } = req.params;
    try {
        const ambulance = await Ambulance.findOne({
            where: { id, provider_id: req.user.id }
        });

        if (!ambulance) return res.status(404).json({ success: false, message: 'Ambulance not found' });

        await ambulance.destroy();
        res.json({ success: true, message: 'Ambulance removed' });
    } catch (err) {
        console.error('Delete Ambulance Error:', err);
        res.status(500).json({ success: false, message: 'Server error while deleting ambulance' });
    }
};
// ... rest of file updated similarly in memory or next chunk

// @desc    Get dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const total_ambulances = await Ambulance.count({ where: { provider_id: req.user.id } });
        const available = await Ambulance.count({ 
            where: { provider_id: req.user.id, status: 'available' } 
        });
        const on_trip = await Ambulance.count({ 
            where: { provider_id: req.user.id, status: 'on_trip' } 
        });
        const pending_bookings = await Booking.count({ 
            where: { provider_id: req.user.id, status: 'pending' } 
        });
        
        const provider = await Provider.findByPk(req.user.id);
        
        // Get total earnings from ProviderEarning table
        const totalEarningsData = await ProviderEarning.sum('total_fare', {
            where: { provider_id: req.user.id }
        });
        const total_earnings = totalEarningsData || 0;

        res.json({
            success: true,
            stats: {
                total_ambulances,
                available,
                on_trip,
                pending_bookings,
                total_earnings
            }
        });
    } catch (err) {
        console.error('Dashboard Stats Error:', err);
        res.status(500).json({ success: false, message: 'Server error while fetching stats' });
    }
};

// @desc    Get bookings
exports.getBookings = async (req, res) => {
    const { status } = req.query;
    const whereClause = { provider_id: req.user.id };
    if (status) whereClause.status = status;

    try {
        const bookings = await Booking.findAll({
            where: whereClause,
            include: [
                { model: Ambulance, attributes: ['vehicle_number', 'type'] },
                { model: User, attributes: ['full_name', 'phone'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, bookings });
    } catch (err) {
        console.error('Get Bookings Error:', err);
        res.status(500).json({ success: false, message: 'Server error while fetching bookings' });
    }
};

// @desc    Accept booking
exports.acceptBooking = async (req, res) => {
    try {
        const booking = await Booking.findOne({
            where: { id: req.params.id, provider_id: req.user.id }
        });

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        await booking.update({ status: 'confirmed' });
        
        // Optionally update ambulance status to 'booked'
        await Ambulance.update(
            { status: 'booked' },
            { where: { id: booking.ambulance_id } }
        );

        res.json({ success: true, message: 'Booking accepted' });
    } catch (err) {
        console.error('Accept Booking Error:', err);
        res.status(500).json({ success: false, message: 'Server error while accepting booking' });
    }
};

// @desc    Reject booking
exports.rejectBooking = async (req, res) => {
    try {
        const booking = await Booking.findOne({
            where: { id: req.params.id, provider_id: req.user.id }
        });

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        await booking.update({ status: 'rejected' });
        res.json({ success: true, message: 'Booking rejected' });
    } catch (err) {
        console.error('Reject Booking Error:', err);
        res.status(500).json({ success: false, message: 'Server error while rejecting booking' });
    }
};

// @desc    Complete booking (Reset ambulance status and release slot)
exports.completeTrip = async (req, res) => {
    try {
        const { id } = req.params; // Using id as per current route
        const providerId = req.user.id;

        const booking = await Booking.findOne({
            where: { id, provider_id: providerId }
        });

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        await booking.update({ status: 'completed' });

        await ProviderEarning.update(
            { trip_status: 'completed' },
            { where: { booking_id: id } }
        );

        await AmbulanceSlot.update(
            { status: 'released' },
            { where: { booking_id: id } }
        );

        await Ambulance.update(
            { status: 'available' },
            { where: { id: booking.ambulance_id } }
        );

        res.json({ success: true, message: 'Trip marked as completed' });
    } catch (err) {
        console.error('Complete Trip Error:', err);
        res.status(500).json({ success: false, message: 'Server error while completing trip' });
    }
};

module.exports = exports;
