ENSURE YOU ADRESS ALL THESE PARTS

logo.png, favicon.ico, wide.png and narrow.png are in public/images

🌿 FRESH HARVEST GROCERY: THE ULTIMATE TECHNICAL SPECIFICATION

BRAND & VISUAL IDENTITY Website Name: FRESH HARVEST GROCERY. Email Sender Name: FRESH HARVEST. Favicon : favicon.ico (on root) Logo: logo.png (on root)

Color Palette: Organic Earth-Tone Greenish Theme. Not high-contrast neon; instead, deep forest greens, moss, and rich browns.

Background Architecture: * Desktop: Fixed wide.png background.

Mobile: Fixed narrow.png background.

UI Containers: All cards, menus, and modals use Glassmorphism (semi-transparent dark green/black overlays with backdrop-filter: blur(10px) and subtle borders) to ensure 100% text readability against realistic backgrounds.

Responsiveness: Full mobile-first design. Desktop sidebar categories collapse into a Native Hamburger Menu on mobile.

SYSTEM ARCHITECTURE & MICROSERVICES Service A: The Core Hub (Node.js + Express + EJS) Houses the database connection, user sessions, WhatsApp client, and Admin Dashboard. WhatsApp Engine: Uses @whiskeysockets/baileys.

Session Storage: Session data is stored in the MongoDB whatsapp_sessions collection, not locally, ensuring persistence across server restarts or deployments.

Admin Linking: Admin scans QR on /admin/settings/whatsapp. Upon success, the system sends a "Message Yourself" notification to the admin: ✅ FRESH HARVEST SERVER CONNECTED.

Service B: The Mailer Microservice (Express + Brevo SMTP) Standalone service. Holds all hardcoded transactional HTML templates (Welcome, Verification, Order Receipt, Tracking Update).

Security: Only accepts requests from Service A via an API_KEY header.

Flexibility: Includes a /broadcast endpoint where the Admin can POST a complete, raw HTML string (for custom offers/discounts) which the microservice then fires via Brevo.

DATABASE (MONGODB) & SCHEMA DESIGN Users: _id, name, email, password (bcrypt), phone, isEmailVerified, isPhoneVerified, walletCoins, role (user/admin). Products: _id, name, category (Vegetables, Fruits, Cereals, Dairy & Eggs, Spices), price (KSH), stockQty, description, images (Cloudinary URLs).

Orders:

userId, items (Array), totalAmount, status (Pending/Approved/Packing/En-Route/Delivered).

deliveryData: { landmark, building, receiverPhone, coords }.

mpesaData: { receiptCode, transactionDate, amount }.

trackingTimeline: [{ status: String, time: Date, note: String, updatedBy: 'Admin' }].

Need Help: _id, userId, subject, message, status (Open/Closed).

AUTHENTICATION & VERIFICATION FLOW Registration: User signs up on /register. Email Verification: Service A pings Service B. Service B sends an ultra-modern HTML email with a unique verification link.

WhatsApp Verification: Service A sends a WhatsApp message via Baileys.

Message Format: 🌿 FRESH HARVEST GROCERY \n\n Your verification code is: 123456 \n\n Please enter this on the website to verify your phone.

CTA Button: The WhatsApp message includes a List Button or URL Button (if the WhatsApp API version allows) pointing to the verification page.

Security: Users cannot access the Checkout page until both isEmailVerified and isPhoneVerified are true.

THE SHOPPING & CHECKOUT EXPERIENCE Product Grid: Clicking a product opens a Popup Modal. It shows multiple images (Cloudinary), detailed description, and a quantity selector. Smart Cart: A side-drawer popup. Bottom section features "You Might Like": Every 10 seconds, it randomly selects a product not currently in the cart and displays it as a "Quick Add" suggestion.

The Checkout Page:

User selects location via Map or Landmark typing.

User inputs receiving person’s phone.

The M-Pesa Trigger: User clicks "Confirm & Pay". The system triggers an STK Push.

Fallback/Manual: If STK fails, the UI shows: Please Pay to 0113 323 234 (Peter Wekulo) and paste the confirmation message below.

