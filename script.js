// ============================================================
// 1. CONFIGURATION FIREBASE (À REMPLACER AVEC VOS CLÉS)
// ============================================================
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJECT.firebaseapp.com",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_PROJECT.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};

// Initialisation
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ============================================================
// 2. ÉLÉMENTS DOM
// ============================================================
const productsGrid = document.getElementById('productsGrid');
const cartBadge = document.getElementById('cartBadge');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartItems = document.getElementById('cartItems');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');

// ============================================================
// 3. ÉTAT DU PANIER (localStorage)
// ============================================================
let cart = [];

function loadCart() {
    const stored = localStorage.getItem('noir_cart');
    if (stored) {
        cart = JSON.parse(stored);
    } else {
        cart = [];
    }
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('noir_cart', JSON.stringify(cart));
    updateCartUI();
}

// ============================================================
// 4. AFFICHAGE DES PRODUITS DEPUIS FIRESTORE
// ============================================================
async function fetchProducts() {
    try {
        const querySnapshot = await db.collection('products').get();
        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });

        if (products.length === 0) {
            productsGrid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--mid-gray);">
                    <p>Aucun produit trouvé. Ajoutez-en dans Firestore !</p>
                    <p style="font-size:0.8rem; margin-top:8px;">Collection : "products"</p>
                </div>
            `;
            return;
        }

        renderProducts(products);
    } catch (error) {
        console.error("Erreur Firestore :", error);
        productsGrid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--danger);">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Impossible de charger les produits. Vérifiez votre configuration Firestore.</p>
                <pre style="font-size:0.7rem; margin-top:10px; background:#f0f0f0; padding:10px; border-radius:4px;">${error.message}</pre>
            </div>
        `;
    }
}

function renderProducts(products) {
    let html = '';
    products.forEach((product) => {
        // Gestion des champs manquants
        const name = product.name || 'Sans nom';
        const price = product.price || 0;
        const image = product.image || 'https://picsum.photos/seed/' + product.id + '/400/500';
        const desc = product.description || 'Pièce minimaliste';

        html += `
            <div class="product-card">
                <img src="${image}" alt="${name}" class="product-image" loading="lazy" />
                <div class="product-info">
                    <h3 class="product-name">${name}</h3>
                    <p class="product-desc">${desc}</p>
                    <p class="product-price">${price.toFixed(2)} €</p>
                    <button class="add-to-cart" data-id="${product.id}" data-name="${name}" data-price="${price}" data-image="${image}">
                        Ajouter au panier
                    </button>
                </div>
            </div>
        `;
    });

    productsGrid.innerHTML = html;

    // Ajout des écouteurs sur les boutons "Ajouter"
    document.querySelectorAll('.add-to-cart').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const id = btn.dataset.id;
            const name = btn.dataset.name;
            const price = parseFloat(btn.dataset.price);
            const image = btn.dataset.image;
            addToCart({ id, name, price, image });
        });
    });
}

// ============================================================
// 5. FONCTIONS DU PANIER
// ============================================================
function addToCart(product) {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    // Animation / feedback rapide
    const badge = cartBadge;
    badge.style.transform = 'scale(1.4)';
    setTimeout(() => badge.style.transform = 'scale(1)', 200);
}

function removeFromCart(productId) {
    cart = cart.filter((item) => item.id !== productId);
    saveCart();
    renderCartItems();
}

function updateCartUI() {
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartBadge.textContent = totalItems;
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
    cart.forEach((item) => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        html += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" />
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>${item.quantity} x ${item.price.toFixed(2)} €</p>
                </div>
                <button class="cart-item-remove" data-id="${item.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    });

    cartItems.innerHTML = html;
    cartTotalPrice.textContent = total.toFixed(2) + ' €';

    // Écouteurs de suppression
    document.querySelectorAll('.cart-item-remove').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            removeFromCart(id);
        });
    });
}

// ============================================================
// 6. OUVERTURE / FERMETURE DU PANIER
// ============================================================
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
// 7. INITIALISATION
// ============================================================
loadCart();
fetchProducts();

// Petit message console pour le développeur
console.log('🖤 Boutique NOIR - Firestore connecté.');
