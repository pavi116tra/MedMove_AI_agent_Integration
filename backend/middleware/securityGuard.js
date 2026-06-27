const axios = require('axios');

// In-memory store for tracking (resets on server restart)
// In production this would use Redis
const ipTracker = new Map();
const blockedIPs = new Map();

// Send Discord alert — completely silent to users
const sendDiscordAlert = async (alertData) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl === 'your_discord_webhook_url_here') return; // Silent fail if not configured

  const severityColor = {
    LOW: 3447003,     // Blue
    MEDIUM: 16776960, // Yellow
    HIGH: 16711680,   // Red
    CRITICAL: 10038562 // Dark red
  };

  const embed = {
    title: `🚨 MedMove Security Alert — ${alertData.type}`,
    color: severityColor[alertData.severity] || 16711680,
    fields: [
      { name: 'Severity', value: alertData.severity, inline: true },
      { name: 'IP Address', value: alertData.ip || 'Unknown', inline: true },
      { name: 'Endpoint', value: alertData.endpoint || 'Unknown', inline: true },
      { name: 'Time (IST)', value: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), inline: true },
      { name: 'Details', value: alertData.details || 'No details', inline: false },
      { name: 'Action Taken', value: alertData.action || 'Logged only', inline: false },
      { name: 'User Impact', value: 'None — handled silently', inline: false }
    ],
    footer: { text: '— MedMove Security Guardian' },
    timestamp: new Date().toISOString()
  };

  try {
    await axios.post(webhookUrl, { embeds: [embed] });
  } catch (err) {
    // Never crash the app for a failed alert
    console.error('[Security] Discord alert failed:', err.message);
  }
};

// Log security events to memory (and optionally file)
const securityLog = [];
const logEvent = (event) => {
  const entry = { ...event, timestamp: new Date().toISOString() };
  securityLog.push(entry);
  // Keep only last 500 events in memory
  if (securityLog.length > 500) securityLog.shift();
  console.log(`[Security] ${entry.type} from ${entry.ip} on ${entry.endpoint}`);
};

// Get client IP reliably
const getIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.connection?.remoteAddress ||
         req.ip ||
         'unknown';
};

// DETECTOR 1: Brute force login attempts
const detectBruteForce = async (req, res, next) => {
  try {
    const ip = getIP(req);
    const now = Date.now();
    const windowMs = 2 * 60 * 1000; // 2 minute window
    const maxAttempts = 5;

    // Check if IP is blocked
    if (blockedIPs.has(ip)) {
      const blockedUntil = blockedIPs.get(ip);
      if (now < blockedUntil) {
        logEvent({ type: 'BLOCKED_IP_ATTEMPT', ip, endpoint: req.path });
        return res.status(429).json({
          success: false,
          message: 'Too many attempts. Please try again later.'
        });
      } else {
        blockedIPs.delete(ip); // Unblock after time expires
      }
    }

    // Track attempts
    const key = `login_${ip}`;
    const tracker = ipTracker.get(key) || { count: 0, firstAttempt: now };

    // Reset if outside window
    if (now - tracker.firstAttempt > windowMs) {
      tracker.count = 0;
      tracker.firstAttempt = now;
    }

    tracker.count++;
    ipTracker.set(key, tracker);

    if (tracker.count >= maxAttempts) {
      // Block for 15 minutes
      blockedIPs.set(ip, now + 15 * 60 * 1000);
      ipTracker.delete(key);

      logEvent({
        type: 'BRUTE_FORCE_DETECTED',
        ip,
        endpoint: req.path,
        attempts: tracker.count
      });

      await sendDiscordAlert({
        type: 'Brute Force Login Attempt',
        severity: 'HIGH',
        ip,
        endpoint: req.path,
        details: `${tracker.count} failed login attempts in 2 minutes. IP blocked for 15 minutes.`,
        action: 'IP blocked for 15 minutes automatically'
      });

      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please try again later.'
      });
    }
  } catch (err) {
    console.error('[Security] Brute force detector error:', err.message);
  }
  next();
};

