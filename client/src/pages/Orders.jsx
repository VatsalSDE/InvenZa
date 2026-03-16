import React, { useState, useEffect } from "react";
import {
  X, Plus, Search, Edit, Trash2, Package, Users, Calendar, DollarSign,
  TrendingUp, CheckCircle, Clock, AlertCircle, Eye, ShoppingCart, Truck,
  FileText, IndianRupee, Table, Grid3X3, Download, Loader2,
} from "lucide-react";
import { ordersAPI, dealersAPI, productsAPI, paymentsAPI } from "../services/api";
import OrdersTable from "../components/orders/OrdersTable";
import PageHeader from "../components/ims/PageHeader";
import StatsCard from "../components/ims/StatsCard";
import StatusBadge from "../components/ui/StatusBadge";
import OrderForm from "../components/orders/OrderForm";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import OrbitalLoader from "../components/ui/OrbitalLoader";
import { formatRelativeDate, formatDate, exportToCSV } from "../utils/dateFormatter";

const Orders = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [products, setProducts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  const { toasts, showToast, hideToast } = useToast();

  const [formData, setFormData] = useState({
    order_code: "", dealer_id: "", order_status: "Pending",
    total_amount: "", delivery_date: "",
    items: [{ product_id: "", quantity: "", unit_price: "" }]
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, dealersData, productsData, paymentsData] = await Promise.all([
        ordersAPI.getAll(), dealersAPI.getAll(), productsAPI.getAll(), paymentsAPI.getAll()
      ]);
      setOrders(ordersData.data?.data || ordersData.data || ordersData || []);
      setDealers(dealersData.data?.data || dealersData.data || dealersData || []);
      setProducts(productsData.data?.data || productsData.data || productsData || []);
      setPayments(paymentsData.data?.data || paymentsData.data || paymentsData || []);
    } catch (err) {
      setError(err.message);
      showToast('Failed to load orders: ' + err.message, 'error');
    } finally { setLoading(false); }
  };

  const handleExport = () => {
    const exportData = filteredOrders.map(order => {
      const paymentStatus = getOrderPaymentStatus(order.order_id, order.total_amount);
      return {
        'Order Code': order.order_code, 'Dealer': order.firm_name, 'Status': order.order_status,
        'Total Amount': order.total_amount, 'Paid Amount': paymentStatus.totalPaid.toFixed(2),
        'Balance': paymentStatus.remaining.toFixed(2),
        'Payment Status': paymentStatus.isFullyPaid ? 'Paid' : 'Pending',
        'Delivery Date': order.delivery_date ? formatDate(order.delivery_date) : 'N/A',
        'Created': formatDate(order.created_at),
      };
    });
    exportToCSV(exportData, 'orders');
    showToast('Orders exported successfully!', 'success');
  };

  const getOrderPaymentStatus = (orderId, totalAmount) => {
    const orderPayments = payments.filter(p => p.order_id === orderId);
    const totalPaid = orderPayments.reduce((sum, p) => sum + parseFloat(p.paid_amount || 0), 0);
    const remaining = parseFloat(totalAmount) - totalPaid;
    return { totalPaid, remaining, percentage: (totalPaid / parseFloat(totalAmount)) * 100, isFullyPaid: remaining <= 0.01 };
  };

  const generateOrderCode = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${year}${month}${day}-${random}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    if (field === 'product_id') {
      const product = products.find(p => p.product_id.toString() === value);
      if (product) { newItems[index].unit_price = product.price.toString(); newItems[index].quantity = ""; }
    }
    if (field === 'quantity') {
      const product = products.find(p => p.product_id.toString() === newItems[index].product_id);
      if (product && parseInt(value) > product.quantity) {
        alert(`Cannot order more than available stock. Available: ${product.quantity}`);
        newItems[index].quantity = product.quantity.toString();
      }
    }
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => setFormData(prev => ({ ...prev, items: [...prev.items, { product_id: "", quantity: "", unit_price: "" }] }));
  const removeItem = (index) => { if (formData.items.length > 1) setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) })); };
  const calculateTotal = () => formData.items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)), 0);

  const resetForm = () => {
    setFormData({ order_code: "", dealer_id: "", order_status: "Pending", total_amount: "", delivery_date: "", items: [{ product_id: "", quantity: "", unit_price: "" }] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      for (const item of formData.items) {
        if (item.product_id && item.quantity) {
          const product = products.find(p => p.product_id.toString() === item.product_id);
          if (product && parseInt(item.quantity) > product.quantity) {
            showToast(`Cannot order ${item.quantity} of ${product.product_name}. Available: ${product.quantity}`, 'error'); return;
          }
        }
      }
      const orderCode = formData.order_code || generateOrderCode();
      const totalAmount = calculateTotal();
      const newOrder = {
        ...formData, order_code: orderCode, total_amount: totalAmount,
        items: formData.items.filter(item => item.product_id && item.quantity && item.unit_price)
      };
      await ordersAPI.create(newOrder);
      await loadData(); resetForm(); setShowAddForm(false);
      showToast('Order created successfully!', 'success');
    } catch (err) { setError(err.message); showToast('Failed to create order: ' + err.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async (order) => {
    try {
      setEditingOrder(order);
      const items = await ordersAPI.getItems(order.order_id);
      setFormData({
        order_code: order.order_code, dealer_id: order.dealer_id.toString(),
        order_status: order.order_status, total_amount: order.total_amount.toString(),
        delivery_date: order.delivery_date ? order.delivery_date.split('T')[0] : "",
        items: items.length > 0 ? items.map(item => ({
          product_id: item.product_id.toString(), quantity: item.quantity.toString(), unit_price: item.unit_price.toString()
        })) : [{ product_id: "", quantity: "", unit_price: "" }]
      });
      setShowEditForm(true);
    } catch (err) { console.error('Failed to load order items:', err); setError('Failed to load order items for editing'); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      for (const item of formData.items) {
        if (item.product_id && item.quantity) {
          const product = products.find(p => p.product_id.toString() === item.product_id);
          if (product && parseInt(item.quantity) > product.quantity) {
            alert(`Cannot order ${item.quantity} of ${product.product_name}. Available stock: ${product.quantity}`); return;
          }
        }
      }
      const totalAmount = calculateTotal();
      const updatedOrder = {
        ...formData, total_amount: totalAmount,
        items: formData.items.filter(item => item.product_id && item.quantity && item.unit_price)
      };
      await ordersAPI.update(editingOrder.order_id, updatedOrder);
      await loadData(); resetForm(); setShowEditForm(false); setEditingOrder(null);
    } catch (err) { setError(err.message); console.error('Failed to update order:', err); }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try { await ordersAPI.updateStatus(orderId, newStatus); await loadData(); }
    catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      setSubmitting(true);
      try { await ordersAPI.delete(id); await loadData(); showToast('Order deleted successfully!', 'success'); }
      catch (err) { setError(err.message); showToast('Failed to delete order: ' + err.message, 'error'); }
      finally { setSubmitting(false); }
    }
  };

  const viewOrderItems = async (order) => {
    try {
      const items = await ordersAPI.getItems(order.order_id);
      setOrderItems(items); setSelectedOrder(order); setShowItemsModal(true);
    } catch (err) { setError(err.message); }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.firm_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.order_status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.order_status === 'Pending').length;
  const completedOrders = orders.filter(o => o.order_status === 'Completed').length;
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const formatCurrency = (amt) => `₹${Number(amt || 0).toLocaleString("en-IN")}`;

  if (loading) return (
    <div className="min-h-screen bg-[#0F0F0F] p-6 flex items-center justify-center">
      <OrbitalLoader message="Loading orders..." />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0F0F0F] p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-white mb-2">Error Loading Orders</h2>
        <p className="text-zinc-500 mb-4">{error}</p>
        <button onClick={loadData} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-lg transition-colors">Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F0F0F] p-6">
      <PageHeader title="Orders" subtitle="Track and manage customer orders" icon={ShoppingCart} count={totalOrders}
        action={
          <div className="flex gap-2">
            <button onClick={handleExport} disabled={filteredOrders.length === 0}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 active:scale-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-zinc-500">
              <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={() => setShowAddForm(true)}
              className="bg-green-500 hover:bg-green-600 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all duration-100 active:scale-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-green-500">
              <Plus className="w-4 h-4" /> Create Order
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Orders" value={totalOrders} icon={ShoppingCart} accentColor="blue" />
        <StatsCard title="Pending Orders" value={pendingOrders} icon={Clock} accentColor="orange" />
        <StatsCard title="Completed Orders" value={completedOrders} icon={CheckCircle} accentColor="green" />
        <StatsCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={IndianRupee} accentColor="purple" />
      </div>

      {/* Controls */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
            <input type="text" placeholder="Search orders by code or dealer..."
              className="w-full pl-10 pr-4 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 placeholder:text-zinc-600"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-xl focus:outline-none focus:border-green-500/50">
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="shipping">Shipping</option>
            <option value="completed">Completed</option>
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
          {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {viewMode === 'table' ? (
        <OrdersTable orders={filteredOrders} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const paymentStatus = getOrderPaymentStatus(order.order_id, order.total_amount);
            return (
              <div key={order.order_id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden hover:border-green-500/30 transition-all">
                {/* Header */}
                <div className="p-4 border-b border-[#2A2A2A]">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-medium text-white">{order.order_code}</h3>
                      <p className="text-xs text-zinc-500">{order.firm_name}</p>
                    </div>
                    <StatusBadge status={order.order_status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-zinc-800 text-green-400 border border-zinc-700 rounded-md text-xs font-medium">
                      ₹{parseFloat(order.total_amount || 0).toLocaleString()}
                    </span>
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-md text-xs">
                      {formatRelativeDate(order.created_at)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-[#222222] rounded-xl border border-[#2A2A2A]">
                      <p className="text-sm font-bold text-white">{order.order_id}</p>
                      <p className="text-[10px] text-zinc-600">Order ID</p>
                    </div>
                    <div className="text-center p-2 bg-[#222222] rounded-xl border border-[#2A2A2A]">
                      <p className="text-sm font-bold text-zinc-300">{order.delivery_date ? formatDate(order.delivery_date) : 'Not set'}</p>
                      <p className="text-[10px] text-zinc-600">Delivery Date</p>
                    </div>
                    <div className={`text-center p-2 rounded-xl border ${paymentStatus.isFullyPaid ? 'bg-green-500/10 border-green-500/20' :
                      paymentStatus.totalPaid > 0 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-red-500/10 border-red-500/20'
                      }`}>
                      <p className={`text-sm font-bold ${paymentStatus.isFullyPaid ? 'text-green-400' :
                        paymentStatus.totalPaid > 0 ? 'text-orange-400' : 'text-red-400'
                        }`}>
                        {paymentStatus.isFullyPaid ? '✓ Paid' : `₹${paymentStatus.remaining.toFixed(0)}`}
                      </p>
                      <p className="text-[10px] text-zinc-600">{paymentStatus.isFullyPaid ? 'Fully Paid' : 'Balance Due'}</p>
                    </div>
                  </div>

                  {/* Status Actions */}
                  <div className="mb-4">
                    <p className="text-xs text-zinc-500 mb-2">Update Status:</p>
                    <div className="flex flex-wrap gap-1">
                      {['Pending', 'Shipping', 'Completed'].map((status) => (
                        <button key={status} onClick={() => handleStatusUpdate(order.order_id, status)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-100 active:scale-95 ${order.order_status === status ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-white'
                            }`}>
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => viewOrderItems(order)} className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 text-xs font-medium hover:bg-white/5 flex items-center justify-center gap-1 transition-all duration-100 active:scale-95 active:brightness-90">
                      <Eye className="w-3 h-3" /> Items
                    </button>
                    <button onClick={() => handleEdit(order)} className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 text-xs font-medium hover:bg-white/5 flex items-center justify-center gap-1 transition-all duration-100 active:scale-95 active:brightness-90">
                      <Edit className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => handleDelete(order.order_id)} className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 flex items-center justify-center gap-1 transition-all duration-100 active:scale-95 active:brightness-90">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No Results */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-16">
          <ShoppingCart className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-zinc-400 mb-1">No orders found</h3>
          <p className="text-sm text-zinc-600">Try adjusting your search criteria or create new orders.</p>
        </div>
      )}

      {/* Create Order Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
              <div>
                <h2 className="text-lg font-semibold text-white">Create New Order</h2>
                <p className="text-xs text-zinc-500 mt-1">Add a new customer order</p>
              </div>
              <button onClick={() => { setShowAddForm(false); resetForm(); }} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <OrderForm formData={formData} dealers={dealers} products={products}
              onInputChange={handleInputChange} onItemChange={handleItemChange}
              onAddItem={addItem} onRemoveItem={removeItem} calculateTotal={calculateTotal}
              onCancel={() => { setShowAddForm(false); resetForm(); }} onSubmit={handleSubmit}
              submitLabel={submitting ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Creating...</span> : "Create Order"}
              disabled={submitting} />
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditForm && editingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
              <div>
                <h2 className="text-lg font-semibold text-white">Edit Order</h2>
                <p className="text-xs text-zinc-500 mt-1">Update order details and items</p>
              </div>
              <button onClick={() => { setShowEditForm(false); setEditingOrder(null); resetForm(); }} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <OrderForm formData={formData} dealers={dealers} products={products}
              onInputChange={handleInputChange} onItemChange={handleItemChange}
              onAddItem={addItem} onRemoveItem={removeItem} calculateTotal={calculateTotal}
              onCancel={() => { setShowEditForm(false); setEditingOrder(null); resetForm(); }}
              onSubmit={handleUpdate} submitLabel="Update Order" />
          </div>
        </div>
      )}

      {/* Order Items Modal */}
      {showItemsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
              <div>
                <h2 className="text-lg font-semibold text-white">Order Items</h2>
                <p className="text-xs text-zinc-500 mt-1">{selectedOrder.order_code} — {selectedOrder.firm_name}</p>
              </div>
              <button onClick={() => setShowItemsModal(false)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[#222222] border border-[#2A2A2A] rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-white">{item.product_name}</p>
                      <p className="text-xs text-zinc-500">{item.product_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">Qty: {item.quantity}</p>
                      <p className="text-xs text-green-400">₹{parseFloat(item.unit_price).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[#2A2A2A] flex items-center justify-between">
                <span className="text-sm text-zinc-400">Total Amount:</span>
                <span className="text-xl font-bold text-green-400">
                  ₹{parseFloat(selectedOrder.total_amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
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

export default Orders;