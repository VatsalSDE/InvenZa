import React, { useState, useEffect } from "react";
import {
    Truck, CheckCircle, Package, ClipboardList, Search, Plus, MapPin, Phone, Mail,
    Edit, Archive, RotateCcw, X, Tag, Download
} from "lucide-react";
import { suppliersAPI, productsAPI, purchasesAPI, supplierPaymentsAPI, archiveAPI } from "../services/api";
import StatusBadge from "../components/ui/StatusBadge";
import StatsCard from "../components/ims/StatsCard";
import PageHeader from "../components/ims/PageHeader";
import OrbitalLoader from "../components/ui/OrbitalLoader";
import jsPDF from "jspdf";

const SuppliersPage = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [selectedSupplierPurchases, setSelectedSupplierPurchases] = useState([]);
    const [selectedSupplierPayments, setSelectedSupplierPayments] = useState([]);
    const [autoMappedModels, setAutoMappedModels] = useState({});
    const [showForm, setShowForm] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showArchived, setShowArchived] = useState(false);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDrawer, setShowDrawer] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [drawerTab, setDrawerTab] = useState("purchases");
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const dDate = new Date();
    const [ledgerFrom, setLedgerFrom] = useState(() => `2024-01-01`);
    const [ledgerTo, setLedgerTo] = useState(() => new Date().toLocaleDateString('en-CA'));

    const emptyForm = { firm_name: "", person_name: "", mobile: "", email: "", city: "", state: "", gstin: "", notes: "", product_ids: [] };
    const emptyPayForm = { paid_amount: "", method: "Bank Transfer", payment_date: new Date().toISOString().split("T")[0], reference_number: "", notes: "" };
    const [formData, setFormData] = useState(emptyForm);
    const [payFormData, setPayFormData] = useState(emptyPayForm);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [s, p, pu] = await Promise.all([
                suppliersAPI.getAll(),
                productsAPI.getAll(),
                purchasesAPI.getAll()
            ]);
            setSuppliers(s.data?.data || s.data || s || []);
            setProducts(p.data?.data || p.data || p || []);
            setPurchases(pu.data?.data || pu.data || pu || []);
            // Fetch all supplier models for the grid view
            const modelsPromises = (s.data?.data || s.data || s || []).map(sup => 
                suppliersAPI.getSupplierModels(sup.supplier_id).then(m => ({ id: sup.supplier_id, models: m.data || m || [] }))
            );
            const allModels = await Promise.all(modelsPromises);
            const modelsMap = {};
            allModels.forEach(m => { modelsMap[m.id] = m.models; });
            setAutoMappedModels(modelsMap);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingSupplier) await suppliersAPI.update(editingSupplier.supplier_id, formData);
        else await suppliersAPI.create(formData);
        setShowForm(false); setEditingSupplier(null); setFormData(emptyForm); loadData();
    };

    const openEdit = (s) => {
        setEditingSupplier(s);
        setFormData({ firm_name: s.firm_name || "", person_name: s.person_name || "", mobile: s.mobile || "", email: s.email || "", city: s.city || "", state: s.state || "", gstin: s.gstin || "", notes: s.notes || "", product_ids: s.product_ids || [] });
        setShowForm(true);
    };

    const handleArchive = async (id) => { await suppliersAPI.archive(id); setShowArchiveConfirm(null); loadData(); };
    const handleRestore = async (id) => { await suppliersAPI.restore(id); loadData(); };

    const toggleProductId = (pid) => {
        setFormData(prev => ({
            ...prev,
            product_ids: prev.product_ids.includes(pid) ? prev.product_ids.filter(id => id !== pid) : [...prev.product_ids, pid]
        }));
    };

    const getSupplierPurchases = (id) => purchases.filter(p => p.supplier_id === id);
    const calculateTotalPurchased = (id) => {
        return getSupplierPurchases(id).reduce((s, p) => s + (parseFloat(p.calculated_total || p.total_amount || p.total_cost) || 0), 0);
    };

    const formatCurrency = (a) => `₹${Number(a || 0).toLocaleString("en-IN")}`;

    const buildLedger = (id) => {
        const ledgerEntries = [];
        const supplierPurchases = selectedSupplierPurchases || [];
        const supplierPayments = selectedSupplierPayments || [];
        
        supplierPurchases.forEach(p => {
            const date = (p.purchase_date || p.created_at || "").slice(0, 10);
            if (date >= ledgerFrom && date <= ledgerTo) {
                ledgerEntries.push({ date, desc: `Purchase #${p.purchase_code}`, type: "CREDIT", credit: parseFloat(p.calculated_total || p.total_amount || p.total_cost || 0), debit: 0 });
            }
        });

        supplierPayments.forEach(p => {
            const date = (p.payment_date || "").slice(0, 10);
            if (date >= ledgerFrom && date <= ledgerTo) {
                ledgerEntries.push({ date, desc: `Payment - ${p.method}`, type: "DEBIT", credit: 0, debit: parseFloat(p.paid_amount || 0) });
            }
        });

        ledgerEntries.sort((a, b) => a.date.localeCompare(b.date));
        let bal = 0;
        ledgerEntries.forEach(e => { bal += e.credit - e.debit; e.runBal = bal; });
        return ledgerEntries;
    };

    const getSupplierPayments = (id) => selectedSupplierPayments;

    const entries = selectedSupplier ? buildLedger(selectedSupplier.supplier_id) : [];
    const totalPurchases = entries.reduce((s, e) => s + e.credit, 0);
    const totalPayments = entries.reduce((s, e) => s + e.debit, 0);

    const openDrawer = async (s) => {
        setSelectedSupplier(s);
        setDrawerTab("purchases");
        setShowDrawer(true);
        try {
            const [pRes, payRes] = await Promise.all([
                suppliersAPI.getSupplierLedger(s.supplier_id),
                supplierPaymentsAPI.getAll({ supplier_id: s.supplier_id })
            ]);
            setSelectedSupplierPurchases(pRes.data?.data || pRes.data || pRes || []);
            setSelectedSupplierPayments(payRes.data?.data || payRes.data || payRes || []);
        } catch (err) {
            console.error("Error loading supplier drawer data:", err);
            setSelectedSupplierPurchases(purchases.filter(p => p.supplier_id === s.supplier_id));
            setSelectedSupplierPayments([]);
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            await supplierPaymentsAPI.create({ ...payFormData, supplier_id: selectedSupplier.supplier_id });
            // Refresh payments for the drawer
            const payRes = await supplierPaymentsAPI.getAll({ supplier_id: selectedSupplier.supplier_id });
            setSelectedSupplierPayments(payRes.data?.data || payRes.data || payRes || []);
            setPayFormData(emptyPayForm);
            setShowPaymentForm(false);
            loadData();
        } catch (err) {
            console.error("Failed to record payment:", err);
            alert("Error: " + (err.response?.data?.message || err.message));
        }
    };

    const filtered = suppliers.filter(s => {
        const matchesSearch = (s.firm_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (s.person_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (s.city || "").toLowerCase().includes(searchTerm.toLowerCase());
        if (showArchived) return matchesSearch;
        return matchesSearch && s.status !== 'archived';
    });

    const activeSuppliers = suppliers.filter(s => s.status !== 'archived');
    const allProductIds = [...new Set(suppliers.flatMap(s => s.product_ids || []))];
    const totalPurchasedValue = activeSuppliers.reduce((s, sup) => s + calculateTotalPurchased(sup.supplier_id), 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F0F0F] p-6 flex items-center justify-center">
                <OrbitalLoader message="Loading suppliers..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F0F0F] p-6">
            <PageHeader
                title="Suppliers"
                subtitle="Manage your stock sources and the models they supply"
                icon={Truck}
                count={suppliers.length}
                action={
                    <button onClick={() => { setEditingSupplier(null); setFormData(emptyForm); setShowForm(true); }}
                        className="bg-green-500 hover:bg-green-600 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all duration-100 active:scale-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-black">
                        <Plus className="w-4 h-4" /> Add Supplier
                    </button>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatsCard title="Total Suppliers" value={suppliers.length} icon={Truck} accentColor="green" />
                <StatsCard title="Active Suppliers" value={activeSuppliers.length} icon={CheckCircle} accentColor="blue" />
                <StatsCard title="Product Models Covered" value={allProductIds.length} icon={Package} accentColor="purple" />
                <StatsCard title="Total Purchased" value={formatCurrency(totalPurchasedValue)} icon={ClipboardList} accentColor="orange" />
            </div>

            {/* Search + Archive Toggle */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                    <input type="text" placeholder="Search suppliers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 placeholder:text-zinc-600" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative">
                        <input type="checkbox" className="sr-only peer" checked={showArchived} onChange={() => setShowArchived(!showArchived)} />
                        <div className="w-9 h-5 bg-[#2A2A2A] peer-checked:bg-green-500 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 peer-checked:after:bg-black after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                    </div>
                    <span className="text-xs text-zinc-500">Show Archived</span>
                </label>
            </div>

            {/* Suppliers Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filtered.length === 0 ? (
                    <div className="col-span-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-12 text-center">
                        <Truck className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-zinc-400 mb-1">No suppliers found</h3>
                        <p className="text-sm text-zinc-600">Add your first supplier to get started</p>
                    </div>
                ) : (
                    filtered.map((supplier) => {
                        const isArchived = supplier.status === 'archived';
                        const supplierProducts = products.filter(p => (supplier.product_ids || []).includes(p.product_id));
                        return (
                            <div key={supplier.supplier_id}
                                className={`bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl border-l-4 border-l-green-500 overflow-hidden transition-all ${isArchived ? 'opacity-50' : 'hover:border-green-500/30'}`}>
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-base font-medium text-white">{supplier.firm_name}</h3>
                                            <p className="text-sm text-zinc-500">{supplier.person_name}</p>
                                        </div>
                                        <StatusBadge status={isArchived ? "Archived" : "Active"} />
                                    </div>

                                    <div className="flex flex-wrap gap-3 text-xs text-zinc-400 mb-3">
                                        {supplier.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {supplier.city}{supplier.state ? `, ${supplier.state}` : ''}</span>}
                                        {supplier.mobile && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {supplier.mobile}</span>}
                                        {supplier.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {supplier.email}</span>}
                                    </div>
                                    {supplier.gstin && <p className="text-xs text-zinc-600 mb-3">GST: <span className="text-zinc-400">{supplier.gstin}</span></p>}

                                    {/* Models Supplied */}
                                    <div className="bg-[#222222] rounded-xl p-3 mb-3 border border-[#2A2A2A]">
                                        <p className="text-xs text-zinc-500 mb-2">Supplies These Models</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(() => {
                                                const manualModels = products.filter(p => (supplier.product_ids || []).includes(p.product_id)).map(p => p.product_name);
                                                const autoModels = autoMappedModels[supplier.supplier_id] || [];
                                                const allModels = [...new Set([...manualModels, ...autoModels])];
                                                
                                                if (allModels.length === 0) return <span className="text-xs text-zinc-600">No models assigned</span>;
                                                
                                                return allModels.map(model => {
                                                    const isAuto = autoModels.includes(model) && !manualModels.includes(model);
                                                    return (
                                                        <div key={model} className="flex items-center gap-1">
                                                            <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-md px-2 py-0.5 text-xs">
                                                                {model}
                                                            </span>
                                                            {isAuto && <span className="text-[10px] text-zinc-500 italic ml-1">Auto-mapped from purchases</span>}
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                        <button onClick={() => openEdit(supplier)} className="mt-2 text-xs text-green-400 hover:text-green-300 transition-all duration-100 active:scale-95"> + Assign</button>
                                    </div>

                                    {/* Financials & Balances */}
                                    <div className="flex justify-between items-end mb-4 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-1">Total Purchased</p>
                                            <p className="text-base font-bold text-green-400">
                                                {formatCurrency(calculateTotalPurchased(supplier.supplier_id))}
                                            </p>
                                        </div>
                                        <button onClick={() => openDrawer(supplier)} className="text-xs flex items-center gap-1 text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-all duration-100 active:scale-95 active:brightness-90">
                                            <Archive className="w-3 h-3" /> Ledger
                                        </button>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(supplier)} className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 text-xs font-medium hover:bg-white/5 transition-all duration-100 active:scale-95 active:brightness-90">
                                            <Edit className="w-3 h-3 inline mr-1" /> Edit
                                        </button>
                                        {isArchived ? (
                                            <button onClick={() => handleRestore(supplier.supplier_id)} className="flex-1 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-all duration-100 active:scale-95 active:brightness-90">
                                                <RotateCcw className="w-3 h-3 inline mr-1" /> Restore
                                            </button>
                                        ) : (
                                            <button onClick={() => setShowArchiveConfirm(supplier)} className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all duration-100 active:scale-95 active:brightness-90">
                                                <Archive className="w-3 h-3 inline mr-1" /> Archive
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Archive Confirm */}
            {showArchiveConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Archive this supplier?</h3>
                        <p className="text-sm text-zinc-400 mb-6">This supplier will be hidden but all data linked to it remains safe.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowArchiveConfirm(null)} className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-white/5 transition-all duration-100 active:scale-95">Cancel</button>
                            <button onClick={() => handleArchive(showArchiveConfirm.supplier_id)} className="flex-1 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all duration-100 active:scale-95 active:brightness-90">Archive</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Right Drawer */}
            {showDrawer && selectedSupplier && (() => {
                const entries = buildLedger(selectedSupplier.supplier_id);
                const totalPurchased = calculateTotalPurchased(selectedSupplier.supplier_id);

                return (
                    <>
                        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowDrawer(false)} />
                        <div className="fixed top-0 right-0 h-full w-full max-w-[520px] bg-[#1A1A1A] border-l border-[#2A2A2A] z-50 overflow-y-auto animate-slide-in-right">
                            <div className="p-6 border-b border-[#2A2A2A]">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">{selectedSupplier.firm_name}</h2>
                                        <p className="text-sm text-zinc-500">{selectedSupplier.person_name}</p>
                                    </div>
                                    <button onClick={() => setShowDrawer(false)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="flex flex-wrap gap-3 text-xs text-zinc-400 mb-3">
                                    {selectedSupplier.mobile && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedSupplier.mobile}</span>}
                                    {selectedSupplier.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedSupplier.email}</span>}
                                </div>
                                <div className="mt-3 text-lg font-bold text-green-400">{formatCurrency(calculateTotalPurchased(selectedSupplier.supplier_id))} <span className="text-xs font-normal text-zinc-500">total purchased</span></div>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-[#2A2A2A]">
                                {["purchases", "payments", "ledger"].map(tab => (
                                    <button key={tab} onClick={() => setDrawerTab(tab)}
                                        className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${drawerTab === tab ? 'text-green-400 border-b-2 border-green-500' : 'text-zinc-500 hover:text-white'}`}>{tab}</button>
                                ))}
                            </div>

                            <div className="p-6">
                                {drawerTab === "purchases" && (
                                    <div className="space-y-2">
                                        {getSupplierPurchases(selectedSupplier.supplier_id).length === 0 ? <p className="text-zinc-600 text-sm text-center py-6">No purchases logged</p> : (
                                            getSupplierPurchases(selectedSupplier.supplier_id).map((p, i) => (
                                                <div key={i} className="bg-[#222222] border border-[#2A2A2A] rounded-xl p-3 flex justify-between items-center">
                                                    <div><p className="text-sm text-white font-medium">{p.purchase_code}</p><p className="text-xs text-zinc-500">{(p.purchase_date || p.created_at || "").split("T")[0]}</p></div>
                                                    <div className="text-right"><p className="text-sm font-medium text-orange-400">{formatCurrency(p.calculated_total || p.total_amount)}</p><StatusBadge status={p.status === 'received' ? 'Received' : 'Pending'} /></div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {drawerTab === "payments" && (
                                    <div className="space-y-4">
                                        <button onClick={() => setShowPaymentForm(!showPaymentForm)} className="w-full py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm font-medium transition-all duration-100 active:scale-95 active:brightness-90">
                                            {showPaymentForm ? 'Cancel Payment' : '+ Record Payment Made'}
                                        </button>

                                        {showPaymentForm && (
                                            <form onSubmit={handleRecordPayment} className="bg-[#222222] border border-[#2A2A2A] p-4 rounded-xl space-y-3">
                                                <div>
                                                    <label className="text-xs text-zinc-400 mb-1 block">Amount Paid (₹) *</label>
                                                    <input type="number" required value={payFormData.paid_amount} onChange={e => setPayFormData({ ...payFormData, paid_amount: e.target.value })} className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs text-zinc-400 mb-1 block">Method</label>
                                                        <select value={payFormData.method} onChange={e => setPayFormData({ ...payFormData, method: e.target.value })} className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50">
                                                            <option>Bank Transfer</option><option>UPI</option><option>Cheque</option><option>Cash</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-zinc-400 mb-1 block">Date</label>
                                                        <input type="date" value={payFormData.payment_date} onChange={e => setPayFormData({ ...payFormData, payment_date: e.target.value })} className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-zinc-400 mb-1 block">Reference # / UTR</label>
                                                    <input type="text" value={payFormData.reference_number} onChange={e => setPayFormData({ ...payFormData, reference_number: e.target.value })} className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50" />
                                                </div>
                                                <button type="submit" className="w-full py-2 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-lg text-sm mt-2 transition-all duration-100 active:scale-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-green-500">Save Payment</button>
                                            </form>
                                        )}

                                        <div className="space-y-2 mt-4">
                                            {getSupplierPayments(selectedSupplier.supplier_id).length === 0 ? <p className="text-zinc-600 text-sm text-center py-4">No payments recorded</p> : (
                                                getSupplierPayments(selectedSupplier.supplier_id).map((p, i) => (
                                                    <div key={i} className="bg-[#222222] border border-[#2A2A2A] rounded-xl p-3 flex justify-between items-center">
                                                        <div><p className="text-sm text-white font-medium">{formatCurrency(p.paid_amount)}</p><p className="text-xs text-zinc-500">{(p.payment_date || "").split("T")[0]}</p></div>
                                                        <div className="text-right"><StatusBadge status={p.method || "N/A"} /><p className="text-[10px] text-zinc-500 mt-1">{p.reference_number || ""}</p></div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {drawerTab === "ledger" && (
                                    <div>
                                        <div className="flex gap-2 mb-4 items-end">
                                            <div className="flex-1"><label className="text-xs text-zinc-500 mb-1 block">From</label><input type="date" value={ledgerFrom} onChange={e => setLedgerFrom(e.target.value)} className={"w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50"} /></div>
                                            <div className="flex-1"><label className="text-xs text-zinc-500 mb-1 block">To</label><input type="date" value={ledgerTo} onChange={e => setLedgerTo(e.target.value)} className={"w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50"} /></div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-center"><p className="text-lg font-bold text-orange-400">{formatCurrency(totalPurchases)}</p><p className="text-xs text-orange-400/60">Purchased</p></div>
                                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center"><p className="text-lg font-bold text-green-400">{formatCurrency(totalPayments)}</p><p className="text-xs text-green-400/60">Paid</p></div>
                                        </div>

                                        <div className="bg-[#222222] border border-[#2A2A2A] rounded-xl overflow-hidden mb-4">
                                            <table className="w-full">
                                                <thead><tr className="border-b border-[#2A2A2A]">
                                                    <th className="text-left py-2 px-3 text-[10px] text-zinc-500 uppercase">Date</th>
                                                    <th className="text-left py-2 px-3 text-[10px] text-zinc-500 uppercase">Description</th>
                                                    <th className="text-right py-2 px-3 text-[10px] text-zinc-500 uppercase">Debit</th>
                                                    <th className="text-right py-2 px-3 text-[10px] text-zinc-500 uppercase">Credit</th>
                                                    <th className="text-right py-2 px-3 text-[10px] text-zinc-500 uppercase">Bal</th>
                                                </tr></thead>
                                                <tbody>
                                                    {entries.length === 0 ? <tr><td colSpan="5" className="py-6 text-center text-zinc-600 text-xs">No transactions</td></tr> : (
                                                        entries.map((e, i) => (
                                                            <tr key={i} className="border-b border-[#1F1F1F]">
                                                                <td className="py-2 px-3 text-xs text-zinc-400">{e.date}</td>
                                                                <td className="py-2 px-3 text-xs text-zinc-300">{e.desc}</td>
                                                                <td className="py-2 px-3 text-xs text-right text-zinc-300">{e.debit > 0 ? formatCurrency(e.debit) : '—'}</td>
                                                                <td className="py-2 px-3 text-xs text-right text-zinc-300">{e.credit > 0 ? formatCurrency(e.credit) : '—'}</td>
                                                                <td className={`py-2 px-3 text-xs text-right font-medium ${e.runBal > 0 ? 'text-orange-400' : 'text-green-400'}`}>{formatCurrency(Math.abs(e.runBal))}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <button onClick={() => {
                                            const doc = new jsPDF();
                                            const pageWidth = doc.internal.pageSize.getWidth();

                                            // Header
                                            doc.setFontSize(18);
                                            doc.setFont(undefined, 'bold');
                                            doc.text(selectedSupplier.firm_name || 'Supplier Ledger', 14, 20);
                                            doc.setFontSize(10);
                                            doc.setFont(undefined, 'normal');
                                            doc.text(`Contact: ${selectedSupplier.person_name || ''}`, 14, 28);
                                            if (selectedSupplier.mobile) doc.text(`Mobile: ${selectedSupplier.mobile}`, 14, 34);
                                            if (selectedSupplier.gstin) doc.text(`GSTIN: ${selectedSupplier.gstin}`, 14, 40);
                                            if (selectedSupplier.city) doc.text(`Location: ${selectedSupplier.city}${selectedSupplier.state ? `, ${selectedSupplier.state}` : ''}`, 14, 46);

                                            doc.setFontSize(12);
                                            doc.setFont(undefined, 'bold');
                                            doc.text(`Ledger Statement: ${ledgerFrom} to ${ledgerTo}`, 14, 58);

                                            // Table header
                                            let y = 68;
                                            doc.setFontSize(9);
                                            doc.setFont(undefined, 'bold');
                                            doc.setFillColor(240, 240, 240);
                                            doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
                                            doc.text('Date', 16, y);
                                            doc.text('Description', 46, y);
                                            doc.text('Debit', 110, y);
                                            doc.text('Credit', 140, y);
                                            doc.text('Balance', 170, y);
                                            y += 8;

                                            // Table rows
                                            doc.setFont(undefined, 'normal');
                                            doc.setFontSize(8);
                                            entries.forEach((e) => {
                                                if (y > 270) {
                                                    doc.addPage();
                                                    y = 20;
                                                }
                                                doc.text(e.date || '', 16, y);
                                                doc.text(e.desc || '', 46, y);
                                                doc.text(e.debit > 0 ? `Rs ${e.debit.toLocaleString()}` : '-', 110, y);
                                                doc.text(e.credit > 0 ? `Rs ${e.credit.toLocaleString()}` : '-', 140, y);
                                                doc.text(`Rs ${Math.abs(e.runBal).toLocaleString()}`, 170, y);
                                                y += 6;
                                            });

                                            // Summary
                                            y += 8;
                                            if (y > 260) { doc.addPage(); y = 20; }
                                            doc.setFontSize(10);
                                            doc.setFont(undefined, 'bold');
                                            doc.text(`Total Purchases (Credit): Rs ${totalPurchases.toLocaleString()}`, 14, y);
                                            y += 7;
                                            doc.text(`Total Payments (Debit): Rs ${totalPayments.toLocaleString()}`, 14, y);
                                            y += 7;
                                            doc.text(`Outstanding Balance: Rs ${Math.abs(netBal).toLocaleString()}`, 14, y);

                                            doc.save(`Ledger_${selectedSupplier.firm_name}_${ledgerFrom}_to_${ledgerTo}.pdf`);
                                        }} className="w-full px-3 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-white/5 flex items-center justify-center gap-2 transition-all duration-100 active:scale-95 active:brightness-90">
                                            <Download className="w-4 h-4" /> Download PDF Ledger
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                );
            })()}

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
                            <h2 className="text-lg font-semibold text-white">{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
                            <button onClick={() => { setShowForm(false); setEditingSupplier(null); setFormData(emptyForm); }} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <input type="text" placeholder="Firm Name *" value={formData.firm_name} onChange={e => setFormData({ ...formData, firm_name: e.target.value })} className="w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 placeholder:text-zinc-600" required />
                            <input type="text" placeholder="Contact Person" value={formData.person_name} onChange={e => setFormData({ ...formData, person_name: e.target.value })} className="w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 placeholder:text-zinc-600" />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="tel" placeholder="Mobile" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} className="w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 placeholder:text-zinc-600" />
                                <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 placeholder:text-zinc-600" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="City" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 placeholder:text-zinc-600" />
                                <input type="text" placeholder="State" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} className="w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 placeholder:text-zinc-600" />
                            </div>
                            <input type="text" placeholder="GSTIN" value={formData.gstin} onChange={e => setFormData({ ...formData, gstin: e.target.value })} className="w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 placeholder:text-zinc-600" />
                            <textarea placeholder="Notes / Address" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows="2" className="w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 placeholder:text-zinc-600" />

                            {/* Product Selection */}
                            <div className="bg-[#222222] rounded-xl p-4 border border-[#2A2A2A]">
                                <p className="text-sm font-medium text-white mb-1">Which product models does this supplier provide?</p>
                                <p className="text-xs text-zinc-600 mb-3">You can assign models later too</p>
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                    {products.map(p => (
                                        <label key={p.product_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                                            <input type="checkbox" checked={formData.product_ids.includes(p.product_id)} onChange={() => toggleProductId(p.product_id)} className="w-3.5 h-3.5 rounded border-zinc-600 bg-[#1A1A1A] text-green-500 focus:ring-green-500/30" />
                                            <span className="text-sm text-zinc-300">{p.product_name} <span className="text-zinc-600">({p.category})</span></span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setShowForm(false); setEditingSupplier(null); setFormData(emptyForm); }} className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-white/5 transition-all duration-100 active:scale-95">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black font-semibold text-sm transition-all duration-100 active:scale-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-emerald-500">Save Supplier</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuppliersPage;
