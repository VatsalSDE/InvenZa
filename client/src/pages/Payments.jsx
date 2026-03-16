import React, { useState, useEffect } from "react";
import {
  X, Plus, Search, Edit, Trash2, IndianRupee, CreditCard, CheckCircle,
  Clock, Eye, Download, Table, Grid3X3, Loader2, Wallet,
} from "lucide-react";
import { paymentsAPI, ordersAPI, dealersAPI } from "../services/api";
import PaymentsTable from "../components/payments/PaymentsTable";
import PaymentForm from "../components/payments/PaymentForm";
import PageHeader from "../components/ims/PageHeader";
import StatsCard from "../components/ims/StatsCard";
import StatusBadge from "../components/ui/StatusBadge";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import OrbitalLoader from "../components/ui/OrbitalLoader";

const Payments = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const { toasts, showToast, hideToast } = useToast();

  const [formData, setFormData] = useState({
    dealer_id: "", order_id: "", payment_method: "Cash",
    amount: "", payment_status: "Completed", payment_date: new Date().toISOString().split('T')[0],
    reference_number: "", notes: ""
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, ordersData, dealersData] = await Promise.all([
        paymentsAPI.getAll(), ordersAPI.getAll(), dealersAPI.getAll()
      ]);
      setPayments(paymentsData.data?.data || paymentsData.data || paymentsData || []);
      setOrders(ordersData.data?.data || ordersData.data || ordersData || []);
      setDealers(dealersData.data?.data || dealersData.data || dealersData || []);
    } catch (err) {
      setError(err.message);
      showToast('Failed to load payments: ' + err.message, 'error');
    } finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      dealer_id: "", order_id: "", payment_method: "Cash",
      amount: "", payment_status: "Completed", payment_date: new Date().toISOString().split('T')[0],
      reference_number: "", notes: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dealer = dealers.find(d => d.dealer_id === parseInt(formData.dealer_id));
      await paymentsAPI.create({
        dealer_id: formData.dealer_id,
        order_id: formData.order_id || null,
        paid_amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        payment_status: formData.payment_status,
        payment_date: formData.payment_date,
        reference_number: formData.reference_number,
        notes: formData.notes,
      });
      await loadData(); resetForm(); setShowAddForm(false);
      showToast('Payment recorded successfully!', 'success');
    } catch (err) {
      setError(err.message);
      showToast('Failed to record payment: ' + err.message, 'error');
    } finally { setSubmitting(false); }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      dealer_id: payment.dealer_id?.toString() || "", order_id: payment.order_id?.toString() || "",
      payment_method: payment.payment_method || "Cash", amount: payment.paid_amount?.toString() || "",
      payment_status: payment.payment_status || "Completed",
      payment_date: payment.payment_date ? payment.payment_date.split('T')[0] : new Date().toISOString().split('T')[0],
      reference_number: payment.reference_number || "", notes: payment.notes || ""
    });
    setShowEditForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dealer = dealers.find(d => d.dealer_id === parseInt(formData.dealer_id));
      await paymentsAPI.update(editingPayment.payment_id, {
        ...formData, paid_amount: parseFloat(formData.amount), dealer_name: dealer?.firm_name || ''
      });
      await loadData(); resetForm(); setShowEditForm(false); setEditingPayment(null);
      showToast('Payment updated successfully!', 'success');
    } catch (err) {
      setError(err.message);
      showToast('Failed to update payment: ' + err.message, 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      try {
        await paymentsAPI.delete(id); await loadData();
        showToast('Payment deleted successfully!', 'success');
      } catch (err) {
        setError(err.message);
        showToast('Failed to delete payment: ' + err.message, 'error');
      }
    }
  };

  const handleExport = () => {
    const headers = ["Reference", "Dealer", "Method", "Amount", "Status", "Date", "Notes"];
    const csvData = filteredPayments.map(p => [
      p.reference_number || '', p.dealer_name || p.firm_name || '', p.payment_method || '',
      p.paid_amount || '', p.payment_status || '', p.payment_date || '', p.notes || ''
    ]);
    const csvContent = [headers, ...csvData].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "payments_report.csv"; a.click();
    window.URL.revokeObjectURL(url);
    showToast('Payments exported successfully!', 'success');
  };

  const handleStatusUpdate = async (payment, newStatus) => {
    try {
      const dealer = dealers.find(d => d.dealer_id === payment.dealer_id);
      await paymentsAPI.update(payment.payment_id, {
        ...payment,
        amount: payment.paid_amount,
        payment_status: newStatus,
        dealer_name: dealer?.firm_name || payment.dealer_name || ''
      });
      await loadData();
      showToast(`Payment status updated to ${newStatus}`, 'success');
    } catch (err) {
      showToast('Failed to update status: ' + err.message, 'error');
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = (payment.reference_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.dealer_name || payment.firm_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || (payment.payment_status || '').toLowerCase() === statusFilter.toLowerCase();
    const matchesMethod = methodFilter === "all" || (payment.payment_method || '').toLowerCase() === methodFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalPayments = payments.length;
  const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.paid_amount || 0), 0);
  const completedPayments = payments.filter(p => (p.payment_status || '').toLowerCase() === 'completed').length;
  const pendingPayments = payments.filter(p => (p.payment_status || '').toLowerCase() === 'pending').length;
  const formatCurrency = (amt) => `₹${Number(amt || 0).toLocaleString("en-IN")}`;

  if (loading) return (
    <div className="min-h-screen bg-[#0F0F0F] p-6 flex items-center justify-center">
      <OrbitalLoader message="Loading payments..." />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F0F0F] p-6">
      <PageHeader title="Payments" subtitle="Track and manage all payment transactions" icon={Wallet} count={totalPayments}
        action={
          <div className="flex gap-2">
            <button onClick={handleExport} disabled={filteredPayments.length === 0}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50">
              <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={() => { resetForm(); setShowAddForm(true); }}
              className="bg-green-500 hover:bg-green-600 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Record Payment
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Payments" value={totalPayments} icon={CreditCard} accentColor="blue" />
        <StatsCard title="Total Collected" value={formatCurrency(totalAmount)} icon={IndianRupee} accentColor="green" />
        <StatsCard title="Completed" value={completedPayments} icon={CheckCircle} accentColor="green" />
        <StatsCard title="Pending" value={pendingPayments} icon={Clock} accentColor="orange" />
      </div>

      {/* Controls */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
            <input type="text" placeholder="Search by reference or dealer..."
              className="w-full pl-10 pr-4 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 placeholder:text-zinc-600"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-xl focus:outline-none focus:border-green-500/50">
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-xl focus:outline-none focus:border-green-500/50">
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
            <option value="card">Card</option>
          </select>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-green-500/10 text-green-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
              <Table className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-green-500/10 text-green-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-[#2A2A2A] text-xs text-zinc-600">
          {filteredPayments.length} of {payments.length} payments
        </div>
      </div>

      {/* Payments Display */}
      {viewMode === 'table' ? (
        <PaymentsTable payments={filteredPayments} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPayments.map((payment) => (
            <div key={payment.payment_id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden hover:border-green-500/30 transition-all">
              <div className="p-4 border-b border-[#2A2A2A]">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-lg font-bold text-green-400">{formatCurrency(payment.paid_amount)}</p>
                    <p className="text-xs text-zinc-500">{payment.dealer_name || payment.firm_name || 'Unknown'}</p>
                  </div>
                  <StatusBadge status={payment.payment_status || 'Completed'} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={payment.payment_method || 'N/A'} />
                  <span className="text-xs text-zinc-500">{new Date(payment.payment_date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="p-2 bg-[#222222] rounded-xl border border-[#2A2A2A]">
                    <p className="text-[10px] text-zinc-600">Reference</p>
                    <p className="text-xs text-zinc-300 truncate">{payment.reference_number || 'N/A'}</p>
                  </div>
                  <div className="p-2 bg-[#222222] rounded-xl border border-[#2A2A2A]">
                    <p className="text-[10px] text-zinc-600">Order</p>
                    <p className="text-xs text-zinc-300">{payment.order_code || 'N/A'}</p>
                  </div>
                </div>
                {payment.notes && (
                  <div className="p-2 bg-[#222222] rounded-xl border border-[#2A2A2A] mb-4">
                    <p className="text-[10px] text-zinc-600">Notes</p>
                    <p className="text-xs text-zinc-400 line-clamp-2">{payment.notes}</p>
                  </div>
                )}

                {/* Status Toggle */}
                <div className="mb-4">
                  <p className="text-xs text-zinc-500 mb-2">Update Status:</p>
                  <div className="flex gap-1">
                    {['Pending', 'Completed'].map((status) => (
                      <button key={status} onClick={() => handleStatusUpdate(payment, status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${(payment.payment_status || 'Completed') === status ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-white'
                          }`}>
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleEdit(payment)} className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 text-xs font-medium hover:bg-white/5 flex items-center justify-center gap-1">
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => handleDelete(payment.payment_id)} className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 flex items-center justify-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredPayments.length === 0 && (
        <div className="text-center py-16">
          <Wallet className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-zinc-400 mb-1">No payments found</h3>
          <p className="text-sm text-zinc-600">Try adjusting your filters or record a new payment.</p>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
              <div>
                <h2 className="text-lg font-semibold text-white">Record Payment</h2>
                <p className="text-xs text-zinc-500 mt-1">Add a new payment transaction</p>
              </div>
              <button onClick={() => { setShowAddForm(false); resetForm(); }} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <PaymentForm formData={formData} orders={orders} dealers={dealers} payments={payments}
              onInputChange={handleInputChange} onCancel={() => { setShowAddForm(false); resetForm(); }}
              onSubmit={handleSubmit}
              submitLabel={submitting ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Recording...</span> : "Record Payment"}
              disabled={submitting} />
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditForm && editingPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
              <div>
                <h2 className="text-lg font-semibold text-white">Edit Payment</h2>
                <p className="text-xs text-zinc-500 mt-1">Update payment details</p>
              </div>
              <button onClick={() => { setShowEditForm(false); setEditingPayment(null); resetForm(); }} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <PaymentForm formData={formData} orders={orders} dealers={dealers} payments={payments}
              onInputChange={handleInputChange} onCancel={() => { setShowEditForm(false); setEditingPayment(null); resetForm(); }}
              onSubmit={handleUpdate} submitLabel="Update Payment" disabled={submitting} />
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type}
            onClose={() => hideToast(toast.id)} duration={toast.duration} />
        ))}
      </div>
    </div>
  );
};

export default Payments;