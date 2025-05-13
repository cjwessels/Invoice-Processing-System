import { parseDate } from './dateUtils';

// Extract supplier name based on patterns in the text or filename
const extractSupplierName = (text, fileName) => {
  // Check for common supplier patterns in text
  const supplierPatterns = [
    { regex: /Mustek Limited/i, name: 'Mustek Limited' },
    // ... other supplier patterns ...
  ];

  for (const pattern of supplierPatterns) {
    if (pattern.regex.test(text)) {
      return pattern.name;
    }
  }

  return 'Unknown Supplier';
};

// Extract invoice number
const extractInvoiceNumber = (text, supplierName) => {
  // Special handling for Mustek invoices
  if (supplierName === 'Mustek Limited') {
    // Find CUSTOMER REF2
    const customerRef2Index = text.indexOf('CUSTOMER REF2');
    if (customerRef2Index !== -1) {
      // Get the text after CUSTOMER REF2
      const textAfterRef2 = text.substring(customerRef2Index + 'CUSTOMER REF2'.length);
      
      // Remove any "Invoice To:" text
      const cleanedText = textAfterRef2.replace(/Invoice To:/g, '').trim();
      
      // Look for the invoice number pattern
      const invoicePattern = /\bINV-\d{7} [A-Za-z0-9]{2}\b/;
      const match = cleanedText.match(invoicePattern);
      
      if (match) {
        return match[0];
      }
      
      // If no match found, return the next 15 characters after CUSTOMER REF2
      return cleanedText.substring(0, 15).trim();
    }
  }

  // Common patterns for other invoices
  const invoiceNumberPatterns = [
    /Tax Invoice No[.:]\s*([A-Z0-9-]+)/i,
    /Invoice\s*(?:Number|No|#|:|Number:)\s*([A-Z0-9-]+)/i,
    /Invoice\s*(?::|#)\s*([A-Z0-9-]+)/i,
    /INV(?:OICE)?\s*(?::|#|No|Number)?\s*([A-Z0-9-]+)/i,
    /Document No\s*([A-Z0-9-]+)/i,
    /BELASTING FAKTUUR NR[.:]\s*([A-Z0-9-]+)/i,
  ];

  for (const pattern of invoiceNumberPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return 'Unknown';
};

// Extract invoice date
const extractInvoiceDate = (text) => {
  // Common patterns for invoice dates
  const invoiceDatePatterns = [
    /Invoice Date:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /Date:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /DATE OF ACCOUNT:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
  ];

  for (const pattern of invoiceDatePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseDate(match[1]);
    }
  }

  return 'Unknown';
};

// Main function to extract data from invoice text
export const extractInvoiceData = (text, fileName) => {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Extract supplier name first
  const supplierName = extractSupplierName(cleanText, fileName);
  
  // Extract invoice number (passing supplierName for special handling)
  const invoiceNumber = extractInvoiceNumber(cleanText, supplierName);
  
  // Extract dates
  const invoiceDate = extractInvoiceDate(cleanText);

  return {
    supplierName,
    invoiceNumber,
    invoiceDate,
    dueDate: 'Unknown', // Add other date extraction if needed
    description: '',
    quantity: '',
    unitPrice: '',
    subtotal: '',
    tax: '',
    total: '',
  };
};