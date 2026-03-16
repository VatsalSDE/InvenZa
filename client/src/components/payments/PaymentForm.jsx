import React from "react";

const inp = "w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 placeholder:text-zinc-600";

export default function PaymentForm({
  formData, orders = [], dealers = [], onInputChange,
  onCancel, onSubmit, submitLabel = "Submit", payments = [], disabled = false,
}) {
  const getOrderPaidAmount = (orderId) => {
    return payments
      .filter(p => p.order_id === orderId)
      .reduce((sum, p) => sum + parseFloat(p.paid_amount || 0), 0);
  };

  const filteredOrders = formData.dealer_id
    ? orders.filter(order => {
      if (order.dealer_id !== parseInt(formData.dealer_id)) return false;
      const totalAmount = parseFloat(order.total_amount || 0);
      const paidAmount = getOrderPaidAmount(order.order_id);
      return totalAmount - paidAmount > 0;
    })
    : orders.filter(order => {
      const totalAmount = parseFloat(order.total_amount || 0);
      const paidAmount = getOrderPaidAmount(order.order_id);
      return totalAmount - paidAmount > 0;
    });

  return (
    <form onSubmit={onSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Dealer <span className="text-red-400">*</span></label>
          <select name="dealer_id" value={formData.dealer_id} onChange={onInputChange} required className={inp}>
            <option value="">Select Dealer</option>
            {dealers.map((dealer) => (
              <option key={dealer.dealer_id} value={dealer.dealer_id}>{dealer.firm_name} - {dealer.person_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Order ID (Optional)</label>
          <select name="order_id" value={formData.order_id} onChange={onInputChange} disabled={!formData.dealer_id}
            className={`${inp} disabled:opacity-50 disabled:cursor-not-allowed`}>
            <option value="">
              {!formData.dealer_id ? 'Select Dealer First' : filteredOrders.length === 0 ? 'No Pending Orders' : 'Select Order (Optional)'}
            </option>
            {filteredOrders.map((order) => {
              const totalAmount = parseFloat(order.total_amount || 0);
              const paidAmount = getOrderPaidAmount(order.order_id);
              const remainingAmount = totalAmount - paidAmount;
              return (
                <option key={order.order_id} value={order.order_id}>
                  {order.order_code} - {order.firm_name} (Pending: ₹{remainingAmount.toFixed(2)})
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Payment Method</label>
          <select name="payment_method" value={formData.payment_method} onChange={onInputChange} className={inp}>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Amount (₹)</label>
          <input type="number" name="amount" value={formData.amount} onChange={onInputChange}
            className={inp} placeholder="0.00" step="0.01" min="0" />
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Payment Status</label>
          <select name="payment_status" value={formData.payment_status} onChange={onInputChange} className={inp}>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Payment Date</label>
          <input type="date" name="payment_date" value={formData.payment_date} onChange={onInputChange} className={inp} />
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Reference Number</label>
          <input type="text" name="reference_number" value={formData.reference_number} onChange={onInputChange}
            className={inp} placeholder="Transaction/Cheque number" />
        </div>
      </div>

      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Notes</label>
        <textarea name="notes" value={formData.notes} onChange={onInputChange} rows={3}
          className={inp} placeholder="Additional payment notes..." />
      </div>

      <div className="flex gap-3 pt-2 border-t border-[#2A2A2A]">
        <button type="button" onClick={onCancel} disabled={disabled}
          className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed">
          Cancel
        </button>
        <button type="submit" disabled={disabled}
          className="flex-1 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
