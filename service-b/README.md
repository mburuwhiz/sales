# Service B: Mailer Microservice

Handles Brevo SMTP and HTML email generation. Accepts raw HTML for admin broadcasting campaigns.

## Environment Configuration Blueprint (.env)

```env
PORT=5000
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=a4ded8001@smtp-brevo.com
BREVO_SMTP_PASS=xsmtpsib-a4f6ab8a198..........3a2-KBNuTpx6HBe2HHw2
MAILER_API_KEY=superemailsender2trdr
DEFAULT_FROM_EMAIL="ewebb@whizpoint.app"
DEFAULT_FROM_NAME="EWEBB CYBER"
REPLY_TO_EMAIL="ewebb@whizpoint.app"
BASE_WEBSITE_URL="http://localhost:5173"
```
