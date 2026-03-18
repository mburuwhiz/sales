function formatNotification(type, data) {
  let message = '';
  switch (type) {
    case 'verification':
      message = `🌿 *FRESH HARVEST GROCERY*\n\nYour verification code is: *${data.code}*\n\nPlease enter this on the website to verify your phone.`;
      break;
    case 'order_placed':
      message = `🚨 *NEW ORDER RECEIVED*\n\nAmount: KSH ${data.amount}\nCustomer: ${data.customerName}\n\nPlease approve within 3 minutes.\n\nOrder ID: \`${data.orderId}\``;
      break;
    case 'order_update':
      message = `📦 *ORDER UPDATE*\n\nStatus: _${data.status}_\nNote: ${data.note}\n\nClick here to track: ${data.trackingLink}\n\nOrder ID: \`${data.orderId}\``;
      break;
    default:
      message = `🌿 *FRESH HARVEST*\n\nNotification: ${data.message}`;
  }
  return message;
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Ensure the module works in both Node (for formatting) and Browser (for toasts)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { formatNotification };
} else {
  window.formatNotification = formatNotification;
  window.showToast = showToast;
}
