# Fresh Harvest Grocery

This is the repository for the Fresh Harvest Grocery platform.
It consists of two microservices:
- **Service A:** The main e-commerce server (Node.js/Express) connected to MongoDB. Handles user auth, the shopping experience, the admin dashboard, and WhatsApp notifications (using @whiskeysockets/baileys).
- **Service B:** The mailer microservice. Handles sending promotional and transactional emails via Brevo SMTP.

Both run concurrently to provide a seamless, modern web experience with WhatsApp order updates and robust UI styling.
