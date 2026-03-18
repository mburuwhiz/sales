# Service B: Mailer Microservice

Handles Brevo SMTP and HTML email generation. Accepts raw HTML for admin broadcasting campaigns.

## Environment Configuration Blueprint (.env)

```env
# Application Core
PORT=4000
NODE_ENV=production

# Microservice Security
MICROSERVICE_API_KEY=your_shared_secret_key_between_servers

# Brevo SMTP Configuration
BREVO_API_KEY=your_brevo_api_key
```
