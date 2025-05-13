import { parseDate } from './dateUtils';

// Main function to extract data from invoice text
export const extractInvoiceData = (text, fileName) => {
  const cleanText = text.replace(/\s+/g, ' ').trim();

  // Extract supplier name
  const supplierName = extractSupplierName(cleanText, fileName);

  // Extract invoice number
  const invoiceNumber = extractInvoiceNumber(cleanText);

  // Extract dates
  const invoiceDate = extractInvoiceDate(cleanText);

  return {
    supplierName,
    invoiceNumber,
    invoiceDate,
    dueDate: 'Unknown',
  };
};

// Extract supplier name based on patterns in the text or filename
const extractSupplierName = (text, fileName) => {
  // Check for Matzikama Vredendal specific pattern
  if (text.includes('headoff@matzikama.gov.za') && text.toLowerCase().includes('vredendal')) {
    return 'Matzikama Municipality - Vredendal';
  }

  // Check for common supplier patterns in text
  const supplierPatterns = [
    { regex: /MATZIKAMA MUNISIPALITEIT/i, name: 'Matzikama Municipality - Vredendal' },
    { regex: /MATZIKAMA MUNICIPALITY/i, name: 'Matzikama Municipality - Vredendal' },
    // ... other patterns ...
  ];

  for (const pattern of supplierPatterns) {
    if (pattern.regex.test(text)) {
      // If we find Matzikama Municipality and Vredendal, return the Vredendal-specific name
      if ((pattern.regex.test(text) && text.toLowerCase().includes('vredendal')) || 
          text.includes('headoff@matzikama.gov.za')) {
        return 'Matzikama Municipality - Vredendal';
      }
    }
  }

  return 'Unknown Supplier';
};

// Extract invoice number
const extractInvoiceNumber = (text) => {
  // Check for Matzikama specific invoice number pattern
  const matzikamaBelastingPattern = /BELASTING FAKTUUR NR\.\s*(\S+)/i;
  const matzikamaBelastingMatch = text.match(matzikamaBelastingPattern);
  if (matzikamaBelastingMatch && matzikamaBelastingMatch[1]) {
    return matzikamaBelastingMatch[1].trim();
  }

  // Common patterns for invoice numbers as fallback
  const invoiceNumberPatterns = [
    /Invoice\s*(?:Number|No|#|:|Number:)\s*([A-Z0-9-]+)/i,
    /Invoice\s*(?::|#)\s*([A-Z0-9-]+)/i,
    /INV(?:OICE)?\s*(?::|#|No|Number)?\s*([A-Z0-9-]+)/i,
    /Tax Invoice No[.:]\s*([A-Z0-9-]+)/i,
    /Document No\s*([A-Z0-9-]+)/i,
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
    // Return the first date found in DD/MM/YYYY format
    return matzikamaDates[0];
  }

  // Common patterns for other date formats as fallback
  const datePatterns = [
    /Invoice Date:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /Date:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
    /DATE OF ACCOUNT:?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return 'Unknown';
};