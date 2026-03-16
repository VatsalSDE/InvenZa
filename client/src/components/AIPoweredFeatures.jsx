import React from "react";
import { Brain, Sparkles, TrendingUp, BarChart3, Package, AlertTriangle } from "lucide-react";

const AIPoweredFeatures = ({ salesData = [], lowStock = [], stats = null }) => {
  // Simple calculations from real data
  const totalSales = salesData.reduce((s, d) => s + (d.sales || 0), 0);
  const totalTarget = salesData.reduce((s, d) => s + (d.target || 0), 0);
  const efficiency = totalTarget > 0 ? Math.min(100, Math.round((totalSales / totalTarget) * 100)) : 0;

  // Low stock recommendations
  const recommendations = (lowStock || []).slice(0, 3).map(p => ({
    product_name: p.product_name,
    quantity: p.quantity || 0,
    min_stock: p.min_stock_level || 10
  }));

  return (
    <div className="mb-8">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">AI-Powered Insights</h2>
              <p className="text-xs text-zinc-500">Smart analytics coming soon</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
            <Sparkles className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400">Preview</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Current Stats */}
          <div className="bg-[#222222] rounded-xl p-4 border border-[#2A2A2A]">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-white">Performance</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Efficiency</span>
                <span className="text-sm font-medium text-white">{efficiency}%</span>
              </div>
              <div className="w-full bg-[#2A2A2A] rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${efficiency}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Total Sales</span>
                <span className="text-green-400">₹{totalSales.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-[#222222] rounded-xl p-4 border border-[#2A2A2A]">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-white">Stock Alerts</span>
            </div>
            {recommendations.length > 0 ? (
              <div className="space-y-2">
                {recommendations.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 truncate max-w-[120px]">{item.product_name}</span>
                    <span className="text-orange-400">{item.quantity} left</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">All products well stocked</p>
            )}
          </div>

          {/* Coming Soon */}
          <div className="bg-[#222222] rounded-xl p-4 border border-[#2A2A2A] flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-full flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-sm font-medium text-white mb-1">AI Features Coming</h3>
            <p className="text-xs text-zinc-500">
              Predictive analytics, smart reordering, and sales forecasting
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        {stats && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#222222] rounded-lg p-3 border border-[#2A2A2A] text-center">
              <Package className="w-4 h-4 text-green-400 mx-auto mb-1" />
              <p className="text-lg font-semibold text-white">{stats.totalProducts || 0}</p>
              <p className="text-xs text-zinc-500">Products</p>
            </div>
            <div className="bg-[#222222] rounded-lg p-3 border border-[#2A2A2A] text-center">
              <BarChart3 className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-semibold text-white">{stats.totalOrders || 0}</p>
              <p className="text-xs text-zinc-500">Orders</p>
            </div>
            <div className="bg-[#222222] rounded-lg p-3 border border-[#2A2A2A] text-center">
              <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-lg font-semibold text-white">{stats.completedOrders || 0}</p>
              <p className="text-xs text-zinc-500">Completed</p>
            </div>
            <div className="bg-[#222222] rounded-lg p-3 border border-[#2A2A2A] text-center">
              <AlertTriangle className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <p className="text-lg font-semibold text-white">{stats.lowStockProducts || 0}</p>
              <p className="text-xs text-zinc-500">Low Stock</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPoweredFeatures;
