// ==================== ADMIN-CREDITS.JS ====================
// Gestion des crédits – Complet

window.creditsPeriod = window.creditsPeriod || 'all';
window.creditsSearch = window.creditsSearch || '';
window.creditSelectionMode = false;
window.creditSelectedIds = [];
window.allCreditsData = window.allCreditsData || [];

window.clientDescriptionIndex = {};
window.clientDescriptionWordIndex = {};

// ============================================================
// FORMATAGE
// ============================================================
function formatPriceC(price) {
    if (price === undefined || price === null) return '0 MAD';
    return Number(price).toFixed(2) + ' MAD';
}

function normalizeC(str) {
    return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function escapeHtmlC(text) {
    if (!text) return '';
    return String(text).replace(/[&<>"]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        return m;
    });
}

// ============================================================
// PAGINATION
// ============================================================
window.currentPages = window.currentPages || {};
window.currentPages.credits = 1;
window.itemsPerPage = 20;

function getPageDataC(pageKey, data) {
    const page = window.currentPages[pageKey] || 1;
    const start = (page - 1) * window.itemsPerPage;
    const end = start + window.itemsPerPage;
    return data.slice(start, end);
}

function getPaginationHTMLC(pageKey, total) {
    const current = window.currentPages[pageKey] || 1;
    const totalPages = Math.ceil(total / window.itemsPerPage);
    if (totalPages <= 1) return '';

    let h = '<div style="display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap;padding:10px 0;">';
    if (current > 1) {
        h += `<button onclick="goToPageC('${pageKey}', ${current - 1})" style="padding:8px 16px;border:1px solid #e2e8f0;border-radius:6px;background:#fff;cursor:pointer;font-size:20px;">◀ Précédent</button>`;
    }
    h += `<span style="font-size:20px;font-weight:600;padding:0 12px;">Page ${current}/${totalPages}</span>`;
    if (current < totalPages) {
        h += `<button onclick="goToPageC('${pageKey}', ${current + 1})" style="padding:8px 16px;border:1px solid #e2e8f0;border-radius:6px;background:#fff;cursor:pointer;font-size:20px;">Suivant ▶</button>`;
    }
    h += '</div>';
    return h;
}

window.goToPageC = function(pageKey, page) {
    window.currentPages[pageKey] = page;
    if (pageKey === 'credits') {
        applyCreditsFilters();
    }
};

// ============================================================
// FILTRES
// ============================================================
function filterByPeriodC(data, period) {
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
// CHARGEMENT CRÉDITS
// ============================================================
export async function loadCreditsPage(c) {
    window.creditsPeriod = 'all';
    window.creditsSearch = '';
    window.creditSelectionMode = false;
    window.creditSelectedIds = [];

    if (!window.sortOrders) window.sortOrders = {};
    if (!window.sortOrders.credits) window.sortOrders.credits = {};
    if (!window.sortOrders.credits.createdAt) window.sortOrders.credits.createdAt = 'desc';

    // Vérifier si le conteneur existe déjà
    let container = document.getElementById('creditsTableContainer');
    
    c.innerHTML = `
    <div class="content-card">
        <div class="card-header">
            <h3 style="font-size:28px;"><i class="fas fa-credit-card"></i> Crédits</h3>
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <div style="position:relative;">
                    <input type="text" id="creditsSearchInput" placeholder="🔍 Rechercher..." 
                           style="padding:14px 18px; border:2px solid #e2e8f0; border-radius:8px; width:280px; font-size:24px !important; height:56px;">
                    <div id="creditsClientDropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:2px solid #e2e8f0;border-radius:0 0 8px 8px;max-height:250px;overflow-y:auto;z-index:50;box-shadow:0 5px 15px rgba(0,0,0,0.1);font-size:24px;"></div>
                </div>
                <select id="creditsPeriodSelect" 
                        style="padding:14px 18px; border:2px solid #e2e8f0; border-radius:8px; font-size:24px !important; height:56px;">
                    <option value="all">Toutes</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                </select>
                <button class="btn-add" onclick="loadCredits()" 
                        style="font-size:24px !important; padding:14px 20px; height:56px;">
                    <i class="fas fa-sync"></i> Actualiser
                </button>
                <button id="toggleSelectionBtn" class="btn-add" onclick="toggleCreditSelectionMode()" 
                        style="font-size:24px !important; padding:14px 20px; height:56px;">
                    <i class="fas fa-check-square"></i> Sélectionner
                </button>
                <button id="selectAllBtn" class="btn-add" onclick="toggleSelectAllVisible()" 
                        style="display:none; background:#4f46e5; font-size:24px !important; padding:14px 20px; height:56px;">
                    <i class="fas fa-check-double"></i> Tout sélectionner
                </button>
                <button id="deleteSelectedBtn" class="btn-delete" onclick="deleteSelectedCredits()" 
                        style="display:none; background:#fee2e2; color:#b91c1c; font-size:24px !important; padding:14px 20px; height:56px;">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        </div>
        <div id="creditsTableContainer"></div>
        <div id="creditsPagination" style="margin-top:10px;"></div>
    </div>`;

    // Attacher les événements
    setTimeout(() => {
        const searchInput = document.getElementById('creditsSearchInput');
        if (searchInput) {
            searchInput.oninput = function() {
                searchClientInCreditsDropdown(this.value);
            };
            searchInput.autocomplete = 'off';
        }
        const periodSelect = document.getElementById('creditsPeriodSelect');
        if (periodSelect) {
            periodSelect.onchange = function() {
                window.creditsPeriod = this.value;
                window.currentPages.credits = 1;
                applyCreditsFilters();
            };
        }
    }, 100);

    loadCredits();
}

// ============================================================
// LOAD CREDITS
// ============================================================
async function loadCredits() {
    try {
        const snapshot = await db.collection('credits').orderBy('createdAt', 'desc').limit(2000).get();
        window.allCreditsData = [];
        snapshot.forEach(function(doc) {
            var d = doc.data();
            d.id = doc.id;
            window.allCreditsData.push(d);
        });

        if (!window.sortOrders.credits) window.sortOrders.credits = {};
        if (!window.sortOrders.credits.createdAt) window.sortOrders.credits.createdAt = 'desc';

        window.currentPages.credits = 1;
        applyCreditsFilters();
    } catch (error) {
        console.error('Erreur chargement crédits:', error);
        window.showToast('⚠️ Erreur chargement crédits', true);
    }
}

window.loadCredits = loadCredits;

// ============================================================
// RECHERCHE CLIENT
// ============================================================
function searchClientInCreditsDropdown(query) {
    var q = query.toLowerCase().trim();
    var dropdown = document.getElementById('creditsClientDropdown');
    var searchInput = document.getElementById('creditsSearchInput');

    if (!q) {
        if (dropdown) dropdown.style.display = 'none';
        window.creditsSearch = q;
        window.currentPages.credits = 1;
        applyCreditsFilters();
        return;
    }

    // Filtrer les crédits par recherche
    window.creditsSearch = q;
    window.currentPages.credits = 1;
    applyCreditsFilters();

    // Cacher le dropdown
    if (dropdown) dropdown.style.display = 'none';
}

// ============================================================
// APPLY FILTERS
// ============================================================
function applyCreditsFilters() {
    let filtered = filterByPeriodC(window.allCreditsData, window.creditsPeriod);
    
    if (window.creditsSearch && window.creditsSearch.trim() !== '') {
        const q = normalizeC(window.creditsSearch.trim());
        filtered = filtered.filter(function(credit) {
            return normalizeC(credit.clientName || '').indexOf(q) !== -1 ||
                   normalizeC(credit.factureNum || '').indexOf(q) !== -1 ||
                   normalizeC(credit.table || '').indexOf(q) !== -1;
        });
    }
    
    // Tri
    filtered.sort(function(a, b) {
        var da = a.createdAt?.seconds || 0;
        var db = b.createdAt?.seconds || 0;
        return db - da;
    });
    
    window.filteredCredits = filtered;
    renderCreditsTable();
}

window.applyCreditsFilters = applyCreditsFilters;

// ============================================================
// RENDER TABLE
// ============================================================
function renderCreditsTable() {
    var cont = document.getElementById('creditsTableContainer');
    if (!cont) return;
    
    var data = window.filteredCredits || [];
    var pageData = getPageDataC('credits', data);
    
    if (pageData.length === 0) {
        cont.innerHTML = '<p style="text-align:center;padding:40px;font-size:28px;">Aucun crédit trouvé</p>';
        document.getElementById('creditsPagination').innerHTML = '';
        return;
    }
    
    var totalImpaye = 0;
    
    var h = '<div class="table-container" style="overflow-x:auto;border-radius:10px;border:1px solid #e2e8f0;">' +
        '<table class="data-table" style="width:100%;border-collapse:collapse;min-width:900px;font-size:24px !important;">' +
        '<thead><tr style="background:#f9fafb;">' +
        '<th style="padding:16px 14px;text-align:left;font-weight:700;font-size:24px !important;border-bottom:2px solid #e2e8f0;">Facture</th>' +
        '<th style="padding:16px 14px;text-align:left;font-weight:700;font-size:24px !important;border-bottom:2px solid #e2e8f0;">Date</th>' +
        '<th style="padding:16px 14px;text-align:left;font-weight:700;font-size:24px !important;border-bottom:2px solid #e2e8f0;">Client</th>' +
        '<th style="padding:16px 14px;text-align:left;font-weight:700;font-size:24px !important;border-bottom:2px solid #e2e8f0;">Total</th>' +
        '<th style="padding:16px 14px;text-align:left;font-weight:700;font-size:24px !important;border-bottom:2px solid #e2e8f0;">Payé</th>' +
        '<th style="padding:16px 14px;text-align:left;font-weight:700;font-size:24px !important;border-bottom:2px solid #e2e8f0;">Restant</th>' +
        '<th style="padding:16px 14px;text-align:left;font-weight:700;font-size:24px !important;border-bottom:2px solid #e2e8f0;">Mode</th>' +
        '<th style="padding:16px 14px;text-align:left;font-weight:700;font-size:24px !important;border-bottom:2px solid #e2e8f0;">Actions</th>';
    
    if (window.creditSelectionMode) {
        h += '<th style="padding:16px 14px;text-align:left;font-weight:700;font-size:24px !important;border-bottom:2px solid #e2e8f0;width:40px;">☑️</th>';
    }
    h += '</tr></thead><tbody>';
    
    pageData.forEach(function(d) {
        var reste = d.remainingAmount || d.total || 0;
        if (!d.paid) totalImpaye += reste;
        
        var dt = d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleString('fr-FR') : '';
        
        var isSelected = window.creditSelectedIds.includes(d.id);
        var rowClass = isSelected ? ' style="background:#fef3c7;"' : '';
        
        h += '<tr' + rowClass + '>' +
            '<td style="padding:16px 14px;font-size:24px !important;border-bottom:1px solid #e2e8f0;font-weight:700;">' + (d.factureNum || d.id.substring(0, 8)) + '</td>' +
            '<td style="padding:16px 14px;font-size:24px !important;border-bottom:1px solid #e2e8f0;">' + dt + '</td>' +
            '<td style="padding:16px 14px;font-size:24px !important;border-bottom:1px solid #e2e8f0;font-weight:700;">' + escapeHtmlC(d.clientName || d.table || '-') + '</td>' +
            '<td style="padding:16px 14px;font-size:24px !important;border-bottom:1px solid #e2e8f0;">' + (d.total || 0).toFixed(2) + ' MAD</td>' +
            '<td style="padding:16px 14px;font-size:24px !important;border-bottom:1px solid #e2e8f0;">' + (d.amountGiven || 0).toFixed(2) + ' MAD</td>' +
            '<td style="padding:16px 14px;font-size:24px !important;border-bottom:1px solid #e2e8f0;color:#ef4444;font-weight:700;"><span style="font-size:26px;">' + reste.toFixed(2) + ' MAD</span></td>' +
            '<td style="padding:16px 14px;font-size:24px !important;border-bottom:1px solid #e2e8f0;">' + (d.paymentMethod || '-') + '</td>' +
            '<td style="padding:16px 14px;font-size:24px !important;border-bottom:1px solid #e2e8f0;">' +
            '<button class="btn-edit" onclick="printFacture(\'' + d.id + '\')" style="font-size:22px !important;padding:10px 14px;background:none;border:none;color:#4b5563;cursor:pointer;"><i class="fas fa-print"></i></button> ' +
            (d.paid ? '' : '<button class="btn-add" onclick="payerCredit(\'' + d.id + '\')" style="font-size:22px !important;padding:10px 16px;background:#2E7D32;color:#fff;border:none;border-radius:6px;cursor:pointer;"><i class="fas fa-check"></i> Payer</button> ') +
            '<button class="btn-edit" onclick="editCredit(\'' + d.id + '\')" style="font-size:22px !important;padding:10px 14px;background:none;border:none;color:#4b5563;cursor:pointer;"><i class="fas fa-edit"></i></button>' +
            '</td>';
        
        if (window.creditSelectionMode) {
            var checked = isSelected ? 'checked' : '';
            h += '<td style="padding:16px 14px;font-size:24px !important;border-bottom:1px solid #e2e8f0;text-align:center;"><input type="checkbox" class="credit-select-check" data-id="' + d.id + '" ' + checked + ' onchange="toggleCreditSelection(\'' + d.id + '\')" style="transform:scale(1.5);width:24px;height:24px;"></td>';
        }
        h += '</tr>';
    });
    
    h += '</tbody></table></div>';
    h += '<div style="margin-top:15px;padding:20px;background:#fef2f2;border-radius:12px;text-align:center;font-size:28px !important;">' +
        '<strong style="font-size:30px !important;">Impayés: ' + totalImpaye.toFixed(2) + ' MAD</strong>' +
        '</div>';
    
    cont.innerHTML = h;
    document.getElementById('creditsPagination').innerHTML = getPaginationHTMLC('credits', data.length);
}

window.renderCreditsTable = renderCreditsTable;

// ============================================================
// SÉLECTION MULTIPLE
// ============================================================
function toggleCreditSelectionMode() {
    window.creditSelectionMode = !window.creditSelectionMode;
    window.creditSelectedIds = [];
    window.selectAllBtnState = false;
    
    var selectBtn = document.getElementById('toggleSelectionBtn');
    var deleteBtn = document.getElementById('deleteSelectedBtn');
    var selectAllBtn = document.getElementById('selectAllBtn');
    
    if (selectBtn) {
        selectBtn.innerHTML = window.creditSelectionMode ? 
            '<i class="fas fa-times-circle"></i> Annuler' : 
            '<i class="fas fa-check-square"></i> Sélectionner';
    }
    if (selectAllBtn) {
        selectAllBtn.style.display = window.creditSelectionMode ? 'inline-block' : 'none';
        selectAllBtn.innerHTML = '<i class="fas fa-check-double"></i> Tout sélectionner';
        selectAllBtn.style.background = '#4f46e5';
    }
    if (deleteBtn) {
        deleteBtn.style.display = 'none';
    }
    renderCreditsTable();
}

window.toggleCreditSelectionMode = toggleCreditSelectionMode;

function toggleCreditSelection(id) {
    var idx = window.creditSelectedIds.indexOf(id);
    if (idx === -1) {
        window.creditSelectedIds.push(id);
    } else {
        window.creditSelectedIds.splice(idx, 1);
    }
    updateDeleteButtonVisibility();
    renderCreditsTable();
}

window.toggleCreditSelection = toggleCreditSelection;

function updateDeleteButtonVisibility() {
    var deleteBtn = document.getElementById('deleteSelectedBtn');
    if (deleteBtn) {
        deleteBtn.style.display = window.creditSelectedIds.length > 0 ? 'inline-block' : 'none';
    }
}

window.updateDeleteButtonVisibility = updateDeleteButtonVisibility;

function toggleSelectAllVisible() {
    var data = window.filteredCredits || [];
    var pageData = getPageDataC('credits', data);
    
    if (window.selectAllBtnState) {
        // Désélectionner
        window.creditSelectedIds = window.creditSelectedIds.filter(function(id) {
            return !pageData.some(function(d) { return d.id === id; });
        });
    } else {
        // Sélectionner
        pageData.forEach(function(d) {
            if (!window.creditSelectedIds.includes(d.id)) {
                window.creditSelectedIds.push(d.id);
            }
        });
    }
    window.selectAllBtnState = !window.selectAllBtnState;
    
    var btn = document.getElementById('selectAllBtn');
    if (btn) {
        if (window.selectAllBtnState) {
            btn.innerHTML = '<i class="fas fa-times"></i> Tout décocher';
            btn.style.background = '#ef4444';
        } else {
            btn.innerHTML = '<i class="fas fa-check-double"></i> Tout sélectionner';
            btn.style.background = '#4f46e5';
        }
    }
    updateDeleteButtonVisibility();
    renderCreditsTable();
}

window.toggleSelectAllVisible = toggleSelectAllVisible;

function deleteSelectedCredits() {
    if (window.creditSelectedIds.length === 0) {
        alert('Aucun crédit sélectionné.');
        return;
    }
    if (!confirm('Supprimer définitivement les ' + window.creditSelectedIds.length + ' crédits sélectionnés ?')) return;

    var promises = window.creditSelectedIds.map(function(id) {
        return db.collection('credits').doc(id).delete().then(function() {
            window.allCreditsData = window.allCreditsData.filter(function(c) { return c.id !== id; });
        });
    });

    Promise.all(promises).then(function() {
        alert('✅ ' + window.creditSelectedIds.length + ' crédit(s) supprimé(s).');
        window.creditSelectedIds = [];
        window.creditSelectionMode = false;
        var selectBtn = document.getElementById('toggleSelectionBtn');
        var deleteBtn = document.getElementById('deleteSelectedBtn');
        var selectAllBtn = document.getElementById('selectAllBtn');
        if (selectBtn) selectBtn.innerHTML = '<i class="fas fa-check-square"></i> Sélectionner';
        if (deleteBtn) deleteBtn.style.display = 'none';
        if (selectAllBtn) selectAllBtn.style.display = 'none';
        loadCredits();
    }).catch(function(e) {
        alert('❌ Erreur: ' + e.message);
    });
}

window.deleteSelectedCredits = deleteSelectedCredits;

// ============================================================
// PAIEMENT CRÉDIT
// ============================================================
window.payerCredit = function(creditId) {
    var data = window.filteredCredits || window.allCreditsData || [];
    var credit = data.find(function(c) { return c.id === creditId; });
    if (!credit) {
        alert('Crédit introuvable');
        return;
    }
    
    // Rediriger vers le POS ou ouvrir un modal de paiement
    window.showToast('💳 Paiement du crédit ' + (credit.factureNum || creditId.substring(0,8)), false);
    
    // Simple: marquer comme payé
    var montant = credit.remainingAmount || credit.total || 0;
    if (confirm('Payer le montant de ' + montant.toFixed(2) + ' MAD pour le crédit ' + (credit.factureNum || creditId.substring(0,8)) + ' ?')) {
        db.collection('credits').doc(creditId).update({
            paid: true,
            remainingAmount: 0,
            amountGiven: (credit.amountGiven || 0) + montant,
            paidAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function() {
            window.showToast('✅ Crédit payé avec succès !');
            loadCredits();
        }).catch(function(e) {
            alert('❌ Erreur: ' + e.message);
        });
    }
};

// ============================================================
// ÉDITION CRÉDIT
// ============================================================
window.editCredit = function(id) {
    var data = window.filteredCredits || window.allCreditsData || [];
    var credit = data.find(function(c) { return c.id === id; });
    if (!credit) {
        alert('Crédit introuvable');
        return;
    }
    
    var montantRestant = credit.remainingAmount || credit.total || 0;
    var nouveauMontant = prompt('Modifier le montant restant pour le crédit ' + (credit.factureNum || id.substring(0,8)) + ' :', montantRestant.toFixed(2));
    
    if (nouveauMontant === null) return;
    var nouveauMontantNum = parseFloat(nouveauMontant);
    if (isNaN(nouveauMontantNum) || nouveauMontantNum < 0) {
        alert('Montant invalide');
        return;
    }
    
    db.collection('credits').doc(id).update({
        remainingAmount: nouveauMontantNum,
        total: (credit.total || 0),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
        window.showToast('✅ Crédit mis à jour');
        loadCredits();
    }).catch(function(e) {
        alert('❌ Erreur: ' + e.message);
    });
};

// ============================================================
// EXPORTS
// ============================================================
window.loadCreditsPage = loadCreditsPage;
window.loadCredits = loadCredits;
window.applyCreditsFilters = applyCreditsFilters;
window.renderCreditsTable = renderCreditsTable;

console.log('📊 Admin-Credits.js chargé');
