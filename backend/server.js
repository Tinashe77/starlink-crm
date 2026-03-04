require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const packageRoutes = require('./src/routes/packageRoutes');
const settingRoutes = require('./src/routes/settingRoutes');
const contractRoutes = require('./src/routes/contractRoutes');
const paymentPlanRoutes = require('./src/routes/paymentPlanRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const collectionsRoutes = require('./src/routes/collectionsRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const applicationRoutes = require('./src/routes/applicationRoutes');
const customerApplicationRoutes = require('./src/routes/customerApplicationRoutes');
const { startCollectionsAutomation } = require('./src/utils/collectionsAutomation');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({ origin: process.env.APP_URL || '*' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/payment-plans', paymentPlanRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/customer-applications', customerApplicationRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'StarConnect CRM API' }));

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      if (mongoose.connection.readyState === 1) {
        startCollectionsAutomation();
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
