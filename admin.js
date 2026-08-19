// ============================================================
// IMPORTS
// ============================================================
import { 
    collection,
    doc,
    setDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import { db } from "./script.js";

// ============================================================
// VARIABLES GLOBALES
// ============================================================
let categoriesData = [];
let productsData = [];

// ============================================================
// CRUD CATÉGORIES
// ============================================================
export async function loadCategories() {
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
        if (cat.image) {
            span.innerHTML = `<img src="${cat.image}" alt="${cat.name}">${cat.name}`;
        } else {
            span.innerHTML = cat.name;
        }
        container.appendChild(span);
    });
}

export async function loadCategoriesTable() {
    try {
        const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const tbody = document.getElementById('categoriesTableBody');
        tbody.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const tr = document.createElement('tr');
            const profit = (data.profit || 0);
            tr.innerHTML = `
                <td>${data.image ? `<img src="${data.image}" class="table-img">` : '-'}</td>
                <td><strong>${data.name || ''}</strong></td>
                <td>${data.description || '-'}</td>
                <td>${data.order || 0}</td>
                <td>${data.ca || 0} €</td>
                <td>${profit} €</td>
                <td>${data.productCount || 0}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-edit-small" onclick="window.editCategory('${doc.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-danger-small" onclick="window.deleteCategory('${doc.id}')"><i class="fas fa-trash"></i></button>
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
        window.showToast('✅ Catégorie supprimée');
        loadCategories();
        loadCategoriesTable();
        updateDashboard();
    } catch (error) {
        window.showToast('⚠️ ' + error.message, true);
    }
};

// ============================================================
// CRUD PRODUITS
// ============================================================
export async function loadProducts() {
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
        const imgSrc = prod.image || 'https://via.placeholder.com/200x200?text=MANORA';
        card.innerHTML = `
            <img src="${imgSrc}" alt="${prod.name}">
            <div class="product-info">
                <h4>${prod.name || ''}</h4>
                <span class="product-category">${prod.category || ''}</span>
                <div class="product-price">${promo ? `<span>${prod.sellPrice}€</span> ${prod.promoPrice}€` : (prod.sellPrice || 0) + '€'}</div>
                <div style="font-size:0.6rem;color:#999;">Stock: ${prod.stock || 0}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

export async function loadProductsTable() {
    try {
        const snapshot = await getDocs(collection(db, 'products'));
        const tbody = document.getElementById('productsTableBody');
        tbody.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const profit = (data.sellPrice || 0) - (data.buyPrice || 0);
            const totalProfit = (data.profit || 0);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${data.image ? `<img src="${data.image}" class="table-img">` : '-'}</td>
                <td><strong>${data.name || ''}</strong></td>
                <td>${data.category || '-'}</td>
                <td>${data.brand || '-'}</td>
                <td>${data.buyPrice || 0} €</td>
                <td>${data.sellPrice || 0} €</td>
                <td style="color:${profit >= 0 ? '#27ae60' : '#e74c3c'}">${profit.toFixed(2)} €</td>
                <td>${data.stock || 0}</td>
                <td>${data.promoPrice && data.promoPrice > 0 ? data.promoPrice + ' €' : '-'}</td>
                <td>${data.supplier || '-'}</td>
                <td>${data.ca || 0} €</td>
                <td>${totalProfit} €</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-edit-small" onclick="window.editProduct('${doc.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-danger-small" onclick="window.deleteProduct('${doc.id}')"><i class="fas fa-trash"></i></button>
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
        window.showToast('✅ Produit supprimé');
        loadProducts();
        loadProductsTable();
        updateDashboard();
    } catch (error) {
        window.showToast('⚠️ ' + error.message, true);
    }
};

// ============================================================
// DASHBOARD
// ============================================================
export async function updateDashboard() {
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
            window.showToast('✅ Catégorie mise à jour');
        } else {
            await setDoc(doc(collection(db, 'categories')), data);
            window.showToast('✅ Catégorie créée');
        }
        document.getElementById('categoryModal').classList.remove('active');
        loadCategories();
        loadCategoriesTable();
        updateDashboard();
    } catch (error) {
        window.showToast('⚠️ ' + error.message, true);
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
            window.showToast('✅ Produit mis à jour');
        } else {
            await setDoc(doc(collection(db, 'products')), data);
            window.showToast('✅ Produit créé');
        }
        document.getElementById('productModal').classList.remove('active');
        loadProducts();
        loadProductsTable();
        updateDashboard();
    } catch (error) {
        window.showToast('⚠️ ' + error.message, true);
    }
});

console.log('📊 Admin.js chargé - Gestion Catégories & Produits');
