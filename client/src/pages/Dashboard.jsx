import React, { useState, useEffect } from "react";
import {
  IndianRupee, Package, ShoppingCart, CreditCard, AlertTriangle, Clock, Eye, Sparkles
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { dashboardAPI, aiAPI } from "../services/api";
import BusinessInsights from "../components/BusinessInsights";
import OrbitalLoader from "../components/ui/OrbitalLoader";
import StatsCard from "../components/ims/StatsCard";
import StatusBadge from "../components/ui/StatusBadge";

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [salesData, setSalesData] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [topSellingItems, setTopSellingItems] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anomalyData, setAnomalyData] = useState(null);
  const [anomalyLoading, setAnomalyLoading] = useState(true);
  const [digestData, setDigestData] = useState(null);
  const [digestLoading, setDigestLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    checkAnomalies();
    loadMorningDigest();
  }, []);

  const loadMorningDigest = async () => {
    // Safety fallback: Hide skeleton after 5s
    const timer = setTimeout(() => setDigestLoading(false), 5000);
    try {
      const res = await aiAPI.getMorningDigest();
      if (res && res.success && res.data) {
        setDigestData(res.data);
      }
    } catch (err) {
      console.error("Failed to load morning digest:", err);
    } finally {
      setDigestLoading(false);
      clearTimeout(timer);
    }
  };

  const checkAnomalies = async () => {
    // Safety fallback: Hide skeleton after 3s regardless of data
    const timer = setTimeout(() => setAnomalyLoading(false), 3000);
    
    try {
      const res = await aiAPI.getAnomalyCheck();
      if (res && res.success && res.data) {
        setAnomalyData(res.data);
      }
    } catch (err) {
      console.error("Failed to check anomalies:", err);
    } finally {
      setAnomalyLoading(false);
      clearTimeout(timer);
    }
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsData, salesHistory, lowStock, topSelling, activities] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getSalesData(),
        dashboardAPI.getLowStockAlerts(),
        dashboardAPI.getTopSellingItems(),
        dashboardAPI.getRecentActivities(),
      ]);


      // Extract stats from overview if present
      const overview = statsData?.overview || statsData || {};
      setStats({
        totalRevenue: overview.totalRevenue || 0,
        totalProducts: overview.totalProducts || 0,
        pendingOrders: overview.pendingOrders || 0,
        completedOrders: overview.completedOrders || 0,
        outstandingPayments: overview.outstandingPayments || 0,
        lowStockCount: overview.lowStockCount || 0,
        outOfStockCount: overview.outOfStockCount || 0,
      });

      // Ensure arrays
      setSalesData(Array.isArray(salesHistory) ? salesHistory : (statsData?.monthlyRevenue || []));
      setLowStockAlerts(Array.isArray(lowStock) ? lowStock : (statsData?.lowStockProducts || []));
      setTopSellingItems(Array.isArray(topSelling) ? topSelling : []);
      setRecentActivities(Array.isArray(activities) ? activities : []);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt) => `₹${Number(amt || 0).toLocaleString("en-IN")}`;

  // Stock distribution for donut chart
  const stockDistribution = [
    { name: "In Stock", value: stats.totalProducts - (stats.lowStockCount || 0) - (stats.outOfStockCount || 0), color: "#22C55E" },
    { name: "Low Stock", value: stats.lowStockCount || 0, color: "#F97316" },
    { name: "Out of Stock", value: stats.outOfStockCount || 0, color: "#EF4444" },
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-[#222222] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm">
          <p className="text-white font-medium">{label}</p>
          <p className="text-green-400">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] p-6 flex items-center justify-center">
        <OrbitalLoader message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] p-6">
      {/* AI Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* AI Morning Digest */}
        {digestLoading ? (
          <div className="h-32 bg-[#1A1A1A] border border-green-500/20 rounded-2xl animate-pulse flex items-center px-6 gap-4">
            <div className="w-12 h-12 bg-[#2A2A2A] rounded-xl"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-[#2A2A2A] rounded w-1/3"></div>
              <div className="h-3 bg-[#2A2A2A] rounded w-3/4"></div>
              <div className="h-3 bg-[#2A2A2A] rounded w-1/2"></div>
            </div>
          </div>
        ) : digestData ? (
          <div className="p-5 bg-green-500/[0.02] border border-green-500/20 rounded-2xl flex items-start gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <div className="p-3 bg-green-500/10 rounded-2xl mt-0.5">
              <Sparkles className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-green-400 mb-2 uppercase tracking-tight flex items-center gap-2">
                Today's Business Digest
              </h3>
              <p className="text-sm text-zinc-100 leading-relaxed font-medium">
                {digestData}
              </p>
            </div>
          </div>
        ) : null}

        {/* AI Business Alert */}
        {anomalyLoading ? (
          <div className="h-32 bg-[#1A1A1A] border border-amber-500/20 rounded-2xl animate-pulse flex items-center px-6 gap-4">
            <div className="w-12 h-12 bg-[#2A2A2A] rounded-xl"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-[#2A2A2A] rounded w-1/3"></div>
              <div className="h-3 bg-[#2A2A2A] rounded w-3/4"></div>
            </div>
          </div>
        ) : anomalyData ? (
          <div className="p-5 bg-amber-500/[0.02] border border-amber-500/20 rounded-2xl flex items-start gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <div className="p-3 bg-amber-500/10 rounded-2xl mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-500 mb-2 uppercase tracking-tight flex items-center gap-2">
                Action Required: Anomaly Detected
              </h3>
              <p className="text-sm text-zinc-100 leading-relaxed font-medium">
                {anomalyData}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={IndianRupee} accentColor="green" />
        <StatsCard title="Total Products" value={stats.totalProducts || 0} icon={Package} accentColor="blue" />
        <StatsCard title="Pending Orders" value={stats.pendingOrders || 0} icon={ShoppingCart} accentColor="orange" />
        <StatsCard title="Outstanding Payments" value={formatCurrency(stats.outstandingPayments)} icon={CreditCard} accentColor="red" />
      </div>

      {/* Two Column: Chart + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Sales Chart */}
        <div className="lg:col-span-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
          <div className="mb-4">
            <h2 className="text-base font-medium text-white">Sales Overview</h2>
            <p className="text-xs text-zinc-500">Last 6 months revenue</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
              <XAxis dataKey="month" tick={{ fill: "#71717A", fontSize: 12 }} axisLine={{ stroke: "#2A2A2A" }} />
              <YAxis tick={{ fill: "#71717A", fontSize: 12 }} axisLine={{ stroke: "#2A2A2A" }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="#22C55E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h2 className="text-base font-medium text-white">Low Stock Alerts</h2>
          </div>
          <div className="space-y-3 max-h-[260px] overflow-y-auto scrollbar-hide">
            {(lowStockAlerts || []).length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">All products are well stocked</p>
            ) : (
              lowStockAlerts.slice(0, 6).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#222222] rounded-xl border border-[#2A2A2A]">
                  <div>
                    <p className="text-sm font-medium text-white">{item.product_name}</p>
                    <p className="text-xs text-zinc-500">{item.product_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-400">{item.quantity} left</p>
                    <p className="text-xs text-zinc-600">Min: {item.min_stock_level || 10}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Three Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Dealers */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
          <h2 className="text-base font-medium text-white mb-4">Top Selling Products</h2>
          <div className="space-y-3">
            {(topSellingItems || []).length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-6">No data yet</p>
            ) : (
              topSellingItems.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-green-500/15 text-green-400' :
                    i === 1 ? 'bg-zinc-600 text-zinc-300' :
                      'bg-zinc-700 text-zinc-400'
                    }`}>{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{item.product_name || item.name}</p>
                    <p className="text-xs text-zinc-500">{item.total_sold || item.quantity} units</p>
                  </div>
                  <p className="text-sm font-semibold text-green-400">{formatCurrency(item.revenue || item.total)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
          <h2 className="text-base font-medium text-white mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {(recentActivities || []).length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-6">No recent orders</p>
            ) : (
              recentActivities.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#222222] rounded-xl border border-[#2A2A2A]">
                  <div>
                    <p className="text-sm font-medium text-white">{a.order_code || a.description}</p>
                    <p className="text-xs text-zinc-500">{a.dealer_name || a.details}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={a.status || "Pending"} />
                    <p className="text-xs text-zinc-500 mt-1">{formatCurrency(a.amount || a.total_amount)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stock Distribution */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
          <h2 className="text-base font-medium text-white mb-4">Stock Distribution</h2>
          {stockDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={stockDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {stockDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {stockDistribution.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <span className="text-xs text-zinc-400">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-zinc-500 text-sm text-center py-10">No stock data</p>
          )}
        </div>
      </div>


      {/* Business Insights */}
      <BusinessInsights />
    </div>
  );
};

export default Dashboard;
