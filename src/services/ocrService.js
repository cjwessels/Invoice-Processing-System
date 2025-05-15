import pdfjs from '../utils/pdfWorker';
import { extractInvoiceData, extractInvoiceNumber } from '../utils/invoiceParser';
import { matchSupplier } from '../utils/supplierMatcher';

export const processPDF = async (file) => {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load the PDF with PDF.js
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    // Process only the first page for Mustek invoices
    // For other invoices, we'll still process all pages
    const pageTexts = [];
    
    // Always process at least the first page
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(' ');
    pageTexts.push(pageText);
    
    // Check if this is a Mustek invoice by looking for "Mustek Limited" in the first page
    const isMustekInvoice = pageText.includes("Mustek Limited");
    
    // If it's not a Mustek invoice, process the remaining pages
    if (!isMustekInvoice) {
      for (let i = 2; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ');
        pageTexts.push(pageText);
      }
    } else {
      console.log(`Mustek invoice detected: ${file.name} - Processing only first page`);
    }

    // Combine all page texts
    const fullText = pageTexts.join('\n\n');

    // Extract structured data from text
    const extractedData = extractInvoiceData(fullText, file.name);

    // Match supplier
    const supplierInfo = matchSupplier(extractedData.supplierName);

    return {
      ...extractedData,
      supplierCode: supplierInfo.code,
      matchConfidence: supplierInfo.confidence,
    };
  } catch (error) {
    console.error(`Error processing PDF ${file.name}:`, error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
};

// Process multiple invoices
export const processInvoices = async (files) => {
  const processedData = [];
  let id = 1;

  for (const file of files) {
    try {
      console.log(`Processing file: ${file.name}`);
      const fileData = await processPDF(file);

      // For Mustek invoices, create only one row per file
      if (fileData.supplierName === 'Mustek Limited') {
        processedData.push({
          id: id++,
          fileName: file.name,
          invoiceNumber: fileData.invoiceNumber,
          invoiceDate: fileData.invoiceDate,
          dueDate: fileData.dueDate,
          supplierName: fileData.supplierName,
          supplierCode: fileData.supplierCode,
          description: fileData.description || '',
          quantity: fileData.quantity || '',
          unitPrice: fileData.unitPrice || '',
          subtotal: fileData.subtotal || '',
          tax: fileData.tax || '',
          total: fileData.total || '',
        });
      }
      // For other invoices, handle line items as before
      else if (fileData.lineItems && fileData.lineItems.length > 0) {
        fileData.lineItems.forEach((item) => {
          processedData.push({
            id: id++,
            fileName: file.name,
            invoiceNumber: fileData.invoiceNumber,
            invoiceDate: fileData.invoiceDate,
            dueDate: fileData.dueDate,
            supplierName: fileData.supplierName,
            supplierCode: fileData.supplierCode,
            ...item,
          });
        });
      } else {
        // If no line items were found, create a single row
        processedData.push({
          id: id++,
          fileName: file.name,
          invoiceNumber: fileData.invoiceNumber,
          invoiceDate: fileData.invoiceDate,
          dueDate: fileData.dueDate,
          supplierName: fileData.supplierName,
          supplierCode: fileData.supplierCode,
          description: fileData.description || '',
          quantity: fileData.quantity || '',
          unitPrice: fileData.unitPrice || '',
          subtotal: fileData.subtotal || '',
          tax: fileData.tax || '',
          total: fileData.total || '',
        });
      }
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      // Add an error entry
      processedData.push({
        id: id++,
        fileName: file.name,
        error: error.message,
        status: 'Error',
      });
    }
  }

  return { data: processedData };
};