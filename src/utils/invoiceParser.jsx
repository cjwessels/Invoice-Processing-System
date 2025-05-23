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
    
    return null; // or return a default like { code: "", name: "" }
  }
  
  // Check for specific company names
  //TRUSC
  if (text.toLowerCase().includes('2023/529949/07')) {
    const matchedSupplier = supplierCodes.find(s => s.code === 'TRUSC');
    return matchedSupplier ? matchedSupplier.name : 'Trusc Pty ltd';
  }

  console.warn(`%c${text}` , "color: white;font-size: 1.3rem; font-style: italic; background-color: teal;padding: 2px",)
  
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
    
    // If we get here, no specific region was found, so return generic Wispernet Internet Srvices
    const matchedSupplier = supplierCodes.find(s => s.code === 'WISPEN');
    return matchedSupplier ? matchedSupplier.name : 'Wispernet Internet Srvices';
  }
  

   // If text contains "Simple Pay", check for specific regions
  if (text.toLowerCase().includes('orange thunder technologies')) {
   
    // { code: 'SIMPL', name: 'Simple Pay' },    
    const matchedSupplier = supplierCodes.find(s => s.code === 'SIMPL');
    return matchedSupplier ? matchedSupplier.name : 'Simple Pay';
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
    'Matzikama Municipality - Vredendal': /BELASTING FAKTUUR NR\.\s*(\S+)/i,
    'Matzikama Municipality - RIETPOORT': /BELASTING FAKTUUR NR\.\s*(\S+)/i,
    'ICDL OF SOUTH AFRICA':  /Tax\s+Invoice\s(\d{1,2}\/\d{1,2}\/\d{2,4})\s+([A-Z0-9-]+)/i,
    'Fidelity ADT': /Invoice Number:?\s+([A-Za-z0-9-]+)/i,
    'The Computer Shop' : /Invoice#\s*([A-Z0-9]+)/i,
    'Simple Pay' : /Invoice:\s*([A-Z0-9]+)/i,
    'George Municipality' : /Invoice Number:\s*([A-Z0-9]+)/i,
    'KANNALAND MUNICIPALITY' : /KANNA 1003940081\s*([A-Z0-9]+)/i,
    'CAPE AGULHAS MUNICIPALITY' : /\b(\d{2}\/\d{2}\/\d{4})\s*([A-Z0-9]+)/i
  };  

  // Use supplier-specific pattern if available, otherwise use default
  const pattern = patterns[supplierName] || defaultPattern;
  const match = text.match(pattern);

  if (!match) return 'Unknown';
  if (supplierName === 'Trust Patrol') return match[2];
  if (supplierName === 'ICDL OF SOUTH AFRICA') return match[2];
  if (supplierName === 'CAPE AGULHAS MUNICIPALITY') return match[2];
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
    /Invoice Date\s*(\d{2,4}[\/.-]\d{1,2}[\/.-]\d{1,2})/i,
    /Invoice Date:?\s*(\d{1,2}[ ]\d{1,2}[ ]\d{2,4})/i,
    /Date:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /Date:?\s*(\d{2,4}[\/.-]\d{1,2}[\/.-]\d{1,2})/i,
    /DATE OF ACCOUNT:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /Invoice Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/i,
    /\b(\d{4}\/\d{2}\/\d{2})\b/g,
    /Tax\s+Invoice\s(\d{1,2}\/\d{1,2}\/\d{2,4})\s+([A-Z0-9-]+)/i,
    /Invoice Date\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/i,    
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