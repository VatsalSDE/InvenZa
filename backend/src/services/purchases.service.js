import supabase from '../config/supabase.js';
import { generatePurchaseCode, getTodayDatePattern } from '../utils/codeGenerator.js';
import * as productsService from './products.service.js';

/**
 * Purchases Service
 * Handles all purchase order related business logic and Supabase queries
 */

/**
 * Get all purchases with supplier info and items
 * @param {Object} filters - Optional filters
 * @returns {Array} List of purchases
 */
export const getAllPurchases = async (filters = {}) => {
  let query = supabase
    .from('purchases')
    .select(`
      *,
      suppliers (supplier_code, firm_name, person_name)
    `)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.supplier_id) {
    query = query.eq('supplier_id', filters.supplier_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching purchases:', error);
    throw { statusCode: 500, message: 'Failed to fetch purchases' };
  }

  // Flatten supplier info
  return (data || []).map((purchase) => ({
    ...purchase,
    supplier_name: purchase.suppliers?.firm_name,
    supplier_code: purchase.suppliers?.supplier_code,
    suppliers: undefined,
  }));
};

/**
 * Get purchase by ID with items
 * @param {number} purchaseId - Purchase ID
 * @returns {Object} Purchase with items
 */
export const getPurchaseById = async (purchaseId) => {
  const { data: purchase, error } = await supabase
    .from('purchases')
    .select(`
      *,
      suppliers (supplier_code, firm_name, person_name, mobile, email)
    `)
    .eq('purchase_id', purchaseId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw { statusCode: 404, message: 'Purchase not found' };
    }
    console.error('Error fetching purchase:', error);
    throw { statusCode: 500, message: 'Failed to fetch purchase' };
  }

  // Get purchase items
  const { data: items, error: itemsError } = await supabase
    .from('purchase_items')
    .select(`
      *,
      products (product_code, product_name, category)
    `)
    .eq('purchase_id', purchaseId);

  if (itemsError) {
    console.error('Error fetching purchase items:', itemsError);
    throw { statusCode: 500, message: 'Failed to fetch purchase items' };
  }

  return {
    ...purchase,
    supplier: purchase.suppliers,
    suppliers: undefined,
    items: (items || []).map((item) => ({
      ...item,
      product_code: item.products?.product_code,
      product_name: item.products?.product_name,
      products: undefined,
    })),
  };
};

/**
 * Get purchase items
 * @param {number} purchaseId - Purchase ID
 * @returns {Array} Purchase items with product info
 */
export const getPurchaseItems = async (purchaseId) => {
  const { data, error } = await supabase
    .from('purchase_items')
    .select(`
      *,
      products (product_code, product_name, category, price)
    `)
    .eq('purchase_id', purchaseId);

  if (error) {
    console.error('Error fetching purchase items:', error);
    throw { statusCode: 500, message: 'Failed to fetch purchase items' };
  }

  return (data || []).map((item) => ({
    ...item,
    product_code: item.products?.product_code,
    product_name: item.products?.product_name,
    products: undefined,
  }));
};

/**
 * Generate next purchase code for today
 * @returns {string} New purchase code
 */
export const generateNextPurchaseCode = async () => {
  const datePattern = getTodayDatePattern();

  const { data, error } = await supabase
    .from('purchases')
    .select('purchase_code')
    .like('purchase_code', `PO-${datePattern}%`)
    .order('purchase_code', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error generating purchase code:', error);
    return generatePurchaseCode(1);
  }

  if (!data || data.length === 0) {
    return generatePurchaseCode(1);
  }

  const lastCode = data[0].purchase_code;
  const lastSeq = parseInt(lastCode.split('-')[2]) || 0;
  return generatePurchaseCode(lastSeq + 1);
};

/**
 * Create a new purchase with items
 * When status is 'Received', automatically increase product quantities
 * @param {Object} purchaseData - Purchase data with items
 * @returns {Object} Created purchase
 */
