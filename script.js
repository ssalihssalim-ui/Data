// ============================================================
// SCRIPT.JS - Navigation, Auth, Catalogue
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
// BOUTIQUE - CHARGER PRODUITS DEPUIS FIRESTORE
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

function renderProducts(category = 'all') {
    const grid = document.getElementById('productsGrid');
    const count = document.getElementById('productCount');
    const filtered = category === 'all' ? products : products.filter(p => p.category === category);

    count.textContent = `${filtered.length} produits`;

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><p>Aucun produit</p></div>`;
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <div class="product-card" data-id="${p.id}">
            <div class="product-image">${p.image || '📦'}</div>
            <div class="product-info">
                <h4>${p.name}</h4>
                <p>${p.description || ''}</p>
                <div class="product-price">${p.price || '0 MAD'}</div>
            </div>
        </div>
    `).join('');
}

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
// BOUTONS ACCUEIL
// ============================================================
document.getElementById('shopNowBtn')?.addEventListener('click', () => {
    showPage('shop');
    loadShopProducts('all');
});

document.getElementById('silverBtn')?.addEventListener('click', () => {
    showPage('shop');
    loadShopProducts('all');
});

document.getElementById('lunchBadge')?.addEventListener('click', () => {
    showToast('🌿 Wellness & Bien-être — MANORA');
});

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

// ============================================================
// ICÔNES HEADER
// ============================================================
document.querySelectorAll('.header-icons i').forEach(icon => {
    if (icon.id === 'userIcon') return;
    icon.addEventListener('click', function() {
        const user = auth.currentUser;
        if (!user && this.dataset.icon === 'bag') {
            showToast('🛍️ Connectez-vous pour commander', true);
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

console.log('🌿 MANORA · Script principal chargé');
