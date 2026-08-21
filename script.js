// ============================================================
// MANORA - script.js (Auth + Store + UI + Panier persistant)
// ============================================================
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
    getAuth, createUserWithEmailAndPassword,
    signInWithEmailAndPassword, sendPasswordResetEmail,
    onAuthStateChanged, signOut, setPersistence,
    browserLocalPersistence, updateProfile
} from "firebase/auth";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";

// ============================================================
// CONFIGURATION FIREBASE
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyBuaSbWc0yIBvILjduH3K5NlJqpC1npX1E",
    authDomain: "manora-4281c.firebaseapp.com",
    projectId: "manora-4281c",
    storageBucket: "manora-4281c.firebasestorage.app",
    messagingSenderId: "255958969186",
    appId: "1:255958969186:web:569bb30959197a77ae1a3b",
    measurementId: "G-3HF31CC37B"
};

// ============================================================
// INITIALISATION
// ============================================================
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});

export { app, auth, db };

// ============================================================
// PANIER (Cart) - PERSISTANT DANS localStorage
// ============================================================
const CART_KEY = 'manora_cart';

function loadCart() {
    try {
        const data = localStorage.getItem(CART_KEY);
        return data ? JSON.parse(data) : [];
    } catch { return []; }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

let cart = loadCart();

function updateCartUI() {
    const badge = document.getElementById('cartBadge');
    const badgeHeader = document.getElementById('cartBadgeHeader');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (badge) {
        badge.textContent = count;
        badge.classList.toggle('hidden', count === 0);
    }
    if (badgeHeader) {
        badgeHeader.textContent = count;
        badgeHeader.classList.toggle('hidden', count === 0);
    }
}

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart(cart);
    updateCartUI();
    window.showToast(`🛒 ${product.name} ajouté au panier !`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    updateCartUI();
    renderCart();
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }
    saveCart(cart);
    updateCartUI();
    renderCart();
}

function clearCart() {
    if (cart.length === 0) return;
    if (confirm('Vider le panier ?')) {
        cart = [];
        saveCart(cart);
        updateCartUI();
        renderCart();
        window.showToast('🛒 Panier vidé');
    }
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.sellPrice || 0) * item.quantity, 0);
}

