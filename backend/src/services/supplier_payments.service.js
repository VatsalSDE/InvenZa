import supabase from '../config/supabase.js';
import { generatePaymentCode, getTodayDatePattern } from '../utils/codeGenerator.js';

/**
 * Supplier Payments Service
 * Handles all payment-related business logic for suppliers
 */

const ALLOWED_METHODS = ['Cash', 'UPI', 'Card', 'NEFT', 'Online', 'Bank Transfer', 'Cheque'];

/**
 * Validate payment data
 */
const validatePaymentData = (data) => {
    const errors = [];
    const sanitized = {};

    if (!data.supplier_id) {
        errors.push('Supplier ID is required');
    } else {
        const supplierId = parseInt(data.supplier_id);
        if (isNaN(supplierId) || supplierId <= 0) {
            errors.push('Supplier ID must be a valid positive number');
        } else {
            sanitized.supplier_id = supplierId;
        }
    }

    if (!data.paid_amount) {
        errors.push('Paid amount is required');
    } else {
        const paidAmount = parseFloat(data.paid_amount);
        if (isNaN(paidAmount) || paidAmount <= 0) {
            errors.push('Paid amount must be a valid positive number');
        } else {
            sanitized.paid_amount = paidAmount;
        }
    }

    if (data.purchase_id) {
        const purchaseId = parseInt(data.purchase_id);
        if (isNaN(purchaseId) || purchaseId <= 0) {
            errors.push('Purchase ID must be a valid positive number if provided');
        } else {
            sanitized.purchase_id = purchaseId;
        }
    } else {
        sanitized.purchase_id = null;
    }

    sanitized.method = ALLOWED_METHODS.includes(data.method)
        ? data.method
        : 'Bank Transfer';

    if (data.payment_date) {
        const date = new Date(data.payment_date);
        if (isNaN(date.getTime())) {
            errors.push('Payment date must be a valid date');
        } else {
            sanitized.payment_date = data.payment_date;
        }
    }

    sanitized.reference_number = data.reference_number || null;
    sanitized.notes = data.notes || null;

    return { errors, sanitized };
};

export const getAllSupplierPayments = async (filters = {}) => {
    let query = supabase
        .from('supplier_payments')
        .select(`
      *,
      suppliers (firm_name),
      purchases (purchase_code)
    `)
        .order('payment_date', { ascending: false });

    if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching supplier payments:', error);
        throw { statusCode: 500, message: 'Failed to fetch supplier payments' };
    }

    return (data || []).map((payment) => ({
        payment_id: payment.payment_id,
        supplier_id: payment.supplier_id,
        purchase_id: payment.purchase_id,
        paid_amount: payment.paid_amount,
        method: payment.method,
        transaction_id: payment.transaction_id,
        payment_date: payment.payment_date,
        reference_number: payment.reference_number,
        notes: payment.notes,
        supplier_name: payment.suppliers?.firm_name,
        purchase_code: payment.purchases?.purchase_code,
    }));
};

export const getSupplierPaymentById = async (paymentId) => {
    const { data, error } = await supabase
        .from('supplier_payments')
        .select(`
      *,
      suppliers (firm_name, person_name),
      purchases (purchase_code, total_amount)
    `)
        .eq('payment_id', paymentId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            throw { statusCode: 404, message: 'Supplier payment not found' };
        }
        console.error('Error fetching supplier payment:', error);
        throw { statusCode: 500, message: 'Failed to fetch supplier payment' };
    }

    return data;
};

export const generateNextSupplierPaymentCode = async () => {
    const datePattern = getTodayDatePattern();

    const { data, error } = await supabase
        .from('supplier_payments')
        .select('transaction_id')
        .like('transaction_id', `SPAY-${datePattern}%`)
        .order('transaction_id', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error generating supplier payment code:', error);
        return generatePaymentCode(1).replace('PAY-', 'SPAY-');
    }

    if (!data || data.length === 0) {
        return generatePaymentCode(1).replace('PAY-', 'SPAY-');
    }

    const lastCode = data[0].transaction_id;
    const lastSeq = parseInt(lastCode.split('-')[2]) || 0;
    return generatePaymentCode(lastSeq + 1).replace('PAY-', 'SPAY-');
};

