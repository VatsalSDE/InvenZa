import React from "react";
import { Table as DataTable } from "../../components/ui/Table";

export default function DealersTable({ dealers = [], calculateDealerBalance, formatCurrency }) {
  const columns = [
    { key: 'firm_name', header: 'Firm' },
    { key: 'person_name', header: 'Person' },
    { key: 'contact', header: 'Contact', render: (d) => (
      <span>
        {d.mobile_number}
        <br />
        <span className="text-sm text-gray-500">{d.email}</span>
      </span>
    )},
    { key: 'gstin', header: 'GST' },
    { key: 'dealer_code', header: 'Code' },
    { key: 'balance', header: 'Balance', render: (d) => {
      const b = calculateDealerBalance ? calculateDealerBalance(d.dealer_id) : { remainingBalance: 0 };
      return <span className="font-semibold text-gray-900">{formatCurrency ? formatCurrency(b.remainingBalance) : b.remainingBalance}</span>;
    }},
  ];

  return (
    <DataTable columns={columns} data={dealers} keyField="dealer_id" />
  );
}


