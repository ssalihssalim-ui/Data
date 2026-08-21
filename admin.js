// ============================================================
// ADMIN.JS - Gestion avec images en Base64 (SANS Firebase Storage)
// ============================================================
import { 
    collection, doc, setDoc, getDocs, updateDoc, deleteDoc,
    query, orderBy, serverTimestamp
} from "firebase/firestore";
import { db } from "./script.js";

// ============================================================
// VARIABLES GLOBALES
// ============================================================
let categoriesData = [];
let productsData = [];
const CURRENCY = 'MAD';
const MAX_IMAGE_SIZE = 800 * 1024; // 800 KB

function formatPrice(p) {
    if (p === undefined || p === null) return '0 ' + CURRENCY;
    return Number(p).toFixed(2) + ' ' + CURRENCY;
}

// ============================================================
// UPLOAD IMAGE EN BASE64 (SANS API EXTERNE)
// ============================================================
async function uploadImage(file) {
    if (!file) return null;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64 = e.target.result;
            // Vérifier la taille
            const sizeInBytes = base64.length * 0.75; // approximation
            if (sizeInBytes > MAX_IMAGE_SIZE) {
                window.showToast('⚠️ Image trop grande (max 800 KB)', true);
                resolve(null);
            } else {
                resolve(base64);
            }
        };
        reader.onerror = function(error) {
            console.error('Erreur lecture fichier:', error);
            reject(error);
        };
        reader.readAsDataURL(file);
    });
}

