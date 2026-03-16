/**
 * Main API Service Index
 * Re-exports all API services for backward compatibility
 */

// Re-export from individual service files
export { authAPI } from './authAPI.js';
export { productsAPI } from './productsAPI.js';
export { dealersAPI } from './dealersAPI.js';
export { ordersAPI } from './ordersAPI.js';
export { paymentsAPI } from './paymentsAPI.js';
export { suppliersAPI } from './suppliersAPI.js';
export { purchasesAPI } from './purchasesAPI.js';
export { dashboardAPI } from './dashboardAPI.js';
export { billingAPI } from './billingAPI.js';
export { supplierPaymentsAPI } from './supplierPaymentsAPI.js';
export { profitAPI } from './profitAPI.js';
export { aiAPI } from './aiAPI.js';

// Settings API - localStorage for display preferences only
const LS_KEYS = {
  SETTINGS_COMPANY: 'invenza_settings_company',
  SETTINGS_BILLING: 'invenza_settings_billing',
  ARCHIVED_PRODUCTS: 'invenza_archived_products',
  ARCHIVED_DEALERS: 'invenza_archived_dealers',
};

function lsGet(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

function lsSet(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// Settings API - localStorage for display preferences
export const settingsAPI = {
  getAll: () => ({
    company: lsGet(LS_KEYS.SETTINGS_COMPANY, {
      name: 'Vinayak Lakshmi Gas Stoves',
      type: 'Wholesale Gas Stove Manufacturer',
      gstin: '',
      mobile: '',
      whatsapp: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    }),
    billing: lsGet(LS_KEYS.SETTINGS_BILLING, {
      prefix: 'BILL',
      gst_percent: '18',
      payment_terms: 'net30',
      footer: 'Thank you for your business!',
    }),
  }),
  saveCompany: (info) => { lsSet(LS_KEYS.SETTINGS_COMPANY, info); return info; },
  saveBilling: (prefs) => { lsSet(LS_KEYS.SETTINGS_BILLING, prefs); return prefs; },
};

// Archive helpers for products/dealers - localStorage for UI state
export const archiveAPI = {
  getArchivedProducts: () => lsGet(LS_KEYS.ARCHIVED_PRODUCTS),
  archiveProduct: (id) => {
    const archived = lsGet(LS_KEYS.ARCHIVED_PRODUCTS);
    if (!archived.includes(id)) archived.push(id);
    lsSet(LS_KEYS.ARCHIVED_PRODUCTS, archived);
    return Promise.resolve();
  },
  restoreProduct: (id) => {
    let archived = lsGet(LS_KEYS.ARCHIVED_PRODUCTS);
    archived = archived.filter(a => a !== id);
    lsSet(LS_KEYS.ARCHIVED_PRODUCTS, archived);
    return Promise.resolve();
  },
  getArchivedDealers: () => lsGet(LS_KEYS.ARCHIVED_DEALERS),
  archiveDealer: (id) => {
    const archived = lsGet(LS_KEYS.ARCHIVED_DEALERS);
    if (!archived.includes(id)) archived.push(id);
    lsSet(LS_KEYS.ARCHIVED_DEALERS, archived);
    return Promise.resolve();
  },
  restoreDealer: (id) => {
    let archived = lsGet(LS_KEYS.ARCHIVED_DEALERS);
    archived = archived.filter(a => a !== id);
    lsSet(LS_KEYS.ARCHIVED_DEALERS, archived);
    return Promise.resolve();
  },
};
