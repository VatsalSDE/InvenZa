import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Eye,
  Table,
  Grid3X3,
  Filter,
  Download,
  FileText,
} from "lucide-react";
import { productsAPI } from "../services/api";
import PageHeader from "../components/ims/PageHeader";
import StatsCard from "../components/ims/StatsCard";
import Button from "../components/ui/Button";
import { Table as DataTable } from "../components/ui/Table";

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // "table" or "grid"
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

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
        product.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory =
        categoryFilter === "all" ||
        product.category?.toLowerCase() === categoryFilter.toLowerCase();
      
      const matchesStock = (() => {
        switch (stockFilter) {
          case "low":
            return product.quantity <= (product.min_stock_level || 10);
          case "out":
            return product.quantity === 0;
          case "normal":
            return product.quantity > (product.min_stock_level || 10);
          default:
            return true;
        }
      })();

      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "name":
          aValue = a.product_name?.toLowerCase() || "";
          bValue = b.product_name?.toLowerCase() || "";
          break;
        case "price":
          aValue = parseFloat(a.price) || 0;
          bValue = parseFloat(b.price) || 0;
          break;
        case "quantity":
          aValue = parseInt(a.quantity) || 0;
          bValue = parseInt(b.quantity) || 0;
          break;
        case "stock_value":
          aValue = (parseFloat(a.price) || 0) * (parseInt(a.quantity) || 0);
          bValue = (parseFloat(b.price) || 0) * (parseInt(b.quantity) || 0);
          break;
        default:
          aValue = a.product_name?.toLowerCase() || "";
          bValue = b.product_name?.toLowerCase() || "";
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.price || 0) * parseInt(p.quantity || 0)), 0);
  const lowStockProducts = products.filter(p => p.quantity <= (p.min_stock_level || 10)).length;
  const outOfStockProducts = products.filter(p => p.quantity === 0).length;

  const getStockStatus = (product) => {
    if (product.quantity === 0) return { status: "Out of Stock", color: "bg-red-100 text-red-800 border-red-200", icon: <AlertTriangle className="w-4 h-4" /> };
    if (product.quantity <= (product.min_stock_level || 10)) return { status: "Low Stock", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Clock className="w-4 h-4" /> };
    return { status: "In Stock", color: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle className="w-4 h-4" /> };
  };

  const exportToCSV = () => {
    const headers = ["Product Code", "Product Name", "Category", "Price", "Quantity", "Stock Value", "Status"];
    const csvData = filteredProducts.map(product => [
      product.product_code,
      product.product_name,
      product.category,
      product.price,
      product.quantity,
      (parseFloat(product.price || 0) * parseInt(product.quantity || 0)).toFixed(2),
      getStockStatus(product).status
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_report.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Inventory</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadProducts}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-6">
      <PageHeader
        icon={<Package className="w-8 h-8 text-white" />}
        title="Inventory Management"
        subtitle="Monitor and manage your product stock levels"
        right={
          <Button onClick={() => window.open('/catalogue.pdf', '_blank')} className="inline-flex items-center gap-2">
            <FileText className="w-4 h-4" />
            View PDF Catalogue
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatsCard icon={<Package className="w-6 h-6" />} label="Total Products" value={totalProducts} badge="Total" />
        <StatsCard icon={<TrendingUp className="w-6 h-6" />} label="Total Value" value={`₹${(totalValue / 1000).toFixed(1)}K`} badge="Value" />
        <StatsCard icon={<AlertTriangle className="w-6 h-6" />} label="Low Stock Items" value={lowStockProducts} badge="Low Stock" />
        <StatsCard icon={<Clock className="w-6 h-6" />} label="Out of Stock" value={outOfStockProducts} badge="Out of Stock" />
      </div>

      {/* Controls */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products by name, code, or category..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50/80 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-300 text-gray-700 placeholder-gray-400 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-4 bg-gray-50/80 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-700 text-lg"
            >
              <option value="all">All Categories</option>
              <option value="steel">Steel</option>
              <option value="glass">Glass</option>
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-4 py-4 bg-gray-50/80 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-700 text-lg"
            >
              <option value="all">All Stock Levels</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
              <option value="normal">Normal Stock</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-4 bg-gray-50/80 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-700 text-lg"
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="quantity">Sort by Quantity</option>
              <option value="stock_value">Sort by Stock Value</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-4 py-4 bg-gray-50/80 border border-gray-200/50 rounded-2xl hover:bg-gray-100 transition-colors"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">View Mode:</span>
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  viewMode === "table"
                    ? "bg-white text-purple-600 shadow-md"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Table className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-purple-600 shadow-md"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="px-6 py-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {viewMode === "table" ? (
        /* Table View */
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden">
          <DataTable
            columns={[
              { key: 'product', header: 'Product', render: (p) => (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{p.product_name}</p>
                    <p className="text-sm text-gray-500">{p.product_code}</p>
                  </div>
                </div>
              )},
              { key: 'category', header: 'Category', render: (p) => (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium capitalize">
                  {p.category || 'Uncategorized'}
                </span>
              )},
              { key: 'price', header: 'Price', render: (p) => (
                <p className="font-semibold text-gray-900">₹{parseFloat(p.price || 0).toLocaleString()}</p>
              )},
              { key: 'quantity', header: 'Quantity', render: (p) => (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{p.quantity || 0}</span>
                  {p.min_stock_level && (
                    <span className="text-xs text-gray-500">/ {p.min_stock_level}</span>
                  )}
                </div>
              )},
              { key: 'stock_value', header: 'Stock Value', render: (p) => (
                <p className="font-semibold text-gray-900">₹{(parseFloat(p.price || 0) * parseInt(p.quantity || 0)).toFixed(2)}</p>
              )},
              { key: 'status', header: 'Status', render: (p) => {
                const s = getStockStatus(p);
                return (
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${s.color}`}>
                    {s.icon}
                    {s.status}
                  </span>
                );
              }},
            ]}
            data={filteredProducts}
            keyField="product_id"
          />

          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-500 mb-2">
                No products found
              </h3>
              <p className="text-gray-400">
                Try adjusting your search criteria or add new products from the Products page.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Grid View (Original Card Layout) */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product);
            return (
              <div
                key={product.product_id}
                className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300 group"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl border-3 border-white shadow-xl flex items-center justify-center">
                        <Package className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{product.product_name}</h3>
                        <p className="text-pink-100 text-lg">{product.product_code}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                            {product.category || 'Uncategorized'}
                          </span>
                          <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                            ₹{parseFloat(product.price || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}
                      >
                        {stockStatus.icon}
                        {stockStatus.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-purple-50 rounded-2xl border border-purple-200">
                      <p className="text-2xl font-bold text-purple-600">
                        {product.quantity || 0}
                      </p>
                      <p className="text-xs text-purple-500 font-medium">
                        In Stock
                      </p>
                    </div>
                    <div className="text-center p-4 bg-pink-50 rounded-2xl border border-pink-200">
                      <p className="text-2xl font-bold text-pink-600">
                        {product.no_burners || 'N/A'}
                      </p>
                      <p className="text-xs text-pink-500 font-medium">
                        Burners
                      </p>
                    </div>
                    <div className="text-center p-4 bg-rose-50 rounded-2xl border border-rose-200">
                      <p className="text-2xl font-bold text-rose-600">
                        ₹{(parseFloat(product.price || 0) * parseInt(product.quantity || 0)).toLocaleString()}
                      </p>
                      <p className="text-xs text-rose-500 font-medium">
                        Total Value
                      </p>
                    </div>
                  </div>

                  {product.description && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
                      <p className="text-gray-700">{product.description}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDelete(product.product_id)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-2xl hover:from-red-600 hover:to-red-700 transition-colors shadow-lg transform hover:scale-105 text-lg font-semibold flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-5 h-5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No Results */}
      {filteredProducts.length === 0 && viewMode === "grid" && (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">
            No products found
          </h3>
          <p className="text-gray-400">
            Try adjusting your search criteria or add new products from the Products page.
          </p>
        </div>
      )}
    </div>
  );
};

export default Inventory;