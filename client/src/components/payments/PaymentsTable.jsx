import React from "react";
import { Table as DataTable } from "../../components/ui/Table";
import { CheckCircle, Clock } from "lucide-react";

function getStatusColor(status) {
  switch (status) {
    case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'Completed': return <CheckCircle className="w-4 h-4" />;
    case 'Pending': return <Clock className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
}

export default function PaymentsTable({ payments = [] }) {
  const columns = [
    { key: 'reference_number', header: 'Reference' },
    { key: 'dealer_name', header: 'Dealer' },
    { key: 'payment_method', header: 'Method' },
    { key: 'paid_amount', header: 'Amount', render: (p) => `₹${parseFloat(p.paid_amount || 0).toLocaleString()}` },
    { key: 'payment_status', header: 'Status', render: (p) => (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(p.payment_status || 'Completed')}`}>
        {getStatusIcon(p.payment_status || 'Completed')}
        {p.payment_status || 'Completed'}
      </span>
    )},
    { key: 'payment_date', header: 'Date', render: (p) => new Date(p.payment_date).toLocaleDateString() },
  ];

  return (
    <DataTable columns={columns} data={payments} keyField="payment_id" />
  );
}


