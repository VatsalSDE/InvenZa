import React from "react";
import { Table as DataTable } from "../../components/ui/Table";
import { CheckCircle, Clock, AlertCircle, Truck, FileText } from "lucide-react";

function getStatusColor(status) {
  switch (status) {
    case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Processing': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'Pending': return <Clock className="w-4 h-4" />;
    case 'Processing': return <FileText className="w-4 h-4" />;
    case 'Shipped': return <Truck className="w-4 h-4" />;
    case 'Completed': return <CheckCircle className="w-4 h-4" />;
    case 'Cancelled': return <AlertCircle className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
}

export default function OrdersTable({ orders = [] }) {
  const columns = [
    { key: 'order_code', header: 'Order' },
    { key: 'firm_name', header: 'Dealer' },
    { key: 'total_amount', header: 'Amount', render: (o) => `₹${parseFloat(o.total_amount || 0).toLocaleString()}` },
    { key: 'order_status', header: 'Status', render: (o) => (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(o.order_status)}`}>
        {getStatusIcon(o.order_status)}
        {o.order_status}
      </span>
    )},
    { key: 'created_at', header: 'Date', render: (o) => new Date(o.created_at).toLocaleDateString() },
  ];

  return (
    <DataTable columns={columns} data={orders} keyField="order_id" />
  );
}


