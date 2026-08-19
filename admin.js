// ============================================================
// ADMIN.JS - CRUD COMPLET (Sans Storage - Emojis/URLs)
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

console.log('📊 Admin.js chargé - CRUD complet (sans Storage)');

// ============================================================
// CONFIGURATION DES SECTIONS
// ============================================================
const SECTIONS = {
    categories: {
        label: 'Catégories',
        icon: '🏷️',
        collection: 'categories',
        fields: [
            { name: 'name', label: 'Nom de la catégorie', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'text', required: false }
        ],
        displayFields: ['name', 'description']
    },
    produits: {
        label: 'Produits',
        icon: '📦',
        collection: 'produits',
        fields: [
            { name: 'name', label: 'Nom du produit', type: 'text', required: true },
            { name: 'category', label: 'Catégorie', type: 'text', required: true },
            { name: 'price', label: 'Prix (MAD)', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'text', required: false },
            { name: 'image', label: 'Image (emoji ou URL)', type: 'text', required: false, placeholder: 'ex: 🧴 ou https://...' }
        ],
        displayFields: ['name', 'category', 'price']
    },
    clients: {
        label: 'Clients',
        icon: '👥',
        collection: 'clients',
        fields: [
            { name: 'name', label: 'Nom complet', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'phone', label: 'Téléphone', type: 'text', required: false },
            { name: 'address', label: 'Adresse', type: 'text', required: false }
        ],
        displayFields: ['name', 'email', 'phone']
    },
    fournisseurs: {
        label: 'Fournisseurs',
        icon: '🚚',
        collection: 'fournisseurs',
        fields: [
            { name: 'name', label: 'Nom du fournisseur', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: false },
            { name: 'phone', label: 'Téléphone', type: 'text', required: false },
            { name: 'address', label: 'Adresse', type: 'text', required: false }
        ],
        displayFields: ['name', 'email', 'phone']
    },
    ventes: {
        label: 'Ventes',
        icon: '📈',
        collection: 'ventes',
        fields: [
            { name: 'clientName', label: 'Nom du client', type: 'text', required: true },
            { name: 'productName', label: 'Produit', type: 'text', required: true },
            { name: 'quantity', label: 'Quantité', type: 'number', required: true },
            { name: 'totalPrice', label: 'Total (MAD)', type: 'text', required: true },
            { name: 'status', label: 'Statut', type: 'select', required: true, options: ['En attente', 'Payée', 'Livrée'] }
        ],
        displayFields: ['clientName', 'productName', 'totalPrice', 'status']
    },
    credits: {
        label: 'Crédits',
        icon: '💳',
        collection: 'credits',
        fields: [
            { name: 'clientName', label: 'Nom du client', type: 'text', required: true },
            { name: 'amount', label: 'Montant (MAD)', type: 'text', required: true },
            { name: 'dueDate', label: "Date d'échéance", type: 'date', required: false },
            { name: 'status', label: 'Statut', type: 'select', required: true, options: ['En cours', 'Payé', 'En retard'] }
        ],
        displayFields: ['clientName', 'amount', 'dueDate', 'status']
    }
};

// ============================================================
// VÉRIFICATION AUTH
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
                                ${config.displayFields.map(f => `<th>${f.charAt(0).toUpperCase() + f.slice(1)}</th>`).join('')}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    ${config.displayFields.map(f => `<td>${item[f] || '-'}</td>`).join('')}
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
// CRUD MODAL
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
            ` : f.type === 'textarea' ? `
                <textarea id="crud_${f.name}" ${f.required ? 'required' : ''}></textarea>
            ` : `
                <input type="${f.type}" id="crud_${f.name}" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''} />
            `}
        </div>
    `).join('');

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
                if (el) el.value = data[f.name] || '';
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
    config.fields.forEach(f => {
        const el = document.getElementById(`crud_${f.name}`);
        if (el) {
            data[f.name] = el.value.trim();
            if (f.required && !data[f.name]) {
                valid = false;
                el.style.borderColor = '#c0392b';
            } else {
                el.style.borderColor = '';
            }
        }
    });

    if (!valid) {
        showToast('⚠️ Veuillez remplir tous les champs obligatoires', true);
        return;
    }

    data.updatedAt = serverTimestamp();

    crudSubmit.disabled = true;
    crudSubmit.textContent = 'Enregistrement...';

    try {
        if (editingId) {
            await updateDoc(doc(db, config.collection, editingId), data);
            showToast(`✅ ${config.label} modifié avec succès !`);
        } else {
            data.createdAt = serverTimestamp();
            await addDoc(collection(db, config.collection), data);
            showToast(`✅ ${config.label} ajouté avec succès !`);
        }
        window.closeCrudModal();
        loadSection(currentSection);
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        showToast(`⚠️ Erreur lors de l'enregistrement`, true);
    } finally {
        crudSubmit.disabled = false;
        crudSubmit.textContent = editingId ? 'Mettre à jour' : 'Ajouter';
    }
});

