import React, { useState, useEffect } from "react";
import BillPreview from "../components/billing/BillPreview";
import BillingActions from "../components/billing/BillingActions";
import { API_BASE_URL } from "../config";
import {
  Plus,
  Search,
  Download,
  Mail,
  Printer,
  Eye,
  Trash2,
  FileText,
  DollarSign,
  Calendar,
  User,
  Building,
  Phone,
  MapPin,
  Receipt,
  X,
  Clock,
  IndianRupee,
} from "lucide-react";
import { ordersAPI, dealersAPI, productsAPI } from "../services/api";

// Helper functions
const getDealerInfo = (dealers, dealerId) => {
  if (!Array.isArray(dealers)) return null;
  return dealers.find(d => d.dealer_id === dealerId);
};

const getOrderItems = async (orderId) => {
  try {
    console.log('🔍 Fetching order items for order ID:', orderId);
    
    if (!orderId) {
      console.error('❌ No order ID provided');
      return [];
    }
    
    const items = await ordersAPI.getItems(orderId);
    
    if (Array.isArray(items)) {
      console.log('✅ Order items fetched:', items);
      
      // Validate the data structure
      if (items.length > 0) {
        items.forEach((item, index) => {
          console.log(`🔍 Item ${index + 1}:`, {
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.quantity * item.unit_price
          });
        });
      } else {
        console.warn('⚠️ No order items found or invalid data structure');
      }
      
      return items;
    }
    
    console.warn('⚠️ Unexpected items response');
    return [];
  } catch (error) {
    console.error('❌ Error fetching order items:', error);
    return [];
  }
};

const getProductInfo = (products, productId) => {
  if (!Array.isArray(products)) return null;
  return products.find(p => p.product_id === productId);
};

const calculateTotal = (orderItems, orderTotal = 0) => {
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    console.log('⚠️ No order items, using order total:', orderTotal);
    return parseFloat(orderTotal) || 0;
  }
  
  const calculatedTotal = orderItems.reduce((sum, item) => {
    const quantity = parseInt(item.quantity) || 0;
    const unitPrice = parseFloat(item.unit_price) || 0;
    return sum + (quantity * unitPrice);
  }, 0);
  
  console.log('🔍 Calculated total from items:', calculatedTotal, 'Order total:', orderTotal);
  return calculatedTotal;
};

const generateBillNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BILL-${year}${month}${day}-${random}`;
};

const generateBill = async (order, dealers, products) => {
  console.log('🔍 Generating bill for order:', order);
  console.log('🔍 Dealers:', dealers);
  console.log('🔍 Products:', products);
  
  const dealer = getDealerInfo(dealers, order.dealer_id);
  console.log('🔍 Found dealer:', dealer);
  
  const orderItems = await getOrderItems(order.order_id);
  console.log('🔍 Order items:', orderItems);
  
  const total = calculateTotal(orderItems, order.total_amount);
  console.log('🔍 Calculated total:', total, 'Order total:', order.total_amount);
  
  const billData = {
    billNumber: generateBillNumber(),
    billDate: new Date().toLocaleDateString('en-IN'),
    order: order,
    dealer: dealer,
    items: orderItems.map(item => {
      const product = getProductInfo(products, item.product_id);
      console.log('🔍 Item:', item, 'Product:', product);
      return {
        ...item,
        product: product
      };
    }),
    total: total
  };

  console.log('✅ Generated bill data:', billData);
  return billData;
};

// BillPreview moved to components/billing/BillPreview.jsx

const Billing = () => {
  const [orders, setOrders] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, dealersData, productsData] = await Promise.all([
        ordersAPI.getAll(),
        dealersAPI.getAll(),
        productsAPI.getAll()
      ]);
      setOrders(ordersData);
      setDealers(dealersData);
      setProducts(productsData);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };



  const downloadBill = async (order) => {
    const billData = await generateBill(order, dealers, products);
    
    // Create bill HTML content
    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - ${billData.billNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; color: #333; }
          .company-details { font-size: 12px; color: #666; margin-top: 10px; }
          .bill-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .dealer-info { margin-bottom: 30px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .items-table th { background-color: #f5f5f5; }
          .total { text-align: right; font-size: 18px; font-weight: bold; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">VINAYAK LAKSHMI</div>
          <div class="company-details">
            Gas Stove Manufacturing & Distribution<br>
            Address: 123 Industrial Area, City - 123456<br>
            GST Number: 22AAAAA0000A1Z5<br>
            Mobile: +91 98765 43210
          </div>
        </div>
        
        <div class="bill-info">
          <div>
            <strong>Bill Number:</strong> ${billData.billNumber}<br>
            <strong>Bill Date:</strong> ${billData.billDate}<br>
            <strong>Order Code:</strong> ${billData.order.order_code}
          </div>
          <div>
            <strong>Dealer:</strong><br>
            ${billData.dealer.firm_name}<br>
            ${billData.dealer.address}<br>
            GST: ${billData.dealer.gstin}<br>
            Mobile: ${billData.dealer.mobile_number}
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${billData.items.map(item => `
              <tr>
                <td>${item.product?.product_name || 'Product'}</td>
                <td>${item.quantity}</td>
                <td>₹${item.unit_price}</td>
                <td>₹${item.quantity * item.unit_price}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total">
          <strong>Total Amount: ₹${billData.total}</strong>
        </div>
        
        <div class="footer">
          Thank you for your business!<br>
          For any queries, please contact us.
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([billHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bill-${billData.billNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const sendBillEmail = async (order) => {
    try {
      setSendingEmail(true);
      
      const dealer = getDealerInfo(dealers, order.dealer_id);
      if (!dealer?.email) {
        const addEmail = window.confirm(
          `Dealer "${dealer?.firm_name || 'Unknown'}" doesn't have an email address.\n\n` +
          `Would you like to add an email address now?`
        );
        
        if (addEmail) {
          const email = prompt('Enter dealer email address:');
          if (email && email.includes('@')) {
            // Here you would typically update the dealer's email in the database
            // For now, we'll use the entered email
            dealer.email = email;
          } else {
            alert('Invalid email address. Please try again.');
            setSendingEmail(false);
            return;
          }
        } else {
          setSendingEmail(false);
          return;
        }
      }

      // Generate bill data
      const billData = await generateBill(order, dealers, products);
      
      // Send email via backend API
      const response = await fetch(`${API_BASE_URL}/billing/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          order_id: order.order_id,
          dealer_email: dealer.email,
          bill_data: billData
        })
      });

      if (response.ok) {
        alert(`Bill sent successfully to ${dealer.email}`);
        // Optimistically mark bill as sent in local state
        setOrders(prev => prev.map(o =>
          o.order_id === order.order_id ? { ...o, bill_sent: true } : o
        ));
      } else {
        // Try to read server's JSON error message for better debugging
        let body = null;
        try {
          body = await response.json();
        } catch (e) {
          // ignore JSON parse errors
        }
        const serverMsg = body && body.message ? body.message : `HTTP ${response.status}`;
        throw new Error(serverMsg || 'Failed to send email');
      }
      
    } catch (error) {
      console.error('Email error:', error);
      alert('Failed to send bill email: ' + error.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const printBill = async (order) => {
    const billData = await generateBill(order, dealers, products);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Bill - ${billData.billNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; color: #333; }
          .company-details { font-size: 12px; color: #666; margin-top: 10px; }
          .bill-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .dealer-info { margin-bottom: 30px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .items-table th { background-color: #f5f5f5; }
          .total { text-align: right; font-size: 18px; font-weight: bold; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">VINAYAK LAKSHMI</div>
          <div class="company-details">
            Gas Stove Manufacturing & Distribution<br>
            Address: 123 Industrial Area, City - 123456<br>
            GST Number: 22AAAAA0000A1Z5<br>
            Mobile: +91 98765 43210
          </div>
        </div>
        
        <div class="bill-info">
          <div>
            <strong>Bill Number:</strong> ${billData.billNumber}<br>
            <strong>Bill Date:</strong> ${billData.billDate}<br>
            <strong>Order Code:</strong> ${billData.order.order_code}
          </div>
          <div>
            <strong>Dealer:</strong><br>
            ${billData.dealer.firm_name}<br>
            ${billData.dealer.address}<br>
            GST: ${billData.dealer.gstin}<br>
            Mobile: ${billData.dealer.mobile_number}
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${billData.items.map(item => `
              <tr>
                <td>${item.product?.product_name || 'Product'}</td>
                <td>${item.quantity}</td>
                <td>₹${item.unit_price}</td>
                <td>₹${item.quantity * item.unit_price}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total">
          <strong>Total Amount: ₹${billData.total}</strong>
        </div>
        
        <div class="footer">
          Thank you for your business!<br>
          For any queries, please contact us.
        </div>
        
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()">Print Bill</button>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const filteredOrders = orders.filter((order) => {
    const dealer = getDealerInfo(dealers, order.dealer_id);
    const matchesSearch =
      order.order_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dealer?.firm_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      order.order_status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading billing data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
      <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🧾 Billing Management</h1>
          <p className="text-gray-600">Generate bills, send emails, and manage invoicing</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
              </div>
            </div>
          </div>

      
<div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
  <div className="flex items-center gap-3">
    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
      <IndianRupee className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-600">Total Value</p>
      <p className="text-2xl font-bold text-gray-800">
        ₹{orders
          .reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0)
          .toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  </div>
</div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-800">
                  {orders.filter(o => o.order_status === 'Pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Dealers</p>
                <p className="text-2xl font-bold text-gray-800">{dealers.length}</p>
              </div>
            </div>
          </div>
      </div>

        {/* Debug Panel */}
        {/* <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">Debug Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Orders:</strong> {orders.length}
              <br />
              <strong>Dealers:</strong> {dealers.length}
              <br />
              <strong>Products:</strong> {products.length}
            </div>
            <div>
              <strong>Sample Order:</strong>
              <br />
              {orders[0] ? (
                <>
                  ID: {orders[0].order_id}<br />
                  Total: ₹{orders[0].total_amount}<br />
                  Dealer: {orders[0].dealer_id}
                </>
              ) : 'No orders'}
            </div>
            <div>
              <strong>Sample Dealer:</strong>
              <br />
              {dealers[0] ? (
                <>
                  ID: {dealers[0].dealer_id}<br />
                  Name: {dealers[0].firm_name}<br />
                  Email: {dealers[0].email || 'No email'}
                </>
              ) : 'No dealers'}
            </div>
          </div>
      </div> */}

        {/* Filters and Search */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
                  placeholder="Search orders, dealers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
          </select>
        </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {filteredOrders.length} of {orders.length} orders
              </span>
            </div>
          </div>
      </div>

        {/* Orders Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
          <div className="overflow-x-auto">
        <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dealer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill Sent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
            </tr>
          </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                                 {filteredOrders.map((order) => {
                   const dealer = getDealerInfo(dealers, order.dealer_id);
                   return (
                    <tr key={order.order_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.order_code}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                </td>
                <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {dealer?.firm_name || 'Unknown Dealer'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {dealer?.mobile_number || 'No contact'}
                          </div>
                        </div>
                </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{order.total_amount?.toLocaleString() || '0'}
                        </div>
                </td>
                <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.order_status === 'Completed' ? 'bg-green-100 text-green-800' :
                          order.order_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.order_status}
                  </span>
                </td>
                <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.bill_sent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {order.bill_sent ? 'Yes' : 'No'}
                        </span>
                </td>
                <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => downloadBill(order)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download Bill"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => printBill(order)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Print Bill"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                                                     <button
                             onClick={() => sendBillEmail(order)}
                             disabled={sendingEmail}
                             className={`p-2 rounded-lg transition-colors ${
                               sendingEmail 
                                 ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                                 : 'text-purple-600 hover:bg-purple-50'
                             }`}
                             title={sendingEmail ? "Sending..." : "Send Email"}
                           >
                             {sendingEmail ? (
                               <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                             ) : (
                               <Mail className="w-4 h-4" />
                             )}
                           </button>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowBillPreview(true);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Preview Bill"
                          >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
                  );
                })}
          </tbody>
        </table>
          </div>
        </div>

        {/* Bill Preview Modal */}
        {showBillPreview && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-800">Bill Preview</h3>
                  <button
                    onClick={() => setShowBillPreview(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <BillPreview order={selectedOrder} dealers={dealers} products={products} />
              </div>

              <BillingActions
                onDownload={() => downloadBill(selectedOrder)}
                onPrint={() => printBill(selectedOrder)}
                onSend={() => sendBillEmail(selectedOrder)}
                disabled={sendingEmail}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Billing;