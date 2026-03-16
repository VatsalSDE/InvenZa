/**
 * Utility functions for generating auto-incrementing codes
 * Used across the application for orders, payments, purchases, suppliers
 */

/**
 * Generate date-based code with sequence number
 * Format: PREFIX-YYMMDD-XXX (e.g., ORD-250307-001)
 * @param {string} prefix - The prefix for the code (ORD, PAY, PO)
 * @param {number} sequenceNumber - The sequence number for the day
 * @returns {string} Generated code
 */
export const generateDateBasedCode = (prefix, sequenceNumber = 1) => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const seq = String(sequenceNumber).padStart(3, '0');
  return `${prefix}-${yy}${mm}${dd}-${seq}`;
};

/**
 * Generate incremental code with number padding
 * Format: PREFIX-XXX (e.g., SUP-001)
 * @param {string} prefix - The prefix for the code
 * @param {number} sequenceNumber - The sequence number
 * @returns {string} Generated code
 */
export const generateIncrementalCode = (prefix, sequenceNumber = 1) => {
  const seq = String(sequenceNumber).padStart(3, '0');
  return `${prefix}-${seq}`;
};

/**
 * Generate order code
 * Format: ORD-YYMMDD-XXX
 * @param {number} sequenceNumber - The sequence number for the day
 * @returns {string} Generated order code
 */
export const generateOrderCode = (sequenceNumber = 1) => {
  return generateDateBasedCode('ORD', sequenceNumber);
};

/**
 * Generate payment transaction ID
 * Format: PAY-YYMMDD-XXX
 * @param {number} sequenceNumber - The sequence number for the day
 * @returns {string} Generated payment code
 */
export const generatePaymentCode = (sequenceNumber = 1) => {
  return generateDateBasedCode('PAY', sequenceNumber);
};

/**
 * Generate purchase order code
 * Format: PO-YYMMDD-XXX
 * @param {number} sequenceNumber - The sequence number for the day
 * @returns {string} Generated purchase order code
 */
export const generatePurchaseCode = (sequenceNumber = 1) => {
  return generateDateBasedCode('PO', sequenceNumber);
};

/**
 * Generate supplier code
 * Format: SUP-XXX
 * @param {number} sequenceNumber - The sequence number
 * @returns {string} Generated supplier code
 */
export const generateSupplierCode = (sequenceNumber = 1) => {
  return generateIncrementalCode('SUP', sequenceNumber);
};

/**
 * Generate dealer code
 * Format: DLR-XXX
 * @param {number} sequenceNumber - The sequence number
 * @returns {string} Generated dealer code
 */
export const generateDealerCode = (sequenceNumber = 1) => {
  return generateIncrementalCode('DLR', sequenceNumber);
};

/**
 * Generate product code based on attributes
 * Format: CAT-BRN-TYP-XXX (e.g., STL-2B-BRS-001)
 * @param {Object} product - Product details
 * @param {number} sequenceNumber - The sequence number
 * @returns {string} Generated product code
 */
export const generateProductCode = (product, sequenceNumber = 1) => {
  const categoryMap = { steel: 'STL', glass: 'GLS' };
  const burnerTypeMap = { Brass: 'BRS', Alloy: 'ALY' };
  
  const cat = categoryMap[product.category?.toLowerCase()] || 'OTH';
  const brn = `${product.no_burners || 1}B`;
  const typ = burnerTypeMap[product.type_burner] || 'OTH';
  const seq = String(sequenceNumber).padStart(3, '0');
  
  return `${cat}-${brn}-${typ}-${seq}`;
};

/**
 * Extract today's date pattern for querying existing codes
 * @returns {string} Date pattern in YYMMDD format
 */
export const getTodayDatePattern = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
};

export default {
  generateDateBasedCode,
  generateIncrementalCode,
  generateOrderCode,
  generatePaymentCode,
  generatePurchaseCode,
  generateSupplierCode,
  generateDealerCode,
  generateProductCode,
  getTodayDatePattern,
};
