// Extract invoice number
const extractInvoiceNumber = (text, supplierName) => {
  // Special handling for Mustek invoices
  if (supplierName === 'Mustek Limited') {
    // First find CUSTOMER REF2
    const customerRef2Index = text.indexOf('CUSTOMER REF2');
    if (customerRef2Index !== -1) {
      // Get the text after CUSTOMER REF2
      const textAfterRef2 = text.substring(customerRef2Index);
      // Look for the invoice number pattern
      const invoicePattern = /\bINV-\d{7} [A-Za-z0-9]{2}\b/;
      const match = textAfterRef2.match(invoicePattern);
      if (match) {
        return match[0];
      }
    }
  }

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

export const extractInvoiceData = (text, fileName) => {
  const invoiceNumber = extractInvoiceNumber(text);
  
  return {
    invoiceNumber,
    // Add other extracted data here as needed
    supplierName: text.includes("Mustek Limited") ? "Mustek Limited" : "Unknown"
  };
};