export const createSupplierPayment = async (paymentData) => {
    const { errors, sanitized } = validatePaymentData(paymentData);

    if (errors.length > 0) {
        throw { statusCode: 400, message: 'Validation failed', errors };
    }

    // Verify supplier exists
    const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('supplier_id')
        .eq('supplier_id', sanitized.supplier_id)
        .single();

    if (supplierError || !supplier) {
        throw { statusCode: 400, message: 'Supplier not found' };
    }

    if (sanitized.purchase_id) {
        const { data: purchase, error: purchaseError } = await supabase
            .from('purchases')
            .select('purchase_id')
            .eq('purchase_id', sanitized.purchase_id)
            .single();

        if (purchaseError || !purchase) {
            throw { statusCode: 400, message: 'Purchase not found' };
        }
    }

    const transaction_id = await generateNextSupplierPaymentCode();

    const { data, error } = await supabase
        .from('supplier_payments')
        .insert({
            supplier_id: sanitized.supplier_id,
            purchase_id: sanitized.purchase_id,
            paid_amount: sanitized.paid_amount,
            method: sanitized.method,
            transaction_id,
            payment_date: sanitized.payment_date || new Date().toISOString(),
            reference_number: sanitized.reference_number,
            notes: sanitized.notes,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating supplier payment:', error);
        throw { statusCode: 500, message: 'Failed to create supplier payment' };
    }

    return data;
};

export const updateSupplierPayment = async (paymentId, paymentData) => {
    const { errors, sanitized } = validatePaymentData(paymentData);

    const updateData = {};

    if (paymentData.supplier_id && !errors.includes('Supplier ID must be a valid positive number')) {
        updateData.supplier_id = sanitized.supplier_id;
    }
    if (paymentData.purchase_id !== undefined) {
        updateData.purchase_id = sanitized.purchase_id;
    }
    if (paymentData.paid_amount && !errors.includes('Paid amount must be a valid positive number')) {
        updateData.paid_amount = sanitized.paid_amount;
    }
    if (paymentData.method) {
        updateData.method = sanitized.method;
    }
    if (paymentData.payment_date) {
        updateData.payment_date = sanitized.payment_date;
    }
    if (paymentData.reference_number !== undefined) {
        updateData.reference_number = sanitized.reference_number;
    }
    if (paymentData.notes !== undefined) {
        updateData.notes = sanitized.notes;
    }

    const { data, error } = await supabase
        .from('supplier_payments')
        .update(updateData)
        .eq('payment_id', paymentId)
        .select()
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            throw { statusCode: 404, message: 'Supplier payment not found' };
        }
        console.error('Error updating supplier payment:', error);
        throw { statusCode: 500, message: 'Failed to update supplier payment' };
    }

    return data;
};

export const deleteSupplierPayment = async (paymentId) => {
    const { error } = await supabase
        .from('supplier_payments')
        .delete()
        .eq('payment_id', paymentId);

    if (error) {
        console.error('Error deleting supplier payment:', error);
        throw { statusCode: 500, message: 'Failed to delete supplier payment' };
    }

    return true;
};

export const getSupplierPaymentsByPurchase = async (purchaseId) => {
    const { data, error } = await supabase
        .from('supplier_payments')
        .select('*')
        .eq('purchase_id', purchaseId)
        .order('payment_date', { ascending: false });

    if (error) {
        console.error('Error fetching supplier payments by purchase:', error);
        throw { statusCode: 500, message: 'Failed to fetch supplier payments' };
    }

    return data || [];
};

export default {
    getAllSupplierPayments,
    getSupplierPaymentById,
    generateNextSupplierPaymentCode,
    createSupplierPayment,
    updateSupplierPayment,
    deleteSupplierPayment,
    getSupplierPaymentsByPurchase,
};
