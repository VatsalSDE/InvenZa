import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Search,
  Edit,
  Trash2,
  CreditCard,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
  Banknote,
  Wallet,
  IndianRupee,
  Table,
  Grid3X3,
} from "lucide-react";
import { paymentsAPI, ordersAPI, dealersAPI } from "../services/api";
import PageHeader from "../components/ims/PageHeader";
import PaymentsTable from "../components/payments/PaymentsTable";
import PaymentForm from "../components/payments/PaymentForm";

const Payments = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const [formData, setFormData] = useState({
    order_id: "",
    dealer_id: "",
    payment_method: "Cash",
    paid_amount: "",
    payment_date: "",
    payment_status: "Completed",
    reference_number: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, ordersData, dealersData] = await Promise.all([
        paymentsAPI.getAll(),
        ordersAPI.getAll(),
        dealersAPI.getAll()
      ]);
      setPayments(paymentsData);
      setOrders(ordersData);
      setDealers(dealersData);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReferenceNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PAY-${year}${month}${day}-${random}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      order_id: "",
      dealer_id: "",
      payment_method: "Cash",
      paid_amount: "",
      payment_date: "",
      payment_status: "Completed",
      reference_number: "",
      notes: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Frontend validation
    if (!formData.dealer_id || formData.dealer_id === '') {
      setError('Please select a dealer');
      return;
    }
    
    if (!formData.paid_amount || formData.paid_amount === '') {
      setError('Please enter a valid amount');
      return;
    }
    
    // Convert to numbers for validation
    const dealerId = parseInt(formData.dealer_id);
    const paidAmount = parseFloat(formData.paid_amount);
    
    if (isNaN(dealerId) || isNaN(paidAmount)) {
      setError('Dealer ID and amount must be valid numbers');
      return;
    }
    
    if (paidAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    
    try {
      const referenceNumber = formData.reference_number || generateReferenceNumber();

      const newPayment = {
        ...formData,
        dealer_id: dealerId, // Ensure it's a number
        paid_amount: paidAmount, // Ensure it's a number
        reference_number: referenceNumber,
        payment_date: formData.payment_date || new Date().toISOString().split('T')[0]
      };

      console.log('📤 Sending payment data:', newPayment);
      await paymentsAPI.create(newPayment);
      await loadData();
      resetForm();
      setShowAddForm(false);
      setError(null); // Clear any previous errors
    } catch (err) {
      setError(err.message);
      console.error('Failed to create payment:', err);
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      order_id: payment.order_id?.toString() || "",
      dealer_id: payment.dealer_id?.toString() || "",
      payment_method: payment.payment_method || "Cash",
      paid_amount: payment.paid_amount?.toString() || "",
      payment_date: payment.payment_date ? payment.payment_date.split('T')[0] : "",
      payment_status: payment.payment_status || "Completed",
      reference_number: payment.reference_number || "",
      notes: payment.notes || "",
    });
    setShowEditForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedPayment = {
        ...formData,
        payment_date: formData.payment_date || new Date().toISOString().split('T')[0]
      };

      await paymentsAPI.update(editingPayment.payment_id, updatedPayment);
      await loadData();
      resetForm();
      setShowEditForm(false);
      setEditingPayment(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to update payment:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await paymentsAPI.delete(id);
        await loadData();
      } catch (err) {
        setError(err.message);
        console.error('Failed to delete payment:', err);
      }
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payment_method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.dealer_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      payment.payment_status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const totalPayments = payments.length;
  const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.paid_amount || 0), 0);
  const completedPayments = payments.filter(p => (p.payment_status || 'Completed') === 'Completed').length;
  const pendingPayments = payments.filter(p => (p.payment_status || 'Completed') === 'Pending').length;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'Processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'Failed': return <AlertCircle className="w-4 h-4" />;
      case 'Processing': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'Cash': return <Banknote className="w-5 h-5" />;
      case 'Card': return <CreditCard className="w-5 h-5" />;
      case 'UPI': return <Receipt className="w-5 h-5" />;
      case 'Bank Transfer': return <Wallet className="w-5 h-5" />;
      default: return <DollarSign className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading payments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Payments</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-6">
      <PageHeader icon={<IndianRupee className="w-8 h-8 text-white" />} title="Payments Management" subtitle="Track and manage all payment transactions" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <IndianRupee className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
              Total
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">
            Total Payments
          </p>
          <p className="text-3xl font-bold text-gray-900">{totalPayments}</p>
          <p className="text-xs text-green-600 mt-2">All transactions</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full font-medium">
              Revenue
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">
            Total Revenue
          </p>
          <p className="text-3xl font-bold text-gray-900">
            ₹{(totalAmount / 1000).toFixed(1)}K
          </p>
          <p className="text-xs text-emerald-600 mt-2">From payments</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
              Completed
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">
            Completed Payments
          </p>
          <p className="text-3xl font-bold text-gray-900">{completedPayments}</p>
          <p className="text-xs text-green-600 mt-2">Successfully processed</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full font-medium">
              Pending
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">
            Pending Payments
          </p>
          <p className="text-3xl font-bold text-gray-900">{pendingPayments}</p>
          <p className="text-xs text-yellow-600 mt-2">Awaiting completion</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search payments by reference, method, or dealer..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50/80 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-300 text-gray-700 placeholder-gray-400 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-4 bg-gray-50/80 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/50 text-gray-700 text-lg"
            >
              <option value="all">All Payments</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>

            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg font-semibold"
            >
              <Plus className="w-6 h-6" />
              Add Payment
            </button>
          </div>
        </div>
      </div>

      {/* View Controls */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-4 mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {filteredPayments.length} of {payments.length} payments
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 rounded-lg ${viewMode === 'table' ? 'bg-white text-green-600 shadow' : 'bg-gray-100 text-gray-600'}`}
            title="Table view"
          >
            <Table className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded-lg ${viewMode === 'grid' ? 'bg-white text-green-600 shadow' : 'bg-gray-100 text-gray-600'}`}
            title="Grid view"
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden">
          <PaymentsTable payments={filteredPayments} />
        </div>
      ) : (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {filteredPayments.map((payment) => (
          <div
            key={payment.payment_id}
            className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300 group"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl border-3 border-white shadow-xl flex items-center justify-center">
                    {getPaymentMethodIcon(payment.payment_method)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{payment.reference_number}</h3>
                    <p className="text-emerald-100 text-lg">{payment.dealer_name || 'Unknown Dealer'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                        {payment.payment_method}
                      </span>
                      <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                        ₹{parseFloat(payment.paid_amount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.payment_status)}`}
                  >
                    {getStatusIcon(payment.payment_status)}
                    {payment.payment_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-2xl border border-green-200">
                  <p className="text-2xl font-bold text-green-600">
                    {payment.payment_id}
                  </p>
                  <p className="text-xs text-green-500 font-medium">
                    Payment ID
                  </p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <p className="text-2xl font-bold text-emerald-600">
                    {payment.order_id || 'N/A'}
                  </p>
                  <p className="text-xs text-emerald-500 font-medium">
                    Order ID
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">Payment Date</p>
                  </div>
                </div>

                {payment.notes && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {payment.notes}
                      </p>
                      <p className="text-sm text-gray-500">Notes</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => handleEdit(payment)}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-2xl hover:from-green-600 hover:to-green-700 transition-colors shadow-lg transform hover:scale-105 text-lg font-semibold flex items-center justify-center gap-2"
                >
                  <Edit className="w-5 h-5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(payment.payment_id)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-2xl hover:from-red-600 hover:to-red-700 transition-colors shadow-lg transform hover:scale-105 text-lg font-semibold flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* No Results */}
      {filteredPayments.length === 0 && (
        <div className="text-center py-16">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">
            No payments found
          </h3>
          <p className="text-gray-400">
            Try adjusting your search criteria or add new payments to get
            started.
          </p>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
            <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">Add New Payment</h2>
                  <p className="text-emerald-100 mt-1">
                    Record a new payment transaction
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <PaymentForm
              formData={formData}
              orders={orders}
              onInputChange={handleInputChange}
              onCancel={() => { setShowAddForm(false); resetForm(); }}
              onSubmit={handleSubmit}
              submitLabel="Add Payment"
            />
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditForm && editingPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">Edit Payment</h2>
                  <p className="text-blue-100 mt-1">
                    Update payment information
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingPayment(null);
                    resetForm();
                  }}
                  className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <PaymentForm
              formData={formData}
              orders={orders}
              onInputChange={handleInputChange}
              onCancel={() => { setShowEditForm(false); setEditingPayment(null); resetForm(); }}
              onSubmit={handleUpdate}
              submitLabel="Update Payment"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;