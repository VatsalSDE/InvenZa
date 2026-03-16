import supabase from '../config/supabase.js';
import { generateProductCode } from '../utils/codeGenerator.js';
import cloudinary from '../config/cloudinary.js';

/**
 * Products Service
 * Handles all product-related business logic and Supabase queries
 */

/**
 * Get all products
 * @param {Object} filters - Optional filters (category, search, etc.)
 * @returns {Array} List of products
 */
export const getAllProducts = async (filters = {}) => {
  let query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.search) {
    query = query.or(`product_name.ilike.%${filters.search}%,product_code.ilike.%${filters.search}%`);
  }

  // Note: lowStock filter is handled by getLowStockProducts() function instead

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    throw { statusCode: 500, message: 'Failed to fetch products' };
  }

  return data || [];
};

/**
 * Get product by ID
 * @param {number} productId - Product ID
 * @returns {Object} Product data
 */
export const getProductById = async (productId) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('product_id', productId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw { statusCode: 404, message: 'Product not found' };
    }
    console.error('Error fetching product:', error);
    throw { statusCode: 500, message: 'Failed to fetch product' };
  }

  return data;
};

/**
 * Create a new product
 * @param {Object} productData - Product data
 * @returns {Object} Created product
 */
export const createProduct = async (productData) => {
  const {
    product_code,
    product_name,
    category,
    no_burners,
    type_burner,
    price,
    quantity,
    min_stock_level,
    image_url
  } = productData;

  // Validate required fields
  if (!product_name) {
    throw { statusCode: 400, message: 'Product name is required' };
  }

  // Generate product code if not provided
  let finalProductCode = product_code;
  if (!finalProductCode) {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    finalProductCode = generateProductCode(productData, (count || 0) + 1);
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      product_code: finalProductCode,
      product_name,
      category: category || 'steel',
      no_burners: no_burners || 2,
      type_burner: type_burner || 'Brass',
      price: price || 0,
      quantity: quantity || 0,
      min_stock_level: min_stock_level || 10,
      image_url,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    throw { statusCode: 500, message: 'Failed to create product' };
  }

  return data;
};

/**
 * Update a product
 * @param {number} productId - Product ID
 * @param {Object} productData - Updated product data
 * @returns {Object} Updated product
 */
export const updateProduct = async (productId, productData) => {
  const {
    product_code,
    product_name,
    category,
    no_burners,
    type_burner,
    price,
    quantity,
    min_stock_level,
    image_url,
    old_image_public_id
  } = productData;

  // Delete old image from Cloudinary if new image provided
  if (image_url && old_image_public_id) {
    try {
      await cloudinary.uploader.destroy(old_image_public_id);
    } catch (err) {
      console.error('Failed to delete old image:', err);
      // Continue with update even if image deletion fails
    }
  }

  const { data, error } = await supabase
    .from('products')
    .update({
      product_code,
      product_name,
      category,
      no_burners,
      type_burner,
      price,
      quantity,
      min_stock_level,
      image_url,
    })
    .eq('product_id', productId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw { statusCode: 404, message: 'Product not found' };
    }
    console.error('Error updating product:', error);
    throw { statusCode: 500, message: 'Failed to update product' };
  }

  return data;
};

/**
 * Delete a product
 * @param {number} productId - Product ID
 * @returns {boolean} Success status
 */
export const deleteProduct = async (productId) => {
  // Get product to check for image
  const { data: product } = await supabase
    .from('products')
    .select('image_url')
    .eq('product_id', productId)
    .single();

  // Delete from Cloudinary if exists
  if (product?.image_url?.includes('cloudinary.com')) {
    try {
      const publicId = product.image_url.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`inventory-system/${publicId}`);
    } catch (err) {
      console.error('Failed to delete image from Cloudinary:', err);
    }
  }

  // Clean up FK references before deleting
  await supabase.from('order_items').delete().eq('product_id', productId);
  await supabase.from('purchase_items').delete().eq('product_id', productId);

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('product_id', productId);

  if (error) {
    console.error('Error deleting product:', error);
    throw { statusCode: 500, message: 'Failed to delete product' };
  }

  return true;
};

/**
 * Update product quantity (for orders and purchases)
 * @param {number} productId - Product ID
 * @param {number} quantityChange - Quantity to add (positive) or subtract (negative)
 * @returns {Object} Updated product
 */
