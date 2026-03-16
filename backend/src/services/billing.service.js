import nodemailer from 'nodemailer';
import supabase from '../config/supabase.js';
import * as ordersService from './orders.service.js';

/**
 * Billing Service
 * Handles bill generation and email sending
 */

/**
 * Create email transporter
 * @returns {Object} Nodemailer transporter
 */
const createTransporter = () => {
  const {
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_SECURE,
    EMAIL_SERVICE,
    EMAIL_USER,
    EMAIL_PASS,
  } = process.env;

  // Prefer custom SMTP if host is provided
  if (EMAIL_HOST) {
    return nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT ? Number(EMAIL_PORT) : 587,
      secure: (EMAIL_SECURE || '').toLowerCase() === 'true',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
  }

  // Fallback to nodemailer service (e.g., gmail, outlook)
  return nodemailer.createTransport({
    service: EMAIL_SERVICE || 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
};

/**
 * Generate HTML bill content
 * @param {Object} billData - Bill data
 * @returns {string} HTML content
 */
const generateBillHTML = (billData) => {
  const { billNumber, billDate, order, dealer, items, total } = billData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bill - ${billNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #fff; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; color: #333; }
        .company-details { font-size: 12px; color: #666; margin-top: 10px; }
        .bill-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .bill-info > div { flex: 1; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .items-table th { background-color: #f5f5f5; font-weight: bold; }
        .items-table tr:nth-child(even) { background-color: #fafafa; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
        @media print {
          body { margin: 0; }
          .header { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">VINAYAK LAKSHMI</div>
        <div class="company-details">
          Gas Stove Manufacturing & Distribution<br>
          Address: 123 Industrial Area, City - 123456<br>
          GST Number: 22AAAAA0000A1Z5<br>
          Mobile: +91 98765 43210
        </div>
      </div>
      
      <div class="bill-info">
        <div>
          <strong>Bill Number:</strong> ${billNumber}<br>
          <strong>Bill Date:</strong> ${billDate}<br>
          <strong>Order Code:</strong> ${order?.order_code || 'N/A'}
        </div>
        <div>
          <strong>Dealer:</strong><br>
          ${dealer?.firm_name || 'N/A'}<br>
          ${dealer?.address || ''}<br>
          ${dealer?.gstin ? `GST: ${dealer.gstin}` : ''}<br>
          ${dealer?.mobile_number ? `Mobile: ${dealer.mobile_number}` : ''}
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.product?.product_name || item.product_name || 'Product'}</td>
              <td>${item.quantity}</td>
              <td>₹${item.unit_price}</td>
              <td>₹${item.quantity * item.unit_price}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="total">
        <strong>Total Amount: ₹${total}</strong>
      </div>
      
      <div class="footer">
        Thank you for your business!<br>
        For any queries, please contact us.
      </div>
    </body>
    </html>
  `;
};

/**
 * Get bill data for an order
 * @param {number} orderId - Order ID
 * @returns {Object} Bill data
 */
export const getBillData = async (orderId) => {
  const order = await ordersService.getOrderById(orderId);
  
  const billNumber = `BILL-${order.order_code}`;
  const billDate = new Date().toLocaleDateString('en-IN');

  return {
    billNumber,
    billDate,
    order: {
      order_id: order.order_id,
      order_code: order.order_code,
      order_status: order.order_status,
      delivery_date: order.delivery_date,
    },
    dealer: order.dealer,
    items: order.items || [],
    total: order.total_amount,
  };
};

/**
 * Send bill via email
 * @param {number} orderId - Order ID
 * @param {string} dealerEmail - Dealer's email address
 * @param {Object} billData - Optional pre-generated bill data
 * @returns {Object} Send result
 */
export const sendBillEmail = async (orderId, dealerEmail, billData = null) => {
  // Validate email
  if (!dealerEmail || !dealerEmail.includes('@')) {
    throw { statusCode: 400, message: 'Valid dealer email is required' };
  }

  // Check email configuration
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw { 
      statusCode: 500, 
      message: 'Email is not configured. Please set EMAIL_USER and EMAIL_PASS in environment variables' 
    };
  }

  // Get bill data if not provided
  const finalBillData = billData || await getBillData(orderId);
  
  // Generate HTML
  const billHTML = generateBillHTML(finalBillData);

  // Create transporter
  const transporter = createTransporter();

  // Verify transporter connection
  try {
    if (typeof transporter.verify === 'function') {
      await transporter.verify();
    }
  } catch (verifyErr) {
    console.error('Email transporter verification failed:', verifyErr);
    const msg = process.env.NODE_ENV === 'development'
      ? `Email transporter verification failed: ${verifyErr.message}`
      : 'Email service not available';
    throw { statusCode: 500, message: msg };
  }

  // Send email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: dealerEmail,
    subject: `Bill ${finalBillData.billNumber} - Vinayak Lakshmi`,
    html: billHTML,
    attachments: [
      {
        filename: `Bill-${finalBillData.billNumber}.html`,
        content: billHTML,
        contentType: 'text/html',
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Bill email sent successfully to ${dealerEmail} for order ${orderId}`);
  } catch (sendErr) {
    console.error('Failed to send email:', sendErr);
    const msg = process.env.NODE_ENV === 'development'
      ? `Failed to send email: ${sendErr.message}`
      : 'Failed to send email';
    throw { statusCode: 500, message: msg };
  }

  // Mark order as bill sent
  await ordersService.markBillSent(orderId);

  return {
    success: true,
    message: `Bill sent successfully to ${dealerEmail}`,
    order_id: orderId,
  };
};

/**
 * Generate bill preview (HTML)
 * @param {number} orderId - Order ID
 * @returns {Object} Bill HTML and data
 */
export const generateBillPreview = async (orderId) => {
  const billData = await getBillData(orderId);
  const html = generateBillHTML(billData);

  return {
    html,
    data: billData,
  };
};

export default {
  getBillData,
  sendBillEmail,
  generateBillPreview,
};
