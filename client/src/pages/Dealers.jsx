import React, { useState, useEffect } from "react";
import {
  X, Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Users,
  TrendingUp, DollarSign, Calendar, Receipt, ShoppingCart, CreditCard, AlertCircle
} from "lucide-react";
import { dealersAPI, ordersAPI, paymentsAPI } from "../services/api";
import { Table, Grid3X3 } from "lucide-react";
import DealersTable from "../components/dealers/DealersTable";

const Dealers = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dealers, setDealers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDealer, setEditingDealer] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [formData, setFormData] = useState({
    firm_name: "", person_name: "", address: "", mobile_number: "", email: "", gstin: ""
  });

  useEffect(() => {
    loadDealers();
  }, []);

  const loadDealers = async () => {
    try {
      setLoading(true);
      const [dealersData, ordersData, paymentsData] = await Promise.all([
        dealersAPI.getAll(), ordersAPI.getAll(), paymentsAPI.getAll()
      ]);
      setDealers(dealersData);
      setOrders(ordersData);
      setPayments(paymentsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateDealerCode = (firmName) => {
    const prefix = firmName.split(" ").map((word) => word.substring(0, 3)).join("").toUpperCase();
    const existingCodes = dealers.filter(d => d.dealer_code && d.dealer_code.startsWith(prefix)).map(d => d.dealer_code);
    let sequenceNumber = 1;
    while (existingCodes.includes(`${prefix}-${String(sequenceNumber).padStart(3, "0")}`)) {
      sequenceNumber++;
    }
    return `${prefix}-${String(sequenceNumber).padStart(3, "0")}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ firm_name: "", person_name: "", address: "", mobile_number: "", email: "", gstin: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dealerCode = generateDealerCode(formData.firm_name);
      const newDealer = { ...formData, dealer_code: dealerCode };
      await dealersAPI.create(newDealer);
      await loadDealers();
      resetForm();
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to create dealer:', err);
    }
  };

  const handleEdit = (dealer) => {
    setEditingDealer(dealer);
    setFormData({
      firm_name: dealer.firm_name || "",
      person_name: dealer.person_name || "",
      address: dealer.address || "",
      mobile_number: dealer.mobile_number || "",
      email: dealer.email || "",
      gstin: dealer.gstin || ""
    });
    setShowEditForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await dealersAPI.update(editingDealer.dealer_id, formData);
      await loadDealers();
      resetForm();
      setShowEditForm(false);
      setEditingDealer(null);
    } catch (err) {
      console.error('Failed to update dealer:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this dealer?')) {
      try {
        await dealersAPI.delete(id);
        await loadDealers();
      } catch (err) {
        console.error('Failed to delete dealer:', err);
      }
    }
  };

  const openLedger = (dealer) => {
    setSelectedDealer(dealer);
    setShowLedger(true);
  };

  const getDealerOrders = (dealerId) => orders.filter(order => order.dealer_id === dealerId);
  const getDealerPayments = (dealerId) => payments.filter(payment => payment.dealer_id === dealerId);

  const calculateDealerBalance = (dealerId) => {
    const dealerOrders = getDealerOrders(dealerId);
    const dealerPayments = getDealerPayments(dealerId);
    const totalOrders = dealerOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
    const totalPayments = dealerPayments.reduce((sum, payment) => sum + (parseFloat(payment.paid_amount) || 0), 0);
    return { totalOrders, totalPayments, remainingBalance: totalOrders - totalPayments };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
  };

  const filteredDealers = dealers.filter((dealer) => {
    const matchesSearch = dealer.firm_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dealer.person_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dealer.address?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading dealers...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl">
              <Users className="w-8 h-8 text-white" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{dealers.length}</span>
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Dealers Management
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Manage your dealer network and track financial relationships
            </p>
          </div>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Dealers</p>
              <p className="text-2xl font-bold text-gray-800">{dealers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Dealers</p>
              <p className="text-2xl font-bold text-gray-800">
                {dealers.filter(d => d.status !== 'inactive').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-800">{payments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search dealers by name, firm, or contact..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50/80 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-300 text-gray-700 placeholder-gray-400 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-2xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg font-semibold"
            >
              <Plus className="w-6 h-6" />
              Add Dealer
            </button>
        </div>
      </div>

      {/* View Controls */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-4 mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {filteredDealers.length} of {dealers.length} dealers
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-2 rounded-lg ${viewMode === 'table' ? 'bg-white text-cyan-600 shadow' : 'bg-gray-100 text-gray-600'}`}
            title="Table view"
          >
            <Table className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-2 rounded-lg ${viewMode === 'grid' ? 'bg-white text-cyan-600 shadow' : 'bg-gray-100 text-gray-600'}`}
            title="Grid view"
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden">
          <DealersTable dealers={filteredDealers} calculateDealerBalance={calculateDealerBalance} formatCurrency={formatCurrency} />
        </div>
      ) : (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {filteredDealers.map((dealer) => {
          const balance = calculateDealerBalance(dealer.dealer_id);
          return (
            <div key={dealer.dealer_id} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl border-3 border-white shadow-xl flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{dealer.firm_name}</h3>
                    <p className="text-blue-100 text-lg">{dealer.person_name}</p>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium mt-2 inline-block">
                        {dealer.dealer_code}
                  </span>
                </div>
              </div>
            </div>

              {/* Content */}
            <div className="p-6">
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm font-medium">Balance: {formatCurrency(balance.remainingBalance)}</p>
                  <p className="text-xs text-gray-500">
                    Orders: {formatCurrency(balance.totalOrders)} | Payments: {formatCurrency(balance.totalPayments)}
                  </p>
              </div>

                <div className="flex gap-2">
                  <button onClick={() => openLedger(dealer)} className="flex-1 bg-purple-500 text-white py-2 px-4 rounded text-sm">
                    View Ledger
                  </button>
                  <button onClick={() => handleEdit(dealer)} className="flex-1 bg-blue-500 text-white py-2 px-4 rounded text-sm">
                    Edit
                </button>
                  <button onClick={() => handleDelete(dealer.dealer_id)} className="flex-1 bg-red-500 text-white py-2 px-4 rounded text-sm">
                  Remove
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
      )}

      {/* Add Dealer Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-6 text-white rounded-t-3xl -m-6 mb-6">
              <h2 className="text-2xl font-bold">Add New Dealer</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" name="firm_name" placeholder="Firm Name *" value={formData.firm_name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              <input type="text" name="person_name" placeholder="Contact Person *" value={formData.person_name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              <input type="tel" name="mobile_number" placeholder="Mobile Number *" value={formData.mobile_number} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              <input type="email" name="email" placeholder="Email *" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              <input type="text" name="gstin" placeholder="GST Number (optional)" value={formData.gstin} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <textarea name="address" placeholder="Business Address *" value={formData.address} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              
              {formData.firm_name && (
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm text-blue-700">Generated Code: <strong>{generateDealerCode(formData.firm_name)}</strong></p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  Add Dealer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dealer Modal */}
      {showEditForm && editingDealer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 text-white rounded-t-3xl -m-6 mb-6">
              <h2 className="text-2xl font-bold">Edit Dealer</h2>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <input type="text" name="firm_name" placeholder="Firm Name *" value={formData.firm_name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              <input type="text" name="person_name" placeholder="Contact Person *" value={formData.person_name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              <input type="tel" name="mobile_number" placeholder="Mobile Number *" value={formData.mobile_number} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              <input type="email" name="email" placeholder="Email *" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              <input type="text" name="gstin" placeholder="GST Number (optional)" value={formData.gstin} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <textarea name="address" placeholder="Business Address *" value={formData.address} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowEditForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  Update Dealer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dealer Ledger Modal with Table Format */}
      {showLedger && selectedDealer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Dealer Ledger - {selectedDealer.firm_name}</h2>
                <button onClick={() => setShowLedger(false)} className="text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {(() => {
                  const balance = calculateDealerBalance(selectedDealer.dealer_id);
                  return (
                    <>
                      <div className="bg-blue-50 p-4 rounded text-center border border-blue-200">
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(balance.totalOrders)}</p>
                        <p className="text-sm text-blue-500">Total Orders</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded text-center border border-green-200">
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(balance.totalPayments)}</p>
                        <p className="text-sm text-green-500">Total Payments</p>
              </div>
                      <div className="bg-red-50 p-4 rounded text-center border border-red-200">
                        <p className="text-2xl font-bold text-red-600">{formatCurrency(Math.abs(balance.remainingBalance))}</p>
                        <p className="text-sm text-red-500">{balance.remainingBalance > 0 ? 'Outstanding' : 'Advance'}</p>
              </div>
                    </>
                  );
                })()}
                </div>

              {/* Orders and Payments Tables in Row-Column Format */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Orders Table */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    Orders History
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-2 text-sm font-semibold text-gray-600">Order Code</th>
                          <th className="text-left py-2 px-2 text-sm font-semibold text-gray-600">Date</th>
                          <th className="text-left py-2 px-2 text-sm font-semibold text-gray-600">Status</th>
                          <th className="text-right py-2 px-2 text-sm font-semibold text-gray-600">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getDealerOrders(selectedDealer.dealer_id).map((order) => (
                          <tr key={order.order_id} className="border-b border-gray-100 hover:bg-gray-100">
                            <td className="py-2 px-2 text-sm text-gray-800 font-medium">{order.order_code}</td>
                            <td className="py-2 px-2 text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
                            <td className="py-2 px-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.order_status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.order_status}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-sm text-gray-800 font-semibold text-right">{formatCurrency(order.total_amount)}</td>
                          </tr>
                        ))}
                        {getDealerOrders(selectedDealer.dealer_id).length === 0 && (
                          <tr><td colSpan="4" className="py-4 text-center text-gray-500">No orders found</td></tr>
                        )}
                      </tbody>
                    </table>
                </div>
              </div>

                {/* Payments Table */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    Payment History
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-2 text-sm font-semibold text-gray-600">Transaction ID</th>
                          <th className="text-left py-2 px-2 text-sm font-semibold text-gray-600">Date</th>
                          <th className="text-left py-2 px-2 text-sm font-semibold text-gray-600">Method</th>
                          <th className="text-right py-2 px-2 text-sm font-semibold text-gray-600">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getDealerPayments(selectedDealer.dealer_id).map((payment) => (
                          <tr key={payment.payment_id} className="border-b border-gray-100 hover:bg-gray-100">
                            <td className="py-2 px-2 text-sm text-gray-800 font-medium">{payment.transaction_id}</td>
                            <td className="py-2 px-2 text-sm text-gray-600">{new Date(payment.payment_date).toLocaleDateString()}</td>
                            <td className="py-2 px-2">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {payment.payment_method}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-sm text-gray-800 font-semibold text-right">{formatCurrency(payment.paid_amount)}</td>
                          </tr>
                        ))}
                        {getDealerPayments(selectedDealer.dealer_id).length === 0 && (
                          <tr><td colSpan="4" className="py-4 text-center text-gray-500">No payments found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
              </div>
              </div>

              {/* Summary Footer */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Financial Summary</h4>
                  <p className="text-gray-600">
                    {(() => {
                      const balance = calculateDealerBalance(selectedDealer.dealer_id);
                      if (balance.remainingBalance > 0) {
                        return `Outstanding Balance: ${formatCurrency(balance.remainingBalance)}`;
                      } else if (balance.remainingBalance < 0) {
                        return `Advance Payment: ${formatCurrency(Math.abs(balance.remainingBalance))}`;
                      } else {
                        return 'All payments are settled';
                      }
                    })()}
                  </p>
                  </div>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dealers;
