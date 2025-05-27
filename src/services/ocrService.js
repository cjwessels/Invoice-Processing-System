import { PDFExtract } from 'pdf.js-extract';
import { extractInvoiceData } from '../utils/invoiceParser';
import { matchSupplier } from '../utils/supplierMatcher';

const pdfExtract = new PDFExtract();

export const processPDF = async (file) => {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text from PDF
    const data = await pdfExtract.extractBuffer(arrayBuffer);
    const fullText = data.pages.map(page => page.content.map(item => item.str).join(' ')).join('\n\n');

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