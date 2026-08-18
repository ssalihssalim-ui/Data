// ============================================================
// SCRIPT.JS - Navigation, Auth, Catalogue, Interactions
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
    doc,
    setDoc,
    updateDoc,
    serverTimestamp
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
// PRODUITS (devise MAD)
// ============================================================
const products = [
    { id: 1, name: 'Crème Hydratante', category: 'soin', price: '290 MAD', image: '🧴', description: 'Hydratation intense 24h' },
    { id: 2, name: 'Sérum Anti-Âge', category: 'soin', price: '490 MAD', image: '💧', description: 'Réduit les rides' },
    { id: 3, name: 'Fond de Teint', category: 'maquillage', price: '340 MAD', image: '🎨', description: 'Couvrance parfaite' },
    { id: 4, name: 'Mascara Volume', category: 'maquillage', price: '190 MAD', image: '👁️', description: 'Volume intense' },
    { id: 5, name: 'Vitamine C', category: 'vitamines', price: '150 MAD', image: '🍊', description: 'Immunité renforcée' },
    { id: 6, name: 'Vitamine D', category: 'vitamines', price: '120 MAD', image: '☀️', description: 'Énergie et vitalité' },
    { id: 7, name: 'Coffret Beauty', category: 'ensemble', price: '590 MAD', image: '🎁', description: 'Coffret complet' },
    { id: 8, name: 'Set Soin Visage', category: 'ensemble', price: '390 MAD', image: '🧖', description: 'Routine complète' },
    { id: 9, name: 'Accessoire Cheveux', category: 'accessoires', price: '90 MAD', image: '💇', description: 'Élégant et pratique' },
    { id: 10, name: 'Bracelet Bien-être', category: 'accessoires', price: '240 MAD', image: '📿', description: 'Pierre naturelle' },
    { id: 11, name: 'Tapisserie Yoga', category: 'sport', price: '290 MAD', image: '🧘', description: 'Confort et adhérence' },
    { id: 12, name: 'Bouteille Sport', category: 'sport', price: '140 MAD', image: '💪', description: 'Isotherme 1L' },
    { id: 13, name: 'Boîte Coquet', category: 'coquet', price: '220 MAD', image: '🎀', description: 'Fait main' },
    { id: 14, name: 'Sachet Parfumé', category: 'coquet', price: '80 MAD', image: '🌸', description: 'Parfum délicat' },
];

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

// Navigation - Boutique accessible sans connexion
navShop?.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('shop');
    renderProducts('all');
    document.querySelector('.category-item.active')?.classList.remove('active');
    document.querySelector('.category-item[data-category="all"]')?.classList.add('active');
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
// AFFICHAGE CATALOGUE
// ============================================================
const productsGrid = document.getElementById('productsGrid');
const productCount = document.getElementById('productCount');

export function renderProducts(category = 'all') {
    const filtered = category === 'all'
        ? products
        : products.filter(p => p.category === category);

    productCount.textContent = `${filtered.length} produits`;

    if (filtered.length === 0) {
        productsGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:#999;">Aucun produit dans cette catégorie</div>`;
        return;
    }

    productsGrid.innerHTML = filtered.map(p => `
        <div class="product-card" data-id="${p.id}">
            <div class="product-image">${p.image}</div>
            <div class="product-info">
                <h4>${p.name}</h4>
                <p>${p.description}</p>
                <div class="product-price">${p.price}</div>
            </div>
        </div>
    `).join('');
}

// Catégories clics (dans la boutique)
document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.category-item').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        renderProducts(this.dataset.category);
    });
});

// Clic sur produit
document.addEventListener('click', function(e) {
    const card = e.target.closest('.product-card');
    if (card) {
        const name = card.querySelector('h4')?.textContent || 'Produit';
        const price = card.querySelector('.product-price')?.textContent || '';
        showToast(`🛍️ ${name} — ${price} ajouté au panier`);
    }
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
// MODAL
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
        if (confirm('Vous êtes connecté en tant que ' + (user.displayName || user.email) + '. Voulez-vous vous déconnecter ?')) {
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
// INSCRIPTION
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

    if (!name || name.length < 2) {
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = '⚠️ Nom valide requis';
        showToast('⚠️ Nom invalide', true);
        return;
    }
    if (!email || !isValidEmail(email)) {
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = '⚠️ Email invalide';
        showToast('⚠️ Email invalide', true);
        return;
    }
    if (!password || password.length < 6) {
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = '⚠️ Mot de passe min 6 caractères';
        showToast('⚠️ Mot de passe trop court', true);
        return;
    }
    if (password !== confirm) {
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = '⚠️ Les mots de passe ne correspondent pas';
        showToast('⚠️ Les mots de passe ne correspondent pas', true);
        return;
    }

    this.disabled = true;
    this.textContent = 'Création...';

    createUserWithEmailAndPassword(auth, email, password)
        .then((cred) => {
            const user = cred.user;
            return updateProfile(user, { displayName: name }).then(() => user);
        })
        .then((user) => {
            return setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                phone: phone || '',
                role: 'admin',
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            }).then(() => user);
        })
        .then(() => {
            showToast('🎉 Bienvenue ' + name + ' !');
            closeAuthModal();
            registerForm.reset();
        })
        .catch((error) => {
            errorDiv.classList.remove('hidden');
            let message = 'Erreur';
            if (error.code === 'auth/email-already-in-use') message = 'Email déjà utilisé';
            else if (error.code === 'auth/invalid-email') message = 'Email invalide';
            else if (error.code === 'auth/weak-password') message = 'Mot de passe trop faible';
            else message = error.message;
            errorDiv.textContent = '⚠️ ' + message;
            showToast('⚠️ ' + message, true);
        })
        .finally(() => {
            this.disabled = false;
            this.textContent = 'Créer mon compte';
        });
});

