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
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
const storage = getStorage(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});

console.log('🔥 Firebase initialisé !');

export { app, auth, db, storage };

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
                span.innerHTML = data.name;
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
            if (data.image) {
                btn.innerHTML = `<img src="${data.image}"> ${data.name}`;
            } else {
                btn.textContent = data.name;
            }
            catContainer.appendChild(btn);
        });

        const prodSnapshot = await getDocs(collection(db, 'products'));
        const prodContainer = document.getElementById('storeProducts');
        prodContainer.innerHTML = '';
        
        if (prodSnapshot.empty) {
            prodContainer.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:3rem;color:#999;">
                    <i class="fas fa-box-open" style="font-size:3rem;display:block;margin-bottom:1rem;color:#e8a87c;"></i>
                    <p>Aucun produit disponible pour le moment.</p>
                </div>
            `;
        } else {
            prodSnapshot.forEach(doc => {
                const data = doc.data();
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
                    </div>
                `;
                prodContainer.appendChild(card);
            });
        }

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
        console.error('Erreur chargement store:', error);
        document.getElementById('storeProducts').innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:3rem;color:#c0392b;">
                <i class="fas fa-exclamation-triangle" style="font-size:3rem;display:block;margin-bottom:1rem;"></i>
                <p>Erreur lors du chargement des produits.</p>
            </div>
        `;
        window.showToast('⚠️ Erreur chargement du store', true);
    }
}

// ============================================================
// AUTH STATE
// ============================================================
function updateUI(user) {
    const userStatus = document.getElementById('userStatus');
    const userIcon = document.getElementById('userIcon');

    if (user) {
        const displayName = user.displayName || user.email || 'Utilisateur';
        userStatus.textContent = '👤 ' + displayName.split('@')[0];
        userStatus.className = 'user-status logged-in';
        userIcon.style.color = '#4caf50';
        openAdminPanel(user);
    } else {
        userStatus.textContent = '';
        userStatus.className = 'user-status';
        userIcon.style.color = '';
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
            'products': 'productsPanel',
            'ventes': 'ventesPanel',
            'credits': 'creditsPanel',
            'clients': 'clientsPanel'
        };
        const target = document.getElementById(targetMap[page]);
        if (target) target.classList.add('active');
        
        if (page === 'categories') {
            import('./admin.js').then(module => module.loadCategoriesTable());
        } else if (page === 'products') {
            import('./admin.js').then(module => module.loadProductsTable());
        } else if (page === 'dashboard') {
            import('./admin.js').then(module => module.updateDashboard());
        } else if (page === 'ventes') {
            import('./admin-ventes.js').then(module => {
                if (typeof module.loadVentesPage === 'function') {
                    module.loadVentesPage(document.getElementById('ventesPanel'));
                }
            });
        } else if (page === 'credits') {
            import('./admin-credits.js').then(module => {
                if (typeof module.loadCreditsPage === 'function') {
                    module.loadCreditsPage(document.getElementById('creditsContainer'));
                }
            });
        }
    });
});

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
// AUTRES ÉVÉNEMENTS
// ============================================================
document.getElementById('lunchBadge').addEventListener('click', () => window.showToast('🌿 Wellness & Bien-être'));
document.getElementById('logoLink').addEventListener('click', (e) => { e.preventDefault(); });

document.querySelectorAll('.header-icons i').forEach(icon => {
    if (icon.id === 'userIcon') return;
    icon.addEventListener('click', () => window.showToast('🛍️ Bientôt disponible'));
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
    loadPublicData();
});

// ============================================================
// INITIALISATION
// ============================================================
loadPublicData();

console.log('🌿 MANORA · Store + Admin');
console.log('📊 Firebase Auth + Firestore + Storage actif');
console.log('🛍️ Store disponible avec les données Firebase');
