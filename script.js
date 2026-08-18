// ============================================================
// IMPORTS FIREBASE (Version 12.17.1 - Modulaire)
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js";
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
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

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
// INITIALISATION FIREBASE
// ============================================================
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Activer la persistance (rester connecté)
setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
        console.warn('Erreur persistance:', error);
    });

console.log('🔥 Firebase 12.17.1 initialisé !');
console.log('📁 Projet:', firebaseConfig.projectId);

// ============================================================
// TOAST SYSTEM
// ============================================================
function showToast(msg, isError = false) {
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
// UPDATE UI
// ============================================================
function updateUI(user) {
    const userStatus = document.getElementById('userStatus');
    const userIcon = document.getElementById('userIcon');

    if (user) {
        const displayName = user.displayName || user.email || 'Utilisateur';
        userStatus.textContent = '👤 ' + displayName.split('@')[0];
        userStatus.className = 'user-status logged-in';
        userIcon.style.color = '#4caf50';
    } else {
        userStatus.textContent = '';
        userStatus.className = 'user-status';
        userIcon.style.color = '';
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

if (userIcon) {
    userIcon.addEventListener('click', function() {
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
}

if (authClose) {
    authClose.addEventListener('click', closeAuthModal);
}

authOverlay.addEventListener('click', function(e) {
    if (e.target === authOverlay) {
        closeAuthModal();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && authOverlay.classList.contains('active')) {
        closeAuthModal();
    }
});

// ============================================================
// TABS
// ============================================================
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
// INSCRIPTION AVEC FIRESTORE
// ============================================================
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirm = document.getElementById('registerConfirm').value;
        const errorDiv = document.getElementById('registerError');

        errorDiv.classList.add('hidden');

        // Validations
        if (!name || !email || !password || !confirm) {
            errorDiv.classList.remove('hidden');
            errorDiv.textContent = '⚠️ Veuillez remplir tous les champs obligatoires';
            showToast('⚠️ Veuillez remplir tous les champs', true);
            return;
        }

        if (password !== confirm) {
            errorDiv.classList.remove('hidden');
            errorDiv.textContent = '⚠️ Les mots de passe ne correspondent pas';
            showToast('⚠️ Les mots de passe ne correspondent pas', true);
            return;
        }

        if (password.length < 6) {
            errorDiv.classList.remove('hidden');
            errorDiv.textContent = '⚠️ Le mot de passe doit faire au moins 6 caractères';
            showToast('⚠️ Mot de passe trop court (min 6 caractères)', true);
            return;
        }

        const registerBtn = document.getElementById('registerBtn');
        registerBtn.disabled = true;
        registerBtn.textContent = 'Création en cours...';

        console.log('📝 Création du compte Auth...');

        // 1. Création du compte
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log('✅ Compte Auth créé:', user.uid);

                // Mettre à jour le nom
                return updateProfile(user, {
                    displayName: name
                }).then(() => user);
            })
            .then((user) => {
                console.log('📝 Enregistrement dans Firestore...');

                // 2. Enregistrement dans Firestore
                const userData = {
                    uid: user.uid,
                    name: name,
                    email: email,
                    phone: phone || '',
                    role: 'client',
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    emailVerified: user.emailVerified || false,
                    preferences: {
                        newsletter: false,
                        promotions: false
                    },
                    address: {
                        line1: '',
                        line2: '',
                        city: '',
                        postalCode: '',
                        country: 'France'
                    }
                };

                return setDoc(doc(db, 'users', user.uid), userData).then(() => user);
            })
            .then((user) => {
                console.log('✅ Document Firestore créé !');
                showToast('🎉 Bienvenue ' + name + ' ! Votre compte est créé');
                closeAuthModal();
                registerForm.reset();
            })
            .catch((error) => {
                console.error('❌ ERREUR:', error);
                errorDiv.classList.remove('hidden');

                let message = 'Erreur lors de l\'inscription';
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        message = 'Cet email est déjà utilisé par un autre compte';
                        break;
                    case 'auth/invalid-email':
                        message = 'L\'adresse email n\'est pas valide';
                        break;
                    case 'auth/weak-password':
                        message = 'Le mot de passe est trop faible (min 6 caractères)';
                        break;
                    case 'auth/network-request-failed':
                        message = 'Problème de connexion réseau. Vérifiez votre internet.';
                        break;
                    default:
                        message = error.message;
                }

                errorDiv.textContent = '⚠️ ' + message;
                showToast('⚠️ ' + message, true);
            })
            .finally(() => {
                registerBtn.disabled = false;
                registerBtn.textContent = 'Créer mon compte';
            });
    });
}

