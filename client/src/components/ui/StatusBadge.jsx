import React from "react";

const statusStyles = {
    // General
    'completed': 'bg-green-500/15 text-green-400 border border-green-500/20',
    'delivered': 'bg-green-500/15 text-green-400 border border-green-500/20',
    'in stock': 'bg-green-500/15 text-green-400 border border-green-500/20',
    'active': 'bg-green-500/15 text-green-400 border border-green-500/20',
    'paid': 'bg-green-500/15 text-green-400 border border-green-500/20',
    'received': 'bg-green-500/15 text-green-400 border border-green-500/20',
    'sent': 'bg-green-500/15 text-green-400 border border-green-500/20',
    'success': 'bg-green-500/15 text-green-400 border border-green-500/20',

    'pending': 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
    'in transit': 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
    'partial': 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
    'processing': 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
    'shipping': 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    'shipped': 'bg-blue-500/15 text-blue-400 border border-blue-500/20',

    'low stock': 'bg-red-500/15 text-red-400 border border-red-500/20',
    'out of stock': 'bg-red-500/15 text-red-400 border border-red-500/20',
    'overdue': 'bg-red-500/15 text-red-400 border border-red-500/20',
    'danger': 'bg-red-500/15 text-red-400 border border-red-500/20',
    'unpaid': 'bg-red-500/15 text-red-400 border border-red-500/20',

    'info': 'bg-blue-500/15 text-blue-400 border border-blue-500/20',

    'archived': 'bg-zinc-700/50 text-zinc-500 border border-zinc-700',
    'inactive': 'bg-zinc-700/50 text-zinc-500 border border-zinc-700',
    'draft': 'bg-zinc-700/50 text-zinc-500 border border-zinc-700',

    // Payment methods
    'cash': 'bg-zinc-700/50 text-zinc-400 border border-zinc-700',
    'upi': 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    'neft': 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
    'cheque': 'bg-orange-500/15 text-orange-400 border border-orange-500/20',

    // Debit/Credit
    'debit': 'bg-red-500/15 text-red-400 border border-red-500/20',
    'credit': 'bg-green-500/15 text-green-400 border border-green-500/20',
};

const StatusBadge = ({ status, className = "" }) => {
    const key = (status || "").toLowerCase();
    const style = statusStyles[key] || 'bg-zinc-700/50 text-zinc-400 border border-zinc-700';

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style} ${className}`}>
            {status}
        </span>
    );
};

export default StatusBadge;
