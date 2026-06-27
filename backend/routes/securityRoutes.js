const express = require('express');
const router = express.Router();
const { getSecurityLog, getBlockedIPs, getStats } = require('../middleware/securityGuard');

// Simple secret key check — owner only
const ownerAuth = (req, res, next) => {
  const secret = req.headers['x-security-key'];
  if (secret !== process.env.SECURITY_SECRET && secret !== 'medmove_security_2026') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

// GET /api/security/stats — overall summary
router.get('/stats', ownerAuth, (req, res) => {
  res.json({ success: true, stats: getStats() });
});

// GET /api/security/log — recent security events
router.get('/log', ownerAuth, (req, res) => {
  const log = getSecurityLog();
  res.json({ success: true, total: log.length, events: log.slice(-50) });
});

// GET /api/security/blocked — currently blocked IPs
router.get('/blocked', ownerAuth, (req, res) => {
  res.json({ success: true, blocked_ips: getBlockedIPs() });
});

module.exports = router;