export const createPurchase = async (purchaseData) => {
  const {
    supplier_id,
    status = 'Pending',
    total_cost,
    purchase_date,
    notes,
    items_count,
    items = []
  } = purchaseData;

  // Validate required fields
  if (!supplier_id) {
    throw { statusCode: 400, message: 'Supplier is required' };
  }

  if (!items || items.length === 0) {
    throw { statusCode: 400, message: 'At least one item is required' };
  }

  // Verify supplier exists
  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .select('supplier_id')
    .eq('supplier_id', supplier_id)
    .single();

  if (supplierError || !supplier) {
    throw { statusCode: 400, message: 'Supplier not found or is archived' };
  }

  // Generate purchase code
  const purchase_code = await generateNextPurchaseCode();

  // Calculate total if not provided
  let calculatedTotal = total_cost;
  if (!calculatedTotal) {
    calculatedTotal = items.reduce((sum, item) => {
      return sum + ((item.qty || item.quantity) * (item.cost_per_unit || item.unit_cost || 0));
    }, 0);
  }

  // Create purchase
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      purchase_code,
      supplier_id,
      status,
      total_cost: calculatedTotal,
      total_amount: calculatedTotal,
      items_count: items_count || items.length
    })
    .select()
    .single();

  if (purchaseError) {
    console.error('Error creating purchase:', purchaseError);
    throw { statusCode: 500, message: 'Failed to create purchase' };
  }

  // Insert purchase items
  for (const item of items) {
    const product_id = item.product_id;
    const qty = item.qty || item.quantity;
    const cost_per_unit = item.cost_per_unit || item.unit_cost;

    if (!product_id || !qty) {
      throw { statusCode: 400, message: 'Product ID and qty are required for each item' };
    }

    // Insert purchase item
    const { error: itemError } = await supabase
      .from('purchase_items')
      .insert({
        purchase_id: purchase.purchase_id,
        product_id,
        quantity: qty,
        unit_cost: cost_per_unit || 0,
      });

    if (itemError) {
      console.error('Error creating purchase item:', itemError);
      throw { statusCode: 500, message: 'Failed to create purchase item' };
    }

    // If status is received, increase stock and update price
    if (status && status.toLowerCase() === 'received') {
      // Get current product
      const { data: product } = await supabase
        .from('products')
        .select('quantity, price')
        .eq('product_id', product_id)
        .single();
        
      if (product) {
        await supabase
          .from('products')
          .update({ 
            quantity: product.quantity + qty,
            price: cost_per_unit || product.price
          })
          .eq('product_id', product_id);
      }
    }

    // Auto-map supplier to product model
    // This allows the supplier card to show all models they have supplied
    try {
      // Get product name for mapping
      const { data: prodData } = await supabase
        .from('products')
        .select('product_name')
        .eq('product_id', product_id)
        .single();

      if (prodData) {
        // Check if mapping already exists
        const { data: existingMapping } = await supabase
          .from('supplier_models')
          .select('id')
          .eq('supplier_id', supplier_id)
          .eq('product_name', prodData.product_name)
          .single();

        if (!existingMapping) {
          // Create new mapping
          await supabase
            .from('supplier_models')
            .insert({
              supplier_id,
              product_name: prodData.product_name
            });
        }
      }
    } catch (mappingError) {
      // Don't fail the whole purchase if auto-mapping fails
      console.error('Error in auto-mapping supplier model:', mappingError);
    }
  }

  return await getPurchaseById(purchase.purchase_id);
};

/**
 * Update a purchase
 * @param {number} purchaseId - Purchase ID
 * @param {Object} purchaseData - Updated purchase data
 * @returns {Object} Updated purchase
 */
