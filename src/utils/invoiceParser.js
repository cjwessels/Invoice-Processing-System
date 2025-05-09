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
  const dueDate = extractDueDate(cleanText);

  // Extract totals
  const { subtotal, tax, total } = extractTotals(cleanText);

  // Extract line items - this is the critical function
  const lineItems = extractLineItems(cleanText);

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
  if (fileName) {
    // Extract potential supplier name from filename
    // This is a fallback and less reliable
    return 'Unknown Supplier';
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
const extractInvoiceDate = (text) => {
  // Common patterns for invoice dates

  // Nashua Cape Town:

  const nashuaInvoiceDatePatterns = [/s*(\d{4}\/\d{2}\/\d{2})/i];

  //^\d{4}/\d{2}/\d{2}$
  const invoiceDatePatterns = [
    // /s*(\d{4}\/\d{2}\/\d{2})/i,
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

  let useDatePattern = [];

  console.log('text:', text);

  if (text.includes('Bridoon Trade and Invest 197')) {
    // NASHUA invoice date check
    useDatePattern = nashuaInvoiceDatePatterns;
  } else {
    useDatePattern = invoiceDatePatterns;
  }

  for (const pattern of useDatePattern) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // return parseDate(match[1]);
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
const extractLineItems = (text) => {
  const lineItems = [];

  // Different suppliers have different formats, so we need multiple approaches

  // Approach 1: Look for tabular data with item code, description, quantity, price
  const tableLineRegex =
    /\b([A-Z0-9-]+)\s+([A-Za-z0-9 .,\/-]+)\s+(\d+(?:\.\d+)?)\s+(?:R|ZAR)?\s*(\d+(?:,\d+)?(?:\.\d+)?)\s+(?:R|ZAR)?\s*(\d+(?:,\d+)?(?:\.\d+)?)/g;
  let match;
  while (
    (match = tableLineRegex.exec(text)) !== null &&
    !text.includes('Bridoon Trade and Invest 197')
  ) {
    lineItems.push({
      itemCode: match[1].trim(),
      description: match[2].trim(),
      quantity: match[3].trim(),
      unitPrice: match[4].trim().replace(/,/g, ''),
      amount: match[5].trim().replace(/,/g, ''),
    });
  }

  // Approach 2: Look for Mustek-style line items
  if (lineItems.length === 0 && text.includes('Mustek')) {
    const muskekItemRegex =
      /([A-Z0-9-]+)\s+([A-Za-z0-9 .,\/-]+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:,\d+)?(?:\.\d+)?)\s+(\d+(?:,\d+)?(?:\.\d+)?)\s+(\d+(?:,\d+)?(?:\.\d+)?)\s+(\d+(?:,\d+)?(?:\.\d+)?)/g;
    while ((match = muskekItemRegex.exec(text)) !== null) {
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
  }

  // Approach 3: Look for ICDL style items
  if (lineItems.length === 0 && text.includes('ICDL')) {
    const icdlItemRegex =
      /([A-Z0-9-]+)\s+([A-Za-z0-9 .,\/-]+)\s+(\d+(?:\.\d+)?(?:\s+Unit)?)\s+(\d+(?:,\d+)?(?:\.\d+)?)\s+(?:\d+(?:\.\d+)?)?\s+(\d+(?:,\d+)?(?:\.\d+)?)/g;
    while ((match = icdlItemRegex.exec(text)) !== null) {
      lineItems.push({
        itemCode: match[1].trim(),
        description: match[2].trim(),
        quantity: match[3].trim().replace(/Unit/i, '').trim(),
        unitPrice: match[4].trim().replace(/,/g, ''),
        amount: match[5].trim().replace(/,/g, ''),
      });
    }
  }

  // Approach 4: Look for NASHUA style items
  function extractNashuaLineItems(text) {
    const lineItems = [];

    // First, find the section that contains the tabular data
    // Look for the section between the headers and the totals
    const tableSection = text.match(
      /Description\s+Qty\s+Unit\s+Price\s+Price\s+VAT\s+Total([\s\S]*?)Total \(excl VAT\)/
    );

    if (tableSection && tableSection[1]) {
      const tableContent = tableSection[1].trim();
      console.log('Table Content:', tableContent);

      // Pattern to match line items in the format: Description Qty Unit Price Price VAT Total
      const lineItemRegex =
        /([^\n]+?)\s+(\d+(?:\.\d+)?)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/g;

      let match;
      while ((match = lineItemRegex.exec(tableContent)) !== null) {
        lineItems.push({
          description: match[1].trim(),
          quantity: match[2].trim(),
          unitPrice: match[3].trim(),
          price: match[4].trim(),
          vat: match[5].trim(),
          total: match[6].trim(),
        });
      }
    }

    return lineItems;
  }

  // For specific NASHUA invoice format (Bridoon Trade and Invest 197)
  if (text.includes('Bridoon Trade and Invest 197')) {
    const nashuaLineItems = extractNashuaLineItems(text);
    if (nashuaLineItems.length > 0) {
      lineItems.push(...nashuaLineItems);
    } else {
      // Fallback for the specific structure in this invoice
      // The format appears to be different from standard tabular format
      const specialFormatRegex =
        /\* ([^*]+) \*\s+(?:Captured[^\n]+\s+)?Start\s*:\s*(\d+)\s+End\s*:\s*(\d+)\s+(?:Copies Made at Tier (?:\d+)\s+)?(?:[^\n]+\s+)*?(\d+)\s+([\d.]+)\s+([\d.]+)/g;

      let match;
      while ((match = specialFormatRegex.exec(text)) !== null) {
        console.log(match);
        const meterType = match[1].trim();
        const startReading = match[2].trim();
        const endReading = match[3].trim();
        const quantity = match[5].trim();
        const unitPrice = match[6].trim();
        const price = match[6].trim();

        lineItems.push({
          description: `${meterType} Meter (${startReading}-${endReading})`,
          quantity: quantity,
          unitPrice: unitPrice,
          price: price,
        });
      }

      // Look for minimum charge entries
      const minChargeRegex = /Min\.Copy\s+Chg(?:\s+Shortfall)?\s+([\d.]+)/g;
      while ((match = minChargeRegex.exec(text)) !== null) {
        lineItems.push({
          description: 'Minimum Copy Charge',
          quantity: '1',
          unitPrice: match[1].trim(),
          price: match[1].trim(),
        });
      }
    }
  }

  // Approach 4: For internet service providers (Herotel, Wispernet, etc.)
  if (
    lineItems.length === 0 &&
    (text.includes('Herotel') ||
      text.includes('Wispernet') ||
      text.includes('Internet'))
  ) {
    const internetItemRegex =
      /(Hero Wireless|Premium Uncapped Internet|Internet Service)\s*-\s*([A-Za-z0-9 .,\/-]+)\s+(\d+(?:\.\d+)?)\s+(?:R|ZAR)?\s*(\d+(?:,\d+)?(?:\.\d+)?)\s+(?:\d+(?:\.\d+)%)?\s+(?:R|ZAR)?\s*(\d+(?:,\d+)?(?:\.\d+)?)/g;
    while ((match = internetItemRegex.exec(text)) !== null) {
      lineItems.push({
        serviceType: match[1].trim(),
        description: match[2].trim(),
        quantity: match[3].trim(),
        unitPrice: match[4].trim().replace(/,/g, ''),
        total: match[5].trim().replace(/,/g, ''),
      });
    }
  }

  // Approach 5: For municipal accounts with service items
  if (
    lineItems.length === 0 &&
    (text.includes('Municipality') || text.includes('Munisipaliteit'))
  ) {
    const municipalItemRegex =
      /(Electricity|Water|Rates|Refuse|Sewerage|Sanitation|Rent)\s+(?:[A-Za-z0-9 .,\/-]+)?\s+(?:R|ZAR)?\s*(\d+(?:,\d+)?(?:\.\d+)?)\s+(?:R|ZAR)?\s*(\d+(?:,\d+)?(?:\.\d+)?)\s+(?:R|ZAR)?\s*(\d+(?:,\d+)?(?:\.\d+)?)/g;
    while ((match = municipalItemRegex.exec(text)) !== null) {
      lineItems.push({
        serviceType: match[1].trim(),
        consumption: '',
        basicCharge: match[2] ? match[2].trim().replace(/,/g, '') : '',
        vat: match[3] ? match[3].trim().replace(/,/g, '') : '',
        total: match[4] ? match[4].trim().replace(/,/g, '') : '',
      });
    }
  }

  // If still no line items detected, try a more generic approach
  if (lineItems.length === 0) {
    // Look for patterns that might indicate a line item in almost any format
    const genericItemRegex =
      /([A-Za-z0-9 .,\/-]+)\s+(\d+(?:\.\d+)?)\s+(?:R|ZAR)?\s*(\d+(?:,\d+)?(?:\.\d+)?)\s+(?:R|ZAR)?\s*(\d+(?:,\d+)?(?:\.\d+)?)/g;

    while ((match = genericItemRegex.exec(text)) !== null) {
      // Verify this is likely a line item and not some other numeric data
      const description = match[1].trim();
      if (
        description.length > 3 &&
        !description.match(/total|subtotal|tax|vat|date|invoice/i)
      ) {
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
