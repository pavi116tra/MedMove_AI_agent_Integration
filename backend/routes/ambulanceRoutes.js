const express = require('express');
const router = express.Router();
const ambulanceController = require('../controllers/ambulanceController');

// Search ambulances (public)
router.get('/search', ambulanceController.searchAmbulances);

module.exports = router;
