import React, { useState, useEffect } from "react";
import { Users, Package, IndianRupee, AlertTriangle, BarChart3 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { dashboardAPI } from "../services/api";

const BusinessInsights = () => {
    const [data, setData] = useState({ topDealers: [], slowestProducts: [], collectionRate: 0, stockHealth: { healthy: 0, low: 0, out: 0 } });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        loadInsights();
    }, []);

    const loadInsights = async () => {
        try {
            setLoading(true);
            setError(false);
            const response = await dashboardAPI.getBusinessInsights();
            // Data has topDealers, slowestProducts, collectionRate, stockHealth
            setData(response || { topDealers: [], slowestProducts: [], collectionRate: 0, stockHealth: { healthy: 0, low: 0, out: 0 } });
        } catch (err) {
            console.error("Failed to load insights:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (a) => `₹${Number(a || 0).toLocaleString("en-IN")}`;

    const donutData = [
        { name: "Healthy", value: data.stockHealth?.healthy || 0, color: "#22C55E" },
        { name: "Low", value: data.stockHealth?.low || 0, color: "#F97316" },
        { name: "Out", value: data.stockHealth?.out || 0, color: "#EF4444" },
    ].filter(d => d.value > 0);

    const renderSkeleton = () => (
        <div className="animate-pulse space-y-3 mt-2">
            <div className="h-4 bg-[#2A2A2A] rounded w-3/4"></div>
            <div className="h-4 bg-[#2A2A2A] rounded w-full"></div>
            <div className="h-4 bg-[#2A2A2A] rounded w-5/6"></div>
        </div>
    );

    const renderError = () => (
        <div className="flex items-center justify-center p-4">
            <p className="text-xs text-red-500 font-medium">Failed to load</p>
        </div>
    );

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-green-400" />
                <h2 className="text-base font-medium text-white">Business Insights</h2>
                <span className="flex items-center gap-1 bg-green-500/15 text-green-400 border border-green-500/20 rounded-full px-2 py-0.5 text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Live Data
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top 3 Dealers */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 min-h-[140px]">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-green-400" />
                        <h3 className="text-sm font-medium text-white">Top 3 Dealers</h3>
                    </div>
                    {loading ? renderSkeleton() : error ? renderError() : (
                        <div className="space-y-2">
                            {data.topDealers?.length === 0 ? <p className="text-sm text-zinc-600">No dealer data</p> : (
                                data.topDealers.map((d, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 bg-[#222222] rounded-lg border border-[#2A2A2A]">
                                        <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-green-500/15 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>{i + 1}</span>
                                        <span className="flex-1 text-sm text-zinc-300">{d.firm_name || "Unknown"}</span>
                                        <span className="text-sm font-medium text-green-400">{formatCurrency(d.total_revenue)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Slowest Moving Products */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 min-h-[140px]">
                    <div className="flex items-center gap-2 mb-3">
                        <Package className="w-4 h-4 text-orange-400" />
                        <h3 className="text-sm font-medium text-white">Slowest Moving Products</h3>
                    </div>
                    {loading ? renderSkeleton() : error ? renderError() : (
                        <div className="space-y-2">
                            {data.slowestProducts?.length === 0 ? <p className="text-sm text-zinc-600">No product data</p> : (
                                data.slowestProducts.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 bg-[#222222] rounded-lg border border-[#2A2A2A]">
                                        <span className="text-sm text-zinc-300">{p.product_name}</span>
                                        <span className="text-xs text-zinc-500">{p.total_sold} sold</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Payment Collection Rate */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 min-h-[140px]">
                    <div className="flex items-center gap-2 mb-3">
                        <IndianRupee className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-medium text-white">Payment Collection Rate</h3>
                    </div>
                    {loading ? renderSkeleton() : error ? renderError() : (
                        <>
                            <p className="text-3xl font-bold text-white mb-2">{data.collectionRate}%</p>
                            <div className="w-full h-2 bg-[#222222] rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${data.collectionRate}%` }}></div>
                            </div>
                            <p className="text-xs text-zinc-600 mt-2">of total billed amount collected</p>
                        </>
                    )}
                </div>

                {/* Stock Health */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 min-h-[140px]">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <h3 className="text-sm font-medium text-white">Stock Health Summary</h3>
                    </div>
                    {loading ? renderSkeleton() : error ? renderError() : (
                        <div className="flex items-center gap-4 mt-2">
                            <div className="w-20 h-20">
                                {donutData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={donutData} cx="50%" cy="50%" innerRadius={22} outerRadius={36} paddingAngle={3} dataKey="value">
                                                {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full rounded-full border-4 border-[#2A2A2A] flex items-center justify-center">
                                        <span className="text-[10px] text-zinc-600">N/A</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1.5 flex-1">
                                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div><span className="text-xs text-zinc-400">Healthy</span></div><span className="text-xs text-white">{data.stockHealth?.healthy || 0}</span></div>
                                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-orange-500 rounded-full"></div><span className="text-xs text-zinc-400">Low</span></div><span className="text-xs text-white">{data.stockHealth?.low || 0}</span></div>
                                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div><span className="text-xs text-zinc-400">Out</span></div><span className="text-xs text-white">{data.stockHealth?.out || 0}</span></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BusinessInsights;
