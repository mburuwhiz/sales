const User = require('../models/User');
const bcrypt = require('bcrypt');
const axios = require('axios');
const whatsappService = require('../services/whatsappService');

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      verificationCode
    });

    await user.save();

    // Trigger Service B for email
    try {
      await axios.post(process.env.MAILER_MICROSERVICE_URL, {
        apiKey: process.env.MICROSERVICE_API_KEY,
        action: 'verify_email',
        recipientEmail: email,
        recipientName: name,
        variables: {
          verificationLink: `${process.env.CLIENT_URL}/verify-email?code=${verificationCode}&email=${email}`
        }
      });
    } catch (err) {
      console.error('Failed to send verification email:', err.message);
    }

    // Trigger WhatsApp via Baileys
    try {
      const message = `🌿 *FRESH HARVEST GROCERY*\n\nYour verification code is: *${verificationCode}*\n\nPlease enter this on the website to verify your phone.`;
      // Convert to international format if necessary (assuming Kenya code 254 for example, naive conversion)
      let phoneObj = phone;
      if (phoneObj.startsWith('0')) phoneObj = '254' + phoneObj.substring(1);
      if (!phoneObj.startsWith('+')) phoneObj = '+' + phoneObj;
      await whatsappService.sendMessage(phoneObj, message);
    } catch (err) {
      console.error('Failed to send WhatsApp verification:', err.message);
    }

    res.status(201).json({ message: 'Registration successful. Check email and WhatsApp for verification.', userId: user._id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyPhone = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email, verificationCode: code });

    if (!user) {
      return res.status(400).json({ message: 'Invalid code or email' });
    }

    user.isPhoneVerified = true;
    // user.verificationCode = null; // optional: keep or clear
    await user.save();

    res.status(200).json({ message: 'Phone verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyEmail = async (req, res) => {
    try {
      const { email, code } = req.query;
      const user = await User.findOne({ email, verificationCode: code });

      if (!user) {
        return res.status(400).send('Invalid code or email');
      }

      user.isEmailVerified = true;
      await user.save();

      res.redirect('/login?verified=true');
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  };

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    req.session.userId = user._id;
    req.session.role = user.role;

    res.status(200).json({ message: 'Logged in successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
