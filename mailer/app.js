const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// View Engine for EJS templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/api/v1', require('./routes/email'));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Fresh Harvest Mailer' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Service B Error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Service B (Mailer Microservice) running on port ${PORT}`);
});

module.exports = app;
