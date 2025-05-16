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
  // console.log(invoiceDate)
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

  // Check for Matzikama Municipality with regions
  const regions = {
    'Bitterfontein': 'MATBIT',
    'Klawer': 'MATKLA',
    'RIETPOORT': 'MATRIE',
    'Vanrhynsdorp': 'MATVAN',
    'Vredendal': 'MATVRE',
    'Doringbaai': 'MATZDO'
  };

  // If text contains "Matzikama", check for specific regions
  if (text.toLowerCase().includes('matzikama')) {
    let matzRegion
    for (const [region, code] of Object.entries(regions)) {
      console.log(region)
      const matchedSupplier = supplierCodes.find(s => s.code === code);
      if (text.includes(region)) {       
        
        matzRegion =  matchedSupplier ? matchedSupplier.name : `Matzikama Municipality - ${region}`;
      }
      else
      {
        matzRegion = matchedSupplier ? matchedSupplier.name : 'Matzikama Municipality';
      }
    }
    // If no specific region found, return generic Matzikama
    // const matchedSupplier = supplierCodes.find(s => s.code === 'MATZI');
    // return matchedSupplier ? matchedSupplier.name : 'Matzikama Municipality';
    return matzRegion
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

// Extract invoice number based on supplier-specific patterns
export const extractInvoiceNumber = (text, supplierName) => {
  // Default pattern for invoice numbers
  const defaultPattern = /(?:Invoice|INV|Reference)[\s#:]*([A-Z0-9-]+)/i;
  
  // Supplier-specific patterns
  const patterns = {
    'Mustek Limited': /Invoice Number:?\s*([A-Z0-9-]+)/i,
    'Theewaterskloof Municipality': /Account Number:?\s*([0-9]+)/i,
    'Nashua Cape Town': /Invoice No:?\s*([A-Z0-9-]+)/i
  };

  // Use supplier-specific pattern if available, otherwise use default
  const pattern = patterns[supplierName] || defaultPattern;
  const match = text.match(pattern);

  return match ? match[1] : 'Unknown';
};

// Extract invoice date from text
export const extractInvoiceDate = (text) => {
  const datePattern = /(?:Invoice Date|Date):\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i;
  const match = text.match(datePattern);
  return match ? parseDate(match[1]) : null;
};

// Extract due date from text
export const extractDueDate = (text) => {
  const datePattern = /(?:Due Date|Payment Due):\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i;
  const match = text.match(datePattern);
  return match ? parseDate(match[1]) : null;
};

// Extract totals from text
export const extractTotals = (text) => {
  // Initialize default values
  let subtotal = 0;
  let tax = 0;
  let total = 0;

  // Pattern for currency amounts (handles both with and without decimal points)
  const currencyPattern = /(?:R|ZAR)\s*(\d+(?:\.\d{2})?)/i;

  // Look for subtotal
  const subtotalMatch = text.match(/(?:Subtotal|Sub-total).*?(?:R|ZAR)\s*(\d+(?:\.\d{2})?)/i);
  if (subtotalMatch) {
    subtotal = parseFloat(subtotalMatch[1]);
  }

  // Look for VAT/tax
  const taxMatch = text.match(/(?:VAT|Tax).*?(?:R|ZAR)\s*(\d+(?:\.\d{2})?)/i);
  if (taxMatch) {
    tax = parseFloat(taxMatch[1]);
  }

  // Look for total
  const totalMatch = text.match(/(?:Total|Amount Due).*?(?:R|ZAR)\s*(\d+(?:\.\d{2})?)/i);
  if (totalMatch) {
    total = parseFloat(totalMatch[1]);
  }

  return { subtotal, tax, total };
};

// Extract line items from text
export const extractLineItems = (text, supplierName) => {
  // This is a placeholder implementation
  // You would need to implement specific logic based on your invoice formats
  return [];
};