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

  function findSupplierFromText(text) {
    const matchedSupplier = supplierCodes.find(supplier =>
      text.includes(supplier.name)
    );

    if (matchedSupplier) {
      return { code: matchedSupplier.code, name: matchedSupplier.name };
    }
    
    // if (text.toLowerCase().includes('WISPERNET') && text.toLowerCase().includes('MELKHOUTFONTEIN')) {
    //   const matchedSupplier = supplierCodes.find(s => s.code === 'WISMEL');
    //   return matchedSupplier ? matchedSupplier.name : 'Wispernet Melkhoutfontein';
    // }
   
    return null; // or return a default like { code: "", name: "" }
  }
  
  // Check for specific company names
  if (text.toLowerCase().includes('2023/529949/07')) {
    const matchedSupplier = supplierCodes.find(s => s.code === 'TRUSC');
    return matchedSupplier ? matchedSupplier.name : 'Trusc Pty ltd';
  }

  console.log(text)
  console.log(text.toLowerCase().includes('icdl') ? 'ICDL' : 'NADA')
  
  if (text.toLowerCase().includes('icdl')) {
    const matchedSupplier = supplierCodes.find(s => s.code === 'ICDLSA');
    return matchedSupplier ? matchedSupplier.name : 'ICDL OF SOUTH AFRICA';
  }
  
  // Check for Matzikama Municipality with regions
  const matzikamaRegions = {
    'Bitterfontein': 'MATBIT',
    'Klawer': 'MATKLA',
    'RIETPOORT': 'MATRIE',
    'Vanrhynsdorp': 'MATVAN',
    'Vredendal': 'MATVRE',
    'Doringbaai': 'MATZDO'  
  };  

  // If text contains "Matzikama", check for specific regions
  if (text.toLowerCase().includes('matzikama')) {
    for (const [region, code] of Object.entries(matzikamaRegions)) {
      if (text.toLowerCase().includes(region.toLowerCase())) {
        const matchedSupplier = supplierCodes.find(s => s.code === code);
        return matchedSupplier ? matchedSupplier.name : `Matzikama Municipality - ${region}`;
      }
    }
    
    // If we get here, no specific region was found, so return generic Matzikama
    const matchedSupplier = supplierCodes.find(s => s.code === 'MATZI');
    return matchedSupplier ? matchedSupplier.name : 'Matzikama Municipality';
  }

   const wispernetRegions = {
    'Heidelberg' :'WISHEI',
    'Melkhoutfontein'  : 'WISMEL',
    'Dysselsdorp' :'WISP4',
    'Internet Srvices'  :'WISPEN',
    'Bridgton' :'WISPER'    
  }; 

  
  // If text contains "Wispernet", check for specific regions
  if (text.toLowerCase().includes('wispernet')) {
    for (const [region, code] of Object.entries(wispernetRegions)) {
      if (text.toLowerCase().includes(region.toLowerCase())) {
        const matchedSupplier = supplierCodes.find(s => s.code === code);
        return matchedSupplier ? matchedSupplier.name : `Wispernet ${region}`;
      }
    }
    
    // If we get here, no specific region was found, so return generic Matzikama
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

// Extract invoice number based on supplier-specific patterns
export const extractInvoiceNumber = (text, supplierName) => {
  // Default pattern for invoice numbers
  const defaultPattern = /(?:Invoice|INV|Inv No.|Reference|Docuemnt No)[\s#:]*([A-Z0-9-]+)/i;
  
  // Supplier-specific patterns
  const patterns = {
    // 'Mustek Limited': /CUSTOMER REF2:?\s*([A-Z0-9-]+)s*([A-Z0-9-]+)/i,
    'Mustek Limited': /CUSTOMER REF2\s+(INV-\d+\s+[A-Z]+)/i,
    'Theewaterskloof Municipality': /Account Number:?\s*([0-9]+)/i,
    'Trusc Pty ltd': /Inv No.?\s*([A-Z0-9]+)/i,
    'Nashua Cape Town': /020866 DIR\s*([A-Z0-9-]+)/i,
    'Trust Patrol': /Tax\s+Invoice\s(\d{1,2}\/\d{1,2}\/\d{2,4})\s+([A-Z0-9-]+)/i,
    'Matzikama Municipality - Vanrhynsdorp': /BELASTING FAKTUUR NR\.\s*(\S+)/i,
  };  

  // Use supplier-specific pattern if available, otherwise use default
  const pattern = patterns[supplierName] || defaultPattern;
  const match = text.match(pattern);

  if (!match) return 'Unknown';
  if (supplierName === 'Trust Patrol') return match[2];
  return match[1];
};

// Extract invoice date from text
export const extractInvoiceDate = (text) => {
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

  const datePatterns = [
    /Invoice Date:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /Date:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /DATE OF ACCOUNT:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /Invoice Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/i,
    /\b(\d{4}\/\d{2}\/\d{2})\b/g,
    /Tax\s+Invoice\s(\d{1,2}\/\d{1,2}\/\d{2,4})\s+([A-Z0-9-]+)/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
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