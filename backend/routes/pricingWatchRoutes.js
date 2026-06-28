const express = require('express');
const router = express.Router();
const pricingWatchController = require('../controllers/pricingWatchController');
const { verifyToken } = require('../middleware/auth');

// All routes are protected with JWT auth middleware
router.post('/add', verifyToken, pricingWatchController.addWatch);
router.get('/my-watches', verifyToken, pricingWatchController.getMyWatches);
router.patch('/seen/:id', verifyToken, pricingWatchController.markAlertSeen);
router.post('/trigger-agent', verifyToken, pricingWatchController.triggerAgent);

module.exports = router;
