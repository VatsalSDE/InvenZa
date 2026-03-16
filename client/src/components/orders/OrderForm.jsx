import React from "react";
import { X } from "lucide-react";

const inp = "w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 placeholder:text-zinc-600";

export default function OrderForm({
  formData, dealers = [], products = [], onInputChange, onItemChange,
  onAddItem, onRemoveItem, calculateTotal, onCancel, onSubmit,
  submitLabel = "Submit", disabled = false,
}) {
  return (
    <form onSubmit={onSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Order Code</label>
          <input type="text" name="order_code" value={formData.order_code} onChange={onInputChange}
            className={inp} placeholder="Leave empty for auto-generation" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Dealer <span className="text-red-400">*</span></label>
          <select name="dealer_id" value={formData.dealer_id} onChange={onInputChange} className={inp} required>
            <option value="">Select Dealer</option>
            {dealers.map((dealer) => (
              <option key={dealer.dealer_id} value={dealer.dealer_id}>{dealer.firm_name} - {dealer.person_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Order Status</label>
          <select name="order_status" value={formData.order_status} onChange={onInputChange} className={inp}>
            <option value="Pending">Pending</option>
            <option value="Shipping">Shipping</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Delivery Date</label>
          <input type="date" name="delivery_date" value={formData.delivery_date} onChange={onInputChange} className={inp} />
        </div>
      </div>

      <div className="border-t border-[#2A2A2A] pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-white">Order Items <span className="text-red-400">*</span></label>
          <button type="button" onClick={onAddItem} className="text-sm text-green-400 hover:text-green-300">+ Add Item</button>
        </div>
        <div className="space-y-2">
          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 bg-[#222222] border border-[#2A2A2A] rounded-xl">
              <div>
                <label className="text-[10px] text-zinc-600 mb-0.5 block">Product</label>
                <select value={item.product_id} onChange={(e) => onItemChange(index, 'product_id', e.target.value)} className={inp} required>
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.product_name} - ₹{product.price} (Stock: {product.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-zinc-600 mb-0.5 block">Quantity</label>
                <input type="number" value={item.quantity} onChange={(e) => onItemChange(index, 'quantity', e.target.value)}
                  className={inp} placeholder="0" required />
              </div>
              <div>
                <label className="text-[10px] text-zinc-600 mb-0.5 block">Unit Price</label>
                <input type="number" value={item.unit_price} onChange={(e) => onItemChange(index, 'unit_price', e.target.value)}
                  className={inp} placeholder="0.00" required />
              </div>
              <div className="flex items-end">
                <button type="button" onClick={() => onRemoveItem(index)} disabled={formData.items.length === 1}
                  className="w-full px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#222222] border border-[#2A2A2A] rounded-xl p-4 flex items-center justify-between">
        <span className="text-sm text-zinc-400">Total Amount</span>
        <span className="text-xl font-bold text-green-400">₹{calculateTotal().toLocaleString()}</span>
      </div>

      <div className="flex gap-3 pt-2 border-t border-[#2A2A2A]">
        <button type="button" onClick={onCancel} disabled={disabled}
          className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
        <button type="submit" disabled={disabled}
          className="flex-1 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}