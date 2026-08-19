// ============================================================
// ADMIN.JS - CRUD COMPLET AVEC UPLOAD D'IMAGES (Base64)
// ============================================================
import { auth, db, showToast } from './script.js';
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
    collection,
    doc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    addDoc
} from "firebase/firestore";

console.log('📊 Admin.js chargé - CRUD avec upload d\'images');

// ============================================================
// FONCTION POUR CONVERTIR UNE IMAGE EN BASE64
// ============================================================
function imageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// ============================================================
// CONFIGURATION DES SECTIONS
// ============================================================
const SECTIONS = {
    categories: {
        label: 'Catégories',
        icon: '🏷️',
        collection: 'categories',
        fields: [
            { name: 'image', label: 'Image', type: 'file', required: false, accept: 'image/*' },
            { name: 'name', label: 'Nom', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'text', required: false },
            { name: 'chiffreAffaire', label: 'CA (MAD)', type: 'text', required: false },
            { name: 'nbProduits', label: 'Nb Produits', type: 'number', required: false },
            { name: 'profit', label: 'Profit (MAD)', type: 'text', required: false }
        ],
        displayFields: ['image', 'name', 'description', 'chiffreAffaire', 'nbProduits', 'profit']
    },

    produits: {
        label: 'Produits',
        icon: '📦',
        collection: 'produits',
        fields: [
            { name: 'image', label: 'Image', type: 'file', required: false, accept: 'image/*' },
            { name: 'name', label: 'Nom du produit', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'text', required: false },
            { name: 'prixAchat', label: "Prix d'achat (MAD)", type: 'text', required: true },
            { name: 'prixVente', label: 'Prix de vente (MAD)', type: 'text', required: true },
            { name: 'profit', label: 'Profit (MAD)', type: 'text', required: false },
            { name: 'chiffreAffaire', label: 'CA (MAD)', type: 'text', required: false },
            { name: 'category', label: 'Catégorie', type: 'text', required: false },
            { name: 'stock', label: 'Stock', type: 'number', required: false }
        ],
        displayFields: ['image', 'name', 'prixAchat', 'prixVente', 'profit', 'chiffreAffaire']
    },

    clients: {
        label: 'Clients',
        icon: '👥',
        collection: 'clients',
        fields: [
            { name: 'name', label: 'Nom complet', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'phone', label: 'Téléphone', type: 'text', required: false },
            { name: 'address', label: 'Adresse', type: 'text', required: false },
            { name: 'city', label: 'Ville', type: 'text', required: false }
        ],
        displayFields: ['name', 'email', 'phone', 'city']
    },

    fournisseurs: {
        label: 'Fournisseurs',
        icon: '🚚',
        collection: 'fournisseurs',
        fields: [
            { name: 'name', label: 'Nom', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: false },
            { name: 'phone', label: 'Téléphone', type: 'text', required: false },
            { name: 'address', label: 'Adresse', type: 'text', required: false },
            { name: 'productType', label: 'Type de produits', type: 'text', required: false }
        ],
        displayFields: ['name', 'email', 'phone', 'productType']
    },

    ventes: {
        label: 'Ventes',
        icon: '📈',
        collection: 'ventes',
        fields: [
            { name: 'clientName', label: 'Client', type: 'text', required: true },
            { name: 'productName', label: 'Produit', type: 'text', required: true },
            { name: 'quantity', label: 'Quantité', type: 'number', required: true },
            { name: 'unitPrice', label: 'Prix unitaire (MAD)', type: 'text', required: true },
            { name: 'totalPrice', label: 'Total (MAD)', type: 'text', required: true },
            { name: 'status', label: 'Statut', type: 'select', required: true, options: ['En attente', 'Payée', 'Livrée', 'Annulée'] }
        ],
        displayFields: ['clientName', 'productName', 'totalPrice', 'status']
    },

    credits: {
        label: 'Crédits',
        icon: '💳',
        collection: 'credits',
        fields: [
            { name: 'clientName', label: 'Client', type: 'text', required: true },
            { name: 'amount', label: 'Montant (MAD)', type: 'text', required: true },
            { name: 'dueDate', label: "Échéance", type: 'date', required: false },
            { name: 'status', label: 'Statut', type: 'select', required: true, options: ['En cours', 'Payé', 'En retard'] }
        ],
        displayFields: ['clientName', 'amount', 'dueDate', 'status']
    }
};

// ============================================================
// LE RESTE DU CODE...
// ============================================================
let currentSection = 'categories';
let editingId = null;