// ============================================================
// AFFICHAGE DU PANIER (Modal)
// ============================================================
function renderCart() {
    const container = document.getElementById('cartContent');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Votre panier est vide</p>
            </div>
        `;
        return;
    }

    let html = '';
    cart.forEach(item => {
        const price = item.sellPrice || 0;
        const total = price * item.quantity;
        const imgSrc = item.image || 'https://via.placeholder.com/60x60?text=MANORA';
        html += `
            <div class="cart-item">
                <img src="${imgSrc}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="name">${item.name}</div>
                    <div class="price">${price.toFixed(2)} MAD</div>
                </div>
                <div class="cart-item-qty">
                    <button onclick="updateQuantity('${item.id}', -1)">−</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity('${item.id}', 1)">+</button>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart('${item.id}')"><i class="fas fa-trash"></i></button>
            </div>
        `;
    });

    const total = getCartTotal();
    html += `
        <div class="cart-total">
            Total : <span>${total.toFixed(2)} MAD</span>
        </div>
        <div class="cart-promo">
            <input type="text" id="promoCode" placeholder="Code promo" />
            <button class="btn-apply" onclick="applyPromo()">Appliquer</button>
            <span id="promoMessage" style="font-size:0.8rem;color:#27ae60;display:none;"></span>
        </div>
        <div class="cart-actions">
            <button class="btn-order" onclick="finalizeOrder()"><i class="fas fa-check"></i> Commander</button>
            <button class="btn-clear" onclick="clearCart()"><i class="fas fa-times"></i> Vider</button>
        </div>
    `;

    container.innerHTML = html;
}

// ============================================================
// CODE PROMO (Simulation)
// ============================================================
let promoApplied = false;
let promoDiscount = 0;

window.applyPromo = function() {
    const input = document.getElementById('promoCode');
    const msg = document.getElementById('promoMessage');
    const code = input.value.trim().toUpperCase();
    if (code === 'BIENVENUE10') {
        promoApplied = true;
        promoDiscount = 0.10;
        msg.textContent = '✅ Code promo appliqué : 10% de réduction !';
        msg.style.color = '#27ae60';
        msg.style.display = 'block';
        window.showToast('🎉 Code promo appliqué !');
        renderCart();
    } else if (code === 'MANORA20') {
        promoApplied = true;
        promoDiscount = 0.20;
        msg.textContent = '✅ Code promo appliqué : 20% de réduction !';
        msg.style.color = '#27ae60';
        msg.style.display = 'block';
        window.showToast('🎉 Code promo appliqué !');
        renderCart();
    } else {
        promoApplied = false;
        promoDiscount = 0;
        msg.textContent = '❌ Code promo invalide';
        msg.style.color = '#c0392b';
        msg.style.display = 'block';
    }
};

// ============================================================
// FINALISER LA COMMANDE
// ============================================================
window.finalizeOrder = function() {
    if (cart.length === 0) {
        window.showToast('🛒 Votre panier est vide', true);
        return;
    }

    let total = getCartTotal();
    if (promoApplied && promoDiscount > 0) {
        total = total * (1 - promoDiscount);
    }

    const user = auth.currentUser;
    const clientName = user ? (user.displayName || user.email) : 'Invité';

    const message = `
📦 NOUVELLE COMMANDE MANORA
----------------------------------------
👤 Client : ${clientName}
📅 Date : ${new Date().toLocaleString('fr-FR')}

🛒 Articles :
${cart.map(item => `  - ${item.name} x${item.quantity} = ${(item.sellPrice * item.quantity).toFixed(2)} MAD`).join('\n')}

----------------------------------------
💰 Sous-total : ${getCartTotal().toFixed(2)} MAD
${promoApplied ? `🎯 Réduction : ${(promoDiscount * 100)}%\n💰 Total après promo : ${total.toFixed(2)} MAD` : `💰 Total : ${total.toFixed(2)} MAD`}
----------------------------------------
Merci pour votre commande ! 🌿
    `;

    alert(message);

    cart = [];
    saveCart(cart);
    updateCartUI();
    renderCart();
    window.showToast('✅ Commande validée ! Merci.');
};

// ============================================================
// EXPOSER LES FONCTIONS DU PANIER AU GLOBAL
// ============================================================
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.clearCart = clearCart;
window.applyPromo = window.applyPromo;
window.finalizeOrder = window.finalizeOrder;

// ============================================================
// OUVRIR / FERMER LE MODAL PANIER
// ============================================================
const cartModal = document.getElementById('cartModal');
const closeCartBtn = document.getElementById('closeCartModal');

function openCart() {
    renderCart();
    cartModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    cartModal.classList.remove('active');
    document.body.style.overflow = '';
}

document.getElementById('cartIcon').addEventListener('click', openCart);
document.getElementById('cartHeaderBtn').addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) closeCart();
});

// ============================================================
// TOAST SYSTEM
// ============================================================
window.showToast = function(msg, isError = false) {
    const existing = document.querySelector('.toast-luna');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-luna';
    toast.textContent = msg;
    Object.assign(toast.style, {
        position: 'fixed', bottom: '30px', left: '50%',
        transform: 'translateX(-50%)',
        background: isError ? '#c0392b' : '#1a1a1a',
        color: '#f0ede8', padding: '0.9rem 2.2rem',
        borderRadius: '0', letterSpacing: '0.15em',
        fontSize: '0.7rem', textTransform: 'uppercase',
        boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
        zIndex: '99999', borderLeft: isError ? '4px solid #e74c3c' : '4px solid #e8a87c',
        opacity: '0', transition: 'opacity 0.4s, transform 0.3s',
        fontFamily: "'Montserrat', sans-serif", pointerEvents: 'none',
        maxWidth: '90%', wordBreak: 'break-word',
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
};

// ============================================================
// PRODUCT DETAILS MODAL
// ============================================================
function showProductDetails(product) {
    const modal = document.getElementById('productDetailsModal');
    const content = document.getElementById('productDetailsContent');
    const promo = product.promoPrice && product.promoPrice > 0 && product.promoPrice < product.sellPrice;
    const imgSrc = product.image || 'https://via.placeholder.com/400x300?text=MANORA';
    
    content.innerHTML = `
        <img src="${imgSrc}" alt="${product.name}" class="detail-image">
        <h2 class="detail-name">${product.name || 'Sans nom'}</h2>
        <div class="detail-category">${product.category || 'Non catégorisé'}</div>
        <div class="detail-price">
            ${promo ? `<span>${product.sellPrice} MAD</span> ${product.promoPrice} MAD` : (product.sellPrice || 0) + ' MAD'}
        </div>
        <div class="detail-row"><span class="label">Marque</span><span class="value">${product.brand || '-'}</span></div>
        <div class="detail-row"><span class="label">Stock</span><span class="value">${product.stock || 0}</span></div>
        <div class="detail-row"><span class="label">Fournisseur</span><span class="value">${product.supplier || '-'}</span></div>
        <div class="detail-row"><span class="label">Prix d'achat</span><span class="value">${product.buyPrice || 0} MAD</span></div>
        <div class="detail-row"><span class="label">Marge</span><span class="value">${((product.sellPrice || 0) - (product.buyPrice || 0)).toFixed(2)} MAD</span></div>
        <div style="margin-top:1.2rem; display:flex; gap:0.8rem; flex-wrap:wrap;">
            <button class="btn-primary" onclick="addToCart(window._currentDetailProduct); closeProductDetailsModal();" style="flex:1; padding:0.8rem; font-size:0.8rem;">
                <i class="fas fa-cart-plus"></i> Ajouter au panier
            </button>
            <button class="btn-secondary" onclick="closeProductDetailsModal()" style="flex:0; padding:0.8rem 1.5rem; font-size:0.8rem;">
                Fermer
            </button>
        </div>
    `;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    window._currentDetailProduct = product;
}

function closeProductDetailsModal() {
    document.getElementById('productDetailsModal').classList.remove('active');
    document.body.style.overflow = '';
}

document.getElementById('closeProductDetails').addEventListener('click', closeProductDetailsModal);
document.getElementById('productDetailsModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeProductDetailsModal();
});

// ============================================================
// LOAD PUBLIC DATA (page d'accueil)
// ============================================================
async function loadPublicData() {
    try {
        const catSnapshot = await getDocs(query(collection(db, 'categories'), orderBy('order', 'asc')));
        const catContainer = document.getElementById('categoriesContainer');
        catContainer.innerHTML = '';
        catSnapshot.forEach(doc => {
            const data = doc.data();
            const span = document.createElement('span');
            span.className = 'cat-item';
            if (data.image) {
                span.innerHTML = `<img src="${data.image}" alt="${data.name}">${data.name}`;
            } else {
                span.textContent = data.name;
            }
            catContainer.appendChild(span);
        });

        const prodSnapshot = await getDocs(collection(db, 'products'));
        const prodContainer = document.getElementById('productsContainer');
        prodContainer.innerHTML = '';
        prodSnapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'product-card';
            // On ajoute un data attribute pour l'id produit
            card.dataset.productId = doc.id;
            const promo = data.promoPrice && data.promoPrice > 0 && data.promoPrice < data.sellPrice;
            const imgSrc = data.image || 'https://via.placeholder.com/200x200?text=MANORA';
            card.innerHTML = `
                <img src="${imgSrc}" alt="${data.name}">
                <div class="product-info">
                    <h4>${data.name || ''}</h4>
                    <span class="product-category">${data.category || ''}</span>
                    <div class="product-price">${promo ? `<span>${data.sellPrice} MAD</span> ${data.promoPrice} MAD` : (data.sellPrice || 0) + ' MAD'}</div>
                    <div style="font-size:0.6rem;color:#999;">📦 Stock: ${data.stock || 0}</div>
                </div>
            `;
            prodContainer.appendChild(card);
        });

        // Ajouter un événement de clic sur chaque carte pour ouvrir la boutique
        document.querySelectorAll('#productsContainer .product-card').forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', function() {
                openStore();
            });
        });

    } catch (error) {
        console.error('Erreur chargement données publiques:', error);
    }
}

// ============================================================
// STORE PAGE (boutique modale)
// ============================================================
const storePage = document.getElementById('storePage');
document.getElementById('shopNowBtn').addEventListener('click', () => openStore());
document.getElementById('closeStore').addEventListener('click', () => closeStore());
document.getElementById('silverBtn').addEventListener('click', () => openStore());

async function openStore() {
    storePage.classList.add('active');
    storePage.style.display = 'block';
    document.body.style.overflow = 'hidden';
    await loadStoreData();
}
function closeStore() {
    storePage.classList.remove('active');
    storePage.style.display = 'none';
    document.body.style.overflow = '';
}

async function loadStoreData() {
    try {
        // Charger catégories
        const catSnapshot = await getDocs(query(collection(db, 'categories'), orderBy('order', 'asc')));
        const catContainer = document.getElementById('storeCategories');
        catContainer.innerHTML = '<button class="store-category-btn active" data-category="all">📋 Tous</button>';
        catSnapshot.forEach(doc => {
            const data = doc.data();
            const btn = document.createElement('button');
            btn.className = 'store-category-btn';
            btn.dataset.category = doc.id;
            btn.innerHTML = data.image ? `<img src="${data.image}"> ${data.name}` : data.name;
            catContainer.appendChild(btn);
        });

        // Charger produits
        const prodSnapshot = await getDocs(collection(db, 'products'));
        const prodContainer = document.getElementById('storeProducts');
        prodContainer.innerHTML = '';
        if (prodSnapshot.empty) {
            prodContainer.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#999;">
                <i class="fas fa-box-open" style="font-size:3rem;display:block;margin-bottom:1rem;color:#e8a87c;"></i>
                <p>Aucun produit disponible pour le moment.</p></div>`;
        } else {
            prodSnapshot.forEach(doc => {
                const product = { id: doc.id, ...doc.data() };
                const card = document.createElement('div');
                card.className = 'product-card';
                card.dataset.category = product.category || '';
                const promo = product.promoPrice && product.promoPrice > 0 && product.promoPrice < product.sellPrice;
                const imgSrc = product.image || 'https://via.placeholder.com/200x200?text=MANORA';
                card.innerHTML = `
                    <img src="${imgSrc}" alt="${product.name}">
                    <div class="product-info">
                        <h4>${product.name || 'Sans nom'}</h4>
                        <span class="product-category">${product.category || 'Non catégorisé'}</span>
                        <div class="product-price">${promo ? `<span>${product.sellPrice} MAD</span> ${product.promoPrice} MAD` : (product.sellPrice || 0) + ' MAD'}</div>
                        <div style="font-size:0.6rem;color:#999;">📦 Stock: ${product.stock || 0}</div>
                        ${product.brand ? `<div style="font-size:0.6rem;color:#999;">🏷️ ${product.brand}</div>` : ''}
                        <div class="product-actions">
                            <button class="btn-store-add" data-product-id="${product.id}"><i class="fas fa-cart-plus"></i> Ajouter</button>
                            <button class="btn-store-detail" data-product-id="${product.id}"><i class="fas fa-eye"></i> Détails</button>
                        </div>
                    </div>
                `;
                prodContainer.appendChild(card);
            });

            // Attacher les événements sur les boutons de chaque carte
            prodContainer.querySelectorAll('.btn-store-add').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const id = this.dataset.productId;
                    const product = window._storeProductsMap ? window._storeProductsMap.get(id) : null;
                    if (product) addToCart(product);
                });
            });

            prodContainer.querySelectorAll('.btn-store-detail').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const id = this.dataset.productId;
                    const product = window._storeProductsMap ? window._storeProductsMap.get(id) : null;
                    if (product) showProductDetails(product);
                });
            });

            // Stocker les produits dans une Map pour accès facile
            window._storeProductsMap = new Map();
            prodSnapshot.forEach(doc => {
                const product = { id: doc.id, ...doc.data() };
                window._storeProductsMap.set(doc.id, product);
            });
        }

        // Filtrage par catégorie
        document.querySelectorAll('.store-category-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.store-category-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const cat = this.dataset.category;
                document.querySelectorAll('#storeProducts .product-card').forEach(card => {
                    card.style.display = (cat === 'all' || card.dataset.category === cat) ? 'block' : 'none';
                });
            });
        });
    } catch (error) {
        console.error('Erreur store:', error);
        document.getElementById('storeProducts').innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#c0392b;">
            <i class="fas fa-exclamation-triangle" style="font-size:3rem;display:block;margin-bottom:1rem;"></i>
            <p>Erreur lors du chargement.</p></div>`;
        window.showToast('⚠️ Erreur chargement du store', true);
    }
}

// ============================================================
// AUTH UI
// ============================================================
function updateUI(user) {
    const userStatus = document.getElementById('userStatus');
    const userIcon = document.getElementById('userIcon');
    const navDashboard = document.getElementById('navDashboard');
    const navCategories = document.getElementById('navCategories');
    const navProducts = document.getElementById('navProducts');

    if (user) {
        const displayName = user.displayName || user.email || 'Utilisateur';
        userStatus.textContent = '👤 ' + displayName.split('@')[0];
        userStatus.className = 'user-status logged-in';
        userIcon.style.color = '#4caf50';
        if (navDashboard) navDashboard.style.display = 'inline';
        if (navCategories) navCategories.style.display = 'inline';
        if (navProducts) navProducts.style.display = 'inline';
        openAdminPanel(user);
    } else {
        userStatus.textContent = '';
        userStatus.className = 'user-status';
        userIcon.style.color = '';
        if (navDashboard) navDashboard.style.display = 'none';
        if (navCategories) navCategories.style.display = 'none';
        if (navProducts) navProducts.style.display = 'none';
        closeAdminPanel();
    }
}

// ============================================================
// ADMIN PANEL
// ============================================================
function openAdminPanel(user) {
    const adminPanel = document.getElementById('adminPanel');
    const sidebarUser = document.getElementById('sidebarUser');
    const hero = document.getElementById('heroSection');
    const publicCat = document.getElementById('publicCategories');
    const publicProd = document.getElementById('publicProducts');
    const collection = document.getElementById('collectionSection');
    if (user) {
        adminPanel.classList.add('active');
        adminPanel.style.display = 'flex';
        sidebarUser.textContent = user.displayName || user.email || 'Admin';
        hero.style.display = 'none';
        publicCat.style.display = 'none';
        publicProd.style.display = 'none';
        collection.style.display = 'none';
        import('./admin.js').then(module => {
            module.loadCategories();
            module.loadProducts();
            module.updateDashboard();
            module.loadCategoriesTable();
            module.loadProductsTable();
        });
    }
}
function closeAdminPanel() {
    const adminPanel = document.getElementById('adminPanel');
    const hero = document.getElementById('heroSection');
    const publicCat = document.getElementById('publicCategories');
    const publicProd = document.getElementById('publicProducts');
    const collection = document.getElementById('collectionSection');
    adminPanel.classList.remove('active');
    adminPanel.style.display = 'none';
    hero.style.display = 'flex';
    publicCat.style.display = 'block';
    publicProd.style.display = 'block';
    collection.style.display = 'block';
}

// ============================================================
// SIDEBAR NAVIGATION
// ============================================================
document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const page = this.dataset.page;
        if (this.id === 'sideLogout') {
            signOut(auth);
            window.showToast('👋 Déconnecté');
            return;
        }
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
        const targetMap = {
            'dashboard': 'dashboardPanel',
            'categories': 'categoriesPanel',
            'products': 'productsPanel'
        };
        const target = document.getElementById(targetMap[page]);
        if (target) target.classList.add('active');
        if (page === 'categories') {
            import('./admin.js').then(module => module.loadCategoriesTable());
        } else if (page === 'products') {
            import('./admin.js').then(module => module.loadProductsTable());
        } else if (page === 'dashboard') {
            import('./admin.js').then(module => module.updateDashboard());
        }
    });
});

// ============================================================
// AUTH MODAL
// ============================================================
const authOverlay = document.getElementById('authOverlay');
const userIcon = document.getElementById('userIcon');
const authClose = document.getElementById('authClose');

function openAuthModal() {
    authOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeAuthModal() {
    authOverlay.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('registerError').classList.add('hidden');
}

userIcon.addEventListener('click', function() {
    const user = auth.currentUser;
    if (user) {
        if (confirm('Se déconnecter ?')) {
            signOut(auth);
            window.showToast('👋 Déconnecté');
        }
    } else {
        openAuthModal();
    }
});
authClose.addEventListener('click', closeAuthModal);
authOverlay.addEventListener('click', (e) => { if (e.target === authOverlay) closeAuthModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && authOverlay.classList.contains('active')) closeAuthModal(); });

// ============================================================
// TABS AUTH
// ============================================================
const tabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
tabs.forEach(tab => {
    tab.addEventListener('click', function() {
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        if (this.dataset.tab === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        }
        document.getElementById('loginError').classList.add('hidden');
        document.getElementById('registerError').classList.add('hidden');
    });
});

// ============================================================
// LOGIN
// ============================================================
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    errorDiv.classList.add('hidden');
    if (!email || !email.includes('@')) {
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = '⚠️ Email invalide';
        return;
    }
    if (!password) {
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = '⚠️ Mot de passe requis';
        return;
    }
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Connexion...';
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            window.showToast('✅ Bienvenue ' + (user.displayName || user.email) + ' !');
            closeAuthModal();
            loginForm.reset();
        })
        .catch((error) => {
            errorDiv.classList.remove('hidden');
            let message = 'Erreur de connexion';
            switch (error.code) {
                case 'auth/user-not-found': message = 'Aucun compte trouvé'; break;
                case 'auth/wrong-password': message = 'Mot de passe incorrect'; break;
                case 'auth/invalid-email': message = 'Email invalide'; break;
                case 'auth/too-many-requests': message = 'Trop de tentatives'; break;
                default: message = error.message;
            }
            errorDiv.textContent = '⚠️ ' + message;
            window.showToast('⚠️ ' + message, true);
        })
        .finally(() => {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Se connecter';
        });
});

// ============================================================
// REGISTER
// ============================================================
registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    const errorDiv = document.getElementById('registerError');
    errorDiv.classList.add('hidden');
    if (!name || name.length < 2) {
        errorDiv.classList.remove('hidden'); errorDiv.textContent = '⚠️ Nom invalide'; return;
    }
    if (!email || !email.includes('@')) {
        errorDiv.classList.remove('hidden'); errorDiv.textContent = '⚠️ Email invalide'; return;
    }
    if (!password || password.length < 6) {
        errorDiv.classList.remove('hidden'); errorDiv.textContent = '⚠️ Mot de passe minimum 6 caractères'; return;
    }
    if (password !== confirm) {
        errorDiv.classList.remove('hidden'); errorDiv.textContent = '⚠️ Les mots de passe ne correspondent pas'; return;
    }
    const registerBtn = document.getElementById('registerBtn');
    registerBtn.disabled = true;
    registerBtn.textContent = 'Création...';
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            return updateProfile(user, { displayName: name }).then(() => user);
        })
        .then(() => {
            window.showToast('🎉 Bienvenue ' + name + ' !');
            closeAuthModal();
            registerForm.reset();
        })
        .catch((error) => {
            errorDiv.classList.remove('hidden');
            let message = 'Erreur';
            switch (error.code) {
                case 'auth/email-already-in-use': message = 'Email déjà utilisé'; break;
                case 'auth/invalid-email': message = 'Email invalide'; break;
                case 'auth/weak-password': message = 'Mot de passe trop faible'; break;
                default: message = error.message;
            }
            errorDiv.textContent = '⚠️ ' + message;
            window.showToast('⚠️ ' + message, true);
        })
        .finally(() => {
            registerBtn.disabled = false;
            registerBtn.textContent = 'Créer mon compte';
        });
});

// ============================================================
// RESET PASSWORD
// ============================================================
document.getElementById('resetPasswordLink').addEventListener('click', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    if (!email || !email.includes('@')) {
        window.showToast('⚠️ Email valide requis', true);
        document.getElementById('loginEmail').focus();
        return;
    }
    sendPasswordResetEmail(auth, email)
        .then(() => window.showToast('📧 Email envoyé à ' + email))
        .catch((error) => window.showToast('⚠️ ' + error.message, true));
});

// ============================================================
// AUTRES ÉVÉNEMENTS
// ============================================================
document.getElementById('lunchBadge').addEventListener('click', () => window.showToast('🌿 Wellness & Bien-être'));
document.getElementById('logoLink').addEventListener('click', (e) => e.preventDefault());

document.querySelectorAll('.header-icons i').forEach(icon => {
    if (icon.id === 'userIcon' || icon.id === 'cartIcon') return;
    icon.addEventListener('click', () => window.showToast('🛍️ Bientôt disponible'));
});
document.querySelectorAll('.footer-links a').forEach(link => {
    link.addEventListener('click', (e) => { e.preventDefault(); window.showToast('📄 Page en construction'); });
});
document.querySelectorAll('.footer-social i').forEach(icon => {
    icon.addEventListener('click', () => window.showToast('📱 Bientôt disponible'));
});

// ============================================================
// AUTH STATE
// ============================================================
onAuthStateChanged(auth, (user) => {
    updateUI(user);
    loadPublicData();
    updateCartUI();
});

// ============================================================
// INIT
// ============================================================
loadPublicData();
updateCartUI();

console.log('🌿 MANORA · E-commerce Beauty & Wellness');
console.log('📊 Firebase Auth + Firestore actif');
console.log('🛒 Panier persistant dans localStorage');
