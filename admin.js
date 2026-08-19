// ============================================================
// ADMIN.JS - CRUD COMPLET (Catégories, Produits, Clients, Fournisseurs, Ventes, Crédits)
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

console.log('📊 Admin.js chargé - CRUD complet');

// ============================================================
// CONFIGURATION DES SECTIONS (AVEC TOUS LES CHAMPS)
// ============================================================
const SECTIONS = {
    // ===== CATÉGORIES =====
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

    // ===== PRODUITS =====
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

    // ===== CLIENTS =====
    clients: {
        label: 'Clients',
        icon: '👥',
        collection: 'clients',
        fields: [
            { name: 'name', label: 'Nom complet', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'phone', label: 'Téléphone', type: 'text', required: false },
            { name: 'address', label: 'Adresse', type: 'text', required: false },
            { name: 'city', label: 'Ville', type: 'text', required: false },
            { name: 'postalCode', label: 'Code postal', type: 'text', required: false }
        ],
        displayFields: ['name', 'email', 'phone', 'city']
    },

    // ===== FOURNISSEURS =====
    fournisseurs: {
        label: 'Fournisseurs',
        icon: '🚚',
        collection: 'fournisseurs',
        fields: [
            { name: 'name', label: 'Nom du fournisseur', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: false },
            { name: 'phone', label: 'Téléphone', type: 'text', required: false },
            { name: 'address', label: 'Adresse', type: 'text', required: false },
            { name: 'city', label: 'Ville', type: 'text', required: false },
            { name: 'productType', label: 'Type de produits', type: 'text', required: false }
        ],
        displayFields: ['name', 'email', 'phone', 'productType']
    },

    // ===== VENTES =====
    ventes: {
        label: 'Ventes',
        icon: '📈',
        collection: 'ventes',
        fields: [
            { name: 'clientName', label: 'Nom du client', type: 'text', required: true },
            { name: 'productName', label: 'Produit', type: 'text', required: true },
            { name: 'quantity', label: 'Quantité', type: 'number', required: true },
            { name: 'unitPrice', label: 'Prix unitaire (MAD)', type: 'text', required: true },
            { name: 'totalPrice', label: 'Total (MAD)', type: 'text', required: true },
            { name: 'status', label: 'Statut', type: 'select', required: true, options: ['En attente', 'Payée', 'Livrée', 'Annulée'] },
            { name: 'paymentMethod', label: 'Moyen de paiement', type: 'select', required: false, options: ['Espèces', 'Carte', 'Virement', 'Chèque'] }
        ],
        displayFields: ['clientName', 'productName', 'totalPrice', 'status']
    },

    // =
