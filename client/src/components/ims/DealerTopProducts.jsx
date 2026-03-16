import React, { useState, useEffect } from "react";
import { Package } from "lucide-react";
import { dealersAPI } from "../../services/api";

const DealerTopProducts = ({ dealerId }) => {
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!dealerId) return;
        const fetchTopProducts = async () => {
            try {
                setLoading(true);
                setError(false);
                const products = await dealersAPI.getDealerTopProducts(dealerId);
                setTopProducts(products || []);
            } catch (err) {
                console.error("Failed to load dealer top products:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchTopProducts();
    }, [dealerId]);

    if (loading) {
        return (
            <div className="mt-4 border-t border-[#2A2A2A] pt-4">
                <div className="flex items-center gap-2 mb-2">
                    <Package className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-xs font-medium text-zinc-400">Top Products</span>
                </div>
                <div className="flex gap-2">
                    <div className="h-6 w-20 bg-[#2A2A2A] animate-pulse rounded-full"></div>
                    <div className="h-6 w-24 bg-[#2A2A2A] animate-pulse rounded-full"></div>
                    <div className="h-6 w-16 bg-[#2A2A2A] animate-pulse rounded-full"></div>
                </div>
            </div>
        );
    }

    if (error || topProducts.length === 0) {
        return null;
    }

    return (
        <div className="mt-4 border-t border-[#2A2A2A] pt-4">
            <div className="flex items-center gap-2 mb-2">
                <Package className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-medium text-zinc-300">Top Purchased Products</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {topProducts.map((p, i) => (
                    <span key={p.product_id || i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#222222] border border-[#2A2A2A] text-xs font-medium text-white shadow-sm">
                        {p.product_name}
                        <span className="text-green-400">({p.total_quantity})</span>
                    </span>
                ))}
            </div>
        </div>
    );
};

export default DealerTopProducts;
