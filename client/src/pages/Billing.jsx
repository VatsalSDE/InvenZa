import React, { useState, useEffect, useCallback } from "react";
import {
  X, Search, FileText, Download, Printer, Mail, Eye, IndianRupee,
  CheckCircle, Clock, ShoppingCart, Receipt,
} from "lucide-react";
import { ordersAPI, dealersAPI, productsAPI, paymentsAPI } from "../services/api";
import PageHeader from "../components/ims/PageHeader";
import StatsCard from "../components/ims/StatsCard";
import StatusBadge from "../components/ui/StatusBadge";
import OrbitalLoader from "../components/ui/OrbitalLoader";
import BillingActions from "../components/billing/BillingActions";
import { billingAPI } from "../services/api";

const Billing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [products, setProducts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [billData, setBillData] = useState(null);
  const [generatingBill, setGeneratingBill] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, dealersData, productsData, paymentsData] = await Promise.all([
        ordersAPI.getAll(), dealersAPI.getAll(), productsAPI.getAll(), paymentsAPI.getAll()
      ]);
      setOrders(ordersData); setDealers(dealersData); setProducts(productsData); setPayments(paymentsData);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const getDealer = (dealerId) => dealers.find(d => d.dealer_id === dealerId) || {};
  const formatCurrency = (amt) => `₹${Number(amt || 0).toLocaleString("en-IN")}`;

  const getOrderPaymentStatus = (orderId, totalAmount) => {
    const orderPayments = payments.filter(p => p.order_id === orderId);
    const totalPaid = orderPayments.reduce((sum, p) => sum + parseFloat(p.paid_amount || 0), 0);
    const remaining = parseFloat(totalAmount) - totalPaid;
    return { totalPaid, remaining, isFullyPaid: remaining <= 0.01 };
  };

  const generateBill = useCallback(async (order) => {
    try {
      setGeneratingBill(true);
      const items = await ordersAPI.getItems(order.order_id);
      const dealer = getDealer(order.dealer_id);

      const billNumber = `BILL-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      const enrichedItems = items.map(item => {
        const product = products.find(p => p.product_id === item.product_id);
        return { ...item, product };
      });

      const data = {
        billNumber, billDate: new Date().toLocaleDateString(), order, dealer,
        items: enrichedItems, total: parseFloat(order.total_amount || 0),
        paymentStatus: getOrderPaymentStatus(order.order_id, order.total_amount)
      };

      setBillData(data);
      setSelectedOrder(order);
      setShowPreview(true);
    } catch (err) {
      console.error('Failed to generate bill:', err); setError('Failed to generate bill.');
    } finally { setGeneratingBill(false); }
  }, [dealers, products, payments]);

  const handleDownload = () => {
    if (!billData) return;
    const html = generateBillHTML(billData);
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${billData.billNumber}.html`; a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!billData) return;
    const html = generateBillHTML(billData);
    const win = window.open('', '_blank');
    win.document.write(html); win.document.close(); win.print();
  };

  const handleSendEmail = async () => {
    if (!billData || !selectedOrder) return;
    try {
      setSendingEmail(true);
      await billingAPI.sendEmail({
        order_id: selectedOrder.order_id,
        dealer_email: billData.dealer?.email
      });
      alert(`Bill sent successfully to ${billData.dealer?.email}`);
    } catch (err) {
      console.error('Failed to send email:', err);
      alert('Failed to send email. Please check SMTP configuration.');
    } finally {
      setSendingEmail(false);
    }
  };

  const generateBillHTML = (data) => {
    return `<!DOCTYPE html><html><head><title>${data.billNumber}</title>
    <style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#333}
    .header{text-align:center;border-bottom:3px solid #16a34a;padding-bottom:20px;margin-bottom:30px}
    .header h1{color:#16a34a;margin:0;font-size:28px}.header p{color:#666;margin:4px 0}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:30px}
    .info-section h3{color:#16a34a;margin-bottom:10px;font-size:14px;text-transform:uppercase;letter-spacing:1px}
    .info-section p{margin:4px 0;font-size:14px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{background:#f0fdf4;color:#16a34a;padding:12px;text-align:left;font-size:13px;text-transform:uppercase;letter-spacing:0.5px}
    td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px}
    .total{text-align:right;font-size:20px;font-weight:bold;color:#16a34a;padding:20px 0;border-top:3px solid #16a34a}
    .footer{text-align:center;color:#999;font-size:12px;margin-top:40px;padding-top:20px;border-top:1px solid #ddd}
    @media print{body{padding:20px}}</style></head><body>
    <div class="header"><h1>VINAYAK LAKSHMI</h1><p>Gas Stove Manufacturing & Distribution</p>
    <p>GSTIN: 22AAAAA0000A1Z5 | Mobile: +91 98765 43210</p></div>
    <div class="info-grid"><div class="info-section"><h3>Bill Details</h3><p><strong>Bill#:</strong> ${data.billNumber}</p>
    <p><strong>Date:</strong> ${data.billDate}</p><p><strong>Order:</strong> ${data.order.order_code}</p></div>
    <div class="info-section"><h3>Billed To</h3><p><strong>${data.dealer.firm_name || 'N/A'}</strong></p>
    <p>${data.dealer.address || ''}</p><p>GSTIN: ${data.dealer.gstin || 'N/A'}</p>
    <p>Mobile: ${data.dealer.mobile_number || 'N/A'}</p></div></div>
    <table><thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>
    ${data.items.map(item => `<tr><td>${item.product?.product_name || 'Product'}</td>
    <td>${item.quantity}</td><td>₹${parseFloat(item.unit_price).toLocaleString()}</td>
    <td>₹${(item.quantity * item.unit_price).toLocaleString()}</td></tr>`).join('')}
    </tbody></table><div class="total">Total: ₹${data.total.toLocaleString()}</div>
    <div class="footer"><p>Thank you for your business!</p><p>For queries contact us at info@vinayaklakshmi.com</p></div>
    </body></html>`;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.firm_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const paymentStatus = getOrderPaymentStatus(order.order_id, order.total_amount);
    
    if (statusFilter === "billed") return matchesSearch && paymentStatus.isFullyPaid;
    if (statusFilter === "unbilled") return matchesSearch && !paymentStatus.isFullyPaid;
    
    const matchesStatus = statusFilter === "all" || 
      (order.order_status || '').toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const totalOrders = orders.length;
  const totalBilled = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.paid_amount || 0), 0);
  const totalOutstanding = totalBilled - totalPaid;

  if (loading) return (
    <div className="min-h-screen bg-[#0F0F0F] p-6 flex items-center justify-center">
      <OrbitalLoader message="Loading billing..." />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F0F0F] p-6">
      <PageHeader title="Billing" subtitle="Generate and manage bills for customer orders" icon={Receipt} count={totalOrders} />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Orders" value={totalOrders} icon={ShoppingCart} accentColor="blue" />
        <StatsCard title="Total Billed" value={formatCurrency(totalBilled)} icon={IndianRupee} accentColor="green" />
        <StatsCard title="Total Collected" value={formatCurrency(totalPaid)} icon={CheckCircle} accentColor="green" />
        <StatsCard title="Outstanding" value={formatCurrency(Math.max(0, totalOutstanding))} icon={Clock} accentColor="red" />
      </div>

      {/* Controls */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
            <input type="text" placeholder="Search by order code or dealer..."
              className="w-full pl-10 pr-4 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 placeholder:text-zinc-600"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50">
            <option value="all">All Orders</option>
            <option value="billed">Fully Paid</option>
            <option value="unbilled">Outstanding</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Order</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Dealer</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Amount</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Paid</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Balance</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Bill Sent</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-zinc-600 text-sm">No orders found</td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const paymentStatus = getOrderPaymentStatus(order.order_id, order.total_amount);
                  return (
                    <tr key={order.order_id} className="border-b border-[#1F1F1F] hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-white">{order.order_code}</p>
                        <p className="text-xs text-zinc-600">{new Date(order.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-300">{order.firm_name}</td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-white">{formatCurrency(order.total_amount)}</td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-green-400">{formatCurrency(paymentStatus.totalPaid)}</td>
                      <td className="py-3 px-4 text-sm text-right">
                        <span className={`font-medium ${paymentStatus.remaining > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {formatCurrency(Math.abs(paymentStatus.remaining))}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center"><StatusBadge status={order.order_status} /></td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${order.bill_sent ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {order.bill_sent ? 'Sent' : 'Not Sent'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => generateBill(order)} disabled={generatingBill}
                          className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/20 disabled:opacity-50 transition-all duration-100 active:scale-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center gap-1 ml-auto">
                          <FileText className="w-3 h-3" /> Generate Bill
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Preview Modal */}
      {showPreview && billData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
              <div>
                <h2 className="text-lg font-semibold text-white">Bill Preview</h2>
                <p className="text-xs text-zinc-500 mt-1">{billData.billNumber}</p>
              </div>
              <button onClick={() => setShowPreview(false)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bill Content (light theme for print-friendliness) */}
            <div className="p-6">
              <div className="bg-white rounded-xl p-6 text-gray-800">
                {/* Header */}
                <div className="text-center border-b-2 border-green-500 pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-gray-800">VINAYAK LAKSHMI</h1>
                  <p className="text-gray-500 text-sm">Gas Stove Manufacturing & Distribution</p>
                  <p className="text-gray-500 text-xs mt-1">GSTIN: 22AAAAA0000A1Z5 | Mobile: +91 98765 43210</p>
                </div>

                {/* Bill + Dealer Info */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Bill Details</h3>
                    <p className="text-sm"><strong>Bill#:</strong> {billData.billNumber}</p>
                    <p className="text-sm"><strong>Date:</strong> {billData.billDate}</p>
                    <p className="text-sm"><strong>Order:</strong> {billData.order.order_code}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Billed To</h3>
                    <p className="text-sm font-semibold">{billData.dealer.firm_name || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{billData.dealer.address || ''}</p>
                    <p className="text-sm text-gray-600">GSTIN: {billData.dealer.gstin || 'N/A'}</p>
                  </div>
                </div>

                {/* Items */}
                <table className="w-full mb-4">
                  <thead>
                    <tr className="bg-green-50">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-green-700 uppercase">Product</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-green-700 uppercase">Qty</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-green-700 uppercase">Price</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-green-700 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billData.items.map((item, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-sm">{item.product?.product_name || 'Product'}</td>
                        <td className="py-2 px-3 text-sm text-center">{item.quantity}</td>
                        <td className="py-2 px-3 text-sm text-right">₹{parseFloat(item.unit_price).toLocaleString()}</td>
                        <td className="py-2 px-3 text-sm text-right font-medium">₹{(item.quantity * item.unit_price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="text-right border-t-2 border-green-500 pt-4">
                  <span className="text-xl font-bold text-gray-800">Total: ₹{billData.total.toLocaleString()}</span>
                </div>

                <div className="text-center text-gray-400 text-xs mt-6 pt-4 border-t border-gray-200">
                  <p>Thank you for your business!</p>
                </div>
              </div>
            </div>

            <BillingActions onDownload={handleDownload} onPrint={handlePrint} onSend={handleSendEmail} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;