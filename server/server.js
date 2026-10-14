require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Initialize MongoDB connection
connectDB();

const app = express();

// Security & Parsing middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true }));

// Liveness probe
app.get('/api/ping', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'SecureVault REST API'
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/credentials', require('./routes/credentialRoutes'));
app.use('/api/health', require('./routes/healthRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Serve client build in production
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
  });
}

// 404 Handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[SecureVault API] Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

module.exports = app;
