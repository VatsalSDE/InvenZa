import React, { useState, useEffect } from "react";
import {
    PackageCheck, IndianRupee, Box, Clock, Plus, Search, X, Eye, Edit, Trash2, Filter
} from "lucide-react";
import { purchasesAPI, suppliersAPI, productsAPI } from "../services/api";
import StatusBadge from "../components/ui/StatusBadge";
import StatsCard from "../components/ims/StatsCard";
import PageHeader from "../components/ims/PageHeader";
import OrbitalLoader from "../components/ui/OrbitalLoader";
import ProductForm from "../components/products/ProductForm";

const PurchasesPage = () => {
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [showItems, setShowItems] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [searchTerm, setSearch] = useState("");
    const [supplierFilter, setSF] = useState("all");
    const [statusFilter, setStF] = useState("all");
    const [loading, setLoading] = useState(true);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickAddIndex, setQuickAddIndex] = useState(null);
    const [quickAddFormData, setQuickAddFormData] = useState({
        product_name: "", category: "steel", no_burners: "2", type_burner: "Brass",
        price: "", quantity: "0", min_stock_level: "10", image_url: "", image_public_id: ""
    });
    const [quickAddImageFile, setQuickAddImageFile] = useState(null);
    const [quickAddImagePreview, setQuickAddImagePreview] = useState("");
    const [quickAddUploading, setQuickAddUploading] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const emptyForm = { supplier_id: "", purchase_date: new Date().toISOString().split("T")[0], expected_delivery: "", reference: "", status: "received", items: [{ product_id: "", qty: "", cost_per_unit: "" }] };
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [p, s, pr] = await Promise.all([purchasesAPI.getAll(), suppliersAPI.getAll(), productsAPI.getAll()]);
            setPurchases(p.data?.data || p.data || p || []);
            setSuppliers(s.data?.data || s.data || s || []);
            setProducts(pr.data?.data || pr.data || pr || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const generateCode = () => {
        const d = new Date(); const yymmdd = `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
        const existing = purchases.filter(p => p.purchase_code?.includes(yymmdd)).length;
        return `PO-${yymmdd}-${String(existing + 1).padStart(3, "0")}`;
    };

    const addItemRow = () => setFormData({ ...formData, items: [...formData.items, { product_id: "", qty: "", cost_per_unit: "" }] });
    const removeItemRow = (i) => setFormData({ ...formData, items: formData.items.filter((_, idx) => idx !== i) });
    const updateItem = (i, field, val) => { 
        if (field === 'product_id' && val === 'CREATE_NEW') {
            setQuickAddIndex(i);
            setShowQuickAdd(true);
            return;
        }
        const items = [...formData.items]; 
        items[i][field] = val; 
        
        // If product is selected, auto-fill cost with product's selling price as a default
        if (field === 'product_id') {
            const prod = products.find(p => p.product_id === parseInt(val));
            if (prod) items[i].cost_per_unit = prod.price;
        }
        
        setFormData({ ...formData, items }); 
    };

    const handleQuickAddChange = (e) => { const { name, value } = e.target; setQuickAddFormData(prev => ({ ...prev, [name]: value })); };
    const handleQuickAddImage = (e) => {
        const file = e.target.files[0];
        if (file) { setQuickAddImageFile(file); const reader = new FileReader(); reader.onload = (e) => setQuickAddImagePreview(e.target.result); reader.readAsDataURL(file); }
    };

    const handleQuickAddSubmit = async (e) => {
        e.preventDefault();
        setQuickAddUploading(true);
        try {
            let imageUrl = quickAddFormData.image_url;
            if (quickAddImageFile) {
                const result = await productsAPI.uploadImage(quickAddImageFile);
                if (result && result.image) imageUrl = result.image.url;
            }

            const nameCode = quickAddFormData.product_name.split(" ").map((w) => w.substring(0, 3)).join("").toUpperCase();
            const productCode = `${nameCode}-${quickAddFormData.category.toUpperCase()}-${quickAddFormData.no_burners}-${quickAddFormData.type_burner.toUpperCase()}`;

            const res = await productsAPI.create({ 
                ...quickAddFormData, 
                product_code: productCode,
                price: parseFloat(quickAddFormData.price),
                quantity: parseInt(quickAddFormData.quantity),
                min_stock_level: parseInt(quickAddFormData.min_stock_level),
                image_url: imageUrl 
            });

            const newProduct = res.data?.data || res.data || res;
            
            // Refresh products list
            const updatedProducts = await productsAPI.getAll();
            const prods = updatedProducts.data?.data || updatedProducts.data || updatedProducts || [];
            setProducts(prods);

            // Select the newly created product in the row and sync quantity/price
            const items = [...formData.items];
            items[quickAddIndex].product_id = newProduct.product_id;
            items[quickAddIndex].qty = quickAddFormData.quantity; // Sync quantity from modal
            items[quickAddIndex].cost_per_unit = quickAddFormData.price; // Sync price from modal
            setFormData({ ...formData, items });

            setShowQuickAdd(false);
            setQuickAddFormData({ product_name: "", category: "steel", no_burners: "2", type_burner: "Brass", price: "", quantity: "0", min_stock_level: "10", image_url: "", image_public_id: "" });
            setQuickAddImageFile(null);
            setQuickAddImagePreview("");
        } catch (err) {
            console.error(err);
            alert("Failed to create product: " + err.message);
        } finally {
            setQuickAddUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = generateCode();
        const totalCost = formData.items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.cost_per_unit) || 0), 0);
        
        // Map frontend expected format to backend API format
        const itemsForBackend = formData.items.map(it => ({
            product_id: parseInt(it.product_id),
            qty: parseInt(it.qty),
            cost_per_unit: parseFloat(it.cost_per_unit)
        }));

        const payload = {
            supplier_id: parseInt(formData.supplier_id),
            status: formData.status === "received" ? "Received" : "Pending",
            notes: formData.reference,
            purchase_date: formData.purchase_date,
            total_cost: totalCost,
            items_count: formData.items.length,
            items: itemsForBackend
        };

        await purchasesAPI.create(payload);
        setShowForm(false); setFormData(emptyForm); loadData();
    };

    const handleDelete = async (id) => {
        await purchasesAPI.delete(id);
        setShowDeleteConfirm(null);
        loadData();
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await purchasesAPI.updateStatus(id, newStatus);
            loadData();
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const formatCurrency = (a) => `₹${Number(a || 0).toLocaleString("en-IN")}`;

    const filtered = purchases.filter(p => {
        if (supplierFilter !== "all" && p.supplier_id !== supplierFilter) return false;
        if (statusFilter !== "all" && (p.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
        if (searchTerm && !(p.purchase_code || "").toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const thisMonth = purchases.filter(p => { const d = new Date(p.purchase_date); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); });
    const totalSpentMonth = thisMonth.reduce((s, p) => s + (parseFloat(p.total_cost) || 0), 0);
    const unitsThisMonth = thisMonth.reduce((s, p) => s + (p.items || []).reduce((q, it) => q + (parseInt(it.qty) || 0), 0), 0);

    if (loading) return <div className="min-h-screen bg-[#0F0F0F] p-6 flex items-center justify-center"><OrbitalLoader message="Loading purchases..." /></div>;

    return (
        <div className="min-h-screen bg-[#0F0F0F] p-6">
            <PageHeader title="Purchase Orders" subtitle="Log incoming stock from suppliers" icon={PackageCheck} count={purchases.length}
                action={<button onClick={() => { setFormData(emptyForm); setShowForm(true); }} className="bg-green-500 hover:bg-green-600 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all duration-100 active:scale-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-black"><Plus className="w-4 h-4" /> Log New Purchase</button>}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatsCard title="Total Purchases" value={purchases.length} icon={PackageCheck} accentColor="green" />
                <StatsCard title="Spent This Month" value={formatCurrency(totalSpentMonth)} icon={IndianRupee} accentColor="blue" />
                <StatsCard title="Units Received" value={unitsThisMonth} icon={Box} accentColor="purple" />
                <StatsCard title="Pending Deliveries" value={purchases.filter(p => (p.status || '').toLowerCase() === "pending").length} icon={Clock} accentColor="orange" />
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-3 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                    <input type="text" placeholder="Search by PO code..." value={searchTerm} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 placeholder:text-zinc-600" />
                </div>
                <select value={supplierFilter} onChange={e => setSF(e.target.value)} className="px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50">
                    <option value="all">All Suppliers</option>
                    {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.firm_name}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStF(e.target.value)} className="px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50">
                    <option value="all">All Status</option>
                    <option value="received">Received</option>
                    <option value="pending">Pending</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#2A2A2A]">
                                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">PO Code</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Supplier</th>
                                <th className="text-center py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Items</th>
                                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Cost</th>
                                <th className="text-center py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan="7" className="py-12 text-center text-zinc-600 text-sm">No purchase orders found</td></tr>
                            ) : (
                                filtered.map(p => {
                                    const supplier = suppliers.find(s => s.supplier_id === p.supplier_id);
                                    return (
                                        <tr key={p.purchase_id} className="border-b border-[#1F1F1F] hover:bg-white/[0.02]">
                                            <td className="py-3 px-4 text-sm font-medium text-white">{p.purchase_code}</td>
                                            <td className="py-3 px-4 text-sm text-zinc-300">{p.purchase_date}</td>
                                            <td className="py-3 px-4 text-sm text-zinc-300">{supplier?.firm_name || 'N/A'}</td>
                                            <td className="py-3 px-4 text-sm text-zinc-300 text-center">{p.items_count || (p.items || []).length}</td>
                                            <td className="py-3 px-4 text-sm text-green-400 font-medium text-right">{formatCurrency(p.total_cost)}</td>
                                            <td className="py-3 px-4 text-center"><StatusBadge status={p.status?.toLowerCase() === 'received' ? 'Received' : 'Pending'} /></td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {p.status?.toLowerCase() !== 'received' && (
                                                        <button onClick={() => handleUpdateStatus(p.purchase_id, 'Received')} title="Mark as Received" className="p-1.5 rounded-lg text-zinc-400 hover:text-green-400 hover:bg-green-500/10 transition-all duration-100 active:scale-95 active:brightness-90"><PackageCheck className="w-4 h-4" /></button>
                                                    )}
                                                    <button onClick={() => setShowItems(p)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-100 active:scale-95 active:brightness-90"><Eye className="w-4 h-4" /></button>
                                                    <button onClick={() => setShowDeleteConfirm(p)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-100 active:scale-95 active:brightness-90"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Items Modal */}
            {showItems && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">{showItems.purchase_code} — Items</h3>
                            <button onClick={() => setShowItems(null)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"><X className="w-5 h-5" /></button>
                        </div>
                        {(showItems.items || []).length === 0 ? <p className="text-zinc-500 text-sm">No items recorded</p> : (
                            <div className="space-y-2">
                                {showItems.items.map((it, i) => {
                                    const prod = products.find(p => p.product_id === it.product_id);
                                    return (
                                        <div key={i} className="bg-[#222222] border border-[#2A2A2A] rounded-xl p-3 flex justify-between">
                                            <span className="text-sm text-zinc-300">{prod?.product_name || 'Unknown'} × {it.qty}</span>
                                            <span className="text-sm text-green-400 font-medium">{formatCurrency((parseFloat(it.qty) || 0) * (parseFloat(it.cost_per_unit) || 0))}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <p className="text-right mt-4 text-lg font-bold text-white">Total: {formatCurrency(showItems.total_cost)}</p>
                    </div>
                </div>
            )}

            {/* Log Purchase Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Log New Purchase</h2>
                                <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-md px-2 py-0.5 text-xs mt-1 inline-block">{generateCode()}</span>
                            </div>
                            <button onClick={() => { setShowForm(false); setFormData(emptyForm); }} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <select value={formData.supplier_id} onChange={e => setFormData({ ...formData, supplier_id: e.target.value })} className="w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 placeholder:text-zinc-600" required>
                                <option value="">Select Supplier *</option>
                                {suppliers.filter(s => s.status !== 'archived').map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.firm_name}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-zinc-500 mb-1 block">Purchase Date</label>
                                    <input type="date" value={formData.purchase_date} onChange={e => setFormData({ ...formData, purchase_date: e.target.value })} className="w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50" />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 mb-1 block">Expected Delivery</label>
                                    <input type="date" value={formData.expected_delivery} onChange={e => setFormData({ ...formData, expected_delivery: e.target.value })} className="w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50" />
                                </div>
                            </div>
                            <input type="text" placeholder="Invoice / Reference Number" value={formData.reference} onChange={e => setFormData({ ...formData, reference: e.target.value })} className="w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 placeholder:text-zinc-600" />
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-zinc-400">Status:</span>
                                <button type="button" onClick={() => setFormData({ ...formData, status: 'received' })} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${formData.status === 'received' ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>Received</button>
                                <button type="button" onClick={() => setFormData({ ...formData, status: 'pending' })} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${formData.status === 'pending' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>Pending</button>
                            </div>

                            {/* Items */}
                            <div className="border-t border-[#2A2A2A] pt-4">
                                <h3 className="text-sm font-medium text-white mb-3">Products Received</h3>
                                <div className="space-y-3">
                                    {formData.items.map((item, i) => (
                                        <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-[#222222] border border-[#2A2A2A] rounded-xl items-end relative sm:static">
                                            <div className="sm:col-span-4">
                                                <label className="text-[10px] text-zinc-600 mb-0.5 block sm:hidden">Product</label>
                                                <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)} className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50">
                                                    <option value="">Product</option>
                                                    <optgroup label="Actions">
                                                        <option value="CREATE_NEW" className="text-green-400 font-bold">+ Create New Product</option>
                                                    </optgroup>
                                                    <optgroup label="Existing Products">
                                                        {products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
                                                    </optgroup>
                                                </select>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] text-zinc-600 mb-0.5 block sm:hidden">Qty</label>
                                                <input type="number" placeholder="Qty" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 placeholder:text-zinc-600" />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] text-zinc-600 mb-0.5 block sm:hidden">₹/Unit</label>
                                                <input type="number" placeholder="₹/unit" value={item.cost_per_unit} onChange={e => updateItem(i, 'cost_per_unit', e.target.value)} className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 placeholder:text-zinc-600" />
                                            </div>
                                            <div className="sm:col-span-3 text-right pr-2 pb-2 sm:pb-0">
                                                <label className="text-[10px] text-zinc-600 mb-0.5 block sm:hidden">Subtotal</label>
                                                <span className="text-sm text-green-400 font-medium">{formatCurrency((parseFloat(item.qty) || 0) * (parseFloat(item.cost_per_unit) || 0))}</span>
                                            </div>
                                            <div className="sm:col-span-1 flex justify-end">
                                                {formData.items.length > 1 && (
                                                    <button type="button" onClick={() => removeItemRow(i)} className="p-2 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={addItemRow} className="text-sm text-green-400 hover:text-green-300 mt-4 flex items-center gap-1 font-medium">
                                    <Plus className="w-4 h-4" /> Add Another Product
                                </button>
                            </div>

                            <div className="bg-[#222222] border border-[#2A2A2A] rounded-xl p-4 flex justify-between items-center">
                                <span className="text-sm text-zinc-400">Total Purchase Cost</span>
                                <span className="text-xl font-bold text-green-400">{formatCurrency(formData.items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.cost_per_unit) || 0), 0))}</span>
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setShowForm(false); setFormData(emptyForm); }} className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-white/5 transition-all duration-100 active:scale-95">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black font-semibold text-sm transition-all duration-100 active:scale-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-emerald-500">Save Purchase</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Delete Purchase Order?</h3>
                        <p className="text-sm text-zinc-400 mb-6">
                            This will permanently delete the purchase record <span className="text-white font-medium">{showDeleteConfirm.purchase_code}</span> and its associated items. Product stock levels will NOT be automatically reverted. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 rounded-lg border border-[#2A2A2A] text-white text-sm font-medium hover:bg-white/5">Cancel</button>
                            <button onClick={() => handleDelete(showDeleteConfirm.purchase_id)} className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">Delete Permanently</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Add Product Modal */}
            {showQuickAdd && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Quick Add Product</h2>
                                <p className="text-xs text-zinc-500">Create a new product model to include in this purchase</p>
                            </div>
                            <button onClick={() => setShowQuickAdd(false)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="bg-[#1A1A1A]">
                            <ProductForm 
                                formData={quickAddFormData} 
                                formErrors={formErrors} 
                                imageFile={quickAddImageFile} 
                                imagePreview={quickAddImagePreview} 
                                uploading={quickAddUploading}
                                onInputChange={handleQuickAddChange} 
                                onImageChange={handleQuickAddImage} 
                                onImageUpload={() => {}} // Not strictly needed if handled in submit, but ProductForm uses it
                                onCancel={() => setShowQuickAdd(false)} 
                                onSubmit={handleQuickAddSubmit} 
                                submitLabel="Create & Select" 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchasesPage;