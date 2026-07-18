const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');

// Protected routes for patient notifications
router.get('/', verifyToken, notificationController.getNotifications);
router.patch('/seen/:id', verifyToken, notificationController.markSeen);
router.patch('/:id', verifyToken, notificationController.markSeen);

module.exports = router;
