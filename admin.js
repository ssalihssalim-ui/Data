// ============================================================
// ADMIN.JS - Dashboard Admin (protégé par connexion)
// ============================================================
import { auth, db, showToast } from './script.js';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

console.log('📊 Admin.js chargé');

// ============================================================
// VÉRIFICATION AUTH - Dashboard protégé
// ============================================================
onAuthStateChanged(auth, async (user) => {
    const userName = document.getElementById('dashboardUserName');
    const dashboardPage = document.getElementById('pageDashboard');
    
    if (!user) {
        dashboardPage.style.display = 'none';
        return;
    }
    
    // Si connecté, afficher le dashboard
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
    showDashboardSection('categories');
});

// ============================================================
// DASHBOARD - AFFICHAGE DES SECTIONS
// ============================================================
function showDashboardSection(section) {
    const content = document.getElementById('dashboardSectionContent');
    const title = document.getElementById('dashboardTitle');
    const subtitle = document.getElementById('dashboardSubtitle');

    const sections = {
        categories: { title: '🏷️ Catégories', desc: 'Gestion des catégories de produits' },
        produits: { title: '📦 Produits', desc: 'Gestion du catalogue produits' },
        clients: { title: '👥 Clients', desc: 'Liste et gestion des clients' },
        fournisseurs: { title: '🚚 Fournisseurs', desc: 'Gestion des fournisseurs' },
        ventes: { title: '📈 Ventes', desc: 'Historique et analyse des ventes' },
        credits: { title: '💳 Crédits', desc: 'Gestion des crédits clients' },
        statistiques: { title: '📊 Statistiques', desc: 'Tableaux de bord et rapports' },
        depenses: { title: '💰 Dépenses', desc: 'Suivi des dépenses' },
        options: { title: '⚙️ Options', desc: 'Paramètres et configuration' },
    };

    const data = sections[section] || sections.categories;
    title.textContent = data.title;
    subtitle.textContent = data.desc;

    let html = '';

    switch (section) {
        case 'categories':
            html = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">
                    <h3 style="font-weight:400;">Liste des catégories</h3>
                    <button class="btn-primary" style="padding:0.5rem 1.5rem;font-size:0.7rem;">+ Ajouter</button>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.8rem;">
                    ${['Soin','Maquillage','Vitamines','Ensembles','Coquet','Accessoires','Sport'].map(cat => `
                        <div style="background:#f8f7f3;padding:0.8rem;border-radius:6px;display:flex;justify-content:space-between;align-items:center;">
                            <span>${cat}</span>
                            <div>
                                <i class="fas fa-edit" style="color:#e8a87c;cursor:pointer;margin-right:0.5rem;"></i>
                                <i class="fas fa-trash" style="color:#c0392b;cursor:pointer;"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            break;

        case 'produits':
            const products = [
                { id: 1, name: 'Crème Hydratante', category: 'soin', price: '290 MAD', image: '🧴' },
                { id: 2, name: 'Sérum Anti-Âge', category: 'soin', price: '490 MAD', image: '💧' },
                { id: 3, name: 'Fond de Teint', category: 'maquillage', price: '340 MAD', image: '🎨' },
                { id: 4, name: 'Mascara Volume', category: 'maquillage', price: '190 MAD', image: '👁️' },
                { id: 5, name: 'Vitamine C', category: 'vitamines', price: '150 MAD', image: '🍊' },
                { id: 6, name: 'Vitamine D', category: 'vitamines', price: '120 MAD', image: '☀️' },
            ];
            html = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">
                    <h3 style="font-weight:400;">Catalogue produits</h3>
                    <button class="btn-primary" style="padding:0.5rem 1.5rem;font-size:0.7rem;">+ Ajouter</button>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;">
                    ${products.map(p => `
                        <div style="background:#f8f7f3;padding:1rem;border-radius:6px;text-align:center;">
                            <div style="font-size:2rem;">${p.image}</div>
                            <h4 style="margin:0.3rem 0;">${p.name}</h4>
                            <p style="font-size:0.75rem;color:#999;">${p.category}</p>
                            <p style="color:#e8a87c;font-weight:600;">${p.price}</p>
                            <div style="margin-top:0.5rem;">
                                <i class="fas fa-edit" style="color:#e8a87c;cursor:pointer;margin-right:0.8rem;"></i>
                                <i class="fas fa-trash" style="color:#c0392b;cursor:pointer;"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            break;

        case 'clients':
            html = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">
                    <h3 style="font-weight:400;">Liste des clients</h3>
                    <button class="btn-primary" style="padding:0.5rem 1.5rem;font-size:0.7rem;">+ Ajouter</button>
                </div>
                <div style="background:#f8f7f3;padding:1rem;border-radius:6px;text-align:center;color:#999;">
                    <i class="fas fa-users" style="font-size:2rem;display:block;color:#ddd;"></i>
                    <p>Aucun client enregistré pour le moment</p>
                </div>
            `;
            break;

        case 'fournisseurs':
            html = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">
                    <h3 style="font-weight:400;">Liste des fournisseurs</h3>
                    <button class="btn-primary" style="padding:0.5rem 1.5rem;font-size:0.7rem;">+ Ajouter</button>
                </div>
                <div style="background:#f8f7f3;padding:1rem;border-radius:6px;text-align:center;color:#999;">
                    <i class="fas fa-truck" style="font-size:2rem;display:block;color:#ddd;"></i>
                    <p>Aucun fournisseur enregistré</p>
                </div>
            `;
            break;

        case 'ventes':
            html = `
                <div style="margin-bottom:1rem;">
                    <h3 style="font-weight:400;">Historique des ventes</h3>
                </div>
                <div style="background:#f8f7f3;padding:1rem;border-radius:6px;text-align:center;color:#999;">
                    <i class="fas fa-chart-line" style="font-size:2rem;display:block;color:#ddd;"></i>
                    <p>Aucune vente enregistrée</p>
                </div>
            `;
            break;

        case 'credits':
            html = `
                <div style="margin-bottom:1rem;">
                    <h3 style="font-weight:400;">Gestion des crédits</h3>
                </div>
                <div style="background:#f8f7f3;padding:1rem;border-radius:6px;text-align:center;color:#999;">
                    <i class="fas fa-credit-card" style="font-size:2rem;display:block;color:#ddd;"></i>
                    <p>Aucun crédit en cours</p>
                </div>
            `;
            break;

        case 'statistiques':
            html = `
                <div style="margin-bottom:1rem;">
                    <h3 style="font-weight:400;">Tableau de bord statistiques</h3>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:1rem;">
                    <div style="background:#f8f7f3;padding:1rem;border-radius:6px;text-align:center;">
                        <h4 style="color:#e8a87c;font-size:1.5rem;">12 450 MAD</h4>
                        <p style="font-size:0.75rem;color:#999;">CA total</p>
                    </div>
                    <div style="background:#f8f7f3;padding:1rem;border-radius:6px;text-align:center;">
                        <h4 style="color:#e8a87c;font-size:1.5rem;">89</h4>
                        <p style="font-size:0.75rem;color:#999;">Commandes</p>
                    </div>
                    <div style="background:#f8f7f3;padding:1rem;border-radius:6px;text-align:center;">
                        <h4 style="color:#e8a87c;font-size:1.5rem;">4.8</h4>
                        <p style="font-size:0.75rem;color:#999;">Note moyenne</p>
                    </div>
                    <div style="background:#f8f7f3;padding:1rem;border-radius:6px;text-align:center;">
                        <h4 style="color:#e8a87c;font-size:1.5rem;">32%</h4>
                        <p style="font-size:0.75rem;color:#999;">Taux de conversion</p>
                    </div>
                </div>
            `;
            break;

        case 'depenses':
            html = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">
                    <h3 style="font-weight:400;">Suivi des dépenses</h3>
                    <button class="btn-primary" style="padding:0.5rem 1.5rem;font-size:0.7rem;">+ Ajouter</button>
                </div>
                <div style="background:#f8f7f3;padding:1rem;border-radius:6px;text-align:center;color:#999;">
                    <i class="fas fa-coins" style="font-size:2rem;display:block;color:#ddd;"></i>
                    <p>Aucune dépense enregistrée</p>
                </div>
            `;
            break;

        case 'options':
            html = `
                <div style="margin-bottom:1rem;">
                    <h3 style="font-weight:400;">Paramètres et configuration</h3>
                </div>
                <div style="display:grid;gap:1rem;">
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
                </div>
            `;
            break;

        default:
            html = `
                <div class="dashboard-placeholder">
                    <i class="fas fa-chart-simple"></i>
                    <h3>Sélectionnez une section</h3>
                    <p>Choisissez une option dans le menu de gauche pour afficher son contenu</p>
                </div>
            `;
    }

    content.innerHTML = html;
}

// ============================================================
// DASHBOARD MENU
// ============================================================
document.querySelectorAll('.dashboard-menu-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.dashboard-menu-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        showDashboardSection(this.dataset.section);
    });
});

// ============================================================
// LOGOUT
// ============================================================
document.getElementById('dashboardLogout').addEventListener('click', function() {
    signOut(auth);
    showToast('👋 Déconnexion réussie');
    setTimeout(() => {
        window.location.reload();
    }, 500);
});

console.log('📊 Admin.js chargé - Dashboard protégé');
