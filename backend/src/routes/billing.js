import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import nodemailer from 'nodemailer';

const router = Router();

// Create email transporter (supports Gmail service or custom SMTP via env)
const createTransporter = () => {
  const {
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_SECURE,
    EMAIL_SERVICE,
    EMAIL_USER,
    EMAIL_PASS
  } = process.env;

  // Prefer custom SMTP if host is provided
  if (EMAIL_HOST) {
    return nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT ? Number(EMAIL_PORT) : 587,
      secure: (EMAIL_SECURE || '').toLowerCase() === 'true',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });
  }

  // Fallback to nodemailer service (e.g., gmail, outlook)
  return nodemailer.createTransport({
    service: EMAIL_SERVICE || 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });
};

// Send bill email
router.post('/send-email', requireAuth, async (req, res) => {
  try {
    const { order_id, dealer_email, bill_data } = req.body;
    if (!dealer_email || !dealer_email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid dealer_email is required' });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        success: false,
        message: 'Email is not configured. Please set EMAIL_USER and EMAIL_PASS in backend/.env'
      });
    }
    
    // Create email transporter
    const transporter = createTransporter();
    
    // Generate HTML bill content
    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - ${bill_data.billNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; color: #333; }
          .company-details { font-size: 12px; color: #666; margin-top: 10px; }
          .bill-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .items-table th { background-color: #f5f5f5; }
          .total { text-align: right; font-size: 18px; font-weight: bold; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
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
            <strong>Bill Number:</strong> ${bill_data.billNumber}<br>
            <strong>Bill Date:</strong> ${bill_data.billDate}<br>
            <strong>Order Code:</strong> ${bill_data.order.order_code}
          </div>
          <div>
            <strong>Dealer:</strong><br>
            ${bill_data.dealer.firm_name}<br>
            ${bill_data.dealer.address}<br>
            GST: ${bill_data.dealer.gstin}<br>
            Mobile: ${bill_data.dealer.mobile_number}
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${bill_data.items.map(item => `
              <tr>
                <td>${item.product?.product_name || 'Product'}</td>
                <td>${item.quantity}</td>
                <td>₹${item.unit_price}</td>
                <td>₹${item.quantity * item.unit_price}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total">
          <strong>Total Amount: ₹${bill_data.total}</strong>
        </div>
        
        <div class="footer">
          Thank you for your business!<br>
          For any queries, please contact us.
        </div>
      </body>
      </html>
    `;
    
    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@vinayaklakshmi.com',
      to: dealer_email,
      subject: `Bill ${bill_data.billNumber} - Vinayak Lakshmi`,
      html: billHTML,
      attachments: [
        {
          filename: `Bill-${bill_data.billNumber || order_id}.html`,
          content: billHTML,
          contentType: 'text/html'
        }
      ]
    };
    
    await transporter.sendMail(mailOptions);
    
    console.log(`Bill email sent successfully to ${dealer_email} for order ${order_id}`);
    
    res.json({ 
      success: true, 
      message: `Bill sent successfully to ${dealer_email}`,
      order_id: order_id
    });
    
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email: ' + (error?.response?.toString() || error.message)
    });
  }
});

// Get billing statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_value,
        COUNT(CASE WHEN order_status = 'Pending' THEN 1 END) as pending_orders
      FROM orders
    `);
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Billing stats error:', error);
    res.status(500).json({ message: 'Failed to fetch billing stats' });
  }
});

export default router;
