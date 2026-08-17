// ============================================================
// 1. CONFIGURATION FIREBASE (À REMPLACER PAR VOS CLÉS)
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
// 2. DONNÉES DE DÉMONSTRATION (fallback si Firestore vide)
// ============================================================
const MOCK_PRODUCTS = [
  { id: 'mock1', name: 'Typewriter', price: 9.99, image: 'https://picsum.photos/seed/type/400/400', description: 'Vintage' },
  { id: 'mock2', name: 'Vintage Camera', price: 9.99, image: 'https://picsum.photos/seed/camera/400/400', description: 'Analog' },
  { id: 'mock3', name: 'Coffee Mug', price: 0.00, image: 'https://picsum.photos/seed/mug/400/400', description: 'Ceramic' },
  { id: 'mock4', name: 'Journal', price: 5.99, image: 'https://picsum.photos/seed/journal/400/400', description: 'Notebook' },
  { id: 'mock5', name: 'Minimalist Clock', price: 14.99, image: 'https://picsum.photos/seed/clock/400/400', description: 'Wall' },
  { id: 'mock6', name: 'Desk Lamp', price: 19.99, image: 'https://picsum.photos/seed/lamp/400/400', description: 'LED' },
  { id: 'mock7', name: 'Art Print', price: 12.00, image: 'https://picsum.photos/seed/print/400/400', description: 'Abstract' },
  { id: 'mock8', name: 'Plant Pot', price: 8.50, image: 'https://picsum.photos/seed/pot/400/400', description: 'Terracotta' }
];

// ============================================================
// 3. ÉLÉMENTS DOM
// ============================================================
const views = document.querySelectorAll('.view');
const navLinks = document.querySelectorAll('[data-view]');
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

const bestSellersGrid = document.getElementById('bestSellersGrid');
const newArrivalsGrid = document.getElementById('newArrivalsGrid');
const allProductsGrid = document.getElementById('allProductsGrid');
const cartBadge = document.getElementById('cartBadge');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartItems = document.getElementById('cartItems');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');

// ============================================================
// 4. AUTHENTIFICATION
// ============================================================
// Écouter les changements d'état de l'utilisateur
auth.onAuthStateChanged(user => {
  if (user) {
    // Connecté
    authButtons.style.display = 'none';
    userMenu.style.display = 'flex';
    userNameDisplay.textContent = user.displayName || user.email?.split('@')[0] || 'Utilisateur';
    profileEmail.textContent = user.email || '—';
    profileUid.textContent = user.uid || '—';
    // Mettre à jour la vue si nécessaire (si on est sur login/register, rediriger vers home)
    const activeView = document.querySelector('.view.active');
    if (activeView && ['view-login', 'view-register'].includes(activeView.id)) {
      showView('home');
    }
  } else {
    // Déconnecté
    authButtons.style.display = 'flex';
    userMenu.style.display = 'none';
    // Rediriger vers home si on est sur profil
    const activeView = document.querySelector('.view.active');
    if (activeView && activeView.id === 'view-profile') {
      showView('home');
    }
  }
});

// Connexion
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

// Inscription
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

// Déconnexion
logoutBtn.addEventListener('click', () => {
  auth.signOut();
  dropdownMenu.classList.remove('open');
});
logoutBtnProfile.addEventListener('click', () => {
  auth.signOut();
});

// Affichage du dropdown
userAvatar.addEventListener('click', (e) => {
  e.stopPropagation();
  dropdownMenu.classList.toggle('open');
});
document.addEventListener('click', () => {
  dropdownMenu.classList.remove('open');
});

// ============================================================
// 5. NAVIGATION (SPA)
// ============================================================
function showView(viewId) {
  // Masquer toutes les vues
  views.forEach(v => v.classList.remove('active'));
  // Afficher la vue ciblée
  const target = document.getElementById(`view-${viewId}`);
  if (target) target.classList.add('active');
  // Mettre à jour les liens actifs
  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.view === viewId);
  });
  // Si la vue est 'login' ou 'register' et que l'utilisateur est connecté, rediriger vers home
  if ((viewId === 'login' || viewId === 'register') && auth.currentUser) {
    showView('home');
  }
  // Si la vue est 'profile' et que l'utilisateur n'est pas connecté, rediriger vers login
  if (viewId === 'profile' && !auth.currentUser) {
    showView('login');
  }
}

// Gestion des clics sur les liens de navigation
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

// Clic sur le logo → accueil
document.getElementById('logoLink').addEventListener('click', () => showView('home'));

// Boutons Connexion / Inscription
loginBtn.addEventListener('click', () => showView('login'));
registerBtn.addEventListener('click', () => showView('register'));

// ============================================================
// 6. PANIER (localStorage)
// ============================================================
let cart = [];

function loadCart() {
  const stored = localStorage.getItem('white_cart');
  cart = stored ? JSON.parse(stored) : [];
  updateCartUI();
}
function saveCart() {
  localStorage.setItem('white_cart', JSON.stringify(cart));
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

// Ouverture / fermeture panier
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
// 7. AFFICHAGE DES PRODUITS (Firestore + fallback)
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
  // Best Sellers : 4 premiers
  renderProducts(bestSellersGrid, products.slice(0, 4));
  // New Arrivals : 4 suivants
  renderProducts(newArrivalsGrid, products.slice(4, 8));
  // Tous les produits (vue boutique)
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
// 8. INITIALISATION
// ============================================================
loadCart();
fetchProducts();
// Vue par défaut : accueil
showView('home');

console.log('✨ White Artistry Pro — Prêt !');