onAuthStateChanged(auth, async (user) => {
    const userName = document.getElementById('dashboardUserName');
    const dashboardPage = document.getElementById('pageDashboard');

    if (!user) {
        dashboardPage.style.display = 'none';
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            userName.textContent = data.name || user.displayName || user.email || 'Utilisateur';
        } else {
            userName.textContent = user.displayName || user.email || 'Utilisateur';
        }
    } catch (error) {
        userName.textContent = user.displayName || user.email || 'Utilisateur';
    }

    dashboardPage.style.display = 'block';
    loadSection('categories');
});

// ============================================================
// CHARGER UNE SECTION
// ============================================================
export async function loadSection(section) {
    currentSection = section;
    const config = SECTIONS[section];
    if (!config) return;

    const content = document.getElementById('dashboardSectionContent');
    const title = document.getElementById('dashboardTitle');
    const subtitle = document.getElementById('dashboardSubtitle');

    title.textContent = `${config.icon} ${config.label}`;
    subtitle.textContent = `Gestion des ${config.label.toLowerCase()}`;

    try {
        const q = query(collection(db, config.collection), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const items = [];
        snapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() });
        });

        const headers = config.displayFields.map(f => {
            const labels = {
                'image': 'Image',
                'name': 'Nom',
                'description': 'Description',
                'chiffreAffaire': 'CA (MAD)',
                'nbProduits': 'Nb Produits',
                'profit': 'Profit (MAD)',
                'prixAchat': 'Prix Achat',
                'prixVente': 'Prix Vente',
                'category': 'Catégorie',
                'stock': 'Stock',
                'email': 'Email',
                'phone': 'Téléphone',
                'city': 'Ville',
                'productType': 'Type produits',
                'clientName': 'Client',
                'productName': 'Produit',
                'quantity': 'Qté',
                'unitPrice': 'Prix unitaire',
                'totalPrice': 'Total',
                'status': 'Statut',
                'amount': 'Montant',
                'dueDate': 'Échéance'
            };
            return labels[f] || f.charAt(0).toUpperCase() + f.slice(1);
        });

        content.innerHTML = `
            <div class="dashboard-toolbar">
                <h3>Liste des ${config.label.toLowerCase()}</h3>
                <button class="btn-add" onclick="window.openCrudModal('${section}')">
                    <i class="fas fa-plus"></i> Ajouter
                </button>
            </div>
            <div class="dashboard-table-wrapper">
                ${items.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-${section === 'categories' ? 'tags' : section === 'produits' ? 'box' : section === 'clients' ? 'users' : section === 'fournisseurs' ? 'truck' : section === 'ventes' ? 'chart-line' : 'credit-card'}"></i>
                        <p>Aucun ${config.label.toLowerCase()} enregistré</p>
                    </div>
                ` : `
                    <table class="dashboard-table">
                        <thead>
                            <tr>
                                ${headers.map(h => `<th>${h}</th>`).join('')}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    ${config.displayFields.map(f => {
                                        if (f === 'image') {
                                            if (item.image && item.image.startsWith('data:image')) {
                                                return `<td><img src="${item.image}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;" /></td>`;
                                            }
                                            return `<td>${item.image || '📦'}</td>`;
                                        }
                                        if (f === 'profit' && item.prixVente && item.prixAchat) {
                                            const profit = parseFloat(item.prixVente) - parseFloat(item.prixAchat);
                                            return `<td>${profit.toFixed(2)} MAD</td>`;
                                        }
                                        return `<td>${item[f] || '-'}</td>`;
                                    }).join('')}
                                    <td>
                                        <div class="actions">
                                            <button class="edit-btn" onclick="window.openCrudModal('${section}', '${item.id}')">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="delete-btn" onclick="window.deleteItem('${section}', '${item.id}')">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `}
            </div>
        `;
    } catch (error) {
        console.error('Erreur chargement:', error);
        showToast('⚠️ Erreur chargement des données', true);
    }
}

// ============================================================
// CRUD MODAL AVEC UPLOAD D'IMAGES
// ============================================================
const crudOverlay = document.getElementById('crudOverlay');
const crudClose = document.getElementById('crudClose');
const crudForm = document.getElementById('crudForm');
const crudFields = document.getElementById('crudFields');
const crudTitle = document.getElementById('crudTitle');
const crudSubmit = document.getElementById('crudSubmit');

window.openCrudModal = function(section, id = null) {
    const config = SECTIONS[section];
    if (!config) return;

    editingId = id;
    crudTitle.textContent = id ? `✏️ Modifier ${config.label}` : `➕ Ajouter ${config.label}`;
    crudSubmit.textContent = id ? 'Mettre à jour' : 'Ajouter';

    crudFields.innerHTML = config.fields.map(f => `
        <div class="form-group">
            <label for="crud_${f.name}">${f.label} ${f.required ? '*' : ''}</label>
            ${f.type === 'select' ? `
                <select id="crud_${f.name}" ${f.required ? 'required' : ''}>
                    <option value="">Sélectionner...</option>
                    ${f.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>
            ` : f.type === 'file' ? `
                <input type="file" id="crud_${f.name}" accept="${f.accept || 'image/*'}" />
                <div class="image-preview" id="preview_${f.name}"></div>
                <small style="color:#999;font-size:0.6rem;">JPG, PNG, GIF</small>
            ` : `
                <input type="${f.type}" id="crud_${f.name}" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''} />
            `}
        </div>
    `).join('');

    config.fields.forEach(f => {
        if (f.type === 'file') {
            const input = document.getElementById(`crud_${f.name}`);
            const preview = document.getElementById(`preview_${f.name}`);
            if (input && preview) {
                input.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(event) {
                            preview.innerHTML = `<img src="${event.target.result}" />`;
                        };
                        reader.readAsDataURL(file);
                    } else {
                        preview.innerHTML = '';
                    }
                });
            }
        }
    });

    if (id) {
        loadItemData(section, id);
    }

    crudOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeCrudModal = function() {
    crudOverlay.classList.remove('active');
    document.body.style.overflow = '';
    editingId = null;
    crudForm.reset();
    document.querySelectorAll('.image-preview').forEach(el => el.innerHTML = '');
};

crudClose?.addEventListener('click', window.closeCrudModal);
crudOverlay?.addEventListener('click', function(e) {
    if (e.target === crudOverlay) window.closeCrudModal();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && crudOverlay?.classList.contains('active')) {
        window.closeCrudModal();
    }
});

// ============================================================
// CHARGER DONNÉES POUR MODIFICATION
// ============================================================
async function loadItemData(section, id) {
    const config = SECTIONS[section];
    try {
        const docRef = doc(db, config.collection, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            config.fields.forEach(f => {
                const el = document.getElementById(`crud_${f.name}`);
                if (el) {
                    if (f.type === 'file') {
                        const preview = document.getElementById(`preview_${f.name}`);
                        if (preview && data[f.name] && data[f.name].startsWith('data:image')) {
                            preview.innerHTML = `<img src="${data[f.name]}" />`;
                        }
                    } else {
                        el.value = data[f.name] || '';
                    }
                }
            });
        }
    } catch (error) {
        console.error('Erreur chargement données:', error);
        showToast('⚠️ Erreur chargement des données', true);
    }
}

// ============================================================
// SAUVEGARDER
// ============================================================
crudForm?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const config = SECTIONS[currentSection];
    if (!config) return;

    const data = {};
    let valid = true;

    for (const f of config.fields) {
        const el = document.getElementById(`crud_${f.name}`);
        if (el) {
            if (f.type === 'file') {
                const file = el.files[0];
                if (file) {
                    try {
                        const base64 = await imageToBase64(file);
                        data[f.name] = base64;
                    } catch (error) {
                        showToast('⚠️ Erreur conversion image', true);
                        return;
                    }
                } else if (editingId) {
                    const docRef = doc(db, config.collection, editingId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists() && docSnap.data()[f.name]) {
                        data[f.name] = docSnap.data()[f.name];
                    }
                }
            } else {
                data[f.name] = el.value.trim();
                if (f.required && !data[f.name]) {
                    valid = false;
                    el.style.borderColor = '#c0392b';
                } else {
                    el.style.borderColor = '';
                }
            }
        }
    }

    if (!valid) {
        showToast('⚠️ Veuillez remplir tous les champs obligatoires', true);
        return;
    }

    if (currentSection === 'produits' && data.prixVente && data.prixAchat) {
        const profit = parseFloat(data.prixVente) - parseFloat(data.prixAchat);
        data.profit = profit.toFixed(2);
    }

    data.updatedAt = serverTimestamp();

    crudSubmit.disabled = true;
    crudSubmit.textContent = 'Enregistrement...';

    try {
        if (editingId) {
            await updateDoc(doc(db, config.collection, editingId), data);
            showToast(`✅ ${config.label} modifié !`);
        } else {
            data.createdAt = serverTimestamp();
            await addDoc(collection(db, config.collection), data);
            showToast(`✅ ${config.label} ajouté !`);
        }
        window.closeCrudModal();
        loadSection(currentSection);
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        showToast('⚠️ Erreur lors de l\'enregistrement', true);
    } finally {
        crudSubmit.disabled = false;
        crudSubmit.textContent = editingId ? 'Mettre à jour' : 'Ajouter';
    }
});

// ============================================================
// SUPPRIMER
// ============================================================
window.deleteItem = async function(section, id) {
    if (!confirm('Supprimer cet élément ?')) return;
    const config = SECTIONS[section];
    try {
        await deleteDoc(doc(db, config.collection, id));
        showToast(`✅ ${config.label} supprimé !`);
        loadSection(section);
    } catch (error) {
        showToast('⚠️ Erreur lors de la suppression', true);
    }
};

// ============================================================
// MENU DASHBOARD
// ============================================================
document.querySelectorAll('.dashboard-menu-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.dashboard-menu-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        loadSection(this.dataset.section);
    });
});

// ============================================================
// STATISTIQUES
// ============================================================
const originalLoadSection = loadSection;
loadSection = async function(section) {
    if (section === 'statistiques') {
        const content = document.getElementById('dashboardSectionContent');
        const title = document.getElementById('dashboardTitle');
        const subtitle = document.getElementById('dashboardSubtitle');

        title.textContent = '📊 Statistiques';
        subtitle.textContent = 'Tableau de bord';

        const collections = ['categories', 'produits', 'clients', 'fournisseurs', 'ventes', 'credits'];
        const counts = {};
        let totalCA = 0, totalProfit = 0;

        for (const col of collections) {
            try {
                const snap = await getDocs(collection(db, col));
                counts[col] = snap.size;
                if (col === 'produits') {
                    snap.forEach(doc => {
                        const data = doc.data();
                        if (data.chiffreAffaire) totalCA += parseFloat(data.chiffreAffaire) || 0;
                        if (data.profit) totalProfit += parseFloat(data.profit) || 0;
                    });
                }
            } catch {
                counts[col] = 0;
            }
        }

        content.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;margin-bottom:2rem;">
                <div style="background:#f8f7f3;padding:1.5rem;border-radius:8px;text-align:center;">
                    <h3 style="font-size:2rem;color:#e8a87c;">${counts.categories || 0}</h3>
                    <p style="color:#999;font-size:0.75rem;">Catégories</p>
                </div>
                <div style="background:#f8f7f3;padding:1.5rem;border-radius:8px;text-align:center;">
                    <h3 style="font-size:2rem;color:#e8a87c;">${counts.produits || 0}</h3>
                    <p style="color:#999;font-size:0.75rem;">Produits</p>
                </div>
                <div style="background:#f8f7f3;padding:1.5rem;border-radius:8px;text-align:center;">
                    <h3 style="font-size:2rem;color:#e8a87c;">${counts.clients || 0}</h3>
                    <p style="color:#999;font-size:0.75rem;">Clients</p>
                </div>
                <div style="background:#f8f7f3;padding:1.5rem;border-radius:8px;text-align:center;">
                    <h3 style="font-size:2rem;color:#e8a87c;">${counts.fournisseurs || 0}</h3>
                    <p style="color:#999;font-size:0.75rem;">Fournisseurs</p>
                </div>
                <div style="background:#f8f7f3;padding:1.5rem;border-radius:8px;text-align:center;">
                    <h3 style="font-size:2rem;color:#e8a87c;">${counts.ventes || 0}</h3>
                    <p style="color:#999;font-size:0.75rem;">Ventes</p>
                </div>
                <div style="background:#f8f7f3;padding:1.5rem;border-radius:8px;text-align:center;">
                    <h3 style="font-size:2rem;color:#e8a87c;">${counts.credits || 0}</h3>
                    <p style="color:#999;font-size:0.75rem;">Crédits</p>
                </div>
                <div style="background:#f8f7f3;padding:1.5rem;border-radius:8px;text-align:center;">
                    <h3 style="font-size:2rem;color:#e8a87c;">${totalCA.toFixed(2)} MAD</h3>
                    <p style="color:#999;font-size:0.75rem;">CA Total</p>
                </div>
                <div style="background:#f8f7f3;padding:1.5rem;border-radius:8px;text-align:center;">
                    <h3 style="font-size:2rem;color:#e8a87c;">${totalProfit.toFixed(2)} MAD</h3>
                    <p style="color:#999;font-size:0.75rem;">Profit Total</p>
                </div>
            </div>
        `;
        return;
    }

    if (section === 'depenses' || section === 'options') {
        originalLoadSection(section);
        return;
    }

    originalLoadSection(section);
};

// ============================================================
// LOGOUT
// ============================================================
document.getElementById('dashboardLogout').addEventListener('click', function() {
    signOut(auth);
    showToast('👋 Déconnexion réussie');
    setTimeout(() => window.location.reload(), 500);
});

console.log('📊 Admin.js chargé - CRUD avec upload d\'images');
