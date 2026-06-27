const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

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

// Routes
const authRoutes = require('./routes/authRoutes');
const providerRoutes = require('./routes/providerRoutes');
const ambulanceRoutes = require('./routes/ambulanceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const aiRoutes = require('./routes/aiRoutes');
const pricingWatchRoutes = require('./routes/pricingWatchRoutes');
const { runPricingAgent } = require('./controllers/pricingWatchController');

app.use('/api/auth', authRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/price-watch', pricingWatchRoutes);

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
        });
    })
    .catch(err => {
        console.error('❌ Error syncing database:', err);
    });

module.exports = app;
