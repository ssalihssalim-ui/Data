// ============================================================
// ADMIN.JS - Dashboard complet avec CRUD
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
    addDoc,
    where
} from "firebase/firestore";

console.log('📊 Admin.js chargé');

// ============================================================
// CONFIGURATION DES SECTIONS
// ============================================================
const SECTIONS = {
    categories: {
        label: 'Catégories',
        icon: '🏷️',
        collection: 'categories',
        fields: [
            { name: 'name', label: 'Nom', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'text', required: false },
            { name: 'image', label: 'Image (emoji ou URL)', type: 'text', required: false }
        ],
        displayFields: ['name', 'description']
    },
    produits: {
        label: 'Produits',
        icon: '📦',
        collection: 'produits',
        fields: [
            { name: 'name', label: 'Nom', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'text', required: false },
            { name: 'category', label: 'Catégorie', type: 'text', required: true },
            { name: 'prixAchat', label: "Prix d'achat (MAD)", type: 'text', required: true },
            { name: 'prixVente', label: 'Prix de vente (MAD)', type: 'text', required: true },
            { name: 'prixPromotion', label: 'Prix promotion (MAD)', type: 'text', required: false },
            { name: 'stock', label: 'Stock', type: 'number', required: false },
            { name: 'videoUrl', label: 'URL YouTube', type: 'text', required: false }
        ],
        displayFields: ['name', 'category', 'prixVente', 'stock']
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
    },
    depenses: {
        label: 'Dépenses',
        icon: '💰',
        collection: 'depenses',
        fields: [
            { name: 'title', label: 'Titre', type: 'text', required: true },
            { name: 'amount', label: 'Montant (MAD)', type: 'text', required: true },
            { name: 'category', label: 'Catégorie', type: 'select', required: true, options: ['Achat', 'Loyer', 'Salaire', 'Transport', 'Autre'] },
            { name: 'date', label: 'Date', type: 'date', required: false },
            { name: 'notes', label: 'Notes', type: 'text', required: false }
        ],
        displayFields: ['title', 'amount', 'category', 'date']
    },
    options: {
        label: 'Options',
        icon: '⚙️',
        collection: 'options',
        fields: [
            { name: 'key', label: 'Clé', type: 'text', required: true },
            { name: 'value', label: 'Valeur', type: 'text', required: true }
        ],
        displayFields: ['key', 'value']
    }
};

// ============================================================
// ÉTAT
// ============================================================
let currentSection = 'statistiques';
let editingId = null;

// ============================================================
// AUTH - AFFICHAGE DASHBOARD (UNIQUEMENT SI PAGE DASHBOARD)
// ============================================================
onAuthStateChanged(auth, async (user) => {
    const userName = document.getElementById('dashboardUserName');
    const dashboardPage = document.getElementById('pageDashboard');
    const navDashboardLink = document.getElementById('navDashboard');
    
    if (!user) { 
        dashboardPage.style.display = 'none';
        if (navDashboardLink) navDashboardLink.style.display = 'none';
        return; 
    }
    
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        userName.textContent = userDoc.exists() ? userDoc.data().name || user.displayName || user.email || 'Utilisateur' : user.displayName || user.email || 'Utilisateur';
    } catch { 
        userName.textContent = user.displayName || user.email || 'Utilisateur'; 
    }
    
    // Afficher le lien Dashboard dans la navbar
    if (navDashboardLink) navDashboardLink.style.display = 'inline';
    
    // NE PAS afficher la page dashboard automatiquement
    // Seul le clic sur le lien Dashboard l'affichera
});

