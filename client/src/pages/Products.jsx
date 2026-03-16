import React, { useState, useEffect } from "react";
import {
  X, Plus, Search, Edit, Package, TrendingUp, Upload, FileText,
  Archive, RotateCcw, Eye, Trash2, Camera, LayoutGrid, TableIcon
} from "lucide-react";
import { productsAPI, archiveAPI } from "../services/api";
import ProductForm from "../components/products/ProductForm";
import BulkImportModal from "../components/products/BulkImportModal";
import PageHeader from "../components/ims/PageHeader";
import OrbitalLoader from "../components/ui/OrbitalLoader";
import StatsCard from "../components/ims/StatsCard";
import StatusBadge from "../components/ui/StatusBadge";

const Products = () => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedIds, setArchivedIds] = useState([]);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    product_name: "", category: "steel", no_burners: "2", type_burner: "Brass",
    price: "", quantity: "", min_stock_level: "10", image_url: "", image_public_id: ""
  });
  const [formErrors, setFormErrors] = useState({});

  const isValidImageUrl = (url) => url && !url.startsWith('blob:') && !url.startsWith('data:');
  const getDisplayImageUrl = (p) => isValidImageUrl(p.image_url) ? p.image_url : "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400";

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getAll();
      setProducts(data);
      setArchivedIds(archiveAPI.getArchivedProducts());
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleArchive = async (id) => { await archiveAPI.archiveProduct(id); setShowArchiveConfirm(null); setArchivedIds(archiveAPI.getArchivedProducts()); };
  const handleRestore = async (id) => { await archiveAPI.restoreProduct(id); setArchivedIds(archiveAPI.getArchivedProducts()); };
  const handleDelete = async (id) => { await productsAPI.delete(id); setShowDeleteConfirm(null); await loadProducts(); };

  const generateProductCode = (name, category, burners, burnerType) => {
    const nameCode = name.split(" ").map((w) => w.substring(0, 3)).join("").toUpperCase();
    return `${nameCode}-${category.toUpperCase()}-${burners}-${burnerType.toUpperCase()}`;
  };

  const handleInputChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); const reader = new FileReader(); reader.onload = (e) => setImagePreview(e.target.result); reader.readAsDataURL(file); }
  };

  const uploadImage = async (file) => {
    try { 
      const result = await productsAPI.uploadImage(file); 
      // result = { data: { image: { url, public_id, isPlaceholder, message } } }
      if (result && result.image) {
        if (result.image.isPlaceholder) {
          console.warn(result.image.message);
          // We can optionally show a global toast here if available, or just proceed
        }
        return result.image.url; 
      }
      throw new Error('Upload failed'); 
    }
    catch (error) { 
      const msg = error.response?.data?.message || error.message || 'Failed to upload image.';
      throw new Error(msg); 
    }
  };

  const resetForm = () => {
    setFormData({ product_name: "", category: "steel", no_burners: "2", type_burner: "Brass", price: "", quantity: "", min_stock_level: "10", image_url: "", image_public_id: "" });
    setImageFile(null); setImagePreview(""); setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.product_name.trim()) errors.product_name = 'Required';
    if (!formData.price || parseFloat(formData.price) <= 0) errors.price = 'Must be > 0';
    if (!formData.quantity || parseInt(formData.quantity) < 0) errors.quantity = 'Must be >= 0';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    try {
      setUploading(true); setFormErrors({});
      let imageUrl = formData.image_url;
      if (imageFile) { imageUrl = await uploadImage(imageFile); formData.image_public_id = imageUrl.split('/').pop().split('.')[0]; }
      const productCode = generateProductCode(formData.product_name, formData.category, formData.no_burners, formData.type_burner);
      const existingProduct = products.find(p => p.product_code === productCode);
      if (existingProduct) { setFormErrors({ product_name: `Code "${productCode}" already exists.` }); setUploading(false); return; }
      await productsAPI.create({ ...formData, product_code: productCode, price: parseFloat(formData.price), quantity: parseInt(formData.quantity), min_stock_level: parseInt(formData.min_stock_level), image_url: imageUrl });
      await loadProducts(); resetForm();
    } catch (err) { 
      if (err.message.includes('api.cloudinary.com')) {
        setError("Network Error: Could not reach Cloudinary server. Please check your internet connection.");
      } else {
        setError(err.message); 
      }
    } finally { setUploading(false); }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({ product_name: product.product_name, category: product.category, no_burners: product.no_burners.toString(), type_burner: product.type_burner, price: product.price.toString(), quantity: product.quantity.toString(), min_stock_level: (product.min_stock_level || 10).toString(), image_url: product.image_url || "", image_public_id: product.image_public_id || "" });
    setImagePreview(product.image_url || ""); setImageFile(null); setShowEditForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);
      let imageUrl = formData.image_url;
      if (imageFile) { imageUrl = await uploadImage(imageFile); formData.image_public_id = imageUrl.split('/').pop().split('.')[0]; }
      const productCode = generateProductCode(formData.product_name, formData.category, formData.no_burners, formData.type_burner);
      await productsAPI.update(editingProduct.product_id, { ...formData, product_code: productCode, price: parseFloat(formData.price), quantity: parseInt(formData.quantity), min_stock_level: parseInt(formData.min_stock_level), image_url: imageUrl, old_image_public_id: editingProduct.image_public_id || null });
      await loadProducts(); resetForm(); setShowEditForm(false); setEditingProduct(null);
    } catch (err) { 
      if (err.message.includes('api.cloudinary.com')) {
        setError("Network Error: Could not reach Cloudinary server. Please check your internet connection.");
      } else {
        setError(err.message); 
      }
    } finally { setUploading(false); }
  };

  const filteredProducts = products
    .filter((p) => {
      const matchesSearch = p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()) || p.product_code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || p.category.toLowerCase() === categoryFilter.toLowerCase();
      const isArchived = archivedIds.includes(p.product_id);
      if (!showArchived && isArchived) return false;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => { if (sortBy === "price") return a.price - b.price; if (sortBy === "quantity") return b.quantity - a.quantity; return a.product_name.localeCompare(b.product_name); });

  if (loading) return <div className="min-h-screen bg-[#0F0F0F] p-6 flex items-center justify-center"><OrbitalLoader message="Loading products..." /></div>;

  return (
    <div className="min-h-screen bg-[#0F0F0F] p-6">
      <PageHeader title="Products" subtitle="Manage your gas stove inventory" icon={Package} count={products.length}
        action={
          <div className="flex gap-2">
            <button onClick={() => window.open('/catalogue.pdf', '_blank')} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-sm flex items-center gap-2 transition-all duration-100 active:scale-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-zinc-500"><FileText className="w-4 h-4" /> PDF Catalogue</button>
            <button onClick={() => setShowImport(true)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-sm flex items-center gap-2 transition-all duration-100 active:scale-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-zinc-500"><Upload className="w-4 h-4" /> Import CSV</button>
          </div>
        }
      />

      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 mb-6 flex items-start gap-3">
        <div className="p-1 bg-emerald-500/10 rounded text-emerald-400 mt-0.5">
          <TrendingUp className="w-3.5 h-3.5" />
        </div>
        <p className="text-xs text-zinc-400">
          <span className="text-emerald-400 font-medium">New:</span> Products are added automatically when you create a purchase. Use this page to edit product details.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Products" value={products.length} icon={Package} accentColor="blue" />
        <StatsCard title="In Stock" value={products.filter(p => p.quantity >= (p.min_stock_level || 10)).length} icon={TrendingUp} accentColor="green" />
        <StatsCard title="Low Stock" value={products.filter(p => p.quantity < (p.min_stock_level || 10)).length} icon="⚠️" accentColor="orange" />
        <StatsCard title="Avg. Price" value={`₹${products.length > 0 ? (products.reduce((s, p) => s + (Number(p.price) || 0), 0) / products.length).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}`} icon="₹" accentColor="purple" />
      </div>

      {/* Filters */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
            <input type="text" placeholder="Search products, categories, or codes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 placeholder:text-zinc-600" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50">
            <option value="all">All Categories</option>
            <option value="steel">Steel</option>
            <option value="glass">Glass</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50">
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="quantity">Sort by Quantity</option>
          </select>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-green-500/10 text-green-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode("table")} className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-green-500/10 text-green-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}><TableIcon className="w-4 h-4" /></button>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only peer" checked={showArchived} onChange={() => setShowArchived(!showArchived)} />
              <div className="w-9 h-5 bg-[#2A2A2A] peer-checked:bg-green-500 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 peer-checked:after:bg-black after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
            </div>
            <span className="text-xs text-zinc-500">Archived</span>
          </label>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const isArchived = archivedIds.includes(product.product_id);
          return (
            <div key={product.product_id} className={`group bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden transition-all ${isArchived ? 'opacity-50' : 'hover:border-green-500/30'}`}>
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-[#222222]">
                <img src={getDisplayImageUrl(product)} alt={product.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400"; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <StatusBadge status={product.quantity < (product.min_stock_level || 10) ? "Low Stock" : "In Stock"} />
                </div>
                {isArchived && <div className="absolute top-3 right-3"><StatusBadge status="Archived" /></div>}
                <div className="absolute top-3 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(product)} className="p-1.5 bg-black/60 rounded-lg text-zinc-300 hover:text-white transition-all duration-100 active:scale-95 active:brightness-90"><Edit className="w-3.5 h-3.5" /></button>
                  {isArchived ? (
                    <button onClick={() => handleRestore(product.product_id)} className="p-1.5 bg-black/60 rounded-lg text-green-400 hover:text-green-300 transition-all duration-100 active:scale-95 active:brightness-90"><RotateCcw className="w-3.5 h-3.5" /></button>
                  ) : (
                    <button onClick={() => setShowArchiveConfirm(product)} className="p-1.5 bg-black/60 rounded-lg text-orange-400 hover:text-orange-300 transition-all duration-100 active:scale-95 active:brightness-90"><Archive className="w-3.5 h-3.5" /></button>
                  )}
                  <button onClick={() => setShowDeleteConfirm(product)} className="p-1.5 bg-black/60 rounded-lg text-red-500 hover:text-red-400 transition-all duration-100 active:scale-95 active:brightness-90"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {/* Details */}
              <div className="p-4">
                <h3 className="text-sm font-medium text-white mb-0.5">{product.product_name}</h3>
                <p className="text-xs text-zinc-600 mb-3">{product.product_code}</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-[#222222] rounded-lg p-2"><p className="text-[10px] text-zinc-600">Category</p><p className="text-xs text-zinc-300 capitalize">{product.category}</p></div>
                  <div className="bg-[#222222] rounded-lg p-2"><p className="text-[10px] text-zinc-600">Burners</p><p className="text-xs text-zinc-300">{product.no_burners} ({product.type_burner})</p></div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-green-400">₹{product.price.toLocaleString()}</p>
                  <p className={`text-xs font-medium ${product.quantity < (product.min_stock_level || 10) ? 'text-red-400' : 'text-zinc-400'}`}>
                    {product.quantity} <span className="text-zinc-600">/ {product.min_stock_level || 10}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Archive Confirm */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Archive this product?</h3>
            <p className="text-sm text-zinc-400 mb-6">This product will be hidden. All existing orders linked to it remain safe.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowArchiveConfirm(null)} className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-white/5 transition-all duration-100 active:scale-95">Cancel</button>
              <button onClick={() => handleArchive(showArchiveConfirm.product_id)} className="flex-1 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all duration-100 active:scale-95 active:brightness-90">Archive</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Permanently delete product?</h3>
            <p className="text-sm text-zinc-400 mb-6">
              This will permanently delete <span className="text-white font-medium">{showDeleteConfirm.product_name}</span> and all associated orders and purchase records. This action cannot be undone. Consider archiving instead.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 rounded-lg border border-[#2A2A2A] text-white text-sm font-medium hover:bg-white/5 transition-all duration-100 active:scale-95">Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm.product_id)} className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-all duration-100 active:scale-95 active:brightness-90">Delete Permanently</button>
            </div>
          </div>
        </div>
      )}



      {/* Edit Product Modal */}
      {showEditForm && editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
              <h2 className="text-lg font-semibold text-white">Edit Product</h2>
              <button onClick={() => { setShowEditForm(false); setEditingProduct(null); resetForm(); }} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"><X className="w-5 h-5" /></button>
            </div>
            <ProductForm formData={formData} formErrors={formErrors} imageFile={imageFile} imagePreview={imagePreview} uploading={uploading}
              onInputChange={handleInputChange} onImageChange={handleImageUpload} onImageUpload={handleImageUpload}
              onCancel={() => { setShowEditForm(false); setEditingProduct(null); resetForm(); }} onSubmit={handleUpdate} submitLabel="Update Product" />
          </div>
        </div>
      )}

      {/* Bulk Import */}
      {showImport && (
        <BulkImportModal isOpen={showImport} onClose={() => setShowImport(false)} busy={importing}
          sample={`product_name,category,no_burners,type_burner,price,quantity,min_stock_level\nSteel Stove 2,steel,2,Brass,1999,10,10`}
          note="Use CSV import only for adding existing products. New products should be added through Purchases."
          onImport={async (rows) => {
            try {
              setImporting(true);
              for (const r of rows) { await productsAPI.create({ product_name: r.product_name, category: r.category, no_burners: parseInt(r.no_burners), type_burner: r.type_burner, price: parseFloat(r.price), quantity: parseInt(r.quantity), min_stock_level: parseInt(r.min_stock_level), product_code: `${r.product_name.split(' ').map(w => w.substring(0, 3)).join('').toUpperCase()}-${r.category.toUpperCase()}-${r.no_burners}-${r.type_burner.toUpperCase()}` }); }
              await loadProducts(); setShowImport(false);
            } catch (e) { alert('Import failed: ' + e.message); } finally { setImporting(false); }
          }}
        />
      )}
    </div>
  );
};

export default Products;