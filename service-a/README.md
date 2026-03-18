# Service A: Core E-Commerce Hub

Handles Express, EJS rendering, MongoDB schemas, @whiskeysockets/baileys for WhatsApp features, the smart cart mechanics, and user checkout processes.

## Environment Configuration Blueprint (.env)

```env
# Application Core
PORT=3000
NODE_ENV=production
CLIENT_URL=https://freshharvest.app

# Database & Security
DATABASE_URL=mongodb+srv://...

# Admin Dashboard Access
ADMIN_USERNAME=admin_freshharvest
ADMIN_PASSWORD=secure_admin_password_here

# Microservice Communication
MAILER_MICROSERVICE_URL=https://mailer.freshharvest.app/api/v1/send-email
MICROSERVICE_API_KEY=your_shared_secret_key_between_servers

# Cloudinary (Image Pipeline)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