Order Confirmation: Once paid, the system verifies the callback and updates the database.

ADMIN DASHBOARD & ORDER MANAGEMENT The 3-Minute Window: Once a user pays, the Admin receives an Immediate WhatsApp Alert: 🚨 NEW ORDER RECEIVED \n\n Amount: KSH 1500 \n Customer: John Doe \n\n Please approve within 3 minutes. Manual Tracking Updates: Admin goes to /admin/orders/:id.

They can select status (e.g., "Left Packing Station").

They type a custom note (e.g., "Rider: David, Bike: KMC 123").

The Pulse: This action triggers a WhatsApp to the user: 📦 ORDER UPDATE \n\n Status: Left Packing Station \n Note: Rider: David, Bike: KMC 123 \n\n Click here to track: [LINK].

Product Management: Admin uploads images. A Cropper.js tool allows them to crop and position perfectly before the Base64 data is sent to Cloudinary.

NOTIFICATION FORMATTING & LOGIC All system notifications sent via WhatsApp must follow these strict formatting rules: Headers: Wrapped in * (e.g., FRESH HARVEST).

Status/Timestamps: Wrapped in _ (e.g., Updated at 2:00 PM).

Codes/IDs/Rider Details: Wrapped in (e.g., ORDER-12345 `).

Buttons: Every notification message includes a link to the unique tracking page (/track/:orderId) or the account profile.

ROUTE ARCHITECTURE Public Routes GET / - Home Shop GET /login - User Login

GET /register - User Registration

GET /track/:id - Unique Tracking Page (Dynamic Sugesstions on sidebar)

Admin Routes (Auth-Protected) GET /admin/login - Admin Login (Separate from User)

GET /admin - Main Dashboard

GET /admin/products - CRUD Product with Cloudinary + Cropper.js

GET /admin/orders - Order Approval & Tracking Timeline Updates

GET /admin/emails - Paste RAW HTML for broadcast campaigns

GET /admin/settings/whatsapp - Baileys QR Scan & Link Session

LOYALTY & REWARDS Coin Logic: Admin sets a "Minimum Purchase" (e.g., KSH 2000). Redemption: If a purchase exceeds this, the user earns X coins (set by admin).

Redeeming: On checkout, if user coins > Admin set threshold, a "Redeem for Discount" button appears.

THE SMART CART MECHANICS & "YOU MIGHT LIKE" ENGINE The cart must function without reloading the page, maintaining state, and actively upselling the user. Cart State Management: * The cart lives in the user's Browser Local Storage (localStorage.getItem('whizpoint_cart')). This ensures the cart persists even if they close the tab before logging in.

When the user logs in or proceeds to /checkout, the Local Storage cart is parsed and synced with the Express Session/MongoDB.

The UI (EJS Partial - /views/partials/cart-drawer.ejs):

It is a fixed-position right-side drawer (transform: translateX(100%) hidden, translateX(0) visible).

Contains an array of items with + and - buttons. Clicking these triggers a frontend JS function that updates the quantity in Local Storage and instantly recalculates the Subtotal.

The "You Might Like" Algorithm (Upsell):

The Logic: On page load, the server passes an array of all available products to the frontend window object (e.g., window.allProducts).

The Filter: A JavaScript function filters out any product IDs currently in the whizpoint_cart.

The Rotator: A setInterval(updateUpsell, 10000) runs in the background. Every 10 seconds, it randomly selects one item from the filtered list, applies a fade-out/fade-in CSS transition, and updates the Upsell Card's image, name, and price at the bottom of the cart.

ADMIN IMAGE PIPELINE: CROPPER.JS TO CLOUDINARY You demanded 100% control over the product images to maintain the "greenish, realistic" aesthetic. Here is the exact data flow to prevent admins from uploading distorted or massive images. Step 1: The Admin Upload (Frontend):

Admin navigates to /admin/products/add.

Admin clicks an .

Instead of uploading immediately, a FileReader loads the image onto a hidden

Step 2: Cropper.js Execution:

The modal initializes new Cropper(imageElement, { aspectRatio: 1 / 1, viewMode: 1 }).

This forces the admin to crop the image to a perfect square (so the frontend UI grid never breaks).

Step 3: Base64 Conversion & Transmission:

Admin clicks "Save Crop".

Frontend JS runs cropper.getCroppedCanvas({ width: 800, height: 800 }).toDataURL('image/jpeg', 0.8).

This generates an optimized Base64 string. The string is added to the hidden form payload along with the Title, Price, and Category, and POSTed to the Express server.

Step 4: Cloudinary Upload (Backend POST /admin/products/add):

Node.js receives the Base64 string.

Executes: cloudinary.uploader.upload(req.body.imageBase64, { folder: "fresh_harvest/products" }).

Cloudinary returns a secure URL (e.g., https://res.cloudinary.com/.../kale.jpg).

Express saves this URL to the images array in the MongoDB Product document.

THE MAILER MICROSERVICE (SERVICE B) DEEP DIVE This is how your secondary server actually handles the emails without bogging down the main e-commerce server. The Infrastructure: It is a separate Express app running on a different port or host (e.g., https://mailer.freshharvest.app).

The Automated Templates (Stored in Service B):

Service B contains its own /views/emails/ folder containing EJS templates for welcome.ejs, receipt.ejs, and tracking.ejs.

These templates are styled with ultra-modern inline CSS, featuring the FRESH HARVEST logo, dark-green button accents, and neat typography.

The API Handshake:

When an order is approved, Service A (Main App) makes an Axios request:

JSON POST /api/v1/send-email { "apiKey": "YOUR_SECRET_MICROSERVICE_KEY", "action": "order_approved", "recipientEmail": "user@gmail.com", "recipientName": "John Doe", "variables": { "orderId": "ORD-123", "amount": "KSH 1500", "trackingLink": "https://freshharvest.app/track/ORD-123" } } Service B Execution:

Service B verifies the apiKey.

It uses ejs.renderFile('views/emails/receipt.ejs', req.body.variables) to inject the dynamic data into the beautiful HTML.

It passes the final compiled HTML string to the Brevo Node.js SDK (SibApiV3Sdk.TransactionalEmailsApi()).

Brevo sends the email with sender: { name: "FRESH HARVEST", email: "orders@freshharvest.app" } and replyTo: { email: "admin@freshharvest.app" }.

The Manual Broadcast (Admin Upload):

If req.body.action === "custom_broadcast", Service B bypasses its local EJS templates.

Instead, it takes the raw HTML string the Admin pasted into the dashboard (req.body.rawHtml), wraps it in the Brevo SDK, and fires it to the provided email list.

WhatsApp Disconnect: WhatsApp periodically forces web sessions to log out for security.

Logic: The system catches the connection.update event in Baileys looking for statusCode === 401.

Action: Service A immediately falls back to Service B (Mailer) to send an urgent email to the Admin: "URGENT: WhatsApp Session Disconnected. Please log into the dashboard and re-scan the QR code."

Abandoned Carts (Automated Cron Job):

Logic: A node-cron task runs every 12 hours. It looks for orders with status: "Pending Payment" older than 2 hours.

Action: Triggers Service B to send a "Did you forget something?" email template with a link back to their cart.

SECURITY MIDDLEWARE ARCHITECTURE Every route must be protected by strict Express middleware to prevent unauthorized access. isUser() Middleware: Checks the session. If no session exists, redirects to /login. Applies to /checkout and /account.

isAdmin() Middleware: Checks if req.session.role === 'admin'. If not, destroys the session and redirects to /admin/login. Applies to all /admin/* routes.

verifyMicroservice() Middleware: Only lives on Service B. Checks if req.body.apiKey === process.env.MICROSERVICE_API_KEY. If it doesn't match, it returns HTTP 401 Unauthorized and drops the request to prevent spam bots from using your Brevo account.

All the notifications in the system to be mordern, like perfect toast notofications or popup htmls and no default notification to be seen,

