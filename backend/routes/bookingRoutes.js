const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/auth');

router.post('/create', verifyToken, bookingController.createBooking);
router.post('/send-receipt', verifyToken, bookingController.sendReceipt);
router.get('/my-bookings', verifyToken, bookingController.getUserBookings);

module.exports = router;
