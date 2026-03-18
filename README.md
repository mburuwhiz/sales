# 🌿 Fresh Harvest Grocery - E-Commerce Platform

A complete, production-ready e-commerce platform for organic grocery delivery with dual microservices architecture.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [WhatsApp Integration](#whatsapp-integration)
- [M-Pesa Integration](#m-pesa-integration)
- [Email Templates](#email-templates)

## 🎯 Overview

Fresh Harvest Grocery is a full-stack e-commerce solution built with:
- **Service A (Core Hub)**: Node.js + Express + EJS + MongoDB
- **Service B (Mailer Microservice)**: Express + Brevo SMTP
- **WhatsApp Engine**: @whiskeysockets/baileys
- **Payment**: M-Pesa Daraja API
- **Image Storage**: Cloudinary

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Desktop   │  │   Mobile    │  │   Admin Dashboard   │ │
│  │  (wide.png) │  │ (narrow.png)│  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVICE A (Port 3000)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Express   │  │    EJS      │  │     MongoDB         │ │
│  │   Server    │  │   Views     │  │   (Mongoose)        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   WhatsApp  │  │   M-Pesa    │  │   Cloudinary        │ │
│  │   Baileys   │  │   Daraja    │  │   Images            │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVICE B (Port 3001)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Express   │  │    EJS      │  │      Brevo          │ │
│  │   Server    │  │  Templates  │  │     SMTP/API        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Features

### Customer Features
- 🛍️ Browse products by category (Vegetables, Fruits, Cereals, Dairy & Eggs, Spices)
- 🔍 Search products with filters
- 🛒 Smart cart with localStorage persistence
- 💡 "You Might Like" upsell engine (rotates every 10 seconds)
- 📱 Responsive design with mobile hamburger menu
- 🔐 Email & WhatsApp verification
- 💳 M-Pesa STK Push payment
- 📦 Real-time order tracking
- 🪙 Loyalty coin system
- 🆘 Help/Contact form

### Admin Features
- 📊 Dashboard with statistics and charts
- 📦 Product CRUD with Cropper.js image editing
- 📋 Order management with status updates
- 📧 Email broadcast system
- 💬 WhatsApp connection management
- ⚙️ Settings (loyalty program, M-Pesa)
- 🎫 Help request management

### Technical Features
- 🎨 Glassmorphism UI with organic earth-tone theme
- 🔔 Modern toast notifications (no default alerts)
- 📱 Fixed background images (wide.png/narrow.png)
- 🔒 Secure session management with MongoDB store
- 🔄 Cron jobs for abandoned cart reminders
- 📧 Transactional emails via Brevo
- 💬 WhatsApp notifications via Baileys

## 🚀 Installation

### Prerequisites
- Node.js 16+
- MongoDB Atlas account
- Cloudinary account
- Brevo (Sendinblue) account
- M-Pesa Daraja API credentials (for production)

### Step 1: Clone and Setup

```bash
cd fresh-harvest-grocery
```

### Step 2: Install Dependencies

```bash
# Service A
cd service-a
npm install

# Service B
cd ../service-b
npm install
```

### Step 3: Environment Configuration

Copy `.env.example` to `.env` in both services and fill in your credentials:

**Service A (.env):**
```env
PORT=3000
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
DATABASE_URL=mongodb+srv://...
SESSION_SECRET=your_secret_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_password
MAILER_MICROSERVICE_URL=http://localhost:3001/api/v1/send-email
MICROSERVICE_API_KEY=shared_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=your_shortcode
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
```

**Service B (.env):**
```env
PORT=3001
MICROSERVICE_API_KEY=shared_secret_key
BREVO_API_KEY=your_brevo_key
BREVO_SENDER_EMAIL=orders@freshharvest.app
BREVO_SENDER_NAME=FRESH HARVEST
BREVO_REPLY_TO=admin@freshharvest.app
```

### Step 4: Add Background Images

Place your background images in:
- `service-a/public/images/wide.png` (desktop)
- `service-a/public/images/narrow.png` (mobile)

### Step 5: Add Logo and Favicon

Place in `service-a/public/`:
- `logo.png` - Your store logo
- `favicon.ico` - Browser favicon

### Step 6: Start Services

```bash
# Terminal 1 - Service A
cd service-a
npm start

# Terminal 2 - Service B
cd service-b
npm start
```

## ⚙️ Configuration

### WhatsApp Setup

1. Go to `/admin/settings/whatsapp`
2. Click "Connect"
3. Scan the QR code with WhatsApp on your phone
4. You'll receive a confirmation message

### M-Pesa Setup (Production)

1. Register for Daraja API at https://developer.safaricom.co.ke
2. Get your consumer key, secret, and passkey
3. Configure callback URL (must be HTTPS)
4. Update `.env` with credentials

### Cloudinary Setup

1. Create account at https://cloudinary.com
2. Get your cloud name, API key, and secret
3. Update `.env` with credentials

### Brevo Setup

1. Create account at https://www.brevo.com
2. Generate API key
3. Verify sender domain
4. Update `.env` with credentials

## 📖 Usage

### Customer Flow

1. **Browse**: Visit homepage or `/shop` to browse products
2. **Add to Cart**: Click products to view details and add to cart
3. **Checkout**: Go to `/checkout` (requires login + verification)
4. **Payment**: Pay via M-Pesa STK Push or manual payment
5. **Track**: Use `/track/:orderId` to track order status

### Admin Flow

1. **Login**: Go to `/admin/login`
2. **Dashboard**: View statistics and recent orders
3. **Products**: Add/edit products with image cropping
4. **Orders**: Update order status (triggers WhatsApp notifications)
5. **Emails**: Send broadcast emails to customers
6. **WhatsApp**: Manage WhatsApp connection

## 📚 API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User login |
| `/auth/register` | POST | User registration |
| `/auth/verify-email` | GET | Email verification |
| `/auth/verify-phone` | POST | Phone verification |

### Products

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/shop` | GET | List products |
| `/shop/product/:id` | GET | Get product details |
| `/shop/api/all` | GET | Get all products (for cart) |

### Cart

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/cart` | GET | Get cart contents |
| `/cart/add` | POST | Add item to cart |
| `/cart/update` | PUT | Update quantity |
| `/cart/remove/:id` | DELETE | Remove item |
| `/cart/sync` | POST | Sync localStorage cart |

### Checkout

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/checkout` | GET | Checkout page |
| `/checkout/process` | POST | Process payment |
| `/checkout/confirm-manual` | POST | Confirm manual payment |

### M-Pesa

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mpesa/callback` | POST | M-Pesa callback |
| `/api/mpesa/query/:id` | GET | Query payment status |

### WhatsApp

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/whatsapp/status` | GET | Get connection status |
| `/api/whatsapp/connect` | POST | Connect WhatsApp |
| `/api/whatsapp/disconnect` | POST | Disconnect WhatsApp |
| `/api/whatsapp/send-test` | POST | Send test message |

### Admin

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/login` | POST | Admin login |
| `/admin/products` | GET/POST | Product management |
| `/admin/orders` | GET | Order list |
| `/admin/orders/:id` | GET | Order detail |
| `/admin/orders/:id/update-status` | POST | Update order status |
| `/admin/settings` | GET/POST | Settings |
| `/admin/emails/broadcast` | POST | Send broadcast email |

## 💬 WhatsApp Integration

WhatsApp notifications use the following format:

```
*FRESH HARVEST*

Your message here

_Details wrapped in underscores_
`Codes wrapped in backticks`

[Link to tracking page]
```

### Notification Types

1. **Order Confirmation**: Sent to admin when new order received
2. **Tracking Updates**: Sent to customer when status changes
3. **Verification Codes**: 6-digit codes for phone verification

## 💳 M-Pesa Integration

### STK Push Flow

1. Customer clicks "Pay with M-Pesa"
2. System initiates STK Push to customer's phone
3. Customer enters PIN on phone
4. M-Pesa sends callback to server
5. Order status updated to "Pending"
6. Admin receives WhatsApp notification

### Manual Payment (Fallback)

If STK Push fails, customers can:
1. Pay manually to displayed number
2. Enter M-Pesa confirmation code
3. Order is marked for manual verification

## 📧 Email Templates

Service B includes the following email templates:

1. **welcome.ejs** - New user registration
2. **receipt.ejs** - Order confirmation
3. **tracking.ejs** - Order status updates
4. **whatsapp-alert.ejs** - WhatsApp disconnection alert
5. **abandoned-cart.ejs** - Cart abandonment reminder

## 🎨 Customization

### Colors

Edit CSS variables in `views/partials/head.ejs`:

```css
:root {
  --forest-green: #1a3d1c;
  --moss-green: #2d5a27;
  --sage-green: #7a9e7e;
  --earth-brown: #4a3728;
  --cream: #f5f0e8;
}
```

### Loyalty Program

Configure in Admin → Settings:
- Minimum purchase for coins
- Coins awarded per purchase
- Minimum coins to redeem
- Coin value (KSH per coin)

## 🔒 Security

- All passwords hashed with bcrypt
- Sessions stored in MongoDB
- API key protection for microservices
- CORS configured for Service B
- Input validation on all forms

## 🐛 Troubleshooting

### WhatsApp Not Connecting
- Check if session exists in MongoDB
- Delete session and reconnect
- Ensure phone has internet

### M-Pesa Callback Not Working
- Verify callback URL is HTTPS
- Check if URL is accessible
- Review server logs

### Emails Not Sending
- Verify Brevo API key
- Check sender domain verification
- Review Service B logs

## 📄 License

MIT License - Feel free to use for commercial projects.

## 🙏 Support

For support, email admin@freshharvest.app or WhatsApp 0113 323 234.

---

Built with ❤️ by Fresh Harvest Grocery Team
