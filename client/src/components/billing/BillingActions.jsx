import React from "react";
import { Download, Printer, Mail } from "lucide-react";

export default function BillingActions({ onDownload, onPrint, onSend, disabled = false }) {
  return (
    <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
      <button
        onClick={onDownload}
        disabled={disabled}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        Download
      </button>
      <button
        onClick={onPrint}
        disabled={disabled}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Printer className="w-4 h-4" />
        Print
      </button>
      <button
        onClick={onSend}
        disabled={disabled}
        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Mail className="w-4 h-4" />
        Send Email
      </button>
    </div>
  );
}


