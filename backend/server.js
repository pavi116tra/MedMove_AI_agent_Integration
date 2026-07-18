if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');

const app = express();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Security Middleware & Routes
const {
  detectBruteForce,
  detectOTPAbuse,
  detectInjection,
  detectScraping
} = require('./middleware/securityGuard');
const securityRoutes = require('./routes/securityRoutes');

// Apply injection detection to ALL routes
app.use(detectInjection);

// Apply scraping detection to ambulance search only
app.use('/api/ambulances/search', detectScraping);

// Health Check Route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'MedMove API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const providerRoutes = require('./routes/providerRoutes');
const ambulanceRoutes = require('./routes/ambulanceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const aiRoutes = require('./routes/aiRoutes');
const pricingWatchRoutes = require('./routes/pricingWatchRoutes');
const recurringTripRoutes = require('./routes/recurringTripRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const { runPricingAgent } = require('./controllers/pricingWatchController');
const { runRecurringAgent } = require('./controllers/recurringTripController');
const { runReminderAgent } = require('./controllers/reminderController');

app.use('/api/auth', authRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/price-watch', pricingWatchRoutes);
app.use('/api/recurring-suggestions', recurringTripRoutes);
app.use('/api/notifications', notificationRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('MedMove Backend API is running...');
});

const PORT = process.env.PORT || 5000;

// Sync database and start server
sequelize.sync({ alter: true })
    .then(() => {
        console.log('✅ Database synced successfully');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
            console.log(`📡 Network access on http://0.0.0.0:${PORT}`);
            
            // Start Dynamic Pricing Watch Agent (Runs on startup after 5s and every 60 minutes)
            setTimeout(runPricingAgent, 5000);
            setInterval(runPricingAgent, 60 * 60 * 1000);

            // Import cron for daily scheduling of Recurring Agent
            const cron = require('node-cron');

            // Start Recurring Trip Agent (runs daily at 6 AM)
            cron.schedule('0 6 * * *', () => {
                console.log('⏰ [Cron] Running Recurring Trip Agent daily at 6 AM...');
                runRecurringAgent().catch(err => console.error('Recurring trip agent error:', err));
            });

            // Start Reminder Agent (runs every 15 minutes)
            setInterval(() => {
                console.log('⏰ [Interval] Running Reminder Agent...');
                runReminderAgent().catch(err => console.error('Reminder agent error:', err));
            }, 15 * 60 * 1000);

            // Fast startup runs for verification/demo purposes
            setTimeout(() => {
                console.log('🤖 [Startup] Triggering Reminder Agent check...');
                runReminderAgent().catch(err => console.error('Startup reminder agent error:', err));
            }, 8000);

            setTimeout(() => {
                console.log('🤖 [Startup] Triggering Recurring Trip Agent check...');
                runRecurringAgent().catch(err => console.error('Startup recurring agent error:', err));
            }, 12000);
        });
    })
    .catch(err => {
        console.error('❌ Error syncing database:', err);
    });

module.exports = app;
