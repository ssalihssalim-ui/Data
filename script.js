// ============================================================
// 1. CONFIGURATION FIREBASE (À REMPLACER)
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
// 2. DONNÉES DE DÉMONSTRATION (fallback si Firestore vide)
// ============================================================
const MOCK_PRODUCTS = [
    { id: 'mock1', name: 'Typewriter', price: 9.99, image: 'https://picsum.photos/seed/type/400/400', description: 'Vintage' },
    { id: 'mock2', name: 'Vintage Camera', price: 9.99, image: 'https://picsum.photos/seed/camera/400/400', description: 'Analog' },
    { id: 'mock3', name: 'Coffee Mug', price: 0.00, image: 'https://picsum.photos/seed/mug/400/400', description: 'Ceramic' },
    { id: 'mock4', name: 'Journal', price: 5.99, image: 'https://picsum.photos/seed/journal/400/400', description: 'Notebook' },
    { id: 'mock5', name: 'Minimalist Clock', price: 14.99, image: 'https://picsum.photos/seed/clock/400/400', description: 'Wall' },
    { id: 'mock6', name: 'Desk Lamp', price: 19.99, image: 'https://picsum.photos/seed/lamp/400/400', description: 'LED' },
    { id: 'mock7', name: 'Art Print', price: 12.00, image: 'https://picsum.photos/seed/print/400/400', description: 'Abstract' },
    { id: 'mock8', name: 'Plant Pot', price: 8.50, image: 'https://picsum.photos/seed/pot/400/400', description: 'Terracotta' }
];

// ============================================================
// 3. DOM
// ============================================================
const bestSellersGrid = document.getElementById('bestSellersGrid');
const newArrivalsGrid = document.getElementById('newArrivalsGrid');
const cartBadge = document.getElementById('cartBadge');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartItems = document.getElementById('cartItems');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');

// ============================================================
// 4. PANIER (localStorage)
// ============================================================
let cart = [];

function loadCart() {
    const stored = localStorage.getItem('white_cart');
    cart = stored ? JSON.parse(stored) : [];
    updateCartUI();
}
function saveCart() {
    localStorage.setItem('white_cart', JSON.stringify(cart));
    updateCartUI();
}

// ============================================================
// 5. AFFICHAGE DES PRODUITS
// ============================================================
function renderProducts(container, products) {
    if (!products || products.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:30px; color:var(--mid-gray);">Aucun produit disponible.</div>`;
        return;
    }

    let html = '';
    products.forEach(p => {
        const name = p.name || 'Sans nom';
        const price = p.price || 0;
        const image = p.image || `https://picsum.photos/seed/${p.id}/400/400`;
        const desc = p.description || '';

        html += `
            <div class="product-card">
                <img src="${image}" alt="${name}" class="product-image" loading="lazy" />
                <div class="product-info">
                    <h3 class="product-name">${name}</h3>
                    ${desc ? `<p class="product-desc">${desc}</p>` : ''}
                    <p class="product-price">${price.toFixed(2)} €</p>
                    <button class="add-to-cart" 
                            data-id="${p.id}" 
                            data-name="${name}" 
                            data-price="${price}" 
                            data-image="${image}">
                        Ajouter au panier
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Écouteurs "Ajouter"
    container.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', () => {
            addToCart({
                id: btn.dataset.id,
                name: btn.dataset.name,
                price: parseFloat(btn.dataset.price),
                image: btn.dataset.image
            });
        });
    });
}

function displayProducts(products) {
    // On prend les 4 premiers pour Best Sellers, les 4 suivants pour New Arrivals
    const best = products.slice(0, 4);
    const newItems = products.slice(4, 8);
    renderProducts(bestSellersGrid, best);
    renderProducts(newArrivalsGrid, newItems);
}

// ============================================================
// 6. RÉCUPÉRATION FIRESTORE + FALLBACK
// ============================================================
async function fetchProducts() {
    try {
        const snapshot = await db.collection('products').get();
        if (snapshot.empty) {
            // Si Firestore est vide, on utilise les données mockées
            console.warn('Firestore vide, utilisation des données de démonstration.');
            displayProducts(MOCK_PRODUCTS);
            return;
        }

        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        displayProducts(products);
    } catch (error) {
        console.error('Erreur Firestore :', error);
        // En cas d'erreur (configuration manquante), on utilise les mock
        displayProducts(MOCK_PRODUCTS);
    }
}

// ============================================================
// 7. FONCTIONS PANIER
// ============================================================
function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    // Animation du badge
    cartBadge.style.transform = 'scale(1.3)';
    setTimeout(() => cartBadge.style.transform = 'scale(1)', 200);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCartItems();
}

function updateCartUI() {
    const total = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartBadge.textContent = total;
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
    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        html += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" />
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>${item.quantity} × ${item.price.toFixed(2)} €</p>
                </div>
                <button class="cart-item-remove" data-id="${item.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    });

    cartItems.innerHTML = html;
    cartTotalPrice.textContent = total.toFixed(2) + ' €';

    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
    });
}

// ============================================================
// 8. OUVERTURE / FERMETURE PANIER
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
// 9. INITIALISATION
// ============================================================
loadCart();
fetchProducts();

console.log('✨ White Artistry — Prêt !');
