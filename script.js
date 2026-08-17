// ============================================================
// 1. FIREBASE CONFIG (À REMPLACER)
// ============================================================
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ============================================================
// 2. DONNÉES MOCKÉES (bijouterie)
// ============================================================
const MOCK_PRODUCTS = [
  { id: 'mock1', name: 'Luna Earrings', price: 199.00, image: 'https://picsum.photos/seed/earrings/400/400', description: '18K Gold' },
  { id: 'mock2', name: 'Celestial Necklace', price: 299.00, image: 'https://picsum.photos/seed/necklace/400/400', description: '18K Gold' },
  { id: 'mock3', name: 'Sol Ring', price: 159.00, image: 'https://picsum.photos/seed/ring/400/400', description: '14K Gold' },
  { id: 'mock4', name: 'Stellar Bracelet', price: 249.00, image: 'https://picsum.photos/seed/bracelet/400/400', description: 'Silver Plated' },
  { id: 'mock5', name: 'Aurora Pendant', price: 189.00, image: 'https://picsum.photos/seed/pendant/400/400', description: '18K Gold' },
  { id: 'mock6', name: 'Nova Cuff', price: 219.00, image: 'https://picsum.photos/seed/cuff/400/400', description: 'Silver Plated' },
  { id: 'mock7', name: 'Eclipse Hoops', price: 179.00, image: 'https://picsum.photos/seed/hoops/400/400', description: '14K Gold' },
  { id: 'mock8', name: 'Comet Chain', price: 259.00, image: 'https://picsum.photos/seed/chain/400/400', description: '18K Gold' }
];

// ============================================================
// 3. DOM (identique à la version précédente)
// ============================================================
// Menu latéral
const menuToggle = document.getElementById('menuToggle');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const menuOverlay = document.getElementById('menuOverlay');
const sideMenu = document.getElementById('sideMenu');

// Navigation
const views = document.querySelectorAll('.view');
const navLinks = document.querySelectorAll('[data-view]');
const sideMenuLinks = document.querySelectorAll('.side-menu-links a');
const categoryItems = document.querySelectorAll('.category-item');

// Auth
const authButtons = document.getElementById('authButtons');
const userMenu = document.getElementById('userMenu');
const userNameDisplay = document.getElementById('userNameDisplay');
const userAvatar = document.getElementById('userAvatar');
const dropdownMenu = document.getElementById('dropdownMenu');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const logoutBtnProfile = document.getElementById('logoutBtnProfile');
const profileEmail = document.getElementById('profileEmail');
const profileUid = document.getElementById('profileUid');

// Produits
const bestSellersGrid = document.getElementById('bestSellersGrid');
const newArrivalsGrid = document.getElementById('newArrivalsGrid');
const allProductsGrid = document.getElementById('allProductsGrid');

// Panier
const cartBadge = document.getElementById('cartBadge');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartItems = document.getElementById('cartItems');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');

// Formulaires
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');

// ============================================================
// 4. MENU LATÉRAL
// ============================================================
function openMenu() {
  sideMenu.classList.add('open');
  menuOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeMenu() {
  sideMenu.classList.remove('open');
  menuOverlay.classList.remove('active');
  document.body.style.overflow = '';
}
menuToggle.addEventListener('click', openMenu);
closeMenuBtn.addEventListener('click', closeMenu);
menuOverlay.addEventListener('click', closeMenu);

sideMenuLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const view = link.dataset.view;
    if (view === 'profile' && !auth.currentUser) {
      showView('login');
    } else {
      showView(view);
    }
    closeMenu();
  });
});

