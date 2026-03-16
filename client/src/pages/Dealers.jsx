import React, { useState, useEffect } from "react";
import {
  X, Plus, Search, Edit, Users, TrendingUp, CreditCard, ShoppingCart, Phone, Mail, MapPin,
  Archive, RotateCcw, Download, Share2, Eye, Calendar, Trash2
} from "lucide-react";
import { dealersAPI, ordersAPI, paymentsAPI, archiveAPI, aiAPI } from "../services/api";
import PageHeader from "../components/ims/PageHeader";
import OrbitalLoader from "../components/ui/OrbitalLoader";
import StatsCard from "../components/ims/StatsCard";
import StatusBadge from "../components/ui/StatusBadge";
import DealerTopProducts from "../components/ims/DealerTopProducts";
import jsPDF from "jspdf";

const Dealers = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dealers, setDealers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentScores, setPaymentScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [riskScores, setRiskScores] = useState(null);
  const [riskLoading, setRiskLoading] = useState(true);
  const [editingDealer, setEditingDealer] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [drawerTab, setDrawerTab] = useState("orders");
  const [showArchived, setShowArchived] = useState(false);
  const [archivedIds, setArchivedIds] = useState([]);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({ firm_name: "", person_name: "", address: "", mobile_number: "", email: "", gstin: "" });

  const [ledgerFrom, setLedgerFrom] = useState(() => `2024-01-01`);
  const [ledgerTo, setLedgerTo] = useState(() => new Date().toLocaleDateString('en-CA'));

  useEffect(() => { 
    loadDealers(); 
    loadRiskScores();
  }, []);

  const loadRiskScores = async () => {
    // Safety timeout to hide skeleton after 5s
    const timer = setTimeout(() => setRiskLoading(false), 5000);
    try {
      setRiskLoading(true);
      const res = await aiAPI.getDealerRiskScores();
      if (res && res.success && res.data) {
        const riskMap = {};
        res.data.forEach(item => riskMap[item.dealer_id] = item);
        setRiskScores(riskMap);
      }
    } catch (err) {
      console.error("Failed to load dealer risk scores:", err);
    } finally {
      setRiskLoading(false);
      clearTimeout(timer);
    }
  };

  const loadDealers = async () => {
    try {
      setLoading(true);
      const [d, o, p, scores] = await Promise.all([dealersAPI.getAll(), ordersAPI.getAll(), paymentsAPI.getAll(), dealersAPI.getPaymentScores()]);
      setDealers(d.data?.data || d.data || d || []);
      setOrders(o.data?.data || o.data || o || []);
      setPayments(p.data?.data || p.data || p || []);

      const scoresMap = {};
      (scores || []).forEach(s => scoresMap[s.dealer_id] = s);
      setPaymentScores(scoresMap);

      setArchivedIds(archiveAPI.getArchivedDealers());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const generateDealerCode = (firmName) => {
    const prefix = firmName.split(" ").map(w => w.substring(0, 3)).join("").toUpperCase();
    const existing = dealers.filter(d => d.dealer_code?.startsWith(prefix)).map(d => d.dealer_code);
    let seq = 1;
    while (existing.includes(`${prefix}-${String(seq).padStart(3, "0")}`)) seq++;
    return `${prefix}-${String(seq).padStart(3, "0")}`;
  };

  const resetForm = () => setFormData({ firm_name: "", person_name: "", address: "", mobile_number: "", email: "", gstin: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dealersAPI.create({ ...formData, dealer_code: generateDealerCode(formData.firm_name) });
    await loadDealers(); resetForm(); setShowAddForm(false);
  };

  const handleEdit = (d) => {
    setEditingDealer(d);
    setFormData({ firm_name: d.firm_name || "", person_name: d.person_name || "", address: d.address || "", mobile_number: d.mobile_number || "", email: d.email || "", gstin: d.gstin || "" });
    setShowEditForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await dealersAPI.update(editingDealer.dealer_id, formData);
    await loadDealers(); resetForm(); setShowEditForm(false); setEditingDealer(null);
  };

  const handleArchive = async (id) => { await archiveAPI.archiveDealer(id); setShowArchiveConfirm(null); setArchivedIds(archiveAPI.getArchivedDealers()); };
  const handleRestore = async (id) => { await archiveAPI.restoreDealer(id); setArchivedIds(archiveAPI.getArchivedDealers()); };
  const handleDelete = async (id) => { await dealersAPI.delete(id); setShowDeleteConfirm(null); await loadDealers(); };

  const openDrawer = (d) => { setSelectedDealer(d); setDrawerTab("orders"); setShowDrawer(true); };

  const getDealerOrders = (id) => orders.filter(o => o.dealer_id === id);
  const getDealerPayments = (id) => payments.filter(p => p.dealer_id === id);

  const calculateBalance = (id) => {
    const to = getDealerOrders(id).reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);
    const tp = getDealerPayments(id)
      .filter(p => ['Completed', 'success', 'paid'].includes(p.payment_status))
      .reduce((s, p) => s + (parseFloat(p.paid_amount) || 0), 0);
    return { totalOrders: to, totalPayments: tp, remaining: to - tp };
  };

  const formatCurrency = (a) => `₹${Number(a || 0).toLocaleString("en-IN")}`;

  const buildLedger = (id) => {
    const entries = [];
    getDealerOrders(id).forEach(o => {
      const date = (o.created_at || "").slice(0, 10);
      if (date >= ledgerFrom && date <= ledgerTo) entries.push({ date, desc: `Order #${o.order_code}`, type: "DEBIT", debit: parseFloat(o.total_amount) || 0, credit: 0 });
    });
    getDealerPayments(id).filter(p => ['Completed', 'success', 'paid', 'Completed '].includes(p.payment_status)).forEach(p => {
      const date = (p.payment_date || "").slice(0, 10);
      if (date >= ledgerFrom && date <= ledgerTo) entries.push({ date, desc: `Payment - ${p.payment_method || p.method || 'N/A'}`, type: "CREDIT", debit: 0, credit: parseFloat(p.paid_amount) || 0 });
    });
    entries.sort((a, b) => a.date.localeCompare(b.date));
    let bal = 0;
    entries.forEach(e => { bal += e.debit - e.credit; e.runBal = bal; });
    return entries;
  };

  const filtered = dealers.filter(d => {
    const match = (d.firm_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (d.person_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const isA = archivedIds.includes(d.dealer_id);
    if (!showArchived && isA) return false;
    return match;
  });

  const totalOutstanding = dealers.reduce((s, d) => s + Math.max(0, calculateBalance(d.dealer_id).remaining), 0);
  const inp = "w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 placeholder:text-zinc-600";

  if (loading) return <div className="min-h-screen bg-[#0F0F0F] p-6 flex items-center justify-center"><OrbitalLoader message="Loading dealers..." /></div>;

  return (
    <div className="min-h-screen bg-[#0F0F0F] p-6">
      <PageHeader title="Dealers" subtitle="Manage your wholesale buyers" icon={Users} count={dealers.length}
        action={<button onClick={() => { resetForm(); setShowAddForm(true); }} className="bg-green-500 hover:bg-green-600 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all duration-100 active:scale-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black"><Plus className="w-4 h-4" /> Add Dealer</button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Dealers" value={dealers.length} icon={Users} accentColor="blue" />
        <StatsCard title="Active Dealers" value={dealers.filter(d => !archivedIds.includes(d.dealer_id)).length} icon={TrendingUp} accentColor="green" />
        <StatsCard title="Outstanding Balance" value={formatCurrency(totalOutstanding)} icon={CreditCard} accentColor="red" />
        <StatsCard title="Total Orders" value={orders.length} icon={ShoppingCart} accentColor="purple" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
          <input type="text" placeholder="Search dealers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`${inp} pl-10`} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <div className="relative"><input type="checkbox" className="sr-only peer" checked={showArchived} onChange={() => setShowArchived(!showArchived)} />
            <div className="w-9 h-5 bg-[#2A2A2A] peer-checked:bg-green-500 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 peer-checked:after:bg-black after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
          </div>
          <span className="text-xs text-zinc-500">Show Archived</span>
        </label>
      </div>

      {/* Dealers Table */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2A2A2A]">
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Dealer</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">GSTIN</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Mobile</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Risk Level</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Payment Score</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Outstanding</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="5" className="py-12 text-center text-zinc-600 text-sm">No dealers found</td></tr>
            ) : (
              filtered.map(d => {
                const bal = calculateBalance(d.dealer_id);
                const isA = archivedIds.includes(d.dealer_id);
                return (
                  <tr key={d.dealer_id} className={`border-b border-[#1F1F1F] hover:bg-white/[0.02] ${isA ? 'opacity-50' : ''}`}>
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-white">{d.firm_name}</p>
                      <p className="text-xs text-zinc-500">{d.person_name}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-zinc-400 hidden lg:table-cell">{d.gstin || '—'}</td>
                    <td className="py-3 px-4 text-sm text-zinc-400 hidden md:table-cell">{d.mobile_number}</td>
                    <td className="py-3 px-4 text-center">
                      {riskLoading ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-500 animate-pulse border border-zinc-700">Loading...</span>
                      ) : riskScores && riskScores[d.dealer_id] ? (
                        <span 
                          title={riskScores[d.dealer_id].reason}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold border cursor-help shadow-sm transition-all hover:scale-105 ${
                            riskScores[d.dealer_id].risk_level === 'Low Risk' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            riskScores[d.dealer_id].risk_level === 'Medium Risk' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {riskScores[d.dealer_id].risk_level}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-600">Unknown</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {paymentScores[d.dealer_id] && paymentScores[d.dealer_id].score !== null ? (
                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium border ${paymentScores[d.dealer_id].score >= 85 ? 'bg-green-500/15 text-green-400 border-green-500/20' :
                          paymentScores[d.dealer_id].score >= 50 ? 'bg-yellow-500/15 text-yellow-500 border-yellow-500/20' :
                            'bg-red-500/15 text-red-400 border-red-500/20'
                          }`}>
                          {paymentScores[d.dealer_id].score} — {paymentScores[d.dealer_id].score_label}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">Unrated</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-medium ${bal.remaining > 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(Math.abs(bal.remaining))}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDrawer(d)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-100 active:scale-95 active:brightness-90"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleEdit(d)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-100 active:scale-95 active:brightness-90"><Edit className="w-4 h-4" /></button>
                        {isA ? (
                          <button onClick={() => handleRestore(d.dealer_id)} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-all duration-100 active:scale-95 active:brightness-90"><RotateCcw className="w-4 h-4" /></button>
                        ) : (
                          <button onClick={() => setShowArchiveConfirm(d)} className="p-1.5 rounded-lg text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10 transition-all duration-100 active:scale-95 active:brightness-90"><Archive className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => setShowDeleteConfirm(d)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-100 active:scale-95 active:brightness-90"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Right Drawer */}
      {showDrawer && selectedDealer && (() => {
        const bal = calculateBalance(selectedDealer.dealer_id);
        const entries = buildLedger(selectedDealer.dealer_id);
        const totalDebits = entries.reduce((s, e) => s + e.debit, 0);
        const totalCredits = entries.reduce((s, e) => s + e.credit, 0);
        const netBal = totalDebits - totalCredits;
        const whatsNum = (selectedDealer.mobile_number || '').replace(/[\s\-()]/g, '').replace(/^0+/, '');
        const whatsPhone = whatsNum.startsWith('91') ? whatsNum : `91${whatsNum}`;
        const whatsMsg = encodeURIComponent(`Ledger: ${selectedDealer.firm_name}\n${ledgerFrom} to ${ledgerTo}\nBilled: ${formatCurrency(totalDebits)}\nPaid: ${formatCurrency(totalCredits)}\nBalance: ${formatCurrency(netBal)}`);

        const handleDownloadPDF = () => {
          const doc = new jsPDF();
          const pageWidth = doc.internal.pageSize.getWidth();

          // Header
          doc.setFontSize(18);
          doc.setFont(undefined, 'bold');
          doc.text(selectedDealer.firm_name || 'Dealer Ledger', 14, 20);
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
          doc.text(`Contact: ${selectedDealer.person_name || ''}`, 14, 28);
          if (selectedDealer.mobile_number) doc.text(`Mobile: ${selectedDealer.mobile_number}`, 14, 34);
          if (selectedDealer.gstin) doc.text(`GSTIN: ${selectedDealer.gstin}`, 14, 40);
          if (selectedDealer.address) doc.text(`Address: ${selectedDealer.address}`, 14, 46);

          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text(`Ledger: ${ledgerFrom} to ${ledgerTo}`, 14, 58);

          // Table header
          let y = 68;
          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.setFillColor(240, 240, 240);
          doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
          doc.text('Date', 16, y);
          doc.text('Description', 46, y);
          doc.text('Type', 110, y);
          doc.text('Amount', 135, y);
          doc.text('Balance', 165, y);
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
            doc.text(e.type, 110, y);
            const amount = e.debit > 0 ? e.debit : e.credit;
            doc.text(`Rs ${Number(amount).toLocaleString('en-IN')}`, 135, y);
            doc.text(`Rs ${Number(Math.abs(e.runBal)).toLocaleString('en-IN')}`, 165, y);
            y += 6;
          });

          // Summary
          y += 8;
          if (y > 260) { doc.addPage(); y = 20; }
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.text(`Total Billed: Rs ${Number(totalDebits).toLocaleString('en-IN')}`, 14, y);
          y += 7;
          doc.text(`Total Paid: Rs ${Number(totalCredits).toLocaleString('en-IN')}`, 14, y);
          y += 7;
          doc.text(`Outstanding: Rs ${Number(Math.abs(netBal)).toLocaleString('en-IN')}`, 14, y);

          doc.save(`Ledger_${selectedDealer.firm_name}_${ledgerFrom}_to_${ledgerTo}.pdf`);
        };

        return (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowDrawer(false)} />
            <div className="fixed top-0 right-0 h-full w-full max-w-[520px] bg-[#1A1A1A] border-l border-[#2A2A2A] z-50 overflow-y-auto animate-slide-in-right">
              <div className="p-6 border-b border-[#2A2A2A]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{selectedDealer.firm_name}</h2>
                    <p className="text-sm text-zinc-500">{selectedDealer.person_name}</p>
                  </div>
                  <button onClick={() => setShowDrawer(false)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-100 active:scale-95"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-zinc-400 mb-3">
                  {selectedDealer.mobile_number && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedDealer.mobile_number}</span>}
                  {selectedDealer.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedDealer.email}</span>}
                  {selectedDealer.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedDealer.address}</span>}
                </div>
                {selectedDealer.gstin && <p className="text-xs text-zinc-600">GST: <span className="text-zinc-400">{selectedDealer.gstin}</span></p>}
                <div className={`mt-3 text-lg font-bold ${bal.remaining > 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(Math.abs(bal.remaining))} <span className="text-xs font-normal text-zinc-500">outstanding</span></div>

                {/* Dealer Product Intelligence (Step 3) */}
                <DealerTopProducts dealerId={selectedDealer.dealer_id} />
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#2A2A2A]">
                {["orders", "payments", "ledger"].map(tab => (
                  <button key={tab} onClick={() => setDrawerTab(tab)}
                    className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${drawerTab === tab ? 'text-green-400 border-b-2 border-green-500' : 'text-zinc-500 hover:text-white'}`}>{tab}</button>
                ))}
              </div>

              <div className="p-6">
                {drawerTab === "orders" && (
                  <div className="space-y-2">
                    {getDealerOrders(selectedDealer.dealer_id).length === 0 ? <p className="text-zinc-600 text-sm text-center py-6">No orders</p> : (
                      getDealerOrders(selectedDealer.dealer_id).map((o, i) => (
                        <div key={i} className="bg-[#222222] border border-[#2A2A2A] rounded-xl p-3 flex justify-between items-center">
                          <div><p className="text-sm text-white font-medium">{o.order_code}</p><p className="text-xs text-zinc-500">{(o.created_at || "").split("T")[0]}</p></div>
                          <div className="text-right"><p className="text-sm font-medium text-green-400">{formatCurrency(o.total_amount)}</p></div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {drawerTab === "payments" && (
                  <div className="space-y-2">
                    {getDealerPayments(selectedDealer.dealer_id).length === 0 ? <p className="text-zinc-600 text-sm text-center py-6">No payments</p> : (
                      getDealerPayments(selectedDealer.dealer_id).map((p, i) => (
                        <div key={i} className="bg-[#222222] border border-[#2A2A2A] rounded-xl p-3 flex justify-between items-center">
                          <div><p className="text-sm text-white font-medium">{formatCurrency(p.paid_amount)}</p><p className="text-xs text-zinc-500">{p.payment_date}</p></div>
                          <div className="text-right text-xs text-zinc-500">{p.payment_method || p.method || "N/A"}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {drawerTab === "ledger" && (
                  <div>
                    <div className="flex gap-2 mb-4 items-end">
                      <div className="flex-1"><label className="text-xs text-zinc-500 mb-1 block">From</label><input type="date" value={ledgerFrom} onChange={e => setLedgerFrom(e.target.value)} className={inp} /></div>
                      <div className="flex-1"><label className="text-xs text-zinc-500 mb-1 block">To</label><input type="date" value={ledgerTo} onChange={e => setLedgerTo(e.target.value)} className={inp} /></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center"><p className="text-lg font-bold text-red-400">{formatCurrency(totalDebits)}</p><p className="text-xs text-red-400/60">Billed</p></div>
                      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center"><p className="text-lg font-bold text-green-400">{formatCurrency(totalCredits)}</p><p className="text-xs text-green-400/60">Paid</p></div>
                    </div>

                    <div className="bg-[#222222] border border-[#2A2A2A] rounded-xl overflow-hidden mb-4">
                      <table className="w-full">
                        <thead><tr className="border-b border-[#2A2A2A]">
                          <th className="text-left py-2 px-3 text-[10px] text-zinc-500 uppercase">Date</th>
                          <th className="text-left py-2 px-3 text-[10px] text-zinc-500 uppercase">Description</th>
                          <th className="text-center py-2 px-3 text-[10px] text-zinc-500 uppercase">Type</th>
                          <th className="text-right py-2 px-3 text-[10px] text-zinc-500 uppercase">Amount</th>
                          <th className="text-right py-2 px-3 text-[10px] text-zinc-500 uppercase">Balance</th>
                        </tr></thead>
                        <tbody>
                          {entries.length === 0 ? <tr><td colSpan="5" className="py-6 text-center text-zinc-600 text-xs">No transactions</td></tr> : (
                            entries.map((e, i) => (
                              <tr key={i} className="border-b border-[#1F1F1F]">
                                <td className="py-2 px-3 text-xs text-zinc-400">{e.date}</td>
                                <td className="py-2 px-3 text-xs text-zinc-300">{e.desc}</td>
                                <td className="py-2 px-3 text-center"><StatusBadge status={e.type} /></td>
                                <td className="py-2 px-3 text-xs text-right text-zinc-300">{e.debit > 0 ? formatCurrency(e.debit) : formatCurrency(e.credit)}</td>
                                <td className={`py-2 px-3 text-xs text-right font-medium ${e.runBal > 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(Math.abs(e.runBal))}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={handleDownloadPDF} className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-xs font-medium hover:bg-white/5 flex items-center justify-center gap-1 transition-all duration-100 active:scale-95 active:brightness-90"><Download className="w-3 h-3" /> Download PDF</button>
                      <a href={`https://wa.me/${whatsPhone}?text=${whatsMsg}`} target="_blank" rel="noopener noreferrer" className="flex-1 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black text-xs font-semibold flex items-center justify-center gap-1 transition-all duration-100 active:scale-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-green-500"><Share2 className="w-3 h-3" /> WhatsApp</a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* Archive Confirm */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Archive dealer?</h3>
            <p className="text-sm text-zinc-400 mb-6">Hidden from list but all orders and bills remain safe.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowArchiveConfirm(null)} className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-white/5">Cancel</button>
              <button onClick={() => handleArchive(showArchiveConfirm.dealer_id)} className="flex-1 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20">Archive</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Dealer Modal */}
      {(showAddForm || (showEditForm && editingDealer)) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
              <h2 className="text-lg font-semibold text-white">{editingDealer ? 'Edit Dealer' : 'Add New Dealer'}</h2>
              <button onClick={() => { setShowAddForm(false); setShowEditForm(false); setEditingDealer(null); resetForm(); }} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={editingDealer ? handleUpdate : handleSubmit} className="p-6 space-y-3">
              <input type="text" name="firm_name" placeholder="Firm Name *" value={formData.firm_name} onChange={e => setFormData({ ...formData, firm_name: e.target.value })} className={inp} required />
              <input type="text" name="person_name" placeholder="Contact Person *" value={formData.person_name} onChange={e => setFormData({ ...formData, person_name: e.target.value })} className={inp} required />
              <div className="grid grid-cols-2 gap-3">
                <input type="tel" name="mobile_number" placeholder="Mobile *" value={formData.mobile_number} onChange={e => setFormData({ ...formData, mobile_number: e.target.value })} className={inp} required />
                <input type="email" name="email" placeholder="Email *" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inp} required />
              </div>
              <input type="text" name="gstin" placeholder="GSTIN (optional)" value={formData.gstin} onChange={e => setFormData({ ...formData, gstin: e.target.value })} className={inp} />
              <textarea name="address" placeholder="Business Address *" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} rows="2" className={inp} required />
              {formData.firm_name && !editingDealer && (
                <p className="text-xs text-zinc-500">Code: <span className="text-zinc-300">{generateDealerCode(formData.firm_name)}</span></p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAddForm(false); setShowEditForm(false); setEditingDealer(null); resetForm(); }} className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-white/5 transition-all duration-100 active:scale-95">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black font-semibold text-sm transition-all duration-100 active:scale-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-emerald-500">{editingDealer ? 'Update' : 'Add Dealer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Permanently delete dealer?</h3>
            <p className="text-sm text-zinc-400 mb-6">
              This will permanently delete <span className="text-white font-medium">{showDeleteConfirm.firm_name}</span> and all associated orders and payments. This action cannot be undone. Consider archiving instead.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 rounded-lg border border-[#2A2A2A] text-white text-sm font-medium hover:bg-white/5 transition-all duration-100 active:scale-95">Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm.dealer_id)} className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-all duration-100 active:scale-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-red-500">Delete Permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dealers;
