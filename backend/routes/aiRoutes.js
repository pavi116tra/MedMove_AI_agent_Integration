const express = require('express');
const router = express.Router();
const { triagePatient, chatWithGuide } = require('../controllers/aiTriageController');

router.post('/triage', triagePatient);
router.post('/chat', chatWithGuide);

module.exports = router;
