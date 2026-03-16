import * as productsService from '../services/products.service.js';
import { sendSuccess, sendCreated, sendNoContent, sendError } from '../utils/responseHelper.js';

/**
 * Products Controller
 * Handles product-related HTTP requests
 */

/**
 * Get all products
 * GET /api/products
 */
export const getAllProducts = async (req, res, next) => {
  try {
    const filters = {
      category: req.query.category,
      search: req.query.search,
      lowStock: req.query.lowStock === 'true',
    };
    const products = await productsService.getAllProducts(filters);
    return sendSuccess(res, products);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get product by ID
 * GET /api/products/:id
 */
export const getProductById = async (req, res, next) => {
  try {
    const product = await productsService.getProductById(req.params.id);
    return sendSuccess(res, product);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Create a new product
 * POST /api/products
 */
export const createProduct = async (req, res, next) => {
  try {
    const product = await productsService.createProduct(req.body);
    return sendCreated(res, product, 'Product created successfully');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Update a product
 * PUT /api/products/:id
 */
export const updateProduct = async (req, res, next) => {
  try {
    const product = await productsService.updateProduct(req.params.id, req.body);
    return sendSuccess(res, product, 200, 'Product updated successfully');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Delete a product
 * DELETE /api/products/:id
 */
export const deleteProduct = async (req, res, next) => {
  try {
    await productsService.deleteProduct(req.params.id);
    return sendNoContent(res);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Upload product image
 * POST /api/products/upload-image
 */
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No image file provided', 400);
    }

    const result = await productsService.uploadProductImage(req.file.buffer, {
      mimetype: req.file.mimetype,
      filename: req.file.originalname,
    });

    return sendSuccess(res, { image: result }, 200, 'Image uploaded successfully');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get low stock products
 * GET /api/products/low-stock
 */
export const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await productsService.getLowStockProducts();
    return sendSuccess(res, products);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Cleanup blob URLs
 * POST /api/products/cleanup-blob-urls
 */
export const cleanupBlobUrls = async (req, res, next) => {
  try {
    const result = await productsService.cleanupBlobUrls();
    return sendSuccess(res, result);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get product profitability analysis
 * GET /api/products/profitability
 */
export const getProductProfitability = async (req, res, next) => {
  try {
    const products = await productsService.getProductProfitability();
    return sendSuccess(res, products);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  getLowStockProducts,
  cleanupBlobUrls,
  getProductProfitability,
};
