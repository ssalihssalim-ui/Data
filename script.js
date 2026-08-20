// ============================================================
// SCRIPT.JS - Navigation, Auth, Catalogue, Panier, Détails
// ============================================================
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut,
    setPersistence,
    browserLocalPersistence,
    updateProfile
} from "firebase/auth";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    addDoc
} from "firebase/firestore";

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
export const auth = getAuth(app);
export const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence)
    .catch((error) => console.warn('Erreur persistance:', error));

console.log('🔥 Firebase initialisé !');

// ============================================================
// TOAST SYSTEM
// ============================================================
export function showToast(msg, isError = false) {
    const existing = document.querySelector('.toast-luna');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-luna';
    toast.textContent = msg;
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: isError ? '#c0392b' : '#1a1a1a',
        color: '#f0ede8',
        padding: '0.9rem 2.2rem',
        borderRadius: '0',
        letterSpacing: '0.15em',
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
        zIndex: '99999',
        borderLeft: isError ? '4px solid #e74c3c' : '4px solid #e8a87c',
        opacity: '0',
        transition: 'opacity 0.4s ease, transform 0.3s ease',
        fontFamily: "'Montserrat', sans-serif",
        pointerEvents: 'none',
        maxWidth: '90%',
        wordBreak: 'break-word',
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
}

// ============================================================
// VALIDATION EMAIL
// ============================================================
export function isValidEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

// ============================================================
// NAVIGATION
// ============================================================
const pageHome = document.getElementById('pageHome');
const pageShop = document.getElementById('pageShop');
const pageDashboard = document.getElementById('pageDashboard');

const navShop = document.getElementById('navShop');
const navDashboard = document.getElementById('navDashboard');

export function showPage(page) {
    pageHome.style.display = page === 'home' ? 'block' : 'none';
    pageShop.style.display = page === 'shop' ? 'block' : 'none';
    pageDashboard.style.display = page === 'dashboard' ? 'block' : 'none';

    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
    if (page === 'home') document.querySelector('.nav-links a[href="index.html"]')?.classList.add('active');
    if (page === 'shop') navShop?.classList.add('active');
    if (page === 'dashboard') navDashboard?.classList.add('active');
}

navShop?.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('shop');
    loadShopProducts();
});

navDashboard?.addEventListener('click', (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        showToast('🔐 Connectez-vous pour accéder au dashboard', true);
        openAuthModal();
        return;
    }
    showPage('dashboard');
});

// ============================================================
// BOUTIQUE - CHARGER PRODUITS
// ============================================================
let products = [];

export async function loadShopProducts(category = 'all') {
    try {
        const q = query(collection(db, 'produits'), orderBy('name'));
        const snapshot = await getDocs(q);
        products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        renderProducts(category);
        loadShopCategories();
    } catch (error) {
        console.error('Erreur chargement produits:', error);
        showToast('⚠️ Erreur chargement produits', true);
    }
}

function loadShopCategories() {
    const list = document.getElementById('shopCategoryList');
    // Récupérer toutes les catégories depuis les produits
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    list.innerHTML = `
        <li class="category-item active" data-category="all"><i class="fas fa-th"></i> Tous</li>
        ${categories.map(cat => `
            <li class="category-item" data-category="${cat}"><i class="fas fa-tag"></i> ${cat}</li>
        `).join('')}
    `;
    document.querySelectorAll('#shopCategoryList .category-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('#shopCategoryList .category-item').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            renderProducts(this.dataset.category);
        });
    });
}

// ============================================================
// AFFICHAGE DES PRODUITS AVEC BOUTONS
// ============================================================
function renderProducts(category = 'all') {
    const grid = document.getElementById('productsGrid');
    const count = document.getElementById('productCount');
    const filtered = category === 'all' ? products : products.filter(p => p.category === category);

    count.textContent = `${filtered.length} produits`;

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><p>Aucun produit</p></div>`;
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const displayPrice = p.prixVente || p.price || '0';
        const priceValue = parseFloat(displayPrice) || 0;
        
        let imageHtml = p.image || '📦';
        if (p.image && p.image.startsWith('data:image')) {
            imageHtml = `<img src="${p.image}" alt="${p.name}" />`;
        }

        const desc = p.description || '';
        const descShort = desc.length > 60 ? desc.substring(0, 60) + '...' : desc;

        return `
            <div class="product-card" data-id="${p.id}">
                <div class="product-image">${imageHtml}</div>
                <div class="product-info">
                    <h4>${p.name}</h4>
                    <div class="product-desc">${descShort}</div>
                    <div class="product-price">${priceValue.toFixed(2)} MAD</div>
                    <div class="product-actions">
                        <button class="btn-add-cart" data-id="${p.id}" data-name="${p.name}" data-price="${priceValue}" data-image="${p.image || '📦'}">
                            <i class="fas fa-cart-plus"></i>
                        </button>
                        <button class="btn-detail" data-id="${p.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Ajouter au panier
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const product = {
                id: this.dataset.id,
                name: this.dataset.name,
                prixVente: this.dataset.price,
                image: this.dataset.image
            };
            addToCart(product);
        });
    });

    // Détails produit
    document.querySelectorAll('.btn-detail').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const productId = this.dataset.id;
            openProductDetail(productId);
        });
    });
}

