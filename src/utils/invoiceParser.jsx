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
  console.log(invoiceDate)
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
    for (const [region, code] of Object.entries(regions)) {
      if (text.includes(region)) {
        const matchedSupplier = supplierCodes.find(s => s.code === code);
        return matchedSupplier ? matchedSupplier.name : `Matzikama Municipality - ${region}`;
      }
    }
    // If no specific region found, return generic Matzikama
    const matchedSupplier = supplierCodes.find(s => s.code === 'MATZI');
    return matchedSupplier ? matchedSupplier.name : 'Matzikama Municipality';
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

// Rest of the file remains unchanged
[... rest of the file content remains exactly the same ...]