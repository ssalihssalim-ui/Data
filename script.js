// ============================================================
// 1. FIREBASE CONFIG (remplacer par vos clés)
// ============================================================
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJECT.firebaseapp.com",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_PROJECT.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ============================================================
// 2. DOM
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
// 3. PANIER (localStorage)
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
// 4. RÉCUPÉRATION DES PRODUITS FIRESTORE
// ============================================================
async function fetchProducts() {
    try {
        const snapshot = await db.collection('products').get();
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        if (products.length === 0) {
            const emptyMsg = `<div style="grid-column:1/-1; text-align:center; padding:30px; color:var(--mid-gray);">Aucun produit en base. Ajoutez-en dans Firestore.</div>`;
            bestSellersGrid.innerHTML = emptyMsg;
            newArrivalsGrid.innerHTML = emptyMsg;
            return;
        }

        // On affiche les 4 premiers en Best Sellers, les suivants en New Arrivals
        const best = products.slice(0, 4);
        const newItems = products.slice(4, 8);

        renderProducts(bestSellersGrid, best);
        renderProducts(newArrivalsGrid, newItems);
    } catch (error) {
        console.error("Firestore error:", error);
        const errMsg = `<div style="grid-column:1/-1; text-align:center; padding:30px; color:#999;">⚠️ Erreur de chargement. Vérifiez votre configuration.</div>`;
        bestSellersGrid.innerHTML = errMsg;
        newArrivalsGrid.innerHTML = errMsg;
    }
}

function renderProducts(container, products) {
    if (!products || products.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:20px; color:var(--mid-gray); font-size:0.8rem;">Aucun produit dans cette catégorie.</div>`;
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

// ============================================================
// 5. FONCTIONS PANIER (identiques)
// ============================================================
function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
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
// 6. OUVERTURE / FERMETURE PANIER
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
// 7. INIT
// ============================================================
loadCart();
fetchProducts();

console.log('✨ White Artistry – Firestore connecté.');
