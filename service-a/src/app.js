const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const mongoSanitize = require('express-mongo-sanitize');

dotenv.config();

const app = express();

// Sanitize data against NoSQL query injection
app.use(mongoSanitize());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
}));

// Connect DB
mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/freshharvest')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('DB Connection Error:', err));

// Routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');

app.use('/', indexRoutes);
app.use('/api/auth', authRoutes);
app.use('/shop', shopRoutes);
app.use('/admin', adminRoutes);

const { initCronJobs } = require('./services/cronService');
initCronJobs();

app.get('/', (req, res) => {
  res.redirect('/shop');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Service A running on port ${PORT}`);
});

module.exports = app;
