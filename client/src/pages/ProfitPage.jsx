import React, { useState, useEffect, useCallback } from "react";
import {
    IndianRupee, TrendingUp, TrendingDown, Package, Users, Plus, Edit, Trash2, X,
    Calendar, ArrowUpRight, ArrowDownRight, Loader2, BarChart3
} from "lucide-react";
import { profitAPI } from "../services/profitAPI";
import PageHeader from "../components/ims/PageHeader";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, Cell
} from "recharts";

const EXPENSE_CATEGORIES = ["Rent", "Electricity", "Transport", "Packaging", "Staff", "Other"];
const CATEGORY_COLORS = { Rent: "#f97316", Electricity: "#eab308", Transport: "#3b82f6", Packaging: "#8b5cf6", Staff: "#10b981", Other: "#6b7280" };

const formatCurrency = (a) => `₹${Number(a || 0).toLocaleString("en-IN")}`;
const today = () => new Date().toLocaleDateString("en-CA");

const getThisMonthRange = () => {
    const now = new Date();
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const end = today();
    return { start, end };
};

const getThisQuarterRange = () => {
    const now = new Date();
    const qm = Math.floor(now.getMonth() / 3) * 3;
    const start = `${now.getFullYear()}-${String(qm + 1).padStart(2, "0")}-01`;
    return { start, end: today() };
};

const getThisYearRange = () => ({ start: `${new Date().getFullYear()}-01-01`, end: today() });

/* Skeleton loader */
const Skeleton = ({ className = "" }) => (
    <div className={`animate-pulse bg-zinc-800 rounded-lg ${className}`} />
);

