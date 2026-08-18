// ============================================================
// ADMIN.JS - Dashboard Admin (séparé)
// ============================================================
import { auth, db, showToast, showPage, closeAuthModal } from './script.js';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

console.log('📊 Admin.js chargé');

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
                { id: 1, name: 'Crème Hydratante', category: 'soin', price: '€29.90', image: '🧴' },
                { id: 2, name: 'Sérum Anti-Âge', category: 'soin', price: '€49.90', image: '💧' },
                { id: 3, name: 'Fond de Teint', category: 'maquillage', price: '€34.90', image: '🎨' },
                { id: 4, name: 'Mascara Volume', category: 'maquillage', price: '€19.90', image: '👁️' },
                { id: 5, name: 'Vitamine C', category: 'vitamines', price: '€15.90', image: '🍊' },
                { id: 6, name: 'Vitamine D', category: 'vitamines', price: '€12.90', image: '☀️' },
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
                            <p style="color
