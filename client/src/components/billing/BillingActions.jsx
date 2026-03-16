import React from "react";
import { Download, Printer, Mail } from "lucide-react";

export default function BillingActions({ onDownload, onPrint, onSend, disabled = false }) {
  return (
    <div className="p-6 border-t border-[#2A2A2A] flex justify-end gap-3">
      <button onClick={onDownload} disabled={disabled}
        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 transition-all duration-100 active:scale-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-zinc-500">
        <Download className="w-4 h-4" /> Download
      </button>
      <button onClick={onPrint} disabled={disabled}
        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 transition-all duration-100 active:scale-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-black">
        <Printer className="w-4 h-4" /> Print
      </button>
      <button onClick={onSend} disabled={disabled}
        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 transition-all duration-100 active:scale-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-zinc-500">
        <Mail className="w-4 h-4" /> Send Email
      </button>
    </div>
  );
}