// Catégories (filtrage simulé)
categoryItems.forEach(item => {
  item.addEventListener('click', () => {
    const cat = item.dataset.category;
    showView('products');
    // On filtre les produits affichés (si déjà chargés)
    const allProducts = document.querySelectorAll('#allProductsGrid .product-card');
    allProducts.forEach(card => {
      const desc = card.querySelector('.product-desc')?.textContent || '';
      if (desc.toLowerCase().includes(cat.toLowerCase()) || cat === 'Tous') {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
    closeMenu();
  });
});

// ============================================================
// 5. AUTH
// ============================================================
auth.onAuthStateChanged(user => {
  if (user) {
    authButtons.style.display = 'none';
    userMenu.style.display = 'flex';
    userNameDisplay.textContent = user.displayName || user.email?.split('@')[0] || 'Utilisateur';
    profileEmail.textContent = user.email || '—';
    profileUid.textContent = user.uid || '—';
    const activeView = document.querySelector('.view.active');
    if (activeView && ['view-login', 'view-register'].includes(activeView.id)) {
      showView('home');
    }
  } else {
    authButtons.style.display = 'flex';
    userMenu.style.display = 'none';
    const activeView = document.querySelector('.view.active');
    if (activeView && activeView.id === 'view-profile') {
      showView('home');
    }
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  try {
    await auth.signInWithEmailAndPassword(email, password);
    loginError.textContent = '';
    loginForm.reset();
    showView('home');
  } catch (err) {
    loginError.textContent = err.message;
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  try {
    await auth.createUserWithEmailAndPassword(email, password);
    registerError.textContent = '';
    registerForm.reset();
    showView('home');
  } catch (err) {
    registerError.textContent = err.message;
  }
});

logoutBtn.addEventListener('click', () => {
  auth.signOut();
  dropdownMenu.classList.remove('open');
});
logoutBtnProfile.addEventListener('click', () => {
  auth.signOut();
});

userAvatar.addEventListener('click', (e) => {
  e.stopPropagation();
  dropdownMenu.classList.toggle('open');
});
document.addEventListener('click', () => {
  dropdownMenu.classList.remove('open');
});

// ============================================================
// 6. NAVIGATION SPA
// ============================================================
function showView(viewId) {
  views.forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${viewId}`);
  if (target) target.classList.add('active');
  document.querySelectorAll('[data-view]').forEach(link => {
    link.classList.toggle('active', link.dataset.view === viewId);
  });
  if ((viewId === 'login' || viewId === 'register') && auth.currentUser) {
    showView('home');
  }
  if (viewId === 'profile' && !auth.currentUser) {
    showView('login');
  }
}

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const view = link.dataset.view;
    if (view === 'profile' && !auth.currentUser) {
      showView('login');
      return;
    }
    showView(view);
  });
});

document.getElementById('logoLink').addEventListener('click', () => showView('home'));
loginBtn.addEventListener('click', () => showView('login'));
registerBtn.addEventListener('click', () => showView('register'));

// ============================================================
// 7. PANIER
// ============================================================
let cart = [];

function loadCart() {
  const stored = localStorage.getItem('luna_cart');
  cart = stored ? JSON.parse(stored) : [];
  updateCartUI();
}
function saveCart() {
  localStorage.setItem('luna_cart', JSON.stringify(cart));
  updateCartUI();
}

function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart();
  cartBadge.style.transform = 'scale(1.3)';
  setTimeout(() => cartBadge.style.transform = 'scale(1)', 200);
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  renderCartItems();
}

function updateCartUI() {
  const total = cart.reduce((acc, item) => acc + item.quantity, 0);
  cartBadge.textContent = total;
  renderCartItems();
}

function renderCartItems() {
  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="empty-cart-msg">Votre panier est vide.</p>`;
    cartTotalPrice.textContent = '0.00 €';
    return;
  }
  let html = '';
  let total = 0;
  cart.forEach(item => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    html += `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" />
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <p>${item.quantity} × ${item.price.toFixed(2)} €</p>
        </div>
        <button class="cart-item-remove" data-id="${item.id}">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;
  });
  cartItems.innerHTML = html;
  cartTotalPrice.textContent = total.toFixed(2) + ' €';
  document.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
  });
}

function openCart() {
  cartSidebar.classList.add('open');
  cartOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  cartSidebar.classList.remove('open');
  cartOverlay.classList.remove('active');
  document.body.style.overflow = '';
}
openCartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// ============================================================
// 8. PRODUITS (Firestore + fallback)
// ============================================================
function renderProducts(container, products) {
  if (!products || products.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:30px; color:var(--mid-gray);">Aucun produit disponible.</div>`;
    return;
  }
  let html = '';
  products.forEach(p => {
    const name = p.name || 'Sans nom';
    const price = p.price || 0;
    const image = p.image || `https://picsum.photos/seed/${p.id}/400/400`;
    const desc = p.description || '';
    html += `
      <div class="product-card">
        <img src="${image}" alt="${name}" class="product-image" loading="lazy" />
        <div class="product-info">
          <h3 class="product-name">${name}</h3>
          ${desc ? `<p class="product-desc">${desc}</p>` : ''}
          <p class="product-price">${price.toFixed(2)} €</p>
          <button class="add-to-cart" data-id="${p.id}" data-name="${name}" data-price="${price}" data-image="${image}">
            Ajouter au panier
          </button>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
  container.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      addToCart({
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: parseFloat(btn.dataset.price),
        image: btn.dataset.image
      });
    });
  });
}

function displayProducts(products) {
  renderProducts(bestSellersGrid, products.slice(0, 4));
  renderProducts(newArrivalsGrid, products.slice(4, 8));
  renderProducts(allProductsGrid, products);
}

async function fetchProducts() {
  try {
    const snapshot = await db.collection('products').get();
    if (snapshot.empty) {
      console.warn('Firestore vide, utilisation des mock');
      displayProducts(MOCK_PRODUCTS);
      return;
    }
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    displayProducts(products);
  } catch (error) {
    console.error('Erreur Firestore:', error);
    displayProducts(MOCK_PRODUCTS);
  }
}

// ============================================================
// 9. INIT
// ============================================================
loadCart();
fetchProducts();
showView('home');

console.log('✨ LUNA — Prêt !');
