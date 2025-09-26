import React, { useState, useEffect } from "react";

export default function BillPreview({ order, dealers, products, generateBill }) {
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBillData = async () => {
      try {
        const data = await generateBill(order, dealers, products);
        setBillData(data);
      } catch (error) {
        console.error('Failed to generate bill:', error);
      } finally {
        setLoading(false);
      }
    };
    loadBillData();
  }, [order, dealers, products, generateBill]);

  if (loading) return <div>Loading bill data...</div>;
  if (!billData) return <div>Failed to load bill data</div>;

  return (
    <div className="space-y-6">
      <div className="text-center border-b-2 border-gray-300 pb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">VINAYAK LAKSHMI</h1>
        <p className="text-gray-600">Gas Stove Manufacturing & Distribution</p>
        <p className="text-gray-600">Address: 123 Industrial Area, City - 123456</p>
        <p className="text-gray-600">GST Number: 22AAAAA0000A1Z5</p>
        <p className="text-gray-600">Mobile: +91 98765 43210</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Bill Information</h3>
          <p><strong>Bill Number:</strong> {billData.billNumber}</p>
          <p><strong>Bill Date:</strong> {billData.billDate}</p>
          <p><strong>Order Code:</strong> {billData.order.order_code}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Dealer Information</h3>
          <p><strong>Name:</strong> {billData.dealer.firm_name}</p>
          <p><strong>Address:</strong> {billData.dealer.address}</p>
          <p><strong>GST:</strong> {billData.dealer.gstin}</p>
          <p><strong>Mobile:</strong> {billData.dealer.mobile_number}</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Order Items</h3>
        <table className="w-full border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">Product</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Quantity</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Unit Price</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Total</th>
            </tr>
          </thead>
          <tbody>
            {billData.items.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-300 px-4 py-2">
                  {item.product?.product_name || 'Product'}
                </td>
                <td className="border border-gray-300 px-4 py-2">{item.quantity}</td>
                <td className="border border-gray-300 px-4 py-2">₹{item.unit_price}</td>
                <td className="border border-gray-300 px-4 py-2">₹{item.quantity * item.unit_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-right">
        <h3 className="text-xl font-bold text-gray-800">Total Amount: ₹{billData.total.toLocaleString()}</h3>
      </div>

      <div className="text-center text-gray-600 border-t border-gray-300 pt-6">
        <p>Thank you for your business!</p>
        <p>For any queries, please contact us.</p>
      </div>
    </div>
  );
}