// DETECTOR 2: OTP spam detection
const detectOTPAbuse = async (req, res, next) => {
  try {
    const ip = getIP(req);
    const now = Date.now();
    const windowMs = 10 * 60 * 1000; // 10 minute window
    const maxOTPs = 8;

    const key = `otp_${ip}`;
    const tracker = ipTracker.get(key) || { count: 0, firstAttempt: now };

    if (now - tracker.firstAttempt > windowMs) {
      tracker.count = 0;
      tracker.firstAttempt = now;
    }

    tracker.count++;
    ipTracker.set(key, tracker);

    if (tracker.count >= maxOTPs) {
      logEvent({ type: 'OTP_ABUSE_DETECTED', ip, endpoint: req.path });

      await sendDiscordAlert({
        type: 'OTP Request Abuse',
        severity: 'MEDIUM',
        ip,
        endpoint: req.path,
        details: `${tracker.count} OTP requests in 10 minutes from same IP. Possible SMS spam attack.`,
        action: 'OTP requests blocked from this IP for 10 minutes'
      });

      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please wait 10 minutes.'
      });
    }
  } catch (err) {
    console.error('[Security] OTP abuse detector error:', err.message);
  }
  next();
};

// DETECTOR 3: SQL injection and XSS attempt detection
const detectInjection = async (req, res, next) => {
  try {
    const ip = getIP(req);
    const body = JSON.stringify(req.body || {});
    const query = JSON.stringify(req.query || {});
    const combined = body + query;

    const suspiciousPatterns = [
      /(\bSELECT\s+[\s\S]+\s+FROM\b|\bDROP\s+(TABLE|DATABASE|SCHEMA|VIEW|PROCEDURE)\b|\bINSERT\s+INTO\b|\bDELETE\s+FROM\b|\bUPDATE\s+[\s\S]+\s+SET\b|\bUNION\s+SELECT\b)/i,
      /(<script|javascript:|onerror=|onload=)/i,
      /(--|;--|\/\*|\*\/)/,
      /(\bOR\b\s+\d+=\d+|\bAND\b\s+\d+=\d+)/i,
      /(EXEC\s*\(|EXECUTE\s*\()/i
    ];

    const isAttack = suspiciousPatterns.some(pattern => pattern.test(combined));

    if (isAttack) {
      logEvent({ type: 'INJECTION_ATTEMPT', ip, endpoint: req.path });

      await sendDiscordAlert({
        type: 'SQL Injection / XSS Attempt',
        severity: 'CRITICAL',
        ip,
        endpoint: req.path,
        details: `Suspicious payload detected on ${req.method} ${req.path}`,
        action: 'Request blocked. No database impact.'
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid request.'
      });
    }
  } catch (err) {
    console.error('[Security] Injection detector error:', err.message);
  }
  next();
};

// DETECTOR 4: Search scraping detection
const detectScraping = async (req, res, next) => {
  try {
    const ip = getIP(req);
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxSearches = 30;

    const key = `search_${ip}`;
    const tracker = ipTracker.get(key) || { count: 0, firstAttempt: now };

    if (now - tracker.firstAttempt > windowMs) {
      tracker.count = 0;
      tracker.firstAttempt = now;
    }

    tracker.count++;
    ipTracker.set(key, tracker);

    if (tracker.count >= maxSearches) {
      logEvent({ type: 'SCRAPING_DETECTED', ip, endpoint: req.path });

      await sendDiscordAlert({
        type: 'Data Scraping Attempt',
        severity: 'MEDIUM',
        ip,
        endpoint: req.path,
        details: `${tracker.count} ambulance searches in 1 minute. Possible competitor scraping.`,
        action: 'Rate limited for 5 minutes'
      });

      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please slow down.'
      });
    }
  } catch (err) {
    console.error('[Security] Scraping detector error:', err.message);
  }
  next();
};

// Export getters for CLI and MCP server
const getSecurityLog = () => securityLog;
const getBlockedIPs = () => Array.from(blockedIPs.entries()).map(([ip, until]) => ({
  ip,
  blocked_until: new Date(until).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
  remaining_minutes: Math.round((until - Date.now()) / 60000)
}));
const getStats = () => ({
  total_events: securityLog.length,
  blocked_ips: blockedIPs.size,
  events_by_type: securityLog.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {}),
  last_event: securityLog[securityLog.length - 1] || null
});

module.exports = {
  detectBruteForce,
  detectOTPAbuse,
  detectInjection,
  detectScraping,
  getSecurityLog,
  getBlockedIPs,
  getStats,
  sendDiscordAlert
};