// ============================================================
// EXPORT / IMPORT / DELETE ALL
// ============================================================
window.exportData = async function() {
    try {
        const catSnap = await getDocs(collection(db, 'categories'));
        const prodSnap = await getDocs(collection(db, 'products'));
        const data = { categories: [], products: [], exportedAt: new Date().toISOString() };
        catSnap.forEach(d => data.categories.push({ id: d.id, ...d.data() }));
        prodSnap.forEach(d => data.products.push({ id: d.id, ...d.data() }));
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `manora_data_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        window.showToast('✅ Données exportées !');
    } catch (e) { window.showToast('⚠️ ' + e.message, true); }
};

window.importData = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        let imported = 0;
        for (const cat of data.categories) {
            const { id, ...catData } = cat;
            await setDoc(doc(db, 'categories', id || doc(collection(db, 'categories')).id), catData);
            imported++;
        }
        for (const prod of data.products) {
            const { id, ...prodData } = prod;
            await setDoc(doc(db, 'products', id || doc(collection(db, 'products')).id), prodData);
            imported++;
        }
        window.showToast(`✅ ${imported} éléments importés !`);
        loadCategories(); loadProducts(); loadCategoriesTable(); loadProductsTable(); updateDashboard();
    } catch (e) { window.showToast('⚠️ ' + e.message, true); }
};

window.deleteAllData = async function() {
    if (!confirm('⚠️ Supprimer TOUTES les catégories et produits ?')) return;
    if (!confirm('⚠️ CONFIRMATION FINALE : IRRÉVERSIBLE !')) return;
    try {
        window.showToast('🗑️ Suppression...', false);
        const prodSnap = await getDocs(collection(db, 'products'));
        for (const d of prodSnap.docs) await deleteDoc(doc(db, 'products', d.id));
        const catSnap = await getDocs(collection(db, 'categories'));
        for (const d of catSnap.docs) await deleteDoc(doc(db, 'categories', d.id));
        window.showToast(`✅ ${prodSnap.size + catSnap.size} éléments supprimés !`);
        loadCategories(); loadProducts(); loadCategoriesTable(); loadProductsTable(); updateDashboard();
    } catch (e) { window.showToast('⚠️ ' + e.message, true); }
};

// ============================================================
// CATÉGORIES
// ============================================================
export async function loadCategories() {
    try {
        const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        categoriesData = [];
        snap.forEach(d => categoriesData.push({ id: d.id, ...d.data() }));
        renderCategories();
    } catch (e) { console.error(e); }
}

function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;
    container.innerHTML = '';
    categoriesData.forEach(cat => {
        const span = document.createElement('span');
        span.className = 'cat-item';
        span.dataset.category = cat.id;
        span.innerHTML = cat.image ? `<img src="${cat.image}" alt="${cat.name}">${cat.name}` : cat.name;
        container.appendChild(span);
    });
}

export async function loadCategoriesTable() {
    try {
        const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        const tbody = document.getElementById('categoriesTableBody');
        tbody.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${data.image ? `<img src="${data.image}" class="table-img">` : '-'}</td>
                <td><strong>${data.name || ''}</strong></td>
                <td>${data.description || '-'}</td>
                <td>${data.order || 0}</td>
                <td>${formatPrice(data.ca || 0)}</td>
                <td>${formatPrice(data.profit || 0)}</td>
                <td>${data.productCount || 0}</td>
                <td><div class="action-btns">
                    <button class="btn-edit-small" onclick="window.editCategory('${d.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-danger-small" onclick="window.deleteCategory('${d.id}')"><i class="fas fa-trash"></i></button>
                </div></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) { console.error(e); }
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
    const preview = document.getElementById('catImagePreview');
    preview.innerHTML = data.image ? `<img src="${data.image}">` : '';
    document.getElementById('categoryModal').classList.add('active');
};

window.deleteCategory = async function(id) {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
        await deleteDoc(doc(db, 'categories', id));
        window.showToast('✅ Catégorie supprimée');
        loadCategories(); loadCategoriesTable(); updateDashboard();
    } catch (e) { window.showToast('⚠️ ' + e.message, true); }
};

// ============================================================
// PRODUITS
// ============================================================
export async function loadProducts() {
    try {
        const snap = await getDocs(collection(db, 'products'));
        productsData = [];
        snap.forEach(d => productsData.push({ id: d.id, ...d.data() }));
        renderProducts();
    } catch (e) { console.error(e); }
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
                <div class="product-price">${promo ? `<span>${prod.sellPrice} MAD</span> ${prod.promoPrice} MAD` : (prod.sellPrice || 0) + ' MAD'}</div>
                <div style="font-size:0.6rem;color:#999;">Stock: ${prod.stock || 0}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

export async function loadProductsTable() {
    try {
        const snap = await getDocs(collection(db, 'products'));
        const tbody = document.getElementById('productsTableBody');
        tbody.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            const profit = (data.sellPrice || 0) - (data.buyPrice || 0);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${data.image ? `<img src="${data.image}" class="table-img">` : '-'}</td>
                <td><strong>${data.name || ''}</strong></td>
                <td>${data.category || '-'}</td>
                <td>${data.brand || '-'}</td>
                <td>${formatPrice(data.buyPrice || 0)}</td>
                <td>${formatPrice(data.sellPrice || 0)}</td>
                <td style="color:${profit >= 0 ? '#27ae60' : '#e74c3c'}">${formatPrice(profit)}</td>
                <td>${data.stock || 0}</td>
                <td>${data.promoPrice && data.promoPrice > 0 ? formatPrice(data.promoPrice) : '-'}</td>
                <td>${data.supplier || '-'}</td>
                <td>${formatPrice(data.ca || 0)}</td>
                <td>${formatPrice(data.profit || 0)}</td>
                <td><div class="action-btns">
                    <button class="btn-edit-small" onclick="window.editProduct('${d.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-danger-small" onclick="window.deleteProduct('${d.id}')"><i class="fas fa-trash"></i></button>
                </div></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) { console.error(e); }
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
    const preview = document.getElementById('prodImagePreview');
    preview.innerHTML = data.image ? `<img src="${data.image}">` : '';
    loadCategoriesForSelect(data.category);
    document.getElementById('productModal').classList.add('active');
};

window.deleteProduct = async function(id) {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
        await deleteDoc(doc(db, 'products', id));
        window.showToast('✅ Produit supprimé');
        loadProducts(); loadProductsTable(); updateDashboard();
    } catch (e) { window.showToast('⚠️ ' + e.message, true); }
};

// ============================================================
// DASHBOARD
// ============================================================
export async function updateDashboard() {
    try {
        const catSnap = await getDocs(collection(db, 'categories'));
        const prodSnap = await getDocs(collection(db, 'products'));
        let totalStock = 0, totalCA = 0;
        prodSnap.forEach(d => { const data = d.data(); totalStock += data.stock || 0; totalCA += data.ca || 0; });
        document.getElementById('statCategories').textContent = catSnap.size;
        document.getElementById('statProducts').textContent = prodSnap.size;
        document.getElementById('statStock').textContent = totalStock;
        document.getElementById('statCA').textContent = formatPrice(totalCA);
    } catch (e) { console.error(e); }
}

async function loadCategoriesForSelect(selectedId) {
    const select = document.getElementById('prodCategory');
    select.innerHTML = '<option value="">Sélectionner</option>';
    const snap = await getDocs(collection(db, 'categories'));
    snap.forEach(d => {
        const data = d.data();
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = data.name;
        if (d.id === selectedId) opt.selected = true;
        select.appendChild(opt);
    });
}

// ============================================================
// MODALS EVENTS
// ============================================================
// Category Modal
document.getElementById('btnAddCategory').addEventListener('click', () => {
    document.getElementById('categoryId').value = '';
    document.getElementById('catName').value = '';
    document.getElementById('catDescription').value = '';
    document.getElementById('catImage').value = '';
    document.getElementById('catOrder').value = '0';
    document.getElementById('catImageInput').value = '';
    document.getElementById('catImagePreview').innerHTML = '';
    document.getElementById('categoryModalTitle').textContent = 'Ajouter une catégorie';
    document.getElementById('categoryModal').classList.add('active');
});
document.getElementById('closeCategoryModal').addEventListener('click', () => {
    document.getElementById('categoryModal').classList.remove('active');
});
document.getElementById('categoryModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) document.getElementById('categoryModal').classList.remove('active');
});
document.getElementById('catImageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            document.getElementById('catImagePreview').innerHTML = `<img src="${ev.target.result}">`;
        };
        reader.readAsDataURL(file);
    }
});
document.getElementById('categoryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('categoryId').value;
    const file = document.getElementById('catImageInput').files[0];
    let imageUrl = document.getElementById('catImage').value;
    if (file) {
        const uploaded = await uploadImage(file);
        if (uploaded) imageUrl = uploaded;
    }
    const data = {
        name: document.getElementById('catName').value.trim(),
        description: document.getElementById('catDescription').value.trim(),
        image: imageUrl || '',
        order: parseInt(document.getElementById('catOrder').value) || 0,
        updatedAt: serverTimestamp()
    };
    try {
        if (id) await updateDoc(doc(db, 'categories', id), data);
        else await setDoc(doc(collection(db, 'categories')), data);
        window.showToast(id ? '✅ Catégorie mise à jour' : '✅ Catégorie créée');
        document.getElementById('categoryModal').classList.remove('active');
        loadCategories(); loadCategoriesTable(); updateDashboard();
    } catch (e) { window.showToast('⚠️ ' + e.message, true); }
});

// Product Modal
document.getElementById('btnAddProduct').addEventListener('click', async () => {
    document.getElementById('productId').value = '';
    document.getElementById('prodName').value = '';
    document.getElementById('prodBrand').value = '';
    document.getElementById('prodSupplier').value = '';
    document.getElementById('prodBuyPrice').value = '';
    document.getElementById('prodSellPrice').value = '';
    document.getElementById('prodStock').value = '';
    document.getElementById('prodPromoPrice').value = '';
    document.getElementById('prodImage').value = '';
    document.getElementById('prodImageInput').value = '';
    document.getElementById('prodImagePreview').innerHTML = '';
    document.getElementById('prodCA').value = '0';
    document.getElementById('prodProfit').value = '0';
    document.getElementById('productModalTitle').textContent = 'Ajouter un produit';
    await loadCategoriesForSelect('');
    document.getElementById('productModal').classList.add('active');
});
document.getElementById('closeProductModal').addEventListener('click', () => {
    document.getElementById('productModal').classList.remove('active');
});
document.getElementById('productModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) document.getElementById('productModal').classList.remove('active');
});
document.getElementById('prodImageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            document.getElementById('prodImagePreview').innerHTML = `<img src="${ev.target.result}">`;
        };
        reader.readAsDataURL(file);
    }
});
document.getElementById('productForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const file = document.getElementById('prodImageInput').files[0];
    let imageUrl = document.getElementById('prodImage').value;
    if (file) {
        const uploaded = await uploadImage(file);
        if (uploaded) imageUrl = uploaded;
    }
    const data = {
        name: document.getElementById('prodName').value.trim(),
        category: document.getElementById('prodCategory').value,
        brand: document.getElementById('prodBrand').value.trim(),
        supplier: document.getElementById('prodSupplier').value.trim(),
        buyPrice: parseFloat(document.getElementById('prodBuyPrice').value) || 0,
        sellPrice: parseFloat(document.getElementById('prodSellPrice').value) || 0,
        stock: parseInt(document.getElementById('prodStock').value) || 0,
        promoPrice: parseFloat(document.getElementById('prodPromoPrice').value) || 0,
        image: imageUrl || '',
        ca: parseFloat(document.getElementById('prodCA').value) || 0,
        profit: parseFloat(document.getElementById('prodProfit').value) || 0,
        updatedAt: serverTimestamp()
    };
    try {
        if (id) await updateDoc(doc(db, 'products', id), data);
        else await setDoc(doc(collection(db, 'products')), data);
        window.showToast(id ? '✅ Produit mis à jour' : '✅ Produit créé');
        document.getElementById('productModal').classList.remove('active');
        loadProducts(); loadProductsTable(); updateDashboard();
    } catch (e) { window.showToast('⚠️ ' + e.message, true); }
});

// ============================================================
// IMPORT/EXPORT EVENTS
// ============================================================
document.getElementById('exportDataBtn').addEventListener('click', window.exportData);
document.getElementById('importDataBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
});
document.getElementById('importFile').addEventListener('change', window.importData);
document.getElementById('deleteAllBtn').addEventListener('click', window.deleteAllData);

console.log('📊 Admin.js chargé - Upload en Base64');
console.log('💱 Devise: ' + CURRENCY);
