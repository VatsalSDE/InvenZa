import React from "react";
import { Table as DataTable } from "../../components/ui/Table";
import StatusBadge from "../../components/ui/StatusBadge";

export default function PaymentsTable({ payments = [] }) {
  const columns = [
    {
      key: 'reference_number', header: 'Reference', render: (p) => (
        <span className="text-sm font-medium text-white">{p.reference_number || '—'}</span>
      )
    },
    {
      key: 'dealer_name', header: 'Dealer', render: (p) => (
        <span className="text-sm text-zinc-300">{p.dealer_name || p.firm_name || '—'}</span>
      )
    },
    { key: 'payment_method', header: 'Method', render: (p) => <StatusBadge status={p.payment_method || 'N/A'} /> },
    {
      key: 'paid_amount', header: 'Amount', render: (p) => (
        <span className="text-sm font-medium text-green-400">₹{parseFloat(p.paid_amount || 0).toLocaleString()}</span>
      )
    },
    { key: 'payment_status', header: 'Status', render: (p) => <StatusBadge status={p.payment_status || 'Completed'} /> },
    {
      key: 'payment_date', header: 'Date', render: (p) => (
        <span className="text-sm text-zinc-400">{new Date(p.payment_date).toLocaleDateString()}</span>
      )
    },
  ];

  return <DataTable columns={columns} data={payments} keyField="payment_id" />;
}
