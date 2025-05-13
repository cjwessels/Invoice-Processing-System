import { parseDate } from './dateUtils';

// Main function to extract data from invoice text
export const extractInvoiceData = (text, fileName) => {
  const cleanText = text.replace(/\s+/g, ' ').trim();

  // Extract supplier name
  const supplierName = extractSupplierName(cleanText, fileName);

  // Extract invoice number
  const invoiceNumber = extractInvoiceNumber(cleanText);

  // Extract dates
  const invoiceDate = extractInvoiceDate(cleanText, supplierName);
  const dueDate = extractDueDate(cleanText);

  // Extract totals
  const { subtotal, tax, total } = extractTotals(cleanText);

  // Extract line items - this is the critical function
  const lineItems = extractLineItems(cleanText, supplierName);

  return {
    supplierName,
    invoiceNumber,
    invoiceDate,
    dueDate,
    subtotal,
    tax,
    total,
    lineItems,
  };
};

// Extract supplier name based on patterns in the text or filename
const extractSupplierName = (text, fileName) => {
  // Check for common supplier patterns in text
  const supplierPatterns = [
    { regex: /MOSSEL BAY MUNICIPALITY/i, name: 'Mossel Bay Municipality' },
    { regex: /Bridoon Trade and Invest 197/i, name: 'Nashua Cape Town' },
    { regex: /MATZIKAMA MUNISIPALITEIT/i, name: 'Matzikama Municipality' },
    { regex: /MATZIKAMA MUNICIPALITY/i, name: 'Matzikama Municipality' },
    { regex: /HESSEQUA/i, name: 'Hessequa Municipality' },
    { regex: /THEEWATERSKLOOF/i, name: 'Theewaterskloof Municipality' },
    { regex: /GEORGE MUNICIPALITY/i, name: 'George Municipality' },
    { regex: /KANNALAND/i, name: 'Kannaland Municipality' },
    { regex: /CAPE AGULHAS/i, name: 'Cape Agulhas Municipality' },
    { regex: /Fidelity ADT/i, name: 'Fidelity ADT' },
    { regex: /Herotel/i, name: 'Herotel (Pty) Ltd' },
    { regex: /WISPERNET/i, name: 'Wispernet Internet Services' },
    { regex: /Trust Patrols/i, name: 'Trust Patrol' },
    { regex: /Orange Thunder|SimplePay/i, name: 'Simple Pay' },
    { regex: /ICDL/i, name: 'ICDL OF SOUTH AFRICA' },
    { regex: /The Computer Shop|TCS/i, name: 'The Computer Shop' },
    { regex: /PHILIPPI VILLAGE/i, name: 'Philippi Village' },
    { regex: /PRINCE ALBERT ADVIES/i, name: 'Prince Albert Advice Centre' },
    { regex: /Mustek Limited/i, name: 'Mustek Limited' },
    { regex: /TRUSC/i, name: 'Trusc Pty ltd' },
  ];

  for (const pattern of supplierPatterns) {
    if (pattern.regex.test(text)) {
      return pattern.name;
    }
  }

  // If no match from text, try to extract from filename
  if (fileName && fileName.includes('Mustek')) {
    return 'Mustek Limited';
  }

  return 'Unknown Supplier';
};

