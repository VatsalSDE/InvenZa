import React from "react";

export default function PaymentForm({
  formData,
  orders = [],
  onInputChange,
  onCancel,
  onSubmit,
  submitLabel = "Submit",
}) {
  return (
    <form onSubmit={onSubmit} className="p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Order ID
          </label>
          <select
            name="order_id"
            value={formData.order_id}
            onChange={onInputChange}
            className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg"
          >
            <option value="">Select Order</option>
            {orders.map((order) => (
              <option key={order.order_id} value={order.order_id}>
                {order.order_code} - {order.firm_name} (₹{order.total_amount})
              </option>
            ))}
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
          className="flex-1 px-6 py-4 border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors text-lg font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-colors shadow-lg text-lg font-semibold"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