// ============================================================
// SUPPRIMER
// ============================================================
window.deleteItem = async function(section, id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;

    const config = SECTIONS[section];
    try {
        await deleteDoc(doc(db, config.collection, id));
        showToast(`✅ ${config.label} supprimé avec succès !`);
        loadSection(section);
    } catch (error) {
        console.error('Erreur suppression:', error);
        showToast(`⚠️ Erreur lors de la suppression`, true);
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
        subtitle.textContent = 'Tableau de bord et rapports';

        const collections = ['categories', 'produits', 'clients', 'fournisseurs', 'ventes', 'credits'];
        const counts = {};
        for (const col of collections) {
            try {
                const snap = await getDocs(collection(db, col));
                counts[col] = snap.size;
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
            </div>
            <div style="background:#f8f7f3;padding:1.5rem;border-radius:8px;text-align:center;color:#999;">
                <i class="fas fa-chart-simple" style="font-size:2rem;display:block;color:#ddd;margin-bottom:0.5rem;"></i>
                <p>Rapports détaillés disponibles prochainement</p>
            </div>
        `;
        return;
    }

    if (section === 'depenses') {
        const content = document.getElementById('dashboardSectionContent');
        const title = document.getElementById('dashboardTitle');
        const subtitle = document.getElementById('dashboardSubtitle');

        title.textContent = '💰 Dépenses';
        subtitle.textContent = 'Suivi des dépenses';

        content.innerHTML = `
            <div class="dashboard-toolbar">
                <h3>Liste des dépenses</h3>
                <button class="btn-add" onclick="showToast('🛠️ Fonctionnalité en développement')">
                    <i class="fas fa-plus"></i> Ajouter
                </button>
            </div>
            <div class="empty-state">
                <i class="fas fa-coins"></i>
                <p>Aucune dépense enregistrée</p>
                <p style="font-size:0.75rem;margin-top:0.5rem;">Cette section sera disponible prochainement</p>
            </div>
        `;
        return;
    }

    if (section === 'options') {
        const content = document.getElementById('dashboardSectionContent');
        const title = document.getElementById('dashboardTitle');
        const subtitle = document.getElementById('dashboardSubtitle');

        title.textContent = '⚙️ Options';
        subtitle.textContent = 'Paramètres et configuration';

        content.innerHTML = `
            <div style="display:grid;gap:1rem;max-width:600px;">
                <div style="background:#f8f7f3;padding:1rem;border-radius:6px;display:flex;justify-content:space-between;align-items:center;">
                    <span>Notifications par email</span>
                    <label style="position:relative;display:inline-block;width:50px;height:26px;">
                        <input type="checkbox" checked style="opacity:0;width:0;height:0;">
                        <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#e8a87c;transition:.4s;border-radius:26px;"></span>
                    </label>
                </div>
                <div style="background:#f8f7f3;padding:1rem;border-radius:6px;display:flex;justify-content:space-between;align-items:center;">
                    <span>Mode sombre</span>
                    <label style="position:relative;display:inline-block;width:50px;height:26px;">
                        <input type="checkbox" style="opacity:0;width:0;height:0;">
                        <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#ccc;transition:.4s;border-radius:26px;"></span>
                    </label>
                </div>
                <div style="background:#f8f7f3;padding:1rem;border-radius:6px;display:flex;justify-content:space-between;align-items:center;">
                    <span>Devise</span>
                    <select style="padding:0.3rem 0.8rem;border:1px solid #ddd;border-radius:4px;">
                        <option selected>MAD (Dirham)</option>
                        <option>€ Euro</option>
                        <option>$ Dollar</option>
                    </select>
                </div>
                <div style="background:#f8f7f3;padding:1rem;border-radius:6px;display:flex;justify-content:space-between;align-items:center;">
                    <span>Langue</span>
                    <select style="padding:0.3rem 0.8rem;border:1px solid #ddd;border-radius:4px;">
                        <option selected>Français</option>
                        <option>Anglais</option>
                        <option>Arabe</option>
                    </select>
                </div>
            </div>
        `;
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

console.log('📊 Admin.js chargé - CRUD complet sans Storage (emojis/URLs)');
