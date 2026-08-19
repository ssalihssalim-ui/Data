// ============================================================
// IMPORTS FIREBASE
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
import { getFirestore } from "firebase/firestore";

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

console.log('🔥 Firebase initialisé !');

// Exporter pour admin.js
export { app, auth, db };

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
};

// ============================================================
// VALIDATION EMAIL
// ============================================================
window.isValidEmail = function(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
};

// ============================================================
// AUTH STATE
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
        // Charger les données admin via admin.js
        import('./admin.js').then(module => {
            module.loadCategories();
            module.loadProducts();
            module.updateDashboard();
        });
    } else {
        userStatus.textContent = '';
        userStatus.className = 'user-status';
        userIcon.style.color = '';
        if (navDashboard) navDashboard.style.display = 'none';
        if (navCategories) navCategories.style.display = 'none';
        if (navProducts) navProducts.style.display = 'none';
        document.getElementById('dashboardPanel').style.display = 'none';
        document.getElementById('categoriesPanel').style.display = 'none';
        document.getElementById('productsPanel').style.display = 'none';
        document.getElementById('publicCategories').style.display = 'block';
        document.getElementById('publicProducts').style.display = 'block';
        document.getElementById('heroSection').style.display = 'flex';
    }
}

// ============================================================
// MODAL AUTH
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
    if (!email || !window.isValidEmail(email)) {
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
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = '⚠️ Nom invalide';
        return;
    }
    if (!email || !window.isValidEmail(email)) {
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = '⚠️ Email invalide';
        return;
    }
    if (!password || password.length < 6) {
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = '⚠️ Mot de passe minimum 6 caractères';
        return;
    }
    if (password !== confirm) {
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = '⚠️ Les mots de passe ne correspondent pas';
        return;
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
    if (!email || !window.isValidEmail(email)) {
        window.showToast('⚠️ Email valide requis', true);
        document.getElementById('loginEmail').focus();
        return;
    }
    sendPasswordResetEmail(auth, email)
        .then(() => window.showToast('📧 Email envoyé à ' + email))
        .catch((error) => window.showToast('⚠️ ' + error.message, true));
});

// ============================================================
// NAVIGATION ADMIN
// ============================================================
let currentPanel = 'public';

function showPanel(panel) {
    const hero = document.getElementById('heroSection');
    const publicCat = document.getElementById('publicCategories');
    const publicProd = document.getElementById('publicProducts');
    const dashboard = document.getElementById('dashboardPanel');
    const categories = document.getElementById('categoriesPanel');
    const products = document.getElementById('productsPanel');

    hero.style.display = 'none';
    publicCat.style.display = 'none';
    publicProd.style.display = 'none';
    dashboard.style.display = 'none';
    categories.style.display = 'none';
    products.style.display = 'none';

    if (panel === 'public') {
        hero.style.display = 'flex';
        publicCat.style.display = 'block';
        publicProd.style.display = 'block';
    } else if (panel === 'dashboard') {
        dashboard.style.display = 'block';
        import('./admin.js').then(module => module.updateDashboard());
    } else if (panel === 'categories') {
        categories.style.display = 'block';
        import('./admin.js').then(module => module.loadCategoriesTable());
    } else if (panel === 'products') {
        products.style.display = 'block';
        import('./admin.js').then(module => module.loadProductsTable());
    }
    currentPanel = panel;
}

window.showPanel = showPanel;

document.getElementById('navDashboard').addEventListener('click', (e) => {
    e.preventDefault();
    if (!auth.currentUser) { window.showToast('🔐 Connectez-vous', true); openAuthModal(); return; }
    showPanel('dashboard');
});

document.getElementById('navCategories').addEventListener('click', (e) => {
    e.preventDefault();
    if (!auth.currentUser) { window.showToast('🔐 Connectez-vous', true); openAuthModal(); return; }
    showPanel('categories');
});

document.getElementById('navProducts').addEventListener('click', (e) => {
    e.preventDefault();
    if (!auth.currentUser) { window.showToast('🔐 Connectez-vous', true); openAuthModal(); return; }
    showPanel('products');
});

// ============================================================
// AUTRES ÉVÉNEMENTS
// ============================================================
document.getElementById('shopNowBtn').addEventListener('click', function(e) {
    e.preventDefault();
    if (!auth.currentUser) { window.showToast('🔐 Connectez-vous', true); openAuthModal(); return; }
    window.showToast('✨ Produit ajouté au panier');
});

document.getElementById('silverBtn').addEventListener('click', function() {
    if (!auth.currentUser) { window.showToast('🔐 Connectez-vous', true); openAuthModal(); return; }
    window.showToast('🌿 Collection Wellness');
});

document.getElementById('lunchBadge').addEventListener('click', () => window.showToast('🌿 Wellness & Bien-être'));
document.getElementById('logoLink').addEventListener('click', (e) => { e.preventDefault(); showPanel('public'); });

document.querySelectorAll('.header-icons i').forEach(icon => {
    if (icon.id === 'userIcon') return;
    icon.addEventListener('click', function() {
        if (!auth.currentUser && this.dataset.icon !== 'search') {
            window.showToast('🔐 Connectez-vous', true);
            openAuthModal();
            return;
        }
        window.showToast('🛍️ Bientôt disponible');
    });
});

document.querySelectorAll('.footer-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        window.showToast('📄 Page en construction');
    });
});

document.querySelectorAll('.footer-social i').forEach(icon => {
    icon.addEventListener('click', () => window.showToast('📱 Bientôt disponible'));
});

// ============================================================
// AUTH STATE LISTENER
// ============================================================
onAuthStateChanged(auth, (user) => {
    updateUI(user);
    if (user) {
        if (authOverlay.classList.contains('active')) closeAuthModal();
        if (currentPanel === 'public') showPanel('public');
    } else {
        showPanel('public');
    }
});

// ============================================================
// INITIALISATION
// ============================================================
showPanel('public');

console.log('🌿 MANORA · Beauty & Wellness');
console.log('📊 Firebase Auth actif');