// ============================================================
// DÉTAILS PRODUIT - MODAL
// ============================================================
const detailOverlay = document.getElementById('productDetailOverlay');
const detailClose = document.getElementById('productDetailClose');
const detailContent = document.getElementById('productDetailContent');

export async function openProductDetail(productId) {
    try {
        const docRef = doc(db, 'produits', productId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            showToast('⚠️ Produit non trouvé', true);
            return;
        }
        const product = { id: docSnap.id, ...docSnap.data() };
        renderProductDetail(product);
        detailOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Erreur chargement produit:', error);
        showToast('⚠️ Erreur chargement du produit', true);
    }
}

function renderProductDetail(product) {
    const displayPrice = product.prixVente || product.price || '0';
    const priceValue = parseFloat(displayPrice) || 0;
    const oldPrice = product.prixPromotion || null;
    
    let imageHtml = product.image || '📦';
    if (product.image && product.image.startsWith('data:image')) {
        imageHtml = `<img src="${product.image}" alt="${product.name}" />`;
    } else if (!product.image || product.image === '📦') {
        imageHtml = `<div class="no-image">📦</div>`;
    }

    // Vidéo YouTube si présente
    let videoHtml = '';
    if (product.videoUrl) {
        const videoId = extractYouTubeId(product.videoUrl);
        if (videoId) {
            videoHtml = `
                <div class="product-detail-video">
                    <h4><i class="fab fa-youtube"></i> Vidéo du produit</h4>
                    <iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>
                </div>
            `;
        }
    }

    detailContent.innerHTML = `
        <div class="product-detail-grid">
            <div class="product-detail-image">
                ${imageHtml}
            </div>
            <div class="product-detail-info">
                <h1>${product.name}</h1>
                <div class="detail-category">${product.category || 'Non catégorisé'}</div>
                <div class="detail-description">${product.description || 'Aucune description disponible'}</div>
                <div class="detail-price">
                    ${priceValue.toFixed(2)} MAD
                    ${oldPrice ? `<span class="old-price">${parseFloat(oldPrice).toFixed(2)} MAD</span>` : ''}
                </div>
                <div class="detail-stock ${(product.stock || 0) > 0 ? '' : 'out-of-stock'}">
                    ${(product.stock || 0) > 0 ? `✅ En stock (${product.stock} unités)` : '❌ Rupture de stock'}
                </div>
                <button class="detail-add-cart" data-id="${product.id}" data-name="${product.name}" data-price="${priceValue}" data-image="${product.image || '📦'}">
                    <i class="fas fa-cart-plus"></i> Ajouter au panier
                </button>
                ${videoHtml}
            </div>
        </div>
    `;

    // Ajouter au panier depuis le détail
    detailContent.querySelector('.detail-add-cart')?.addEventListener('click', function() {
        const productData = {
            id: this.dataset.id,
            name: this.dataset.name,
            prixVente: this.dataset.price,
            image: this.dataset.image
        };
        addToCart(productData);
        showToast(`🛒 ${productData.name} ajouté au panier`);
    });
}

