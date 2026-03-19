const fs = require('fs');
let content = fs.readFileSync('views/admin/whatsapp-settings.ejs', 'utf8');

// Replace connect and disconnect buttons with external session ID input
const searchButtons = `        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button onclick="connectWhatsApp()" class="btn btn-primary">
            <i class="fas fa-plug"></i> Connect
          </button>
          <button onclick="disconnectWhatsApp()" class="btn btn-secondary">
            <i class="fas fa-unlink"></i> Disconnect
          </button>
          <button onclick="checkStatus()" class="btn btn-secondary">
            <i class="fas fa-sync"></i> Refresh
          </button>
        </div>`;

const replaceButtons = `        <div style="margin-bottom: 20px;">
          <label class="form-label" style="display: block; margin-bottom: 8px;">Connect via External Session ID (e.g., SUHAIL_11_12...)</label>
          <input type="text" id="sessionIdInput" class="form-input" placeholder="Paste SUHAIL session ID here" style="margin-bottom: 12px; width: 100%; font-family: monospace; font-size: 12px;">

          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button onclick="connectWhatsApp()" class="btn btn-primary">
              <i class="fas fa-plug"></i> Connect with Session ID
            </button>
            <button onclick="disconnectWhatsApp()" class="btn btn-secondary">
              <i class="fas fa-unlink"></i> Disconnect
            </button>
            <button onclick="checkStatus()" class="btn btn-secondary">
              <i class="fas fa-sync"></i> Refresh
            </button>
          </div>
        </div>`;

content = content.replace(searchButtons, replaceButtons);

// Update connectWhatsApp function to send the session ID
const searchConnectFunc = `    async function connectWhatsApp() {
      try {
        const response = await fetch('/api/whatsapp/connect', { method: 'POST' });`;

const replaceConnectFunc = `    async function connectWhatsApp() {
      try {
        const sessionId = document.getElementById('sessionIdInput').value.trim();
        if (!sessionId) {
          showToast('Please enter a session ID first', 'error');
          return;
        }

        showToast('Connecting with external session ID...', 'info');

        const response = await fetch('/api/whatsapp/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ externalSessionId: sessionId })
        });`;

content = content.replace(searchConnectFunc, replaceConnectFunc);

fs.writeFileSync('views/admin/whatsapp-settings.ejs', content);
console.log('patched views/admin/whatsapp-settings.ejs');