export const updatePurchase = async (purchaseId, purchaseData) => {
  const {
    supplier_id,
    status,
    total_cost,
    purchase_date,
    notes
  } = purchaseData;

  // Update purchase
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .update({
      supplier_id,
      status,
      total_cost
    })
    .eq('purchase_id', purchaseId)
    .select()
    .single();

  if (purchaseError) {
    if (purchaseError.code === 'PGRST116') {
      throw { statusCode: 404, message: 'Purchase not found' };
    }
    console.error('Error updating purchase:', purchaseError);
    throw { statusCode: 500, message: 'Failed to update purchase' };
  }

  return await getPurchaseById(purchaseId);
};

/**
 * Update purchase status
 * When changed to 'Received', trigger stock increase
 * @param {number} purchaseId - Purchase ID
 * @param {string} newStatus - New status
 * @returns {Object} Updated purchase
 */
export const updatePurchaseStatus = async (purchaseId, newStatus) => {
  const validStatuses = ['Pending', 'Received'];
  if (!validStatuses.includes(newStatus)) {
    throw { statusCode: 400, message: 'Invalid status. Must be Pending or Received' };
  }

  // Get current purchase to check status
  const { data: currentPurchase, error: fetchError } = await supabase
    .from('purchases')
    .select('status')
    .eq('purchase_id', purchaseId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw { statusCode: 404, message: 'Purchase not found' };
    }
    throw { statusCode: 500, message: 'Failed to fetch purchase' };
  }

  // If changing from Pending to Received, increase stock
  if (currentPurchase.status === 'Pending' && newStatus === 'Received') {
    // Get purchase items
    const items = await getPurchaseItems(purchaseId);

    // Increase stock and update price for each item
    for (const item of items) {
      const qty = item.qty || item.quantity;
      const cost_per_unit = item.cost_per_unit || item.unit_cost;
      const { data: product } = await supabase
        .from('products')
        .select('quantity, price')
        .eq('product_id', item.product_id)
        .single();
        
      if (product) {
        await supabase
          .from('products')
          .update({ 
            quantity: product.quantity + qty,
            price: cost_per_unit || product.price
          })
          .eq('product_id', item.product_id);
      }
    }
  }

  // Update status
  const { data, error } = await supabase
    .from('purchases')
    .update({ status: newStatus })
    .eq('purchase_id', purchaseId)
    .select()
    .single();

  if (error) {
    console.error('Error updating purchase status:', error);
    throw { statusCode: 500, message: 'Failed to update purchase status' };
  }

  return await getPurchaseById(purchaseId);
};

/**
 * Delete a purchase
 * @param {number} purchaseId - Purchase ID
 * @returns {boolean} Success status
 */
export const deletePurchase = async (purchaseId) => {
  // Delete purchase items first
  await supabase
    .from('purchase_items')
    .delete()
    .eq('purchase_id', purchaseId);

  // Delete purchase
  const { error } = await supabase
    .from('purchases')
    .delete()
    .eq('purchase_id', purchaseId);

  if (error) {
    console.error('Error deleting purchase:', error);
    throw { statusCode: 500, message: 'Failed to delete purchase' };
  }

  return true;
};

/**
 * Get purchases for a specific supplier
 * @param {number} supplierId - Supplier ID
 * @returns {Array} Purchases for the supplier
 */
export const getPurchasesBySupplier = async (supplierId) => {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching purchases by supplier:', error);
    throw { statusCode: 500, message: 'Failed to fetch purchases' };
  }

  // Get items for each purchase to calculate total if stored total is 0
  const purchasesWithTotals = await Promise.all((data || []).map(async (purchase) => {
    const { data: items } = await supabase
      .from('purchase_items')
      .select('quantity, unit_cost')
      .eq('purchase_id', purchase.purchase_id);
    
    const calculated = (items || []).reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
    
    return {
      ...purchase,
      calculated_total: calculated || purchase.total_amount || purchase.total_cost || 0
    };
  }));

  return purchasesWithTotals;
};

export default {
  getAllPurchases,
  getPurchaseById,
  getPurchaseItems,
  generateNextPurchaseCode,
  createPurchase,
  updatePurchase,
  updatePurchaseStatus,
  deletePurchase,
  getPurchasesBySupplier,
};
