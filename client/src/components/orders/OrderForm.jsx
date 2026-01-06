import React from "react";

export default function OrderForm({
  formData,
  dealers = [],
  products = [],
  onInputChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  calculateTotal,
  onCancel,
  onSubmit,
  submitLabel = "Submit",
  disabled = false,
}) {
  return (
    <form onSubmit={onSubmit} className="p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">Order Code</label>
          <input
            type="text"
            name="order_code"
            value={formData.order_code}
            onChange={onInputChange}
            className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg"
            placeholder="Leave empty for auto-generation"
          />
        </div>
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">Dealer <span className="text-red-500">*</span></label>
          <select
            name="dealer_id"
            value={formData.dealer_id}
            onChange={onInputChange}
            className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg"
            required
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
          <label className="block text-lg font-semibold text-gray-700 mb-3">Order Status</label>
          <select
            name="order_status"
            value={formData.order_status}
            onChange={onInputChange}
            className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg"
          >
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">Delivery Date</label>
          <input
            type="date"
            name="delivery_date"
            value={formData.delivery_date}
            onChange={onInputChange}
            className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-lg font-semibold text-gray-700">
            Order Items <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={onAddItem}
            className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
          >
            + Add Item
          </button>
        </div>
        <div className="space-y-4">
          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                <select
                  value={item.product_id}
                  onChange={(e) => onItemChange(index, 'product_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.product_name} - ₹{product.price} (Stock: {product.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => onItemChange(index, 'quantity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price</label>
                <input
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => onItemChange(index, 'unit_price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => onRemoveItem(index)}
                  disabled={formData.items.length === 1}
                  className="px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
        <div className="flex items-center justify-between">
          <label className="block text-lg font-semibold text-blue-700">Total Amount</label>
          <div className="text-3xl font-bold text-blue-600">₹{calculateTotal().toLocaleString()}</div>
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-gray-100">
        <button type="button" onClick={onCancel} disabled={disabled} className="flex-1 px-6 py-4 border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
          Cancel
        </button>
        <button type="submit" disabled={disabled} className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-colors shadow-lg text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}