const ProfitPage = () => {
    const [period, setPeriod] = useState("year");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [dateRange, setDateRange] = useState(getThisYearRange());

    // Data states
    const [summary, setSummary] = useState(null);
    const [trend, setTrend] = useState([]);
    const [products, setProducts] = useState([]);
    const [dealers, setDealers] = useState([]);
    const [expenses, setExpenses] = useState([]);

    // Loading states (independent)
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [loadingTrend, setLoadingTrend] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingDealers, setLoadingDealers] = useState(true);
    const [loadingExpenses, setLoadingExpenses] = useState(true);

    // Expense modal
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [expenseForm, setExpenseForm] = useState({ category: "Other", description: "", amount: "", expense_date: today() });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    const fetchAll = useCallback(async (range) => {
        const { start, end } = range;

        setLoadingSummary(true);
        setLoadingTrend(true);
        setLoadingProducts(true);
        setLoadingDealers(true);
        setLoadingExpenses(true);

        // Fire all in parallel
        profitAPI.getProfitSummary(start, end).then(d => { setSummary(d); setLoadingSummary(false); }).catch(() => setLoadingSummary(false));
        profitAPI.getMonthlyTrend(start, end).then(d => { setTrend(d || []); setLoadingTrend(false); }).catch(() => setLoadingTrend(false));
        profitAPI.getProductBreakdown(start, end).then(d => { setProducts(d || []); setLoadingProducts(false); }).catch(() => setLoadingProducts(false));
        profitAPI.getDealerContribution(start, end).then(d => { setDealers(d || []); setLoadingDealers(false); }).catch(() => setLoadingDealers(false));
        profitAPI.getExpenses(start, end).then(d => { setExpenses(d || []); setLoadingExpenses(false); }).catch(() => setLoadingExpenses(false));
    }, []);

    useEffect(() => { fetchAll(dateRange); }, [dateRange, fetchAll]);

    const handlePeriodChange = (p) => {
        setPeriod(p);
        if (p === "month") setDateRange(getThisMonthRange());
        else if (p === "quarter") setDateRange(getThisQuarterRange());
        else if (p === "year") setDateRange(getThisYearRange());
    };

    const handleCustomApply = () => {
        if (customFrom && customTo) setDateRange({ start: customFrom, end: customTo });
    };

    const refreshSummaryAndExpenses = async () => {
        const { start, end } = dateRange;
        setLoadingSummary(true);
        setLoadingExpenses(true);
        profitAPI.getProfitSummary(start, end).then(d => { setSummary(d); setLoadingSummary(false); }).catch(() => setLoadingSummary(false));
        profitAPI.getExpenses(start, end).then(d => { setExpenses(d || []); setLoadingExpenses(false); }).catch(() => setLoadingExpenses(false));
    };

    const handleSaveExpense = async (e) => {
        e.preventDefault();
        try {
            if (editingExpense) {
                await profitAPI.updateExpense(editingExpense.expense_id, expenseForm);
            } else {
                await profitAPI.addExpense(expenseForm);
            }
            setShowExpenseModal(false);
            setEditingExpense(null);
            setExpenseForm({ category: "Other", description: "", amount: "", expense_date: today() });
            await refreshSummaryAndExpenses();
        } catch (err) { console.error(err); }
    };

    const handleDeleteExpense = async (id) => {
        try {
            await profitAPI.deleteExpense(id);
            setShowDeleteConfirm(null);
            await refreshSummaryAndExpenses();
        } catch (err) { console.error(err); }
    };

    const openEditExpense = (exp) => {
        setEditingExpense(exp);
        setExpenseForm({
            category: exp.category,
            description: exp.description || "",
            amount: exp.amount,
            expense_date: (exp.expense_date || "").slice(0, 10),
        });
        setShowExpenseModal(true);
    };

    const totalExpensesInList = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const inp = "w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 placeholder:text-zinc-600";

    const maxDealerRevenue = dealers.length > 0 ? Math.max(...dealers.map(d => d.total_revenue)) : 1;

    return (
        <div className="min-h-screen bg-[#0F0F0F] p-6">
            <PageHeader title="Profit & Loss" subtitle="Track revenue, costs, and profitability" icon={IndianRupee} />

            {/* Section 1 — Period Selector */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                {[
                    { key: "month", label: "This Month" },
                    { key: "quarter", label: "This Quarter" },
                    { key: "year", label: "This Year" },
                    { key: "custom", label: "Custom Range" },
                ].map(({ key, label }) => (
                    <button key={key} onClick={() => handlePeriodChange(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === key ? "bg-green-500 text-black" : "bg-[#1A1A1A] border border-[#2A2A2A] text-zinc-400 hover:text-white hover:bg-white/5"}`}>
                        {label}
                    </button>
                ))}
                {period === "custom" && (
                    <div className="flex items-center gap-2 ml-2">
                        <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className={`${inp} w-40`} />
                        <span className="text-zinc-600 text-sm">to</span>
                        <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className={`${inp} w-40`} />
                        <button onClick={handleCustomApply} className="px-4 py-2 rounded-lg bg-green-500 text-black text-sm font-semibold hover:bg-green-600">Apply</button>
                    </div>
                )}
            </div>

            {/* Section 2 — Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {loadingSummary ? (
                    Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />)
                ) : (
                    <>
                        <SummaryCard label="Total Revenue" value={summary?.total_revenue} color="blue" icon={TrendingUp} />
                        <SummaryCard label="Cost of Goods" value={summary?.total_cost_of_goods} color="orange" icon={Package} />
                        <SummaryCard label="Total Expenses" value={summary?.total_expenses} color="red" icon={ArrowDownRight} />
                        <SummaryCard label="Net Profit" value={summary?.net_profit} color={summary?.net_profit >= 0 ? "green" : "red"} icon={summary?.net_profit >= 0 ? ArrowUpRight : ArrowDownRight}
                            subtitle={`${summary?.profit_margin_percentage || 0}% margin`} />
                    </>
                )}
            </div>

            {/* Section 3 — Profit Trend Chart */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 mb-8">
                <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-green-400" /> Profit Trend</h3>
                {loadingTrend ? (
                    <Skeleton className="h-72" />
                ) : trend.length === 0 ? (
                    <p className="text-zinc-600 text-sm text-center py-16">No data for this period</p>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={trend}>
                            <defs>
                                <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                                <linearGradient id="gCogs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.3} /><stop offset="95%" stopColor="#f97316" stopOpacity={0} /></linearGradient>
                                <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                            <XAxis dataKey="month_label" tick={{ fill: "#71717a", fontSize: 12 }} axisLine={{ stroke: "#2A2A2A" }} />
                            <YAxis tick={{ fill: "#71717a", fontSize: 12 }} axisLine={{ stroke: "#2A2A2A" }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                            <Tooltip contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: "8px", color: "#fff" }}
                                formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, undefined]} labelStyle={{ color: "#71717a" }} />
                            <Legend wrapperStyle={{ color: "#a1a1aa" }} />
                            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#gRevenue)" strokeWidth={2} name="Revenue" />
                            <Area type="monotone" dataKey="cost_of_goods" stroke="#f97316" fill="url(#gCogs)" strokeWidth={2} name="Cost of Goods" />
                            <Area type="monotone" dataKey="net_profit" stroke="#10b981" fill="url(#gProfit)" strokeWidth={2} name="Net Profit" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Section 4 — Product Profitability Table */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 mb-8">
                <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-orange-400" /> Product-wise Profit</h3>
                {loadingProducts ? (
                    <Skeleton className="h-48" />
                ) : products.length === 0 ? (
                    <p className="text-zinc-600 text-sm text-center py-12">No sales in this period.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#2A2A2A]">
                                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Product</th>
                                    <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Units Sold</th>
                                    <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Revenue</th>
                                    <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Cost</th>
                                    <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Gross Profit</th>
                                    <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Margin%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p, i) => (
                                    <tr key={i} className="border-b border-[#1F1F1F] hover:bg-white/[0.02]">
                                        <td className="py-3 px-4 text-sm text-white">{p.product_name} {p.cost_estimated && <span className="text-[10px] text-yellow-500 ml-1">(Est.)</span>}</td>
                                        <td className="py-3 px-4 text-sm text-zinc-400 text-right">{p.units_sold}</td>
                                        <td className="py-3 px-4 text-sm text-zinc-300 text-right">{formatCurrency(p.revenue)}</td>
                                        <td className="py-3 px-4 text-sm text-zinc-400 text-right">{formatCurrency(p.cost)}</td>
                                        <td className={`py-3 px-4 text-sm font-medium text-right ${p.gross_profit >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(p.gross_profit)}</td>
                                        <td className="py-3 px-4 text-right">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.margin_percentage > 20 ? "bg-green-500/15 text-green-400" : p.margin_percentage >= 10 ? "bg-yellow-500/15 text-yellow-400" : "bg-red-500/15 text-red-400"}`}>
                                                {p.margin_percentage}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Section 5 — Expenses */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white text-lg font-semibold flex items-center gap-2"><IndianRupee className="w-5 h-5 text-red-400" /> Operating Expenses</h3>
                    <button onClick={() => { setEditingExpense(null); setExpenseForm({ category: "Other", description: "", amount: "", expense_date: today() }); setShowExpenseModal(true); }}
                        className="bg-green-500 hover:bg-green-600 text-black font-semibold px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Expense</button>
                </div>
                {loadingExpenses ? (
                    <Skeleton className="h-48" />
                ) : expenses.length === 0 ? (
                    <p className="text-zinc-600 text-sm text-center py-12">No expenses recorded for this period.</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[#2A2A2A]">
                                        <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Date</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Category</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Description</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Amount</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map((exp) => (
                                        <tr key={exp.expense_id} className="border-b border-[#1F1F1F] hover:bg-white/[0.02]">
                                            <td className="py-3 px-4 text-sm text-zinc-400">{(exp.expense_date || "").slice(0, 10)}</td>
                                            <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${CATEGORY_COLORS[exp.category] || "#6b7280"}20`, color: CATEGORY_COLORS[exp.category] || "#6b7280" }}>{exp.category}</span></td>
                                            <td className="py-3 px-4 text-sm text-zinc-300">{exp.description || "—"}</td>
                                            <td className="py-3 px-4 text-sm text-red-400 font-medium text-right">{formatCurrency(exp.amount)}</td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEditExpense(exp)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"><Edit className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => setShowDeleteConfirm(exp)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#2A2A2A] flex justify-end">
                            <p className="text-sm font-semibold text-white">Total: <span className="text-red-400">{formatCurrency(totalExpensesInList)}</span></p>
                        </div>
                    </>
                )}
            </div>

            {/* Section 6 — Dealer Revenue Contribution */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 mb-8">
                <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" /> Revenue by Dealer</h3>
                {loadingDealers ? (
                    <Skeleton className="h-48" />
                ) : dealers.length === 0 ? (
                    <p className="text-zinc-600 text-sm text-center py-12">No dealer revenue in this period.</p>
                ) : (
                    <div className="space-y-3">
                        {dealers.map((d, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-40 min-w-[120px] text-sm text-zinc-300 truncate">{d.firm_name}</div>
                                <div className="flex-1">
                                    <div className="w-full bg-[#222222] rounded-full h-6 overflow-hidden">
                                        <div className="h-full rounded-full flex items-center px-2 transition-all duration-500"
                                            style={{ width: `${Math.max((d.total_revenue / maxDealerRevenue) * 100, 5)}%`, background: "linear-gradient(90deg, #3b82f6, #2563eb)" }}>
                                            <span className="text-[10px] text-white font-medium whitespace-nowrap">{formatCurrency(d.total_revenue)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-16 text-right text-sm font-medium text-blue-400">{d.revenue_percentage}%</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Expense Add/Edit Modal */}
            {showExpenseModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
                            <h2 className="text-lg font-semibold text-white">{editingExpense ? "Edit Expense" : "Add Expense"}</h2>
                            <button onClick={() => { setShowExpenseModal(false); setEditingExpense(null); }} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs text-zinc-500 mb-1 block">Category *</label>
                                <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} className={inp}>
                                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 mb-1 block">Description</label>
                                <input type="text" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="e.g. Monthly rent" className={inp} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-zinc-500 mb-1 block">Amount (₹) *</label>
                                    <input type="number" required min="1" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} className={inp} />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 mb-1 block">Date *</label>
                                    <input type="date" required value={expenseForm.expense_date} onChange={e => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} className={inp} />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setShowExpenseModal(false); setEditingExpense(null); }} className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-white/5">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black font-semibold text-sm">{editingExpense ? "Update" : "Save"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Delete expense?</h3>
                        <p className="text-sm text-zinc-400 mb-6">{showDeleteConfirm.category}: {formatCurrency(showDeleteConfirm.amount)} on {(showDeleteConfirm.expense_date || "").slice(0, 10)}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-white/5">Cancel</button>
                            <button onClick={() => handleDeleteExpense(showDeleteConfirm.expense_id)} className="flex-1 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* Summary Card Component */
const SummaryCard = ({ label, value, color, icon: Icon, subtitle }) => {
    const colorMap = {
        blue: "border-blue-500/20 bg-blue-500/5",
        orange: "border-orange-500/20 bg-orange-500/5",
        red: "border-red-500/20 bg-red-500/5",
        green: "border-green-500/20 bg-green-500/5",
    };
    const textMap = { blue: "text-blue-400", orange: "text-orange-400", red: "text-red-400", green: "text-green-400" };

    return (
        <div className={`border rounded-2xl p-5 ${colorMap[color] || colorMap.blue}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
                <Icon className={`w-5 h-5 ${textMap[color]}`} />
            </div>
            <p className={`text-2xl font-bold ${textMap[color]}`}>{formatCurrency(value)}</p>
            {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
        </div>
    );
};

export default ProfitPage;
