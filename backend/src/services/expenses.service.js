import supabase from '../config/supabase.js';

/**
 * Expenses Service
 * CRUD operations for the expenses table
 */

const VALID_CATEGORIES = ['Rent', 'Electricity', 'Transport', 'Packaging', 'Staff', 'Other'];

/**
 * Get all expenses, optionally filtered by date range
 */
export const getAllExpenses = async (startDate, endDate) => {
    let query = supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

    if (startDate) {
        query = query.gte('expense_date', startDate);
    }
    if (endDate) {
        query = query.lte('expense_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching expenses:', error);
        throw { statusCode: 500, message: 'Failed to fetch expenses' };
    }

    return data || [];
};

/**
 * Create a new expense
 */
export const createExpense = async (expenseData) => {
    const { category, description, amount, expense_date } = expenseData;

    // Validate
    const errors = [];
    if (!category || !VALID_CATEGORIES.includes(category)) {
        errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }
    if (!amount || parseFloat(amount) <= 0) {
        errors.push('Amount must be a positive number');
    }
    if (!expense_date) {
        errors.push('Expense date is required');
    }

    if (errors.length > 0) {
        throw { statusCode: 400, message: 'Validation failed', errors };
    }

    const { data, error } = await supabase
        .from('expenses')
        .insert({
            category,
            description: description || null,
            amount: parseFloat(amount),
            expense_date,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating expense:', error);
        throw { statusCode: 500, message: 'Failed to create expense' };
    }

    return data;
};

/**
 * Update an expense
 */
export const updateExpense = async (expenseId, expenseData) => {
    const { category, description, amount, expense_date } = expenseData;

    const updateData = {};
    if (category) {
        if (!VALID_CATEGORIES.includes(category)) {
            throw { statusCode: 400, message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` };
        }
        updateData.category = category;
    }
    if (description !== undefined) updateData.description = description;
    if (amount) {
        if (parseFloat(amount) <= 0) {
            throw { statusCode: 400, message: 'Amount must be a positive number' };
        }
        updateData.amount = parseFloat(amount);
    }
    if (expense_date) updateData.expense_date = expense_date;

    const { data, error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('expense_id', expenseId)
        .select()
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            throw { statusCode: 404, message: 'Expense not found' };
        }
        console.error('Error updating expense:', error);
        throw { statusCode: 500, message: 'Failed to update expense' };
    }

    return data;
};

/**
 * Delete an expense
 */
export const deleteExpense = async (expenseId) => {
    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('expense_id', expenseId);

    if (error) {
        console.error('Error deleting expense:', error);
        throw { statusCode: 500, message: 'Failed to delete expense' };
    }

    return true;
};

export default {
    getAllExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
};
