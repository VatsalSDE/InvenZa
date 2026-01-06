import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const defaultActions = (navigate) => ([
  { id: 'goto-dashboard', label: 'Go to Dashboard', run: () => navigate('/admin/dashboard'), keywords: 'home dashboard' },
  { id: 'goto-products', label: 'Go to Products', run: () => navigate('/admin/products'), keywords: 'inventory items skus' },
  { id: 'goto-orders', label: 'Go to Orders', run: () => navigate('/admin/orders'), keywords: 'sales orders' },
  { id: 'goto-payments', label: 'Go to Payments', run: () => navigate('/admin/payments'), keywords: 'billing payments' },
  { id: 'goto-dealers', label: 'Go to Dealers', run: () => navigate('/admin/dealers'), keywords: 'customers partners' },
  { id: 'create-product', label: 'Create Product', run: () => navigate('/admin/products?new=1'), keywords: 'add product' },
  { id: 'create-order', label: 'Create Order', run: () => navigate('/admin/orders?new=1'), keywords: 'add order' },
  { id: 'create-payment', label: 'Add Payment', run: () => navigate('/admin/payments?new=1'), keywords: 'add payment' },
]);

export default function CommandPalette({ isOpen, onClose, actions }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const base = actions && actions.length ? actions : defaultActions(navigate);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(a => a.label.toLowerCase().includes(q) || (a.keywords || '').includes(q));
  }, [actions, navigate, query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const run = (fn) => {
    try { fn?.(); } finally { onClose?.(); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-24 -translate-x-1/2 w-full max-w-2xl">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
          <div className="p-3 border-b border-gray-100">
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type a command or search…"
              className="w-full outline-none text-gray-800 placeholder-gray-400 p-3 rounded-xl bg-gray-50 focus:bg-white"
            />
          </div>
          <div className="max-h-80 overflow-auto">
            {items.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No matches</div>
            ) : (
              items.map(item => (
                <button
                  key={item.id}
                  onClick={() => run(item.run)}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 focus:bg-indigo-50 transition-colors"
                >
                  <div className="font-medium text-gray-800">{item.label}</div>
                  {item.hint && <div className="text-xs text-gray-500">{item.hint}</div>}
                </button>
              ))
            )}
          </div>
          <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100 bg-gray-50">
            Tip: Press Esc to close • Use ↑/↓ then Enter (mouse also works)
          </div>
        </div>
      </div>
    </div>
  );
}


