import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import upload from '../middleware/upload.js';
import { uploadImage, deleteImage } from '../services/imageService.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// New endpoint for image upload
router.post('/upload-image', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const uploadResult = await uploadImage(req.file.buffer, {
      mimetype: req.file.mimetype,
      filename: req.file.originalname
    });

    res.json({
      success: true,
      image: uploadResult
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { product_code, product_name, category, no_burners, type_burner, price, quantity, min_stock_level, image_url } = req.body;
    const sql = `INSERT INTO products (product_code, product_name, category, no_burners, type_burner, price, quantity, min_stock_level, image_url)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                 RETURNING *`;
    const params = [product_code, product_name, category, no_burners, type_burner, price, quantity ?? 0, min_stock_level ?? 10, image_url];
    const { rows } = await query(sql, params);
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create product' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { product_code, product_name, category, no_burners, type_burner, price, quantity, min_stock_level, image_url, old_image_public_id } = req.body;
    
    // If there's a new image and old image public_id, delete the old image
    if (image_url && old_image_public_id) {
      await deleteImage(old_image_public_id);
    }
    
    const sql = `UPDATE products SET product_code=$1, product_name=$2, category=$3, no_burners=$4, type_burner=$5, price=$6, quantity=$7, min_stock_level=$8, image_url=$9 WHERE product_id=$10 RETURNING *`;
    const params = [product_code, product_name, category, no_burners, type_burner, price, quantity, min_stock_level ?? 10, image_url, id];
    const { rows } = await query(sql, params);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update product' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the product to check if it has an image
    const { rows } = await query('SELECT image_url FROM products WHERE product_id=$1', [id]);
    if (rows.length > 0 && rows[0].image_url) {
      // Extract public_id from image_url if it's a Cloudinary URL
      const imageUrl = rows[0].image_url;
      if (imageUrl.includes('cloudinary.com')) {
        const publicId = imageUrl.split('/').pop().split('.')[0];
        await deleteImage(publicId);
      }
    }
    
    await query('DELETE FROM products WHERE product_id=$1', [id]);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

// Cleanup old blob URLs
router.post('/cleanup-blob-urls', requireAuth, async (req, res) => {
  try {
    // Find all products with blob URLs
    const { rows } = await query("SELECT product_id, image_url FROM products WHERE image_url LIKE 'blob:%'");
    
    if (rows.length === 0) {
      return res.json({ message: 'No blob URLs found to cleanup', cleaned: 0 });
    }
    
    // Update all blob URLs to null
    await query("UPDATE products SET image_url = NULL WHERE image_url LIKE 'blob:%'");
    
    res.json({ 
      message: `Cleaned up ${rows.length} blob URLs`, 
      cleaned: rows.length,
      products: rows.map(p => ({ id: p.product_id, oldUrl: p.image_url }))
    });
  } catch (e) {
    console.error('Cleanup error:', e);
    res.status(500).json({ message: 'Failed to cleanup blob URLs' });
  }
});

export default router;