function extractYouTubeId(url) {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

// Fermeture du modal détails
detailClose?.addEventListener('click', () => {
    detailOverlay.classList.remove('active');
    document.body.style.overflow = '';
});

detailOverlay?.addEventListener('click', function(e) {
    if (e.target === detailOverlay) {
        detailOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && detailOverlay?.classList.contains('active')) {
        detailOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ============================================================
// PANIER
// ============================================================
let cart = [];
const cartBadge = document.getElementById('cartBadge');
const cartOverlay = document.getElementById('cartOverlay');
const cartItems = document.getElementById('cartItems');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const cartFooter = document.getElementById('cartFooter');
const bagIcon = document.getElementById('bagIcon');
const cartClose = document.getElementById('cartClose');

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: parseFloat(product.prixVente) || 0,
            image: product.image || '📦',
            quantity: 1
        });
    }
    updateCartUI();
    showToast(`🛒 ${product.name} ajouté au panier`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
    showToast('🗑️ Produit retiré du panier');
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartBadge) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'block' : 'none';
    }
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-bag"></i>
                <p>Votre panier est vide</p>
            </div>
        `;
        cartFooter.style.display = 'none';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => {
        let imageHtml = item.image || '📦';
        if (item.image && item.image.startsWith('data:image')) {
            imageHtml = `<img src="${item.image}" />`;
        }
        return `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">${imageHtml}</div>
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-qty">
                        <button onclick="window.decreaseQty('${item.id}')">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="window.increaseQty('${item.id}')">+</button>
                    </div>
                </div>
                <div class="cart-item-price">${(item.price * item.quantity).toFixed(2)} MAD</div>
                <button class="cart-item-remove" onclick="window.removeFromCart('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalPrice.textContent = total.toFixed(2) + ' MAD';
    cartFooter.style.display = 'block';
}

window.removeFromCart = removeFromCart;
window.increaseQty = function(productId) {
    const item = cart.find(i => i.id === productId);
    if (item) { item.quantity += 1; updateCartUI(); }
};
window.decreaseQty = function(productId) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        if (item.quantity <= 1) { removeFromCart(productId); }
        else { item.quantity -= 1; updateCartUI(); }
    }
};

bagIcon?.addEventListener('click', () => { cartOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; });
cartClose?.addEventListener('click', () => { cartOverlay.classList.remove('active'); document.body.style.overflow = ''; });
cartOverlay?.addEventListener('click', function(e) {
    if (e.target === cartOverlay) { cartOverlay.classList.remove('active'); document.body.style.overflow = ''; }
});
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && cartOverlay?.classList.contains('active')) {
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
});

document.getElementById('checkoutBtn')?.addEventListener('click', function() {
    const user = auth.currentUser;
    if (!user) {
        showToast('🔐 Connectez-vous pour commander', true);
        cartOverlay.classList.remove('active');
        openAuthModal();
        return;
    }
    if (cart.length === 0) {
        showToast('⚠️ Panier vide', true);
        return;
    }
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderData = {
        userId: user.uid,
        userName: user.displayName || user.email,
        items: cart,
        total: total,
        status: 'En attente',
        createdAt: serverTimestamp()
    };
    addDoc(collection(db, 'commandes'), orderData)
        .then(() => {
            showToast('✅ Commande passée !');
            cart = [];
            updateCartUI();
            cartOverlay.classList.remove('active');
            document.body.style.overflow = '';
        })
        .catch((error) => {
            console.error('Erreur commande:', error);
            showToast('⚠️ Erreur lors de la commande', true);
        });
});

// ============================================================
// AUTH UI
// ============================================================
export function updateUI(user) {
    const userStatus = document.getElementById('userStatus');
    const userIcon = document.getElementById('userIcon');
    if (user) {
        const displayName = user.displayName || user.email || 'Utilisateur';
        userStatus.textContent = '👤 ' + displayName.split('@')[0];
        userStatus.className = 'user-status logged-in';
        userIcon.style.color = '#4caf50';
        if (navDashboard) navDashboard.style.display = 'inline';
    } else {
        userStatus.textContent = '';
        userStatus.className = 'user-status';
        userIcon.style.color = '';
        if (navDashboard) navDashboard.style.display = 'none';
    }
}

// ============================================================
// MODAL AUTH
// ============================================================
const authOverlay = document.getElementById('authOverlay');
const userIcon = document.getElementById('userIcon');
const authClose = document.getElementById('authClose');

export function openAuthModal() {
    authOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

export function closeAuthModal() {
    authOverlay.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('registerError').classList.add('hidden');
}

userIcon?.addEventListener('click', function() {
    const user = auth.currentUser;
    if (user) {
        if (confirm('Se déconnecter ?')) {
            signOut(auth);
            showToast('👋 Déconnexion réussie');
        }
    } else {
        openAuthModal();
    }
});

authClose?.addEventListener('click', closeAuthModal);
authOverlay?.addEventListener('click', function(e) {
    if (e.target === authOverlay) closeAuthModal();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && authOverlay?.classList.contains('active')) closeAuthModal();
});

// Tabs
const tabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

