import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Search,
  Edit,
  Trash2,
  Upload,
  Filter,
  Star,
  TrendingUp,
  Package,
  Image as ImageIcon,
  Camera,
  FileText,
} from "lucide-react";
import { productsAPI } from "../services/api";
import ProductForm from "../components/products/ProductForm";
import ProductTable from "../components/products/ProductTable";
import PageHeader from "../components/ims/PageHeader";
import StatsCard from "../components/ims/StatsCard";
import BulkImportModal from "../components/products/BulkImportModal";

const Products = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);

  const [formData, setFormData] = useState({
    product_name: "",
    category: "steel",
    no_burners: "2",
    type_burner: "Brass",
    price: "",
    quantity: "",
    min_stock_level: "10",
    image_url: "",
    image_public_id: "",
  });

  const [formErrors, setFormErrors] = useState({});

  // Helper function to check if image URL is valid
  const isValidImageUrl = (url) => {
    if (!url) return false;
    if (url.startsWith('blob:')) return false;
    if (url.startsWith('data:')) return false;
    return true;
  };

  // Helper function to get display image URL
  const getDisplayImageUrl = (product) => {
    if (isValidImageUrl(product.image_url)) {
      return product.image_url;
    }
    return "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400";
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getAll();
      setProducts(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateProductCode = (name, category, burners, burnerType) => {
    const nameCode = name
      .split(" ")
      .map((word) => word.substring(0, 3))
      .join("")
      .toUpperCase();
    return `${nameCode}-${category.toUpperCase()}-${burners}-${burnerType.toUpperCase()}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    try {
      const result = await productsAPI.uploadImage(file);
      if (result.success) {
        return result.image.url;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      product_name: "",
      category: "steel",
      no_burners: "2",
      type_burner: "Brass",
      price: "",
      quantity: "",
      min_stock_level: "10",
      image_url: "",
      image_public_id: "",
    });
    setImageFile(null);
    setImagePreview("");
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.product_name.trim()) {
      errors.product_name = 'Product name is required';
    } else if (formData.product_name.trim().length < 3) {
      errors.product_name = 'Product name must be at least 3 characters';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.price = 'Price must be greater than 0';
    }

    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      errors.quantity = 'Quantity must be 0 or greater';
    }

    if (imageFile && imageFile.size > 5 * 1024 * 1024) { // 5MB limit
      errors.image = 'Image size must be less than 5MB';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setUploading(true);
      setFormErrors({}); // Clear errors on success

      let imageUrl = formData.image_url;

      // Upload image if file is selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        // Store the public_id for future reference
        formData.image_public_id = imageUrl.split('/').pop().split('.')[0];
      }

      const productCode = generateProductCode(
        formData.product_name,
        formData.category,
        formData.no_burners,
        formData.type_burner,
      );

      // Check for duplicate product code
      const existingProduct = products.find(p => p.product_code === productCode);
      if (existingProduct) {
        setFormErrors({
          product_name: `Product code "${productCode}" already exists. Please change the product name, category, or specifications to generate a unique code.`
        });
        setUploading(false);
        return;
      }

      const newProduct = {
        ...formData,
        product_code: productCode,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        min_stock_level: parseInt(formData.min_stock_level),
        image_url: imageUrl,
        image_public_id: formData.image_public_id,
      };

      await productsAPI.create(newProduct);
      await loadProducts();
      resetForm();
      setShowAddForm(false);
    } catch (err) {
      setError(err.message);
      console.error('Failed to create product:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      category: product.category,
      no_burners: product.no_burners.toString(),
      type_burner: product.type_burner,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      min_stock_level: (product.min_stock_level || 10).toString(),
      image_url: product.image_url || "",
      image_public_id: product.image_public_id || "",
    });
    setImagePreview(product.image_url || "");
    setImageFile(null);
    setShowEditForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);

      let imageUrl = formData.image_url;

      // Upload image if file is selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        // Store the public_id for future reference
        formData.image_public_id = imageUrl.split('/').pop().split('.')[0];
      }

      const productCode = generateProductCode(
        formData.product_name,
        formData.category,
        formData.no_burners,
        formData.type_burner,
      );

      // Check for duplicate product code (excluding current product)
      const existingProduct = products.find(p => p.product_code === productCode && p.product_id !== editingProduct.product_id);
      if (existingProduct) {
        setFormErrors({
          product_name: `Product code "${productCode}" already exists. Please change the product name, category, or specifications to generate a unique code.`
        });
        setUploading(false);
        return;
      }

      const updatedProduct = {
        ...formData,
        product_code: productCode,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        min_stock_level: parseInt(formData.min_stock_level),
        image_url: imageUrl,
        image_public_id: formData.image_public_id,
        old_image_public_id: editingProduct.image_public_id || null,
      };

      await productsAPI.update(editingProduct.product_id, updatedProduct);
      await loadProducts();
      resetForm();
      setShowEditForm(false);
      setEditingProduct(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to update product:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(id);
        await loadProducts();
      } catch (err) {
        setError(err.message);
        console.error('Failed to delete product:', err);
      }
    }
  };

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.product_code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" ||
        product.category.toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.price - b.price;
        case "quantity":
          return b.quantity - a.quantity;
        case "name":
          return a.product_name.localeCompare(b.product_name);
        default:
          return a.product_name.localeCompare(b.product_name);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Products</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadProducts}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <PageHeader
        title="Products"
        description="Manage your gas stove inventory with style"
        icon={Package}
        count={products.length}
        action={
          <button
            onClick={() => window.open('/catalogue.pdf', '_blank')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <FileText className="w-4 h-4" />
            View PDF Catalogue
          </button>
        }
      />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Products"
            value={products.length}
            icon={Package}
            color="blue"
          />
          <StatsCard
            title="In Stock"
            value={products.filter((p) => p.quantity >= (p.min_stock_level || 10)).length}
            icon={TrendingUp}
            color="green"
          />
          <StatsCard
            title="Low Stock"
            value={products.filter((p) => p.quantity < (p.min_stock_level || 10)).length}
            icon="⚠️"
            color="yellow"
          />
          <StatsCard
            title="Avg. Price"
            value={`₹${products.length > 0
              ? (
                products.reduce((sum, p) => sum + (Number(p.price) || 0), 0) / products.length
              ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : '0.00'}`}
            icon="₹"
            color="purple"
          />
        </div>
      {/* Enhanced Controls */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products, categories, or codes..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50/80 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-300 text-gray-700 placeholder-gray-400 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-4 bg-gray-50/80 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-gray-700 text-lg"
            >
              <option value="all">All Categories</option>
              <option value="steel">Steel</option>
              <option value="glass">Glass</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-4 bg-gray-50/80 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-gray-700 text-lg"
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="quantity">Sort by Quantity</option>
            </select>

            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg font-semibold"
            >
              <Plus className="w-6 h-6" />
              Add Product
            </button>

            <button
              onClick={() => setShowImport(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg font-semibold"
            >
              <Upload className="w-5 h-5" />
              Import CSV
            </button>

            <button
              onClick={async () => {
                if (window.confirm('This will clean up old blob URLs and set them to default images. Continue?')) {
                  try {
                    await productsAPI.cleanupBlobUrls();
                    await loadProducts();
                    alert('Cleanup completed! Old blob URLs have been removed.');
                  } catch (error) {
                    alert('Cleanup failed: ' + error.message);
                  }
                }
              }}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 rounded-2xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg font-semibold"
            >
              <Trash2 className="w-5 h-5" />
              Cleanup Images
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredProducts.map((product) => (
          <div
            key={product.product_id}
            className="group bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105"
          >
            {/* Product Image */}
            <div className="relative h-64 overflow-hidden">
              <img
                src={getDisplayImageUrl(product)}
                alt={product.product_name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span
                  className={`px-3 py-1 text-white text-xs font-bold rounded-full shadow-lg ${product.quantity < (product.min_stock_level || 10)
                      ? "bg-gradient-to-r from-red-500 to-red-600"
                      : "bg-gradient-to-r from-green-500 to-green-600"
                    }`}
                >
                  {product.quantity < (product.min_stock_level || 10) ? "⚠️ Low Stock" : "✅ In Stock"}
                </span>
              </div>

              {/* Quick Actions */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => handleEdit(product)}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-blue-500 hover:text-white transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(product.product_id)}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Product Details */}
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-emerald-600 transition-colors">
                  {product.product_name}
                </h3>
                <p className="text-gray-600 text-sm">
                  {product.product_code}
                </p>
              </div>

              {/* Specifications */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Category</p>
                  <p className="font-semibold text-gray-700 capitalize">
                    {product.category}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Burners</p>
                  <p className="font-semibold text-gray-700">
                    {product.no_burners}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Type</p>
                  <p className="font-semibold text-gray-700">
                    {product.type_burner}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Stock</p>
                  <p
                    className={`font-semibold ${product.quantity < (product.min_stock_level || 10) ? "text-red-600" : "text-green-600"}`}
                  >
                    {product.quantity} units
                  </p>
                  <p className="text-xs text-gray-500">Min: {product.min_stock_level || 10}</p>
                </div>
              </div>

              {/* Price and Actions */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-emerald-600">
                    ₹{product.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{product.product_code}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-colors shadow-lg transform hover:scale-105 text-sm font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.product_id)}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-colors shadow-lg transform hover:scale-105 text-sm font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
            <div className="flex items-center justify-between p-8 border-b border-gray-100">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  Add New Product
                </h2>
                <p className="text-gray-600 mt-1">
                  Create a new gas stove product
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <ProductForm
              formData={formData}
              formErrors={formErrors}
              imageFile={imageFile}
              imagePreview={imagePreview}
              uploading={uploading}
              onInputChange={handleInputChange}
              onImageChange={handleImageUpload}
              onImageUpload={handleImageUpload}
              onCancel={() => { setShowAddForm(false); resetForm(); }}
              onSubmit={handleSubmit}
              submitLabel="Create Product"
            />
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditForm && editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
            <div className="flex items-center justify-between p-8 border-b border-gray-100">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  Edit Product
                </h2>
                <p className="text-gray-600 mt-1">
                  Update product information
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <ProductForm
              formData={formData}
              formErrors={formErrors}
              imageFile={imageFile}
              imagePreview={imagePreview}
              uploading={uploading}
              onInputChange={handleInputChange}
              onImageChange={handleImageUpload}
              onImageUpload={handleImageUpload}
              onCancel={() => { setShowEditForm(false); setEditingProduct(null); resetForm(); }}
              onSubmit={handleUpdate}
              submitLabel="Update Product"
            />
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImport && (
        <BulkImportModal
          isOpen={showImport}
          onClose={() => setShowImport(false)}
          busy={importing}
          sample={`product_name,category,no_burners,type_burner,price,quantity,min_stock_level\nSteel Stove 2,steel,2,Brass,1999,10,10\nGlass Top 3,glass,3,Alloy,2999,5,8`}
          onImport={async (rows) => {
            try {
              setImporting(true);
              for (const r of rows) {
                const newProduct = {
                  product_name: r.product_name,
                  category: r.category,
                  no_burners: parseInt(r.no_burners),
                  type_burner: r.type_burner,
                  price: parseFloat(r.price),
                  quantity: parseInt(r.quantity),
                  min_stock_level: parseInt(r.min_stock_level),
                  product_code: `${r.product_name.split(' ').map(w=>w.substring(0,3)).join('').toUpperCase()}-${r.category.toUpperCase()}-${r.no_burners}-${r.type_burner.toUpperCase()}`
                };
                await productsAPI.create(newProduct);
              }
              await loadProducts();
              setShowImport(false);
            } catch (e) {
              alert('Import failed: ' + e.message);
            } finally {
              setImporting(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default Products;