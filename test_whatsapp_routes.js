// Mock express app to test whatsapp route injection
const express = require('express');
const bodyParser = require('body-parser');
const whatsappRoute = require('./routes/whatsapp');
const app = express();
app.use(bodyParser.json());
// Bypass auth
app.use((req, res, next) => {
    req.user = { role: 'admin' };
    next();
});
app.use('/whatsapp', whatsappRoute);
console.log('Routes loaded successfully');
