import supabase from '../config/supabase.js';
import { generateSupplierCode } from '../utils/codeGenerator.js';

/**
 * Suppliers Service
 * Handles all supplier-related business logic and Supabase queries
 * Uses product_ids array instead of supplier_models table
 */

/**
 * Get all suppliers (non-archived by default)
 * @param {Object} filters - Optional filters
 * @returns {Array} List of suppliers
 */
export const getAllSuppliers = async (filters = {}) => {
  let query = supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false });

  // Filter by status if not showing archived
  if (!filters.showArchived) {
    query = query.neq('status', 'archived');
  }

  if (filters.search) {
    query = query.or(
      `firm_name.ilike.%${filters.search}%,person_name.ilike.%${filters.search}%,city.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching suppliers:', error);
    throw { statusCode: 500, message: 'Failed to fetch suppliers' };
  }

  // 1. Efficient Aggregation: Fetch all purchase items with their supplier_id
  const { data: allItems, error: itemsError } = await supabase
    .from('purchase_items')
    .select('qty, cost_per_unit, purchases!inner(supplier_id)');

  // 2. Efficient Aggregation: Fetch all supplier payments
  const { data: allPayments, error: paymentsError } = await supabase
    .from('supplier_payments')
    .select('supplier_id, paid_amount');

  // Map to store totals per supplier
  const purchaseTotals = {};
  const paymentTotals = {};

  (allItems || []).forEach(item => {
    const sId = item.purchases?.supplier_id;
    if (sId) {
      purchaseTotals[sId] = (purchaseTotals[sId] || 0) + (item.qty * item.cost_per_unit);
    }
  });

  (allPayments || []).forEach(payment => {
    const sId = payment.supplier_id;
    if (sId) {
      paymentTotals[sId] = (paymentTotals[sId] || 0) + (parseFloat(payment.paid_amount) || 0);
    }
  });

  // 3. Map totals onto suppliers
  const suppliersWithStats = (data || []).map(supplier => {
    const totalPurchased = purchaseTotals[supplier.supplier_id] || 0;
    const totalPaid = paymentTotals[supplier.supplier_id] || 0;
    const owedAmount = Math.max(0, totalPurchased - totalPaid);

    return {
      ...supplier,
      owed_amount: owedAmount
    };
  });

  return suppliersWithStats;
};

/**
 * Get active suppliers for dropdowns
 * @returns {Array} List of active suppliers (minimal data)
 */
export const getActiveSuppliers = async () => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('supplier_id, supplier_code, firm_name, person_name')
    .neq('status', 'archived')
    .order('firm_name', { ascending: true });

  if (error) {
    console.error('Error fetching active suppliers:', error);
    throw { statusCode: 500, message: 'Failed to fetch active suppliers' };
  }

  return data || [];
};

/**
 * Get supplier by ID
 * @param {number} supplierId - Supplier ID
 * @returns {Object} Supplier data
 */
export const getSupplierById = async (supplierId) => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('supplier_id', supplierId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw { statusCode: 404, message: 'Supplier not found' };
    }
    console.error('Error fetching supplier:', error);
    throw { statusCode: 500, message: 'Failed to fetch supplier' };
  }

  // Fetch auto-mapped models
  const { data: models, error: modelsError } = await supabase
    .from('supplier_models')
    .select('product_name')
    .eq('supplier_id', supplierId);

  // If table is missing (PGRST204/205), just return empty array instead of crashing
  const modelsData = modelsError ? [] : (models || []);

  return { ...data, auto_mapped_models: modelsData };
};

/**
 * Get auto-mapped models for a supplier
 * @param {number} supplierId - Supplier ID
 * @returns {Array} List of model names
 */
export const getSupplierModels = async (supplierId) => {
  const { data, error } = await supabase
    .from('supplier_models')
    .select('product_name')
    .eq('supplier_id', supplierId);

  if (error) {
    // If table is missing (PGRST205), return empty array
    if (error.code === 'PGRST205' || error.code === 'PGRST204' || error.message.includes('not found')) {
      return [];
    }
    console.error('Error fetching supplier models:', error);
    throw { statusCode: 500, message: 'Failed to fetch supplier models' };
  }

  return (data || []).map(m => m.product_name);
};

/**
 * Generate next supplier code
 * @returns {string} New supplier code
 */
export const generateNextSupplierCode = async () => {
  const { count, error } = await supabase
    .from('suppliers')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error counting suppliers:', error);
    return generateSupplierCode(1);
  }

  return generateSupplierCode((count || 0) + 1);
};

/**
 * Create a new supplier
 * @param {Object} supplierData - Supplier data
 * @returns {Object} Created supplier
 */
export const createSupplier = async (supplierData) => {
  const { 
    firm_name, 
    person_name, 
    mobile, 
    email, 
    gstin, 
    city, 
    state,
    notes,
    product_ids = []
  } = supplierData;

  // Validate required fields
  if (!firm_name) {
    throw { statusCode: 400, message: 'Firm name is required' };
  }

  // Generate supplier code
  const supplier_code = await generateNextSupplierCode();

  // Create supplier
  const { data: supplier, error } = await supabase
    .from('suppliers')
    .insert({
      supplier_code,
      firm_name,
      person_name,
      mobile,
      email,
      gstin,
      city,
      state,
      notes,
      product_ids,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating supplier:', error);
    throw { statusCode: 500, message: 'Failed to create supplier' };
  }

  return supplier;
};

/**
 * Update a supplier
 * @param {number} supplierId - Supplier ID
 * @param {Object} supplierData - Updated supplier data
 * @returns {Object} Updated supplier
 */
export const updateSupplier = async (supplierId, supplierData) => {
  const { 
    firm_name, 
    person_name, 
    mobile, 
    email, 
    gstin, 
    city, 
    state,
    notes,
    product_ids
  } = supplierData;

  const updateData = {
    firm_name,
    person_name,
    mobile,
    email,
    gstin,
    city,
    state,
    notes,
  };

  // Only update product_ids if provided
  if (product_ids !== undefined) {
    updateData.product_ids = product_ids;
  }

  // Update supplier
  const { data: supplier, error } = await supabase
    .from('suppliers')
    .update(updateData)
    .eq('supplier_id', supplierId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw { statusCode: 404, message: 'Supplier not found' };
    }
    console.error('Error updating supplier:', error);
    throw { statusCode: 500, message: 'Failed to update supplier' };
  }

  return supplier;
};

/**
 * Archive a supplier (soft delete)
 * @param {number} supplierId - Supplier ID
 * @returns {boolean} Success status
 */
export const deleteSupplier = async (supplierId) => {
  const { error } = await supabase
    .from('suppliers')
    .update({ status: 'archived' })
    .eq('supplier_id', supplierId);

  if (error) {
    console.error('Error archiving supplier:', error);
    throw { statusCode: 500, message: 'Failed to archive supplier' };
  }

  return true;
};

/**
 * Restore an archived supplier
 * @param {number} supplierId - Supplier ID
 * @returns {Object} Restored supplier
 */
export const restoreSupplier = async (supplierId) => {
  const { data, error } = await supabase
    .from('suppliers')
    .update({ status: 'active' })
    .eq('supplier_id', supplierId)
    .select()
    .single();

  if (error) {
    console.error('Error restoring supplier:', error);
    throw { statusCode: 500, message: 'Failed to restore supplier' };
  }

  return data;
};

/**
 * Get archived suppliers
 * @returns {Array} List of archived suppliers
 */
export const getArchivedSuppliers = async () => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('status', 'archived')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching archived suppliers:', error);
    throw { statusCode: 500, message: 'Failed to fetch archived suppliers' };
  }

  return data || [];
};

export default {
  getAllSuppliers,
  getActiveSuppliers,
  getSupplierById,
  generateNextSupplierCode,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  restoreSupplier,
  getArchivedSuppliers,
};
