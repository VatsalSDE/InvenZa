import React from "react";
import { Table as DataTable } from "../../components/ui/Table";
import StatusBadge from "../../components/ui/StatusBadge";

export default function OrdersTable({ orders = [] }) {
  const columns = [
    {
      key: 'order_code', header: 'Order', render: (o) => (
        <span className="text-sm font-medium text-white">{o.order_code}</span>
      )
    },
    {
      key: 'firm_name', header: 'Dealer', render: (o) => (
        <span className="text-sm text-zinc-300">{o.firm_name}</span>
      )
    },
    {
      key: 'total_amount', header: 'Amount', render: (o) => (
        <span className="text-sm font-medium text-green-400">₹{parseFloat(o.total_amount || 0).toLocaleString()}</span>
      )
    },
    { key: 'order_status', header: 'Status', render: (o) => <StatusBadge status={o.order_status} /> },
    {
      key: 'created_at', header: 'Date', render: (o) => (
        <span className="text-sm text-zinc-400">{new Date(o.created_at).toLocaleDateString()}</span>
      )
    },
  ];

  return <DataTable columns={columns} data={orders} keyField="order_id" />;
}
