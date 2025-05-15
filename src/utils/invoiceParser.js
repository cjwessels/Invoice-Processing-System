import { parseDate } from './dateUtils';
import { supplierCodes } from './supplierCodes';

// Main function to extract data from invoice text
export const extractInvoiceData = (text, fileName) => {
  const cleanText = text.replace(/\s+/g, ' ').trim();

  // Extract supplier name
  const supplierName = extractSupplierName(cleanText, fileName);

  // Extract invoice number
  const invoiceNumber = extractInvoiceNumber(cleanText, supplierName);

  // Extract dates
  const invoiceDate = extractInvoiceDate(cleanText);
  const dueDate = extractDueDate(cleanText);

  // Extract totals
  const { subtotal, tax, total } = extractTotals(cleanText);

  // Extract line items
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
  // First check for specific email patterns
  if (text.includes('headoff@matzikama.gov.za') && 
      text.toLowerCase().includes('vredendal')) {
    const matchedSupplier = supplierCodes.find(s => s.code === 'MATVRE');
    return matchedSupplier ? matchedSupplier.name : 'Matzikama Municipality - Vredendal';
  }

  // Check for specific company names
  if (text.includes('Mustek Limited')) {
    const matchedSupplier = supplierCodes.find(s => s.code === 'MUS001');
    return matchedSupplier ? matchedSupplier.name : 'Mustek Limited';
  }

  if (text.includes('Theewaterskloof')) {
    const matchedSupplier = supplierCodes.find(s => s.code === 'THEE01');
    return matchedSupplier ? matchedSupplier.name : 'Theewaterskloof Municipality';
  }

  if (text.includes('Wispernet') && text.toLowerCase().includes('melkhoutfontein')) {
    const matchedSupplier = supplierCodes.find(s => s.code === 'WISMEL');
    return matchedSupplier ? matchedSupplier.name : 'Wispernet Melkhoutfontein';
  }

  if (text.includes('Bridoon Trade and Invest 197')) {
    const matchedSupplier = supplierCodes.find(s => s.code === 'NAS001');
    return matchedSupplier ? matchedSupplier.name : 'Nashua Cape Town';
  }

  if (text.includes('Trusc')) {
    const matchedSupplier = supplierCodes.find(s => s.code === 'TRUSC');
    return matchedSupplier ? matchedSupplier.name : 'Trusc Pty ltd';
  }

  // Check for patterns in supplierCodes
  for (const supplier of supplierCodes) {
    const regex = new RegExp(supplier.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (regex.test(text)) {
      return supplier.name;
    }
  }

  return 'Unknown Supplier';
};

// Extract invoice number
const extractInvoiceNumber = (text, supplierName) => {
  // For Mustek invoices, get 15 characters after CUSTOMER REF2
  if (supplierName === 'Mustek Limited') {
    const customerRef2Pattern = /CUSTOMER REF2\s*(.{15})/i;
    const customerRef2Match = text.match(customerRef2Pattern);
    if (customerRef2Match && customerRef2Match[1]) {
      return customerRef2Match[1].trim();
    }
  }

  // Check for Matzikama specific invoice number pattern
  const matzikamaBelastingPattern = /BELASTING FAKTUUR NR\.\s*(\S+)/i;
  const matzikamaBelastingMatch = text.match(matzikamaBelastingPattern);
  if (matzikamaBelastingMatch && matzikamaBelastingMatch[1]) {
    return matzikamaBelastingMatch[1].trim();
  }

  // For Theewaterskloof invoices
  if (supplierName === 'Theewaterskloof Municipality') {
    const theewaterskloofPattern = /(?:0201014014.*?){2}\s*(.{15})/i;
    const theewaterskloofMatch = text.match(theewaterskloofPattern);
    if (theewaterskloofMatch && theewaterskloofMatch[1]) {
      return theewaterskloofMatch[1].trim();
    }
  }

  // For Nashua Cape Town invoices
  if (supplierName === 'Nashua Cape Town') {
    const customerRef2Pattern = /020866 DIR\s*(.{6})/i;
    const customerRef2Match = text.match(customerRef2Pattern);
    if (customerRef2Match && customerRef2Match[1]) {
      return customerRef2Match[1].trim();
    }
  }
  // For Nashua Cape Town invoices
  if (supplierName === 'Nashua Cape Town') {
    const customerRef2Pattern = /020866 DIR\s*(.{6})/i;
    const customerRef2Match = text.match(customerRef2Pattern);
    if (customerRef2Match && customerRef2Match[1]) {
      return customerRef2Match[1].trim();
    }
  }

  // Common patterns for invoice numbers as fallback
  const invoiceNumberPatterns = [
    /Document No\s*([A-Z0-9-]+)/i,
    /(?:Invoice|Document)\s*(?:Number|No|#|:|Number:)\s*([A-Z0-9-]+)/i,
    /Inv\s*(?:No.)\s*([A-Z0-9-]+)/i,
    /Invoice\s*(?::|#)\s*([A-Z0-9-]+)/i,
    /INV(?:OICE)?\s*(?::|#|No|Number)?\s*([A-Z0-9-]+)/i,
    /Tax Invoice No[.:]\s*([A-Z0-9-]+)/i,
    
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
  // First try to find the exact date format for Matzikama invoices (DD/MM/YYYY)
  const matzikamaDates = text.match(/\b(\d{2}\/\d{2}\/\d{4})\b/g);
  if (matzikamaDates && matzikamaDates.length > 0) {
    return matzikamaDates[0];
  }

  // Check for Mustek date format
  const mustekDatePattern = /Invoice Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/i;
  const mustekMatch = text.match(mustekDatePattern);
  if (mustekMatch && mustekMatch[1]) {
    return mustekMatch[1];
  }

  // Common patterns for other date formats as fallback
  const datePatterns = [
    /Invoice Date:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /Date:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /DATE OF ACCOUNT:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /\b(\d{2}\/\d{2}\/\d{4})\b/g,
    /\b(\d{4}\/\d{2}\/\d{2})\b/g,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    console.log(match[0])
    const formatedDate = new Date(text)
    if (match && match[1]) {
      return formatedDate
      // return match[1];
    }
  }

  return 'Unknown';
};

// Extract due date
const extractDueDate = (text) => {
  // Common patterns for due dates
  const dueDatePatterns = [
    /Due Date:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /Payment Due:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /Pay By:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
  ];

  for (const pattern of dueDatePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return 'Unknown';
};

// Extract total amounts
const extractTotals = (text) => {
  let subtotal = 'Unknown';
  let tax = 'Unknown';
  let total = 'Unknown';

  // Mustek specific patterns
  if (text.includes('Mustek Limited')) {
    const subtotalPattern = /Sub\s*Total\s*:\s*R\s*([\d,]+\.\d{2})/i;
    const vatPattern = /VAT\s*:\s*R\s*([\d,]+\.\d{2})/i;
    const totalPattern = /Total\s*:\s*R\s*([\d,]+\.\d{2})/i;

    const subtotalMatch = text.match(subtotalPattern);
    const vatMatch = text.match(vatPattern);
    const totalMatch = text.match(totalPattern);

    if (subtotalMatch) subtotal = subtotalMatch[1].replace(/,/g, '');
    if (vatMatch) tax = vatMatch[1].replace(/,/g, '');
    if (totalMatch) total = totalMatch[1].replace(/,/g, '');

    return { subtotal, tax, total };
  }

  // Generic patterns for other invoices
  const subtotalPatterns = [
    /Sub[ -]?total:?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
    /Amount Excl Tax:?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
  ];

  const taxPatterns = [
    /VAT:?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
    /Tax:?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
  ];

  const totalPatterns = [
    /Total:?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
    /Amount Due:?\s*(?:R|ZAR)?\s*([0-9,.]+)/i,
  ];

  for (const pattern of subtotalPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      subtotal = match[1].trim().replace(/,/g, '');
      break;
    }
  }

  for (const pattern of taxPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      tax = match[1].trim().replace(/,/g, '');
      break;
    }
  }

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
    const mustekItemPattern =
      /(\d+)\s+([A-Z0-9-]+)\s+([^]+?)\s+(\d+)\s+R\s*([\d,]+\.\d{2})\s+R\s*([\d,]+\.\d{2})\s+R\s*([\d,]+\.\d{2})\s+R\s*([\d,]+\.\d{2})/g;
    let match;

    while ((match = mustekItemPattern.exec(text)) !== null) {
      lineItems.push({
        itemNumber: match[1].trim(),
        itemCode: match[2].trim(),
        description: match[3].trim(),
        quantity: match[4].trim(),
        unitPrice: match[5].trim().replace(/,/g, ''),
        netPrice: match[6].trim().replace(/,/g, ''),
        vat: match[7].trim().replace(/,/g, ''),
        total: match[8].trim().replace(/,/g, ''),
      });
    }

    return lineItems;
  }

  // Handle other invoice types
  // ... (rest of the existing line item extraction code)

  return lineItems;
};

export const formatDateForFileName = (dateString) => {
  if (!dateString || dateString === 'Unknown') return 'unknown_date';
  return dateString.replace(/\//g, '_');
};