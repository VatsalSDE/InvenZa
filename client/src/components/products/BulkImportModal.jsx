import React, { useMemo, useState } from 'react';

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cols[i] ?? ''; });
    return obj;
  });
  return { headers, rows };
}

export default function BulkImportModal({ isOpen, onClose, onImport, sample, busy }) {
  const [text, setText] = useState('');

  const parsed = useMemo(() => parseCsv(text), [text]);

  const requiredHeaders = ['product_name','category','no_burners','type_burner','price','quantity','min_stock_level'];
  const missingHeaders = requiredHeaders.filter(h => !parsed.headers.includes(h));

  const errors = [];
  parsed.rows.forEach((r, idx) => {
    const row = idx + 2; // header is line 1
    if (!r.product_name || r.product_name.length < 3) errors.push(`Row ${row}: invalid product_name`);
    const price = Number(r.price);
    if (!(price > 0)) errors.push(`Row ${row}: price must be > 0`);
    const qty = Number(r.quantity);
    if (!(qty >= 0)) errors.push(`Row ${row}: quantity must be >= 0`);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800">Bulk Import Products (CSV)</h2>
          <button onClick={onClose} className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700">Close</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">Paste CSV with headers: product_name, category, no_burners, type_burner, price, quantity, min_stock_level</p>
          <div className="flex gap-3">
            <button onClick={() => setText(sample)} className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm">Load Sample</button>
            <a
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(sample)}`}
              download="products_sample.csv"
              className="px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm"
            >
              Download Sample
            </a>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="product_name,category,no_burners,type_burner,price,quantity,min_stock_level\nSteel Stove,steel,2,Brass,1999,10,10"
            className="w-full h-56 p-3 border border-gray-200 rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          {missingHeaders.length > 0 && (
            <div className="text-sm text-red-600">Missing headers: {missingHeaders.join(', ')}</div>
          )}
          {errors.length > 0 && (
            <div className="text-sm text-red-600 space-y-1">
              {errors.slice(0, 8).map((e, i) => (<div key={i}>{e}</div>))}
              {errors.length > 8 && (<div>+{errors.length - 8} more…</div>)}
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">Cancel</button>
          <button
            disabled={busy || missingHeaders.length > 0 || errors.length > 0 || parsed.rows.length === 0}
            onClick={() => onImport(parsed.rows)}
            className={`px-4 py-2 rounded-xl text-white ${busy || missingHeaders.length > 0 || errors.length > 0 || parsed.rows.length === 0 ? 'bg-emerald-400/50' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >{busy ? 'Importing…' : 'Import'}</button>
        </div>
      </div>
    </div>
  );
}