// Extract invoice number
const extractInvoiceNumber = (text) => {
  // Common patterns for invoice numbers
  const invoiceNumberPatterns = [
    /Invoice\s*(?:Number|No|#|:|Number:)\s*([A-Z0-9-]+)/i,
    /Invoice\s*(?::|#)\s*([A-Z0-9-]+)/i,
    /INV(?:OICE)?\s*(?::|#|No|Number)?\s*([A-Z0-9-]+)/i,
    /Tax Invoice No[.:]\s*([A-Z0-9-]+)/i,
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
const extractInvoiceDate = (text, supplierName) => {
  // Special handling for Mustek invoices
  if (supplierName === 'Mustek Limited') {
    const mustekDatePattern = /(\d{2}\/\d{2}\/\d{4})/i;
    const match = text.match(mustekDatePattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Common patterns for invoice dates
  const invoiceDatePatterns = [
    /Invoice Date:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /Invoice Date:?\s*(\d{1,2}\s+[A-Za-z]+\s+\d{2,4})/i,
    /Invoice Date?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /Invoice Date?\s*(\d{1,2}\s+[A-Za-z]+\s+\d{2,4})/i,
    /Date:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /Date?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /DATE OF ACCOUNT:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /STATEMENT DATE:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /DATUM VAN STAAT:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /Date\s+(\d{2}\/\d{2}\/\d{4})/i,
  ];

  for (const pattern of invoiceDatePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return 'Unknown';
};

// Extract due date
const extractDueDate = (text) => {
  // Common patterns for due dates
  const dueDatePatterns = [
    /Due Date:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /DUE DATE:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /Due Date?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /DUE DATE?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /Payment\s*must\s*be\s*made.*?by:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /PAY(ABLE|MENT)\s*(BEFORE|BY):?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /VERVAL\s*DATUM:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /BETAAL VOOR OF OP:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
  ];

  for (const pattern of dueDatePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseDate(match[1]);
    }
  }

  return 'Unknown';
};

// Extract total amounts
const extractTotals = (text) => {
  let subtotal = 'Unknown';
  let tax = 'Unknown';
  let total = 'Unknown';

  // Extract subtotal
  const subtotalPatterns = [
    /Sub[ -]?total:?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
    /Amount Excl Tax:?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
    /Nett Price:?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
    /Total \(excl\. VAT\):?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
  ];

  for (const pattern of subtotalPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      subtotal = match[1].trim().replace(/,/g, '');
      break;
    }
  }

  // Extract tax
  const taxPatterns = [
    /VAT:?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
    /Tax:?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
    /VAT\s*@\s*\d+%:?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
    /BTW:?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
  ];

  for (const pattern of taxPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      tax = match[1].trim().replace(/,/g, '');
      break;
    }
  }

  // Extract total
  const totalPatterns = [
    /TOTAL:?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
    /Total:?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
    /Total (?:Due|Amount):?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
    /AMOUNT DUE:?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
    /BEDRAG VERSKULDIG:?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
    /Grand Total:?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
  ];

  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      total = match[1].trim().replace(/,/g, '');
      break;
    }
  }

  return { subtotal, tax, total };
};

// Extract line items
const extractLineItems = (text, supplierName) => {
  const lineItems = [];

  // Special handling for Mustek invoices
  if (supplierName === 'Mustek Limited') {
    const mustekItemRegex = /([A-Z0-9-]+)\s+([A-Za-z0-9 .,\/-]+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:,\d+)?(?:\.\d+)?)\s+(\d+(?:,\d+)?(?:\.\d+)?)\s+(\d+(?:,\d+)?(?:\.\d+)?)\s+(\d+(?:,\d+)?(?:\.\d+)?)/g;
    
    let match;
    while ((match = mustekItemRegex.exec(text)) !== null) {
      lineItems.push({
        itemCode: match[1].trim(),
        description: match[2].trim(),
        quantity: match[3].trim(),
        unitPrice: match[4].trim().replace(/,/g, ''),
        netPrice: match[5].trim().replace(/,/g, ''),
        tax: match[6].trim().replace(/,/g, ''),
        total: match[7].trim().replace(/,/g, ''),
      });
    }
    
    return lineItems;
  }

  // Approach 1: Look for tabular data with item code, description, quantity, price
  const tableLineRegex = /\b([A-Z0-9-]+)\s+([A-Za-z0-9 .,\/-]+)\s+(\d+(?:\.\d+)?)\s+(?:R|ZAR)?\s*(\d+(?:,\d+)?(?:\.\d+)?)\s+(?:R|ZAR)?\s*(\d+(?:,\d+)?(?:\.\d+)?)/g;
  
  let match;
  while ((match = tableLineRegex.exec(text)) !== null) {
    lineItems.push({
      itemCode: match[1].trim(),
      description: match[2].trim(),
      quantity: match[3].trim(),
      unitPrice: match[4].trim().replace(/,/g, ''),
      amount: match[5].trim().replace(/,/g, ''),
    });
  }

  // If no line items detected, try a more generic approach
  if (lineItems.length === 0) {
    // Look for patterns that might indicate a line item in almost any format
    const genericItemRegex = /([A-Za-z0-9 .,\/-]+)\s+(\d+(?:\.\d+)?)\s+(?:R|ZAR)?\s*(\d+(?:,\d+)?(?:\.\d+)?)\s+(?:R|ZAR)?\s*(\d+(?:,\d+)?(?:\.\d+)?)/g;

    while ((match = genericItemRegex.exec(text)) !== null) {
      // Verify this is likely a line item and not some other numeric data
      const description = match[1].trim();
      if (description.length > 3 && !description.match(/total|subtotal|tax|vat|date|invoice/i)) {
        lineItems.push({
          description: description,
          quantity: match[2].trim(),
          unitPrice: match[3].trim().replace(/,/g, ''),
          amount: match[4].trim().replace(/,/g, ''),
        });
      }
    }
  }

  return lineItems;
};