export const updateProductQuantity = async (productId, quantityChange) => {
  // Get current quantity
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('quantity')
    .eq('product_id', productId)
    .single();

  if (fetchError) {
    throw { statusCode: 404, message: 'Product not found' };
  }

  const newQuantity = product.quantity + quantityChange;

  if (newQuantity < 0) {
    throw { statusCode: 400, message: 'Insufficient stock' };
  }

  const { data, error } = await supabase
    .from('products')
    .update({ quantity: newQuantity })
    .eq('product_id', productId)
    .select()
    .single();

  if (error) {
    console.error('Error updating product quantity:', error);
    throw { statusCode: 500, message: 'Failed to update product quantity' };
  }

  return data;
};

/**
 * Get low stock products
 * @returns {Array} Products below minimum stock level
 */
export const getLowStockProducts = async () => {
  // Fetch all products and filter in JS since Supabase doesn't support column-to-column comparison
  const { data: allProducts, error } = await supabase
    .from('products')
    .select('*')
    .order('quantity', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    throw { statusCode: 500, message: 'Failed to fetch low stock products' };
  }

  // Filter products where quantity < min_stock_level
  return (allProducts || []).filter(p => p.quantity < (p.min_stock_level || 10));
};

/**
 * Cleanup blob URLs in products
 * @returns {Object} Cleanup result
 */
export const cleanupBlobUrls = async () => {
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('product_id, image_url')
    .like('image_url', 'blob:%');

  if (fetchError) {
    throw { statusCode: 500, message: 'Failed to fetch products with blob URLs' };
  }

  if (!products || products.length === 0) {
    return { cleaned: 0, message: 'No blob URLs found' };
  }

  const { error: updateError } = await supabase
    .from('products')
    .update({ image_url: null })
    .like('image_url', 'blob:%');

  if (updateError) {
    throw { statusCode: 500, message: 'Failed to cleanup blob URLs' };
  }

  return {
    cleaned: products.length,
    products: products.map(p => ({ id: p.product_id, oldUrl: p.image_url })),
  };
};

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {Object} options - Upload options
 * @returns {Object} Upload result with URL and metadata
 */
export const uploadProductImage = async (fileBuffer, options = {}) => {
  try {
    const base64String = `data:${options.mimetype || 'image/jpeg'};base64,${fileBuffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64String, {
      folder: 'inventory-system',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    
    // Handle DNS/Network issues gracefully, especially in demo mode
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.syscall === 'getaddrinfo') {
      const placeholderUrl = `https://ui-avatars.com/api/?name=Product&background=22C55E&color=fff&size=512`;
      console.warn('Network issue detected. Falling back to placeholder image.');
      
      return {
        url: placeholderUrl,
        public_id: 'placeholder',
        width: 512,
        height: 512,
        format: 'png',
        size: 0,
        isPlaceholder: true,
        message: 'Network issue: Falling back to placeholder'
      };
    }
    
    throw { statusCode: 500, message: 'Failed to upload image: ' + (error.message || 'Unknown error') };
  }
};

/**
 * Step 4: Get Product Profitability Analysis
 * @returns {Array} List of products with revenue and stock value
 */
export const getProductProfitability = async () => {
  const { data: products } = await supabase
    .from('products')
    .select('product_id, product_name, category, price, quantity');

  const { data: orderItems } = await supabase
    .from('order_items')
    .select('product_id, quantity, unit_price');

  const statsMap = {};
  (products || []).forEach(p => {
    statsMap[p.product_id] = {
      product_id: p.product_id,
      product_name: p.product_name,
      category: p.category,
      revenue: 0,
      stock_value: (p.quantity || 0) * (p.price || 0),
      current_stock: p.quantity
    };
  });

  (orderItems || []).forEach(item => {
    if (statsMap[item.product_id]) {
      statsMap[item.product_id].revenue += (item.quantity || 0) * (parseFloat(item.unit_price) || 0);
    }
  });

  return Object.values(statsMap).sort((a, b) => b.revenue - a.revenue);
};

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductQuantity,
  getLowStockProducts,
  cleanupBlobUrls,
  uploadProductImage,
  getProductProfitability,
};
