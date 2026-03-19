document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  startUpsellRotator();
});

let currentUpsellProduct = null;

function getCart() {
  const cart = localStorage.getItem('whizpoint_cart');
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem('whizpoint_cart', JSON.stringify(cart));
  renderCart();
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart(cart);
  if(window.showToast) window.showToast(`${product.name} added to cart!`);
}

function updateQuantity(productId, delta) {
  let cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }

  saveCart(cart);
}

function renderCart() {
  const cart = getCart();
  const container = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('cart-subtotal');

  if (!container || !subtotalEl) return;

  container.innerHTML = '';
  let subtotal = 0;

  cart.forEach(item => {
    subtotal += item.price * item.quantity;

    const div = document.createElement('div');
    div.innerHTML = `
      <p>${item.name} - KSH ${item.price}</p>
      <button onclick="updateQuantity('${item.id}', -1)">-</button>
      <span>${item.quantity}</span>
      <button onclick="updateQuantity('${item.id}', 1)">+</button>
    `;
    container.appendChild(div);
  });

  subtotalEl.textContent = subtotal;
}

function startUpsellRotator() {
  if (!window.allProducts) return;

  updateUpsell();
  setInterval(updateUpsell, 10000);
}

function updateUpsell() {
  const cart = getCart();
  const cartIds = cart.map(item => item.id);

  const available = window.allProducts.filter(p => !cartIds.includes(p._id));

  if (available.length === 0) {
    document.getElementById('upsell-card').style.display = 'none';
    return;
  }

  const randomProduct = available[Math.floor(Math.random() * available.length)];
  currentUpsellProduct = randomProduct;

  const card = document.getElementById('upsell-card');
  card.style.opacity = 0;

  setTimeout(() => {
    document.getElementById('upsell-img').src = randomProduct.images[0] || '/logo.png';
    document.getElementById('upsell-name').textContent = randomProduct.name;
    document.getElementById('upsell-price').textContent = `KSH ${randomProduct.price}`;

    card.style.opacity = 1;
  }, 500);
}

function addUpsellToCart() {
  if (currentUpsellProduct) {
    addToCart({
      id: currentUpsellProduct._id,
      name: currentUpsellProduct.name,
      price: currentUpsellProduct.price
    });
    updateUpsell(); // Instantly show a new upsell
  }
}

function proceedToCheckout() {
  window.location.href = '/shop/checkout'; // The checkout route is mounted under /shop
}

function toggleCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  if (drawer.style.transform === 'translateX(100%)') {
    drawer.style.transform = 'translateX(0)';
  } else {
    drawer.style.transform = 'translateX(100%)';
  }
}