// ============================================================
// CONNEXION
// ============================================================
document.getElementById('loginBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    errorDiv.classList.add('hidden');

    if (!email || !isValidEmail(email)) {
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = '⚠️ Email invalide';
        showToast('⚠️ Email invalide', true);
        return;
    }
    if (!password) {
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = '⚠️ Mot de passe requis';
        showToast('⚠️ Mot de passe requis', true);
        return;
    }

    this.disabled = true;
    this.textContent = 'Connexion...';

    signInWithEmailAndPassword(auth, email, password)
        .then((cred) => {
            const user = cred.user;
            updateDoc(doc(db, 'users', user.uid), { lastLogin: serverTimestamp() }).catch(() => {});
            showToast('✅ Bienvenue ' + (user.displayName || user.email) + ' !');
            closeAuthModal();
            loginForm.reset();
        })
        .catch((error) => {
            errorDiv.classList.remove('hidden');
            let message = 'Erreur';
            if (error.code === 'auth/user-not-found') message = 'Aucun compte trouvé';
            else if (error.code === 'auth/wrong-password') message = 'Mot de passe incorrect';
            else if (error.code === 'auth/invalid-email') message = 'Email invalide';
            else if (error.code === 'auth/too-many-requests') message = 'Trop de tentatives';
            else message = error.message;
            errorDiv.textContent = '⚠️ ' + message;
            showToast('⚠️ ' + message, true);
        })
        .finally(() => {
            this.disabled = false;
            this.textContent = 'Se connecter';
        });
});

// ============================================================
// RESET PASSWORD
// ============================================================
document.getElementById('resetPasswordLink')?.addEventListener('click', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    if (!email || !isValidEmail(email)) {
        showToast('⚠️ Entrez un email valide', true);
        document.getElementById('loginEmail').focus();
        return;
    }
    sendPasswordResetEmail(auth, email)
        .then(() => showToast('📧 Email de réinitialisation envoyé'))
        .catch((error) => showToast('⚠️ ' + error.message, true));
});

// ============================================================
// SURVEILLANCE AUTH
// ============================================================
onAuthStateChanged(auth, (user) => {
    updateUI(user);
    if (user && authOverlay?.classList.contains('active')) {
        closeAuthModal();
    }
});

// ============================================================
// BOUTON SHOP NOW - Accessible sans connexion
// ============================================================
document.getElementById('shopNowBtn')?.addEventListener('click', function() {
    showPage('shop');
    renderProducts('all');
    document.querySelector('.category-item.active')?.classList.remove('active');
    document.querySelector('.category-item[data-category="all"]')?.classList.add('active');
});

// ============================================================
// BOUTON SILVER - Accessible sans connexion
// ============================================================
document.getElementById('silverBtn')?.addEventListener('click', function() {
    showPage('shop');
    renderProducts('all');
    document.querySelector('.category-item.active')?.classList.remove('active');
    document.querySelector('.category-item[data-category="all"]')?.classList.add('active');
});

// ============================================================
// LUNCH BADGE
// ============================================================
document.getElementById('lunchBadge')?.addEventListener('click', function() {
    showToast('🌿 Wellness & Bien-être — MANORA');
});

// ============================================================
// ICÔNES HEADER
// ============================================================
document.querySelectorAll('.header-icons i').forEach(icon => {
    if (icon.id === 'userIcon') return;
    icon.addEventListener('click', function() {
        const user = auth.currentUser;
        if (!user && this.dataset.icon === 'bag') {
            showToast('🛍️ Connectez-vous pour finaliser votre commande', true);
            openAuthModal();
            return;
        }
        const iconType = this.dataset.icon || '';
        let label = 'Action';
        if (iconType === 'search') label = 'Recherche';
        else if (iconType === 'bag') label = 'Panier';
        showToast(`🛍️ ${label} — bientôt disponible`);
    });
});

// ============================================================
// CATÉGORIES ACCUEIL - Accessibles sans connexion
// ============================================================
document.querySelectorAll('#homeCategories .cat-item').forEach(item => {
    item.addEventListener('click', function() {
        const category = this.textContent.trim();
        showPage('shop');
        const catMap = {
            'Soin': 'soin',
            'Maquillage': 'maquillage',
            'Vitamines': 'vitamines',
            'Ensemble': 'ensemble',
            'Coquet': 'coquet',
            'Accessoires': 'accessoires',
            'Sport': 'sport'
        };
        const catKey = catMap[category] || 'all';
        document.querySelectorAll('.category-item').forEach(c => c.classList.remove('active'));
        document.querySelector(`.category-item[data-category="${catKey}"]`)?.classList.add('active');
        renderProducts(catKey);
    });
});

console.log('🌿 MANORA · Script principal chargé - Boutique accessible sans connexion - Devise MAD');
