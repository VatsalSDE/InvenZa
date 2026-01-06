import React, { useState } from "react";
import { Brain, Zap, Target, Lightbulb, TrendingUp, BarChart3, Activity, Package, Users, DollarSign, ShoppingCart, AlertTriangle } from "lucide-react";

const AIPoweredFeatures = ({ salesData = [], lowStock = [], stats = null }) => {
  const [activeFeature, setActiveFeature] = useState(0);

  // Simple trend calculations from salesData
  const totalSales = salesData.reduce((s, d) => s + (d.sales || 0), 0);
  const totalTarget = salesData.reduce((s, d) => s + (d.target || 0), 0);
  const efficiency = totalTarget > 0 ? Math.min(100, Math.round((totalSales / totalTarget) * 100)) : 87;

  // Recommendations from low stock
  const recommendations = (lowStock || []).slice(0, 3).map(p => ({
    product_name: p.product_name,
    suggestion: `Increase ${p.product_name} stock by ${Math.max(5, (p.min_stock_level || 10) - (p.quantity || 0) + 10)} units`
  }));

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Analytics",
      description: "Live trends based on your recent sales vs targets.",
      stats: `${efficiency}% Efficiency`,
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Smart Automation",
      description: "Auto-reorder suggestions based on low stock thresholds and recent velocity.",
      stats: "24/7 Monitoring",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Predictive Insights",
      description: "Identify surges and dips from recent performance to plan ahead.",
      stats: "Real-time Data",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Lightbulb className="w-8 h-8" />,
      title: "Intelligent Recommendations",
      description: "Concrete actions to prevent stockouts on critical SKUs.",
      stats: "Smart Suggestions",
      color: "from-orange-500 to-red-500"
    }
  ];

  return (
    <div className="mb-8">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI-Powered Features
            </h2>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Experience the future of inventory management with cutting-edge artificial intelligence
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Feature Cards */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div
                key={index}
                onClick={() => setActiveFeature(index)}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                  activeFeature === index
                    ? `border-purple-300 bg-gradient-to-r ${feature.color} text-white shadow-lg`
                    : 'border-gray-200 bg-gray-50/50 hover:border-purple-200 hover:bg-purple-50/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    activeFeature === index ? 'bg-white/20' : 'bg-white shadow-md'
                  }`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg mb-2 ${
                      activeFeature === index ? 'text-white' : 'text-gray-800'
                    }`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm ${
                      activeFeature === index ? 'text-purple-100' : 'text-gray-600'
                    }`}>
                      {feature.description}
                    </p>
                    <div className={`mt-3 inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      activeFeature === index ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {feature.stats}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Demo */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">AI Demo Dashboard</h3>
              <p className="text-gray-600 text-sm">Interactive preview of AI capabilities</p>
            </div>

            <div className="space-y-4">
              {/* Mock AI Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{efficiency}%</p>
                  <p className="text-xs text-gray-500">Efficiency</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">24/7</p>
                  <p className="text-xs text-gray-500">Monitoring</p>
                </div>
              </div>

              {/* Mock AI Predictions */}
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3">AI Predictions</h4>
                <div className="space-y-2">
                  {(stats ? [
                    { name: 'Revenue vs Target', val: efficiency >= 100 ? '+5% over' : `-${100-efficiency}% under`, up: efficiency >= 100 },
                    { name: 'Low Stock Items', val: String(stats.lowStockProducts), up: false },
                    { name: 'Completed Orders', val: String(stats.completedOrders), up: true }
                  ] : []).map((row, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{row.name}</span>
                      <span className={`${row.up ? 'text-green-600' : 'text-gray-700'} font-medium`}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mock AI Recommendations */}
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3">Smart Recommendations</h4>
                <div className="space-y-2 text-sm">
                  {recommendations.length > 0 ? recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-600">{rec.suggestion}</span>
                    </div>
                  )) : (
                    <div className="text-gray-500">No critical recommendations right now.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPoweredFeatures;
