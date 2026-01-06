import React from "react";

export default function PaymentForm({
  formData,
  orders = [],
  dealers = [],
  onInputChange,
  onCancel,
  onSubmit,
  submitLabel = "Submit",
  payments = [],
  disabled = false,
}) {
  // Calculate total paid amount for each order
  const getOrderPaidAmount = (orderId) => {
    return payments
      .filter(p => p.order_id === orderId)
      .reduce((sum, p) => sum + parseFloat(p.paid_amount || 0), 0);
  };

  // Filter orders based on selected dealer and payment status
  const filteredOrders = formData.dealer_id 
    ? orders.filter(order => {
        if (order.dealer_id !== parseInt(formData.dealer_id)) return false;
        
        const totalAmount = parseFloat(order.total_amount || 0);
        const paidAmount = getOrderPaidAmount(order.order_id);
        const remainingAmount = totalAmount - paidAmount;
        
        // Only show orders with remaining balance
        return remainingAmount > 0;
      })
    : orders.filter(order => {
        const totalAmount = parseFloat(order.total_amount || 0);
        const paidAmount = getOrderPaidAmount(order.order_id);
        return totalAmount - paidAmount > 0;
      });

  return (
    <form onSubmit={onSubmit} className="p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Dealer <span className="text-red-500">*</span>
          </label>
          <select
            name="dealer_id"
            value={formData.dealer_id}
            onChange={onInputChange}
            required
            className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg"
          >
            <option value="">Select Dealer</option>
            {dealers.map((dealer) => (
              <option key={dealer.dealer_id} value={dealer.dealer_id}>
                {dealer.firm_name} - {dealer.person_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Order ID (Optional)
          </label>
          <select
            name="order_id"
            value={formData.order_id}
            onChange={onInputChange}
            disabled={!formData.dealer_id}
            className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
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
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Payment Method
          </label>
          <select
            name="payment_method"
            value={formData.payment_method}
            onChange={onInputChange}
            className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg"
          >
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
          </select>
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Amount (₹)
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={onInputChange}
            className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg"
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Payment Status
          </label>
          <select
            name="payment_status"
            value={formData.payment_status}
            onChange={onInputChange}
            className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg"
          >
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Payment Date
          </label>
          <input
            type="date"
            name="payment_date"
            value={formData.payment_date}
            onChange={onInputChange}
            className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg"
          />
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Reference Number
          </label>
          <input
            type="text"
            name="reference_number"
            value={formData.reference_number}
            onChange={onInputChange}
            className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg"
            placeholder="Transaction/Cheque number"
          />
        </div>
      </div>

      <div>
        <label className="block text-lg font-semibold text-gray-700 mb-3">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={onInputChange}
          rows={4}
          className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg"
          placeholder="Additional payment notes..."
        />
      </div>

      <div className="flex gap-4 pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="flex-1 px-6 py-4 border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-colors shadow-lg text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
