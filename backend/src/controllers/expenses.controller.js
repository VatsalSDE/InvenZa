import * as expensesService from '../services/expenses.service.js';
import { sendSuccess, sendCreated, sendError } from '../utils/responseHelper.js';

/**
 * Expenses Controller
 * Handles expense CRUD HTTP requests
 */

export const getAll = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        const data = await expensesService.getAllExpenses(start_date, end_date);
        return sendSuccess(res, data);
    } catch (error) {
        if (error.statusCode) return sendError(res, error.message, error.statusCode);
        next(error);
    }
};

export const create = async (req, res, next) => {
    try {
        const data = await expensesService.createExpense(req.body);
        return sendCreated(res, data, 'Expense created');
    } catch (error) {
        if (error.statusCode) return sendError(res, error.message, error.statusCode, error.errors);
        next(error);
    }
};

export const update = async (req, res, next) => {
    try {
        const data = await expensesService.updateExpense(req.params.id, req.body);
        return sendSuccess(res, data);
    } catch (error) {
        if (error.statusCode) return sendError(res, error.message, error.statusCode);
        next(error);
    }
};

export const remove = async (req, res, next) => {
    try {
        await expensesService.deleteExpense(req.params.id);
        return sendSuccess(res, null, 200, 'Expense deleted');
    } catch (error) {
        if (error.statusCode) return sendError(res, error.message, error.statusCode);
        next(error);
    }
};

export default { getAll, create, update, remove };
