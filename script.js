// ============================================================
// MANORA - script.js (Auth + Store + UI)
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
// PANIER (Cart)
// ============================================================
let cart = [];
let cartCount = 0;

function updateCartUI() {
    const badge = document.getElementById('cartBadge');
    const badgeHeader = document.getElementById('cartBadgeHeader');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount = count;
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
    updateCartUI();
    window.showToast(`🛒 ${product.name} ajouté au panier !`);
}

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
            <button class="btn-primary" onclick="window.addToCartFromDetails('${product.id}')" style="flex:1; padding:0.8rem; font-size:0.8rem;">
                <i class="fas fa-cart-plus"></i> Ajouter au panier
            </button>
            <button class="btn-secondary" onclick="document.getElementById('productDetailsModal').classList.remove('active')" style="flex:0; padding:0.8rem 1.5rem; font-size:0.8rem;">
                Fermer
            </button>
        </div>
    `;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Stocker le produit pour l'ajout au panier depuis le modal
    window._currentDetailProduct = product;
}

window.addToCartFromDetails = function(productId) {
    if (window._currentDetailProduct) {
        addToCart(window._currentDetailProduct);
        document.getElementById('productDetailsModal').classList.remove('active');
        document.body.style.overflow = '';
    }
};

// ============================================================
// LOAD PUBLIC DATA
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
            const promo = data.promoPrice && data.promoPrice > 0 && data.promoPrice < data.sellPrice;
            const imgSrc = data.image || 'https://via.placeholder.com/200x200?text=MANORA';
            card.innerHTML = `
                <img src="${imgSrc}" alt="${data.name}">
                <div class="product-info">
                    <h4>${data.name || ''}</h4>
                    <span class="product-category">${data.category || ''}</span>
                    <div class="product-price">${promo ? `<span>${data.sellPrice} MAD</span> ${data.promoPrice} MAD` : (data.sellPrice || 0) + ' MAD'}</div>
                    <div style="font-size:0.6rem;color:#999;">Stock: ${data.stock || 0}</div>
                </div>
            `;
            prodContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Erreur chargement données publiques:', error);
    }
}

// ============================================================
// STORE PAGE
// ============================================================
const storePage = document.getElementById('storePage');
document.getElementById('shopNowBtn').addEventListener('click', () => openStore());
document.getElementById('closeStore').addEventListener('click', () => closeStore());
document.getElementById('silverBtn').addEventListener('click', () => openStore());

// Icône panier dans le header
document.getElementById('cartIcon').addEventListener('click', () => {
    if (cart.length === 0) {
        window.showToast('🛒 Votre panier est vide');
        return;
    }
    // Afficher le contenu du panier
    let msg = '🛒 Panier :\n';
    let total = 0;
    cart.forEach(item => {
        msg += `- ${item.name} x${item.quantity} = ${(item.sellPrice * item.quantity).toFixed(2)} MAD\n`;
        total += item.sellPrice * item.quantity;
    });
    msg += `\nTotal: ${total.toFixed(2)} MAD`;
    alert(msg);
});

// Bouton panier dans le store
document.getElementById('cartHeaderBtn').addEventListener('click', () => {
    if (cart.length === 0) {
        window.showToast('🛒 Votre panier est vide');
        return;
    }
    let msg = '🛒 Panier :\n';
    let total = 0;
    cart.forEach(item => {
        msg += `- ${item.name} x${item.quantity} = ${(item.sellPrice * item.quantity).toFixed(2)} MAD\n`;
        total += item.sellPrice * item.quantity;
    });
    msg += `\nTotal: ${total.toFixed(2)} MAD`;
    alert(msg);
});

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

        const prodSnapshot = await getDocs(collection(db, 'products'));
        const prodContainer = document.getElementById('storeProducts');
        prodContainer.innerHTML = '';
        if (prodSnapshot.empty) {
            prodContainer.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#999;">
                <i class="fas fa-box-open" style="font-size:3rem;display:block;margin-bottom:1rem;color:#e8a87c;"></i>
                <p>Aucun produit disponible pour le moment.</p></div>`;
        } else {
            prodSnapshot.forEach(doc => {
                const data = doc.data();
                const product = { id: doc.id, ...data };
                const card = document.createElement('div');
                card.className = 'product-card';
                card.dataset.category = data.category || '';
                const promo = data.promoPrice && data.promoPrice > 0 && data.promoPrice < data.sellPrice;
                const imgSrc = data.image || 'https://via.placeholder.com/200x200?text=MANORA';
                card.innerHTML = `
                    <img src="${imgSrc}" alt="${data.name}">
                    <div class="product-info">
                        <h4>${data.name || 'Sans nom'}</h4>
                        <span class="product-category">${data.category || 'Non catégorisé'}</span>
                        <div class="product-price">${promo ? `<span>${data.sellPrice} MAD</span> ${data.promoPrice} MAD` : (data.sellPrice || 0) + ' MAD'}</div>
                        <div style="font-size:0.6rem;color:#999;">📦 Stock: ${data.stock || 0}</div>
                        ${data.brand ? `<div style="font-size:0.6rem;color:#999;">🏷️ ${data.brand}</div>` : ''}
                        <div class="product-actions">
                            <button class="btn-store-add" data-id="${doc.id}"><i class="fas fa-cart-plus"></i> Ajouter</button>
                            <button class="btn-store-detail" data-id="${doc.id}"><i class="fas fa-eye"></i> Détails</button>
                        </div>
                    </div>
                `;
                prodContainer.appendChild(card);
            });
            
            // Attacher les événements aux boutons
            prodContainer.querySelectorAll('.btn-store-add').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const id = this.dataset.id;
                    const product = productsData.find(p => p.id === id);
                    if (product) addToCart(product);
                });
            });
            
            prodContainer.querySelectorAll('.btn-store-detail').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const id = this.dataset.id;
                    const product = productsData.find(p => p.id === id);
                    if (product) showProductDetails(product);
                });
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

// Stocker les produits pour les boutons
let productsData = [];

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
            // Stocker les produits pour la boutique
            productsData = module.getProductsData ? module.getProductsData() : [];
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

// Fermeture du modal détails produit
document.getElementById('closeProductDetails').addEventListener('click', () => {
    document.getElementById('productDetailsModal').classList.remove('active');
    document.body.style.overflow = '';
});
document.getElementById('productDetailsModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('productDetailsModal').classList.remove('active');
        document.body.style.overflow = '';
    }
});

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
console.log('🌿 MANORA · E-commerce Beauty & Wellness (Base64)');
console.log('📊 Firebase Auth + Firestore actif');
