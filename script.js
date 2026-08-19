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
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    onSnapshot
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
const auth = getAuth(app);
const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});

console.log('🔥 Firebase initialisé !');

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
// VALIDATION EMAIL
// ============================================================
function isValidEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

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
        // Afficher les liens admin
        if (navDashboard) navDashboard.style.display = 'inline';
        if (navCategories) navCategories.style.display = 'inline';
        if (navProducts) navProducts.style.display = 'inline';
        // Charger les données
        loadCategories();
        loadProducts();
        updateDashboard();
    } else {
        userStatus.textContent = '';
        userStatus.className = 'user-status';
        userIcon.style.color = '';
        if (navDashboard) navDashboard.style.display = 'none';
        if (navCategories) navCategories.style.display = 'none';
        if (navProducts) navProducts.style.display = 'none';
        // Cacher les panels admin
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
            showToast('👋 Déconnecté');
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
    if (!email || !isValidEmail(email)) {
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
            updateDoc(doc(db, 'users', user.uid), { lastLogin: serverTimestamp() }).catch(() => {});
            showToast('✅ Bienvenue ' + (user.displayName || user.email) + ' !');
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
            showToast('⚠️ ' + message, true);
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
    if (!email || !isValidEmail(email)) {
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
        .then((user) => {
            const userData = {
                uid: user.uid, name, email, phone: phone || '',
                role: 'admin',
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                emailVerified: user.emailVerified || false,
                preferences: { newsletter: false, promotions: false },
                address: { line1: '', line2: '', city: '', postalCode: '', country: 'France' }
            };
            return setDoc(doc(db, 'users', user.uid), userData).then(() => user);
        })
        .then(() => {
            showToast('🎉 Bienvenue ' + name + ' !');
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
            showToast('⚠️ ' + message, true);
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
    if (!email || !isValidEmail(email)) {
        showToast('⚠️ Email valide requis', true);
        document.getElementById('loginEmail').focus();
        return;
    }
    sendPasswordResetEmail(auth, email)
        .then(() => showToast('📧 Email envoyé à ' + email))
        .catch((error) => showToast('⚠️ ' + error.message, true));
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

    // Cacher tout
    hero.style.display = 'none';
    publicCat.style.display = 'none';
    publicProd.style.display = 'none';
    dashboard.style.display = 'none';
    categories.style.display = 'none';
    products.style.display = 'none';

    // Afficher le panel demandé
    if (panel === 'public') {
        hero.style.display = 'flex';
        publicCat.style.display = 'block';
        publicProd.style.display = 'block';
    } else if (panel === 'dashboard') {
        dashboard.style.display = 'block';
        updateDashboard();
    } else if (panel === 'categories') {
        categories.style.display = 'block';
        loadCategoriesTable();
    } else if (panel === 'products') {
        products.style.display = 'block';
        loadProductsTable();
    }
    currentPanel = panel;
}

document.getElementById('navDashboard').addEventListener('click', (e) => {
    e.preventDefault();
    if (!auth.currentUser) { showToast('🔐 Connectez-vous', true); openAuthModal(); return; }
    showPanel('dashboard');
});

document.getElementById('navCategories').addEventListener('click', (e) => {
    e.preventDefault();
    if (!auth.currentUser) { showToast('🔐 Connectez-vous', true); openAuthModal(); return; }
    showPanel('categories');
});

document.getElementById('navProducts').addEventListener('click', (e) => {
    e.preventDefault();
    if (!auth.currentUser) { showToast('🔐 Connectez-vous', true); openAuthModal(); return; }
    showPanel('products');
});

// ============================================================
// CRUD CATÉGORIES
// ============================================================
let categoriesData = [];

async function loadCategories() {
    try {
        const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        categoriesData = [];
        snapshot.forEach(doc => {
            categoriesData.push({ id: doc.id, ...doc.data() });
        });
        renderCategories();
    } catch (error) {
        console.error('Erreur chargement catégories:', error);
    }
}

function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;
    container.innerHTML = '';
    categoriesData.forEach(cat => {
        const span = document.createElement('span');
        span.className = 'cat-item';
        span.dataset.category = cat.id;
        span.innerHTML = cat.image ? `<img src="${cat.image}" alt="${cat.name}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:6px;">` : '';
        span.innerHTML += cat.name;
        container.appendChild(span);
    });
}

async function loadCategoriesTable() {
    try {
        const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const tbody = document.getElementById('categoriesTableBody');
        tbody.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${data.image ? `<img src="${data.image}" class="table-img">` : '-'}</td>
                <td><strong>${data.name}</strong></td>
                <td>${data.description || '-'}</td>
                <td>${data.order || 0}</td>
                <td>${data.ca || 0} €</td>
                <td>${data.profit || 0} €</td>
                <td>${data.productCount || 0}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-edit-small" onclick="editCategory('${doc.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-danger-small" onclick="deleteCategory('${doc.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Erreur chargement table catégories:', error);
    }
}

window.editCategory = function(id) {
    const data = categoriesData.find(c => c.id === id);
    if (!data) return;
    document.getElementById('categoryId').value = id;
    document.getElementById('catName').value = data.name || '';
    document.getElementById('catDescription').value = data.description || '';
    document.getElementById('catImage').value = data.image || '';
    document.getElementById('catOrder').value = data.order || 0;
    document.getElementById('categoryModalTitle').textContent = 'Modifier la catégorie';
    document.getElementById('categoryModal').classList.add('active');
};

window.deleteCategory = async function(id) {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
        await deleteDoc(doc(db, 'categories', id));
        showToast('✅ Catégorie supprimée');
        loadCategories();
        loadCategoriesTable();
        updateDashboard();
    } catch (error) {
        showToast('⚠️ ' + error.message, true);
    }
};

// ============================================================
// CRUD PRODUITS
// ============================================================
let productsData = [];

async function loadProducts() {
    try {
        const snapshot = await getDocs(collection(db, 'products'));
        productsData = [];
        snapshot.forEach(doc => {
            productsData.push({ id: doc.id, ...doc.data() });
        });
        renderProducts();
    } catch (error) {
        console.error('Erreur chargement produits:', error);
    }
}

function renderProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    container.innerHTML = '';
    productsData.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const promo = prod.promoPrice && prod.promoPrice > 0 && prod.promoPrice < prod.sellPrice;
        card.innerHTML = `
            <img src="${prod.image || 'https://via.placeholder.com/200x200?text=MANORA'}" alt="${prod.name}">
            <div class="product-info">
                <h4>${prod.name}</h4>
                <span class="product-category">${prod.category || ''}</span>
                <div class="product-price">${promo ? `<span style="text-decoration:line-through;color:#999;font-size:0.7rem;">${prod.sellPrice}€</span> ${prod.promoPrice}€` : prod.sellPrice + '€'}</div>
                <div style="font-size:0.6rem;color:#999;">Stock: ${prod.stock || 0}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

async function loadProductsTable() {
    try {
        const snapshot = await getDocs(collection(db, 'products'));
        const tbody = document.getElementById('productsTableBody');
        tbody.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const profit = (data.sellPrice || 0) - (data.buyPrice || 0);
            const totalProfit = (data.profit || 0) * (data.stock || 0);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${data.image ? `<img src="${data.image}" class="table-img">` : '-'}</td>
                <td><strong>${data.name}</strong></td>
                <td>${data.category || '-'}</td>
                <td>${data.brand || '-'}</td>
                <td>${data.buyPrice || 0} €</td>
                <td>${data.sellPrice || 0} €</td>
                <td style="color:${profit >= 0 ? '#27ae60' : '#e74c3c'}">${profit.toFixed(2)} €</td>
                <td>${data.stock || 0}</td>
                <td>${data.promoPrice && data.promoPrice > 0 ? data.promoPrice + ' €' : '-'}</td>
                <td>${data.supplier || '-'}</td>
                <td>${data.ca || 0} €</td>
                <td>${data.profit || 0} €</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-edit-small" onclick="editProduct('${doc.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-danger-small" onclick="deleteProduct('${doc.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Erreur chargement table produits:', error);
    }
}

window.editProduct = function(id) {
    const data = productsData.find(p => p.id === id);
    if (!data) return;
    document.getElementById('productId').value = id;
    document.getElementById('prodName').value = data.name || '';
    document.getElementById('prodCategory').value = data.category || '';
    document.getElementById('prodBrand').value = data.brand || '';
    document.getElementById('prodSupplier').value = data.supplier || '';
    document.getElementById('prodBuyPrice').value = data.buyPrice || '';
    document.getElementById('prodSellPrice').value = data.sellPrice || '';
    document.getElementById('prodStock').value = data.stock || '';
    document.getElementById('prodPromoPrice').value = data.promoPrice || '';
    document.getElementById('prodImage').value = data.image || '';
    document.getElementById('prodCA').value = data.ca || 0;
    document.getElementById('prodProfit').value = data.profit || 0;
    document.getElementById('productModalTitle').textContent = 'Modifier le produit';
    document.getElementById('productModal').classList.add('active');
};

window.deleteProduct = async function(id) {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
        await deleteDoc(doc(db, 'products', id));
        showToast('✅ Produit supprimé');
        loadProducts();
        loadProductsTable();
        updateDashboard();
    } catch (error) {
        showToast('⚠️ ' + error.message, true);
    }
};

// ============================================================
// DASHBOARD
// ============================================================
async function updateDashboard() {
    try {
        const catSnapshot = await getDocs(collection(db, 'categories'));
        const prodSnapshot = await getDocs(collection(db, 'products'));
        
        let totalStock = 0;
        let totalCA = 0;
        let totalProfit = 0;
        
        prodSnapshot.forEach(doc => {
            const data = doc.data();
            totalStock += data.stock || 0;
            totalCA += data.ca || 0;
            totalProfit += data.profit || 0;
        });
        
        document.getElementById('statCategories').textContent = catSnapshot.size;
        document.getElementById('statProducts').textContent = prodSnapshot.size;
        document.getElementById('statStock').textContent = totalStock;
        document.getElementById('statCA').textContent = totalCA.toFixed(2) + ' €';
    } catch (error) {
        console.error('Erreur dashboard:', error);
    }
}

// ============================================================
// MODALS CATÉGORIE
// ============================================================
document.getElementById('btnAddCategory').addEventListener('click', () => {
    document.getElementById('categoryId').value = '';
    document.getElementById('catName').value = '';
    document.getElementById('catDescription').value = '';
    document.getElementById('catImage').value = '';
    document.getElementById('catOrder').value = '0';
    document.getElementById('categoryModalTitle').textContent = 'Ajouter une catégorie';
    document.getElementById('categoryModal').classList.add('active');
});

document.getElementById('closeCategoryModal').addEventListener('click', () => {
    document.getElementById('categoryModal').classList.remove('active');
});

document.getElementById('categoryModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('categoryModal').classList.remove('active');
    }
});

document.getElementById('categoryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('categoryId').value;
    const data = {
        name: document.getElementById('catName').value.trim(),
        description: document.getElementById('catDescription').value.trim(),
        image: document.getElementById('catImage').value.trim(),
        order: parseInt(document.getElementById('catOrder').value) || 0,
        updatedAt: serverTimestamp()
    };

    try {
        if (id) {
            await updateDoc(doc(db, 'categories', id), data);
            showToast('✅ Catégorie mise à jour');
        } else {
            await setDoc(doc(collection(db, 'categories')), data);
            showToast('✅ Catégorie créée');
        }
        document.getElementById('categoryModal').classList.remove('active');
        loadCategories();
        loadCategoriesTable();
        updateDashboard();
    } catch (error) {
        showToast('⚠️ ' + error.message, true);
    }
});

// ============================================================
// MODALS PRODUIT
// ============================================================
document.getElementById('btnAddProduct').addEventListener('click', async () => {
    document.getElementById('productId').value = '';
    document.getElementById('prodName').value = '';
    document.getElementById('prodCategory').value = '';
    document.getElementById('prodBrand').value = '';
    document.getElementById('prodSupplier').value = '';
    document.getElementById('prodBuyPrice').value = '';
    document.getElementById('prodSellPrice').value = '';
    document.getElementById('prodStock').value = '';
    document.getElementById('prodPromoPrice').value = '';
    document.getElementById('prodImage').value = '';
    document.getElementById('prodCA').value = '0';
    document.getElementById('prodProfit').value = '0';
    document.getElementById('productModalTitle').textContent = 'Ajouter un produit';
    
    // Charger les catégories dans le select
    const select = document.getElementById('prodCategory');
    select.innerHTML = '<option value="">Sélectionner</option>';
    const snapshot = await getDocs(collection(db, 'categories'));
    snapshot.forEach(doc => {
        const data = doc.data();
        select.innerHTML += `<option value="${doc.id}">${data.name}</option>`;
    });
    
    document.getElementById('productModal').classList.add('active');
});

document.getElementById('closeProductModal').addEventListener('click', () => {
    document.getElementById('productModal').classList.remove('active');
});

document.getElementById('productModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('productModal').classList.remove('active');
    }
});

document.getElementById('productForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const buyPrice = parseFloat(document.getElementById('prodBuyPrice').value) || 0;
    const sellPrice = parseFloat(document.getElementById('prodSellPrice').value) || 0;
    const profit = sellPrice - buyPrice;
    
    const data = {
        name: document.getElementById('prodName').value.trim(),
        category: document.getElementById('prodCategory').value,
        brand: document.getElementById('prodBrand').value.trim(),
        supplier: document.getElementById('prodSupplier').value.trim(),
        buyPrice: buyPrice,
        sellPrice: sellPrice,
        stock: parseInt(document.getElementById('prodStock').value) || 0,
        promoPrice: parseFloat(document.getElementById('prodPromoPrice').value) || 0,
        image: document.getElementById('prodImage').value.trim(),
        ca: parseFloat(document.getElementById('prodCA').value) || 0,
        profit: parseFloat(document.getElementById('prodProfit').value) || 0,
        updatedAt: serverTimestamp()
    };

    try {
        if (id) {
            await updateDoc(doc(db, 'products', id), data);
            showToast('✅ Produit mis à jour');
        } else {
            await setDoc(doc(collection(db, 'products')), data);
            showToast('✅ Produit créé');
        }
        document.getElementById('productModal').classList.remove('active');
        loadProducts();
        loadProductsTable();
        updateDashboard();
    } catch (error) {
        showToast('⚠️ ' + error.message, true);
    }
});

// ============================================================
// AUTRES ÉVÉNEMENTS
// ============================================================
document.getElementById('shopNowBtn').addEventListener('click', function(e) {
    e.preventDefault();
    if (!auth.currentUser) { showToast('🔐 Connectez-vous', true); openAuthModal(); return; }
    showToast('✨ Produit ajouté au panier');
});

document.getElementById('silverBtn').addEventListener('click', function() {
    if (!auth.currentUser) { showToast('🔐 Connectez-vous', true); openAuthModal(); return; }
    showToast('🌿 Collection Wellness');
});

document.getElementById('lunchBadge').addEventListener('click', () => showToast('🌿 Wellness & Bien-être'));
document.getElementById('logoLink').addEventListener('click', (e) => { e.preventDefault(); showPanel('public'); });

document.querySelectorAll('.header-icons i').forEach(icon => {
    if (icon.id === 'userIcon') return;
    icon.addEventListener('click', function() {
        if (!auth.currentUser && this.dataset.icon !== 'search') {
            showToast('🔐 Connectez-vous', true);
            openAuthModal();
            return;
        }
        showToast('🛍️ Bientôt disponible');
    });
});

document.querySelectorAll('.footer-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('📄 Page en construction');
    });
});

document.querySelectorAll('.footer-social i').forEach(icon => {
    icon.addEventListener('click', () => showToast('📱 Bientôt disponible'));
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

console.log('🌿 MANORA · Gestion Catégories & Produits');
console.log('📊 Firebase Auth + Firestore actif');