tabs.forEach(tab => {
    tab.addEventListener('click', function() {
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        const tabName = this.dataset.tab;
        if (tabName === 'login') {
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
// INSCRIPTION & CONNEXION (simplifiés)
// ============================================================
document.getElementById('registerBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    const errorDiv = document.getElementById('registerError');
    errorDiv.classList.add('hidden');

    if (!name || name.length < 2) { errorDiv.classList.remove('hidden'); errorDiv.textContent = '⚠️ Nom requis'; showToast('⚠️ Nom invalide', true); return; }
    if (!email || !isValidEmail(email)) { errorDiv.classList.remove('hidden'); errorDiv.textContent = '⚠️ Email invalide'; showToast('⚠️ Email invalide', true); return; }
    if (!password || password.length < 6) { errorDiv.classList.remove('hidden'); errorDiv.textContent = '⚠️ Mot de passe min 6 caractères'; showToast('⚠️ Mot de passe trop court', true); return; }
    if (password !== confirm) { errorDiv.classList.remove('hidden'); errorDiv.textContent = '⚠️ Mots de passe différents'; showToast('⚠️ Mots de passe différents', true); return; }

    this.disabled = true; this.textContent = 'Création...';
    createUserWithEmailAndPassword(auth, email, password)
        .then((cred) => updateProfile(cred.user, { displayName: name }).then(() => cred.user))
        .then((user) => setDoc(doc(db, 'users', user.uid), { uid: user.uid, name, email, phone: phone || '', role: 'admin', createdAt: serverTimestamp(), lastLogin: serverTimestamp() }))
        .then(() => { showToast('🎉 Bienvenue ' + name + ' !'); closeAuthModal(); registerForm.reset(); })
        .catch((error) => { errorDiv.classList.remove('hidden'); errorDiv.textContent = '⚠️ ' + (error.message || 'Erreur'); showToast('⚠️ ' + error.message, true); })
        .finally(() => { this.disabled = false; this.textContent = 'Créer mon compte'; });
});

document.getElementById('loginBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    errorDiv.classList.add('hidden');

    if (!email || !isValidEmail(email)) { errorDiv.classList.remove('hidden'); errorDiv.textContent = '⚠️ Email invalide'; showToast('⚠️ Email invalide', true); return; }
    if (!password) { errorDiv.classList.remove('hidden'); errorDiv.textContent = '⚠️ Mot de passe requis'; showToast('⚠️ Mot de passe requis', true); return; }

    this.disabled = true; this.textContent = 'Connexion...';
    signInWithEmailAndPassword(auth, email, password)
        .then((cred) => { updateDoc(doc(db, 'users', cred.user.uid), { lastLogin: serverTimestamp() }).catch(() => {}); showToast('✅ Bienvenue ' + (cred.user.displayName || cred.user.email) + ' !'); closeAuthModal(); loginForm.reset(); })
        .catch((error) => { errorDiv.classList.remove('hidden'); errorDiv.textContent = '⚠️ ' + (error.message || 'Erreur'); showToast('⚠️ ' + error.message, true); })
        .finally(() => { this.disabled = false; this.textContent = 'Se connecter'; });
});

document.getElementById('resetPasswordLink')?.addEventListener('click', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    if (!email || !isValidEmail(email)) { showToast('⚠️ Entrez un email valide', true); document.getElementById('loginEmail').focus(); return; }
    sendPasswordResetEmail(auth, email).then(() => showToast('📧 Email envoyé')).catch((error) => showToast('⚠️ ' + error.message, true));
});

onAuthStateChanged(auth, (user) => {
    updateUI(user);
    if (user && authOverlay?.classList.contains('active')) closeAuthModal();
});

// ============================================================
// BOUTONS ACCUEIL
// ============================================================
document.getElementById('shopNowBtn')?.addEventListener('click', () => { showPage('shop'); loadShopProducts('all'); });
document.getElementById('silverBtn')?.addEventListener('click', () => { showPage('shop'); loadShopProducts('all'); });
document.getElementById('lunchBadge')?.addEventListener('click', () => { showToast('🌿 Wellness & Bien-être — MANORA'); });

// ============================================================
// CATÉGORIES ACCUEIL
// ============================================================
document.querySelectorAll('#homeCategories .cat-item').forEach(item => {
    item.addEventListener('click', function() {
        const category = this.textContent.trim();
        showPage('shop');
        loadShopProducts('all');
        setTimeout(() => {
            const items = document.querySelectorAll('#shopCategoryList .category-item');
            items.forEach(el => {
                el.classList.toggle('active', el.textContent.trim() === category);
            });
            renderProducts(category);
        }, 300);
    });
});

console.log('🌿 MANORA · Script principal chargé avec détails produit');