// ============================================================
// CHARGER UNE SECTION
// ============================================================
export async function loadSection(section) {
    currentSection = section;
    const config = SECTIONS[section];
    
    // STATISTIQUES
    if (section === 'statistiques') {
        const content = document.getElementById('dashboardSectionContent');
        const title = document.getElementById('dashboardTitle');
        const subtitle = document.getElementById('dashboardSubtitle');
        title.textContent = '📊 Tableau de bord';
        subtitle.textContent = 'Vue d\'ensemble de votre activité';

        const collections = ['categories', 'produits', 'clients', 'fournisseurs', 'ventes', 'credits'];
        const stats = {};
        let totalCA = 0;
        for (const col of collections) {
            try {
                const snap = await getDocs(collection(db, col));
                stats[col] = snap.size;
                if (col === 'ventes') {
                    snap.forEach(doc => {
                        const d = doc.data();
                        if (d.totalPrice) totalCA += parseFloat(d.totalPrice) || 0;
                    });
                }
            } catch { stats[col] = 0; }
        }

        document.querySelectorAll('.stat-card h3').forEach((el, i) => {
            if (i === 0) el.textContent = stats.produits || 0;
            else if (i === 1) el.textContent = stats.clients || 0;
            else if (i === 2) el.textContent = stats.ventes || 0;
            else if (i === 3) el.textContent = totalCA.toFixed(2) + ' MAD';
        });

        content.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:1rem;margin-top:1rem;">
                ${Object.keys(stats).map(key => `
                    <div style="background:#f8f7f3;padding:1rem;border-radius:8px;text-align:center;">
                        <h3 style="font-size:1.5rem;color:#e8a87c;">${stats[key] || 0}</h3>
                        <p style="color:#999;font-size:0.7rem;text-transform:uppercase;">${key}</p>
                    </div>
                `).join('')}
                <div style="background:#f8f7f3;padding:1rem;border-radius:8px;text-align:center;">
                    <h3 style="font-size:1.5rem;color:#e8a87c;">${totalCA.toFixed(2)} MAD</h3>
                    <p style="color:#999;font-size:0.7rem;text-transform:uppercase;">CA Total</p>
                </div>
            </div>
        `;
        return;
    }

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
        snapshot.forEach(doc => { items.push({ id: doc.id, ...doc.data() }); });

        const headers = config.displayFields.map(f => {
            const labels = { 'name': 'Nom', 'description': 'Description', 'category': 'Catégorie', 'prixVente': 'Prix', 'stock': 'Stock', 'email': 'Email', 'phone': 'Téléphone', 'city': 'Ville', 'productType': 'Type', 'clientName': 'Client', 'productName': 'Produit', 'totalPrice': 'Total', 'status': 'Statut', 'amount': 'Montant', 'dueDate': 'Échéance', 'title': 'Titre', 'date': 'Date', 'key': 'Clé', 'value': 'Valeur' };
            return labels[f] || f.charAt(0).toUpperCase() + f.slice(1);
        });

        content.innerHTML = `
            <div class="dashboard-toolbar">
                <h3>Liste des ${config.label.toLowerCase()}</h3>
                <button class="btn-add" onclick="window.openCrudModal('${section}')"><i class="fas fa-plus"></i> Ajouter</button>
            </div>
            <div class="dashboard-table-wrapper">
                ${items.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-${section === 'categories' ? 'tags' : section === 'produits' ? 'box' : 'database'}"></i>
                        <p>Aucun ${config.label.toLowerCase()} enregistré</p>
                    </div>
                ` : `
                    <table class="dashboard-table">
                        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}<th>Actions</th></tr></thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    ${config.displayFields.map(f => `<td>${item[f] || '-'}</td>`).join('')}
                                    <td>
                                        <div class="actions">
                                            <button class="edit-btn" onclick="window.openCrudModal('${section}', '${item.id}')"><i class="fas fa-edit"></i></button>
                                            <button class="delete-btn" onclick="window.deleteItem('${section}', '${item.id}')"><i class="fas fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `}
            </div>
        `;
    } catch (error) { console.error('Erreur:', error); showToast('⚠️ Erreur chargement', true); }
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

    if (id) loadItemData(section, id);
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
crudOverlay?.addEventListener('click', function(e) { if (e.target === crudOverlay) window.closeCrudModal(); });
document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && crudOverlay?.classList.contains('active')) window.closeCrudModal(); });

async function loadItemData(section, id) {
    const config = SECTIONS[section];
    try {
        const docSnap = await getDoc(doc(db, config.collection, id));
        if (docSnap.exists()) {
            const data = docSnap.data();
            config.fields.forEach(f => {
                const el = document.getElementById(`crud_${f.name}`);
                if (el) el.value = data[f.name] || '';
            });
        }
    } catch (error) { console.error('Erreur:', error); }
}

crudForm?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const config = SECTIONS[currentSection];
    if (!config) return;
    const data = {};
    let valid = true;

    for (const f of config.fields) {
        const el = document.getElementById(`crud_${f.name}`);
        if (el) {
            data[f.name] = el.value.trim();
            if (f.required && !data[f.name]) { valid = false; el.style.borderColor = '#c0392b'; } 
            else { el.style.borderColor = ''; }
        }
    }

    if (!valid) { showToast('⚠️ Remplissez tous les champs obligatoires', true); return; }

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
    } catch (error) { console.error('Erreur:', error); showToast('⚠️ Erreur lors de l\'enregistrement', true); }
    finally { crudSubmit.disabled = false; crudSubmit.textContent = editingId ? 'Mettre à jour' : 'Ajouter'; }
});

window.deleteItem = async function(section, id) {
    if (!confirm('Supprimer cet élément ?')) return;
    try {
        await deleteDoc(doc(db, SECTIONS[section].collection, id));
        showToast(`✅ ${SECTIONS[section].label} supprimé !`);
        loadSection(section);
    } catch (error) { showToast('⚠️ Erreur lors de la suppression', true); }
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
// LOGOUT
// ============================================================
document.getElementById('dashboardLogout').addEventListener('click', function() {
    signOut(auth);
    showToast('👋 Déconnexion réussie');
    setTimeout(() => window.location.reload(), 500);
});

console.log('📊 Admin.js chargé - Dashboard complet');
