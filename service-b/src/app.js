const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const mailerRoutes = require('./routes/mailer');
app.use('/api/v1', mailerRoutes);

app.get('/', (req, res) => {
  res.send('Service B Running');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Service B running on port ${PORT}`);
});

module.exports = app;
