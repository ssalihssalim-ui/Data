// ==================== ADMIN-VENTES.JS ====================
// Gestion des ventes

window.ventesPeriod = window.ventesPeriod || 'all';
window.ventesSearch = window.ventesSearch || '';
window.allVentesData = window.allVentesData || [];

// ============================================================
// FORMATAGE
// ============================================================
function formatPriceV(price) {
    if (price === undefined || price === null) return '0 MAD';
    return Number(price).toFixed(2) + ' MAD';
}

function normalizeV(str) {
    return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// ============================================================
// PAGINATION
// ============================================================
window.currentPages = window.currentPages || {};
window.currentPages.ventes = 1;
window.itemsPerPage = 20;

function getPageDataV(pageKey, data) {
    const page = window.currentPages[pageKey] || 1;
    const start = (page - 1) * window.itemsPerPage;
    const end = start + window.itemsPerPage;
    return data.slice(start, end);
}

function getPaginationHTMLV(pageKey, total) {
    const current = window.currentPages[pageKey] || 1;
    const totalPages = Math.ceil(total / window.itemsPerPage);
    if (totalPages <= 1) return '';

    let h = '<div style="display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap;padding:10px 0;">';
    if (current > 1) {
        h += `<button onclick="goToPageV('${pageKey}', ${current - 1})" style="padding:8px 16px;border:1px solid #e2e8f0;border-radius:6px;background:#fff;cursor:pointer;font-size:20px;">◀ Précédent</button>`;
    }
    h += `<span style="font-size:20px;font-weight:600;padding:0 12px;">Page ${current}/${totalPages}</span>`;
    if (current < totalPages) {
        h += `<button onclick="goToPageV('${pageKey}', ${current + 1})" style="padding:8px 16px;border:1px solid #e2e8f0;border-radius:6px;background:#fff;cursor:pointer;font-size:20px;">Suivant ▶</button>`;
    }
    h += '</div>';
    return h;
}

window.goToPageV = function(pageKey, page) {
    window.currentPages[pageKey] = page;
    if (pageKey === 'ventes') {
        applyVentesFilters();
    }
};

// ============================================================
// FILTRES
// ============================================================
function filterByPeriod(data, period) {
    if (period === 'all' || !period) return data;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return data.filter(item => {
        if (!item.createdAt) return false;
        const date = new Date(item.createdAt.seconds * 1000);
        const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        if (period === 'today') {
            return itemDate.getTime() === today.getTime();
        } else if (period === 'week') {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            return itemDate >= weekStart;
        } else if (period === 'month') {
            return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
        }
        return true;
    });
}

// ============================================================
// CHARGEMENT DES VENTES
// ============================================================
export async function loadVentesPage(c) {
    window.ventesPeriod = 'all';
    window.ventesSearch = '';
    
    if (!window.sortOrders) window.sortOrders = {};
    if (!window.sortOrders.ventes) window.sortOrders.ventes = {};
    if (!window.sortOrders.ventes.createdAt) window.sortOrders.ventes.createdAt = 'desc';
    
    // Vérifier si le conteneur existe déjà
    let container = document.getElementById('ventesTableContainer');
    if (!container) {
        c.innerHTML = `
            <div class="content-card">
                <div class="card-header">
                    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                        <input type="text" id="ventesSearchInput" placeholder="🔍 Rechercher..." 
                               style="padding:14px 18px; border:2px solid #e2e8f0; border-radius:8px; width:280px; font-size:24px !important; height:56px;">
                        <select id="ventesPeriodSelect" 
                                style="padding:14px 18px; border:2px solid #e2e8f0; border-radius:8px; font-size:24px !important; height:56px;">
                            <option value="all">Toutes</option>
                            <option value="today">Aujourd'hui</option>
                            <option value="week">Cette semaine</option>
                            <option value="month">Ce mois</option>
                        </select>
                        <button class="btn-add" onclick="loadVentes()" 
                                style="font-size:24px !important; padding:14px 20px; height:56px;">
                            <i class="fas fa-sync"></i> Actualiser
                        </button>
                    </div>
                </div>
                <div id="ventesTableContainer"></div>
                <div id="ventesPagination" style="margin-top:10px;"></div>
            </div>
        `;
    }
    
    // Attacher les événements
    setTimeout(() => {
        const searchInput = document.getElementById('ventesSearchInput');
        if (searchInput) {
            searchInput.oninput = function() {
                window.ventesSearch = this.value;
                window.currentPages.ventes = 1;
                applyVentesFilters();
            };
        }
        const periodSelect = document.getElementById('ventesPeriodSelect');
        if (periodSelect) {
            periodSelect.onchange = function() {
                window.ventesPeriod = this.value;
                window.currentPages.ventes = 1;
                applyVentesFilters();
            };
        }
    }, 100);
    
    loadVentes();
}

// ============================================================
// LOAD VENTES
// ============================================================
async function loadVentes() {
    try {
        const snapshot = await db.collection('ventes').orderBy('createdAt', 'desc').limit(2000).get();
        window.allVentesData = [];
        snapshot.forEach(function(doc) {
            var d = doc.data();
            d.id = doc.id;
            window.allVentesData.push(d);
        });
        
        if (!window.sortOrders.ventes) window.sortOrders.ventes = {};
        if (!window.sortOrders.ventes.createdAt) window.sortOrders.ventes.createdAt = 'desc';
        
        window.currentPages.ventes = 1;
        applyVentesFilters();
    } catch (error) {
        console.error('Erreur chargement ventes:', error);
        window.showToast('⚠️ Erreur chargement ventes', true);
    }
}

window.loadVentes = loadVentes;

// ============================================================
// APPLY FILTERS
// ============================================================
function applyVentesFilters() {
    let filtered = filterByPeriod(window.allVentesData, window.ventesPeriod);
    
    if (window.ventesSearch && window.ventesSearch.trim() !== '') {
        const q = normalizeV(window.ventesSearch.trim());
        filtered = filtered.filter(function(v) {
            return normalizeV(v.clientName || '').indexOf(q) !== -1 ||
                   normalizeV(v.factureNum || '').indexOf(q) !== -1 ||
                   normalizeV(v.table || '').indexOf(q) !== -1;
        });
    }
    
    // Tri
    filtered.sort(function(a, b) {
        var da = a.createdAt?.seconds || 0;
        var db = b.createdAt?.seconds || 0;
        return db - da;
    });
    
    window.filteredVentes = filtered;
    renderVentesTable();
}

window.applyVentesFilters = applyVentesFilters;

// ============================================================
// RENDER TABLE
// ============================================================
function renderVentesTable() {
    var cont = document.getElementById('ventesTableContainer');
    if (!cont) return;
    
    var data = window.filteredVentes || [];
    var pageData = getPageDataV('ventes', data);
    
    if (pageData.length === 0) {
        cont.innerHTML = '<p style="text-align:center;padding:40px;font-size:28px;">Aucune vente trouvée</p>';
        document.getElementById('ventesPagination').innerHTML = '';
        return;
    }
    
    var totalCA = 0;
    var totalProfit = 0;
    
    var h = '<div class="table-container" style="overflow-x:auto;border-radius:10px;border:1px solid #e2e8f0;">' +
        '<table class="data-table" style="width:100%;border-collapse:collapse;min-width:900px;font-size:24px !important;">' +
        '<thead><tr style="background:#f9fafb;">' +
        '<th style="padding:16px 14px;text-align:left;font-weight:700;font-size:24px !important;border-bottom:2px solid #e2e8f0;">Facture</th>' +
        '<th style="padding:16px 14px;text-align:left;font-weight:700;font-size:24px !important;border-bottom:2px solid #e2e8f0;">Date</th>' +
        '<th style="padding:16px 14px;text-align:left;font-weight:700;font-size:24px !important;border-bottom:2px solid #e2e8f0;">Client</th>' +
        '<th style="padding:16px 14px;text-align:left;font-weight:700;font-size:24px !important;border-bottom:2px solid #e2e8f0;">Total</th>' +
        '<th style="padding:16px 14px;text-align:left;font-weight:700;font-size:24px !important;border-bottom:2px solid #e2e8f0;">Profit</th>' +
        '<th style="padding:16px 14px;text-align:left;font-weight:700;font-size:24px !important;border-bottom:2px solid #e2e8f0;">Mode</th>' +
        '<th style="padding:16px 14px;text-align:left;font-weight:700;font-size:24px !important;border-bottom:2px solid #e2e8f0;">Vendeur</th>' +
        '<th style="padding:16px 14px;text-align:left;font-weight:700;font-size:24px !important;border-bottom:2px solid #e2e8f0;">Actions</th>' +
        '</tr></thead><tbody>';
    
    pageData.forEach(function(d) {
        var dt = d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleString('fr-FR') : '';
        var total = d.total || 0;
        var profit = d.profit || 0;
        totalCA += total;
        totalProfit += profit;
        
        h += '<tr>' +
            '<td style="padding:16px 14px;font-size:24px !important;border-bottom:1px solid #e2e8f0;font-weight:700;">' + (d.factureNum || d.id.substring(0, 8)) + '</td>' +
            '<td style="padding:16px 14px;font-size:24px !important;border-bottom:1px solid #e2e8f0;">' + dt + '</td>' +
            '<td style="padding:16px 14px;font-size:24px !important;border-bottom:1px solid #e2e8f0;font-weight:700;">' + escapeHtml(d.clientName || d.table || '-') + '</td>' +
            '<td style="padding:16px 14px;font-size:24px !important;border-bottom:1px solid #e2e8f0;"><strong>' + total.toFixed(2) + ' MAD</strong></td>' +
            '<td style="padding:16px 14px;font-size:24px !important;border-bottom:1px solid #e2e8f0;color:' + (profit >= 0 ? '#27ae60' : '#e74c3c') + ';"><strong>' + profit.toFixed(2) + ' MAD</strong></td>' +
            '<td style="padding:16px 14px;font-size:24px !important;border-bottom:1px solid #e2e8f0;">' + (d.paymentMethod || '-') + '</td>' +
            '<td style="padding:16px 14px;font-size:24px !important;border-bottom:1px solid #e2e8f0;">' + escapeHtml(d.vendeur || '-') + '</td>' +
            '<td style="padding:16px 14px;font-size:24px !important;border-bottom:1px solid #e2e8f0;">' +
            '<button class="btn-edit" onclick="printFacture(\'' + d.id + '\')" style="font-size:22px !important;padding:10px 14px;background:none;border:none;color:#4b5563;cursor:pointer;"><i class="fas fa-print"></i></button> ' +
            '<button class="btn-edit" onclick="showVenteDetails(\'' + d.id + '\')" style="font-size:22px !important;padding:10px 14px;background:none;border:none;color:#4b5563;cursor:pointer;"><i class="fas fa-eye"></i></button>' +
            '</td></tr>';
    });
    
    h += '</tbody></table></div>';
    h += '<div style="margin-top:15px;padding:20px;background:#f0fdf4;border-radius:12px;text-align:center;font-size:28px !important;">' +
        '<strong style="font-size:30px !important;">Total CA: ' + totalCA.toFixed(2) + ' MAD</strong> | ' +
        '<strong style="font-size:30px !important;color:#27ae60;">Profit: ' + totalProfit.toFixed(2) + ' MAD</strong>' +
        '</div>';
    
    cont.innerHTML = h;
    document.getElementById('ventesPagination').innerHTML = getPaginationHTMLV('ventes', data.length);
}

window.renderVentesTable = renderVentesTable;

// ============================================================
// DETAILS VENTE
// ============================================================
window.showVenteDetails = function(id) {
    var data = window.filteredVentes || window.allVentesData || [];
    var vente = data.find(function(v) { return v.id === id; });
    if (!vente) {
        window.showToast('⚠️ Vente introuvable', true);
        return;
    }
    
    var itemsHtml = '';
    if (vente.items && vente.items.length > 0) {
        itemsHtml = '<table style="width:100%;border-collapse:collapse;font-size:24px;">' +
            '<tr style="border-bottom:2px solid #e2e8f0;"><th style="padding:10px;text-align:left;">Produit</th><th style="padding:10px;text-align:center;">Qté</th><th style="padding:10px;text-align:right;">Prix</th><th style="padding:10px;text-align:right;">Total</th></tr>';
        vente.items.forEach(function(item) {
            itemsHtml += '<tr style="border-bottom:1px solid #e2e8f0;">' +
                '<td style="padding:10px;">' + escapeHtml(item.nom || '') + '</td>' +
                '<td style="padding:10px;text-align:center;">' + (item.quantite || 1) + '</td>' +
                '<td style="padding:10px;text-align:right;">' + (item.prix || 0).toFixed(2) + ' MAD</td>' +
                '<td style="padding:10px;text-align:right;">' + ((item.quantite || 1) * (item.prix || 0)).toFixed(2) + ' MAD</td>' +
                '</tr>';
        });
        itemsHtml += '</table>';
    } else {
        itemsHtml = '<p style="font-size:24px;">Aucun article</p>';
    }
    
    var modalHtml = `
        <div style="font-size:24px;">
            <p><strong>Facture:</strong> ${vente.factureNum || vente.id.substring(0, 8)}</p>
            <p><strong>Date:</strong> ${vente.createdAt ? new Date(vente.createdAt.seconds * 1000).toLocaleString('fr-FR') : '-'}</p>
            <p><strong>Client:</strong> ${escapeHtml(vente.clientName || vente.table || '-')}</p>
            <p><strong>Total:</strong> ${(vente.total || 0).toFixed(2)} MAD</p>
            <p><strong>Payé:</strong> ${(vente.amountGiven || 0).toFixed(2)} MAD</p>
            <p><strong>Mode:</strong> ${vente.paymentMethod || '-'}</p>
            <p><strong>Vendeur:</strong> ${escapeHtml(vente.vendeur || '-')}</p>
            <hr style="margin:15px 0;">
            <h4 style="font-size:26px;">Articles</h4>
            ${itemsHtml}
        </div>
    `;
    
    openModal('Détails de la vente', modalHtml);
};

// ============================================================
// EXPORTS
// ============================================================
window.loadVentesPage = loadVentesPage;
window.loadVentes = loadVentes;
window.applyVentesFilters = applyVentesFilters;
window.renderVentesTable = renderVentesTable;

console.log('📊 Admin-Ventes.js chargé');