// ============================================================
// CONNEXION
// ============================================================
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');

        errorDiv.classList.add('hidden');

        if (!email || !password) {
            errorDiv.classList.remove('hidden');
            errorDiv.textContent = '⚠️ Veuillez remplir tous les champs';
            showToast('⚠️ Veuillez remplir tous les champs', true);
            return;
        }

        const loginBtn = document.getElementById('loginBtn');
        loginBtn.disabled = true;
        loginBtn.textContent = 'Connexion...';

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;

                // Mettre à jour lastLogin
                updateDoc(doc(db, 'users', user.uid), {
                    lastLogin: serverTimestamp()
                }).catch(() => {});

                showToast('✅ Bienvenue ' + (user.displayName || user.email) + ' !');
                closeAuthModal();
                loginForm.reset();
            })
            .catch((error) => {
                errorDiv.classList.remove('hidden');
                let message = 'Erreur de connexion';

                switch (error.code) {
                    case 'auth/user-not-found':
                        message = 'Aucun compte trouvé avec cet email';
                        break;
                    case 'auth/wrong-password':
                        message = 'Mot de passe incorrect';
                        break;
                    case 'auth/invalid-email':
                        message = 'Email invalide';
                        break;
                    case 'auth/too-many-requests':
                        message = 'Trop de tentatives, réessayez plus tard';
                        break;
                    default:
                        message = error.message;
                }

                errorDiv.textContent = '⚠️ ' + message;
                showToast('⚠️ ' + message, true);
            })
            .finally(() => {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Se connecter';
            });
    });
}

// ============================================================
// RESET PASSWORD
// ============================================================
document.getElementById('resetPasswordLink').addEventListener('click', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();

    if (!email) {
        showToast('⚠️ Veuillez entrer votre email', true);
        document.getElementById('loginEmail').focus();
        return;
    }

    sendPasswordResetEmail(auth, email)
        .then(() => {
            showToast('📧 Email de réinitialisation envoyé à ' + email);
        })
        .catch((error) => {
            let message = 'Erreur';
            if (error.code === 'auth/user-not-found') {
                message = 'Aucun compte trouvé avec cet email';
            } else {
                message = error.message;
            }
            showToast('⚠️ ' + message, true);
        });
});

// ============================================================
// SURVEILLANCE DE L'ÉTAT AUTH
// ============================================================
onAuthStateChanged(auth, (user) => {
    updateUI(user);
    if (user && authOverlay.classList.contains('active')) {
        closeAuthModal();
    }
});

// ============================================================
// ÉVÉNEMENTS DU SITE
// ============================================================

// Bouton Shop Now
const shopBtn = document.getElementById('shopNowBtn');
if (shopBtn) {
    shopBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) {
            showToast('🔐 Connectez-vous pour commander', true);
            openAuthModal();
            return;
        }
        const originalText = this.textContent;
        this.textContent = '✓ Ajouté';
        this.style.background = '#e8a87c';
        this.style.color = '#111';
        setTimeout(() => {
            this.textContent = originalText;
            this.style.background = '#1a1a1a';
            this.style.color = '#f5f2ec';
        }, 1200);
        showToast('✨ Produit ajouté au panier');
    });
}

// Bouton Découvrir
const silverBtn = document.getElementById('silverBtn');
if (silverBtn) {
    silverBtn.addEventListener('click', function() {
        const user = auth.currentUser;
        if (!user) {
            showToast('🔐 Connectez-vous pour découvrir', true);
            openAuthModal();
            return;
        }
        const originalText = this.textContent;
        this.textContent = '✓ Exploré';
        this.style.borderColor = '#e8a87c';
        this.style.background = '#e8a87c';
        this.style.color = 'white';
        setTimeout(() => {
            this.textContent = originalText;
            this.style.background = 'white';
            this.style.color = '#1a1a1a';
            this.style.borderColor = '#e8a87c';
        }, 1000);
        showToast('🌿 Collection Wellness — découvrez nos produits');
    });
}

// Catégories
document.querySelectorAll('.cat-item').forEach((el) => {
    el.addEventListener('click', function() {
        const category = this.dataset.category || this.textContent.trim();
        const user = auth.currentUser;
        if (!user) {
            showToast('🔐 Connectez-vous pour voir les ' + category, true);
            openAuthModal();
            return;
        }
        showToast(`🔍 ${category} — découvrez notre sélection`);
    });
});

// Lunch Badge
document.getElementById('lunchBadge').addEventListener('click', function() {
    showToast('🌿 Wellness & Bien-être — MANORA');
});

// Logo
document.getElementById('logoLink').addEventListener('click', function(e) {
    e.preventDefault();
    showToast('🌿 MANORA — Beauty & Wellness');
});

// Icônes header
document.querySelectorAll('.header-icons i').forEach(icon => {
    if (icon.id === 'userIcon') return;
    icon.addEventListener('click', function() {
        const user = auth.currentUser;
        if (!user && this.dataset.icon !== 'search') {
            showToast('🔐 Connectez-vous pour accéder à cette fonction', true);
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

// Footer links
document.querySelectorAll('.footer-links a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        showToast(`📄 ${this.dataset.footer || this.textContent.trim()} — page en construction`);
    });
});

// Social icons
document.querySelectorAll('.footer-social i').forEach(icon => {
    icon.addEventListener('click', function() {
        showToast(`📱 ${this.dataset.social || 'réseau social'} — bientôt disponible`);
    });
});

console.log('🌿 MANORA · Beauty & Wellness — Firebase Auth + Firestore actif');
console.log('📊 Les utilisateurs sont enregistrés dans Firestore collection "users"');
