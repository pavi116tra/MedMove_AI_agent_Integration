const express = require('express');
const router = express.Router();
const recurringTripController = require('../controllers/recurringTripController');
const { verifyToken } = require('../middleware/auth');

// Protected routes for Patient recurring trip suggestions
router.get('/', verifyToken, recurringTripController.getSuggestions);
router.patch('/:id', verifyToken, recurringTripController.dismissSuggestion);

module.exports = router;
