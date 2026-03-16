import { Router } from 'express';
import * as productsController from '../controllers/products.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.middleware.js';

const router = Router();

/**
 * Products Routes
 * GET /api/products - Get all products
 * GET /api/products/low-stock - Get low stock products
 * GET /api/products/:id - Get product by ID
 * POST /api/products - Create a new product
 * POST /api/products/upload-image - Upload product image
 * POST /api/products/cleanup-blob-urls - Cleanup blob URLs
 * PUT /api/products/:id - Update a product
 * DELETE /api/products/:id - Delete a product
 */

// All routes require authentication
router.use(requireAuth);

// Get routes
router.get('/', productsController.getAllProducts);
router.get('/profitability', productsController.getProductProfitability);
router.get('/low-stock', productsController.getLowStockProducts);
router.get('/:id', productsController.getProductById);

// Create/Update routes
router.post('/', productsController.createProduct);
router.post('/upload-image', uploadSingle, handleUploadError, productsController.uploadImage);
router.post('/cleanup-blob-urls', productsController.cleanupBlobUrls);
router.put('/:id', productsController.updateProduct);

// Delete routes
router.delete('/:id', productsController.deleteProduct);

export default router;
