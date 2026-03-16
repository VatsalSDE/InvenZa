import React, { useState, useEffect } from "react";
import {
  X, Plus, Search, Edit, Trash2, Package, TrendingUp, AlertTriangle,
  CheckCircle, Clock, BarChart3, Eye, Table, Grid3X3, Filter, Download, FileText, RefreshCw
} from "lucide-react";
import { productsAPI, aiAPI } from "../services/api";
import PageHeader from "../components/ims/PageHeader";
import StatsCard from "../components/ims/StatsCard";
import StatusBadge from "../components/ui/StatusBadge";
import OrbitalLoader from "../components/ui/OrbitalLoader";
import { Table as DataTable } from "../components/ui/Table";

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");
  const [products, setProducts] = useState([]);
  const [profitabilityData, setProfitabilityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [restockData, setRestockData] = useState(null);
  const [restockLoading, setRestockLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadProducts();
    loadProfitability();
    loadRestockSuggestions();
  }, []);

  const loadRestockSuggestions = async (silent = false) => {
    if (!silent) setRestockLoading(true);
    setIsRefreshing(true);
    
    // Safety fallback: Hide skeleton after 5s
    const timer = setTimeout(() => setRestockLoading(false), 5000);

    try {
      const res = await aiAPI.getRestockSuggestions();
      if (res && res.success && res.data) {
        setRestockData(res.data);
      }
    } catch (err) {
      console.error("Failed to load restock suggestions:", err);
    } finally {
      setRestockLoading(false);
      setIsRefreshing(false);
      clearTimeout(timer);
    }
  };

  const loadProfitability = async () => {
    try {
      const data = await productsAPI.getProductProfitability();
      setProfitabilityData(data.data || data || []);
    } catch (err) {
      console.error('Failed to load profitability data:', err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getAll();
      setProducts(data.data || data || []);
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
        await loadProfitability();
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
          case "low": return product.quantity <= (product.min_stock_level || 10);
          case "out": return product.quantity === 0;
          case "normal": return product.quantity > (product.min_stock_level || 10);
          default: return true;
        }
      })();

      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "name": aValue = a.product_name?.toLowerCase() || ""; bValue = b.product_name?.toLowerCase() || ""; break;
        case "price": aValue = parseFloat(a.price) || 0; bValue = parseFloat(b.price) || 0; break;
        case "quantity": aValue = parseInt(a.quantity) || 0; bValue = parseInt(b.quantity) || 0; break;
        case "stock_value": aValue = (parseFloat(a.price) || 0) * (parseInt(a.quantity) || 0); bValue = (parseFloat(b.price) || 0) * (parseInt(b.quantity) || 0); break;
        default: aValue = a.product_name?.toLowerCase() || ""; bValue = b.product_name?.toLowerCase() || "";
      }
      return sortOrder === "asc" ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.price || 0) * parseInt(p.quantity || 0)), 0);
  const lowStockProducts = products.filter(p => p.quantity <= (p.min_stock_level || 10)).length;
  const outOfStockProducts = products.filter(p => p.quantity === 0).length;
  const formatCurrency = (amt) => `₹${Number(amt || 0).toLocaleString("en-IN")}`;

  const getStockStatus = (product) => {
    if (product.quantity === 0) return "Out of Stock";
    if (product.quantity <= (product.min_stock_level || 10)) return "Low Stock";
    return "In Stock";
  };

  const exportToCSV = () => {
    const headers = ["Product Code", "Product Name", "Category", "Price", "Quantity", "Stock Value", "Status"];
    const csvData = filteredProducts.map(product => [
      product.product_code, product.product_name, product.category, product.price,
      product.quantity, (parseFloat(product.price || 0) * parseInt(product.quantity || 0)).toFixed(2),
      getStockStatus(product)
    ]);
    const csvContent = [headers, ...csvData].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "inventory_report.csv"; a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0F0F0F] p-6 flex items-center justify-center">
      <OrbitalLoader message="Loading inventory..." />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0F0F0F] p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-white mb-2">Error Loading Inventory</h2>
        <p className="text-zinc-500 mb-4">{error}</p>
        <button onClick={loadProducts} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-lg transition-colors">Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F0F0F] p-6 pb-20">
      <PageHeader title="Inventory" subtitle="Monitor and manage your product stock levels" icon={Package} count={totalProducts}
        action={
          <button onClick={() => window.open('/catalogue.pdf', '_blank')} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" /> View PDF Catalogue
          </button>
        }
      />

      {/* AI Restock Suggestions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Smart Restock Suggestions</h2>
          </div>
          <button 
            onClick={() => loadRestockSuggestions()}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-green-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Thinking...' : 'Refresh AI Suggestions'}
          </button>
        </div>

        {restockLoading ? (
          <div className="h-28 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl animate-pulse flex items-center px-8 gap-5">
            <div className="w-12 h-12 bg-[#2A2A2A] rounded-xl"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-[#2A2A2A] rounded w-1/3"></div>
              <div className="h-3 bg-[#2A2A2A] rounded w-2/3"></div>
            </div>
          </div>
        ) : restockData ? (
          <div className="p-5 bg-[#1A1A1A] border-l-4 border-l-green-500 border-y border-r border-[#2A2A2A] rounded-tr-2xl rounded-br-2xl flex items-start gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <div className="p-2.5 bg-green-500/10 rounded-xl mt-1">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-zinc-100 leading-relaxed whitespace-pre-line">
                {restockData}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Products" value={totalProducts} icon={Package} accentColor="blue" />
        <StatsCard title="Total Value" value={`₹${(totalValue / 1000).toFixed(1)}K`} icon={TrendingUp} accentColor="green" />
        <StatsCard title="Low Stock Items" value={lowStockProducts} icon="⚠️" accentColor="orange" />
        <StatsCard title="Out of Stock" value={outOfStockProducts} icon={Clock} accentColor="red" />
      </div>

      {/* Controls */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
            <input type="text" placeholder="Search products by name, code, or category..."
              className="w-full pl-10 pr-4 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 placeholder:text-zinc-600"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50">
            <option value="all">All Categories</option>
            <option value="steel">Steel</option>
            <option value="glass">Glass</option>
          </select>

          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50">
            <option value="all">All Stock Levels</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
            <option value="normal">Normal Stock</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50">
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="quantity">Sort by Quantity</option>
            <option value="stock_value">Sort by Stock Value</option>
          </select>

          <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-zinc-400 hover:text-white rounded-lg transition-colors">
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>

        {/* View Controls */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2A2A2A]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">View:</span>
            <button onClick={() => setViewMode("table")} className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-green-500/10 text-green-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
              <Table className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-green-500/10 text-green-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
          <button onClick={exportToCSV} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-lg text-sm flex items-center gap-2 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Products Display */}
      {viewMode === "table" ? (
        <DataTable
          columns={[
            {
              key: 'product', header: 'Product', render: (p) => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{p.product_name}</p>
                    <p className="text-xs text-zinc-500">{p.product_code}</p>
                  </div>
                </div>
              )
            },
            {
              key: 'category', header: 'Category', render: (p) => (
                <span className="px-2.5 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-full text-xs font-medium capitalize">
                  {p.category || 'Uncategorized'}
                </span>
              )
            },
            {
              key: 'price', header: 'Price', render: (p) => (
                <p className="text-sm font-medium text-green-400">₹{parseFloat(p.price || 0).toLocaleString()}</p>
              )
            },
            {
              key: 'quantity', header: 'Quantity', render: (p) => (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{p.quantity || 0}</span>
                  {p.min_stock_level && <span className="text-xs text-zinc-600">/ {p.min_stock_level}</span>}
                </div>
              )
            },
            {
              key: 'stock_value', header: 'Stock Value', render: (p) => (
                <p className="text-sm font-medium text-zinc-300">₹{(parseFloat(p.price || 0) * parseInt(p.quantity || 0)).toFixed(2)}</p>
              )
            },
            { key: 'status', header: 'Status', render: (p) => <StatusBadge status={getStockStatus(p)} /> },
          ]}
          data={filteredProducts}
          keyField="product_id"
        />
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.product_id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden hover:border-green-500/30 transition-all group">
              {/* Header */}
              <div className="p-4 border-b border-[#2A2A2A]">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">{product.product_name}</h3>
                      <p className="text-xs text-zinc-600">{product.product_code}</p>
                    </div>
                  </div>
                  <StatusBadge status={getStockStatus(product)} />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-md text-xs capitalize">{product.category || 'Uncategorized'}</span>
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-md text-xs">₹{parseFloat(product.price || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-3 bg-[#222222] rounded-xl border border-[#2A2A2A]">
                    <p className="text-lg font-bold text-white">{product.quantity || 0}</p>
                    <p className="text-[10px] text-zinc-600">In Stock</p>
                  </div>
                  <div className="text-center p-3 bg-[#222222] rounded-xl border border-[#2A2A2A]">
                    <p className="text-lg font-bold text-zinc-300">{product.no_burners || 'N/A'}</p>
                    <p className="text-[10px] text-zinc-600">Burners</p>
                  </div>
                  <div className="text-center p-3 bg-[#222222] rounded-xl border border-[#2A2A2A]">
                    <p className="text-lg font-bold text-green-400">₹{(parseFloat(product.price || 0) * parseInt(product.quantity || 0)).toLocaleString()}</p>
                    <p className="text-[10px] text-zinc-600">Total Value</p>
                  </div>
                </div>

                {product.description && (
                  <div className="mb-4 p-3 bg-[#222222] rounded-xl border border-[#2A2A2A]">
                    <p className="text-sm text-zinc-400">{product.description}</p>
                  </div>
                )}

                <button onClick={() => handleDelete(product.product_id)}
                  className="w-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

        <div className="text-center py-16">
          <Package className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-zinc-400 mb-1">No products found</h3>
          <p className="text-sm text-zinc-600">Try adjusting your search criteria. New products are added through the Purchase flow.</p>
        </div>

      {/* Profitability Analysis section (Step 4) */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Profitability Analysis</h2>
            <p className="text-sm text-zinc-500">Revenue against current stock value</p>
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-xl">
          <DataTable
            columns={[
              {
                key: 'product',
                header: 'Product',
                render: (p) => (
                  <div>
                    <p className="text-sm font-medium text-white">{p.product_name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase">{p.category}</p>
                  </div>
                )
              },
              {
                key: 'revenue',
                header: 'Generated Revenue',
                render: (p) => (
                  <span className="text-sm font-semibold text-green-400">{formatCurrency(p.revenue)}</span>
                )
              },
              {
                key: 'stock_value',
                header: 'Unsold Stock Value',
                render: (p) => (
                  <span className="text-sm text-zinc-300">{formatCurrency(p.stock_value)}</span>
                )
              },
              {
                key: 'efficiency',
                header: 'Performance',
                render: (p) => {
                  const total = p.revenue + p.stock_value;
                  const ratio = total > 0 ? (p.revenue / total) * 100 : 0;
                  return (
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${ratio > 50 ? 'bg-green-500' : ratio > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, ratio)}%` }}></div>
                      </div>
                      <span className="text-[10px] font-medium text-zinc-400">{ratio.toFixed(1)}%</span>
                    </div>
                  );
                }
              },
              {
                key: 'status',
                header: 'Status',
                render: (p) => {
                  const total = p.revenue + p.stock_value;
                  const ratio = total > 0 ? (p.revenue / total) * 100 : 0;
                  if (p.revenue === 0) return <StatusBadge status="Dead Stock" />;
                  if (ratio > 70) return <StatusBadge status="High Mover" />;
                  if (ratio < 20) return <StatusBadge status="Slow Mover" />;
                  return <StatusBadge status="Steady" />;
                }
              }
            ]}
            data={profitabilityData}
            keyField="product_id"
          />
        </div>
      </div>
    </div>
  );
};

export default Inventory;