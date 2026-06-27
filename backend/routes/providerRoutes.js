const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const bookingController = require('../controllers/bookingController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// All provider routes require token and 'provider' role
router.use(verifyToken);
router.use(authorizeRoles('provider'));

// Ambulance fleet management
router.get('/ambulances', providerController.getAmbulances);
router.post('/ambulances/add', providerController.addAmbulance);
router.put('/ambulances/:id', providerController.editAmbulance);
router.delete('/ambulances/:id', providerController.deleteAmbulance);

// Dashboard stats
router.get('/dashboard-stats', providerController.getDashboardStats);

// Booking management
router.get('/bookings', providerController.getBookings);
router.get('/earnings', bookingController.getProviderEarnings);
router.put('/bookings/:id/accept', providerController.acceptBooking);
router.put('/bookings/:id/reject', providerController.rejectBooking);
router.put('/bookings/:id/complete', providerController.completeTrip);

module.exports = router;
