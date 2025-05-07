import pdfjs from '../utils/pdfWorker';
import { createWorker, PSM } from 'tesseract.js';
import { extractInvoiceData } from '../utils/invoiceParser';
import { matchSupplier } from '../utils/supplierMatcher';

// Initialize Tesseract worker
let tesseractWorker = null;

const initWorker = async () => {
  if (!tesseractWorker) {
    try {
      // Remove the logger function to avoid the DataCloneError
      tesseractWorker = await createWorker();

      await tesseractWorker.loadLanguage('eng');
      await tesseractWorker.initialize('eng');
      await tesseractWorker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
      });
    } catch (error) {
      console.error('Failed to initialize Tesseract worker:', error);
      throw new Error('OCR initialization failed: ' + error.message);
    }
  }
  return tesseractWorker;
};

// Process a single PDF file
export const processPDF = async (file) => {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load the PDF with PDF.js
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    // Process each page
    const pageTexts = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Extract text content
      const pageText = textContent.items.map((item) => item.str).join(' ');
      pageTexts.push(pageText);
    }

    // Combine all page texts - skipping OCR for now due to issues
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

      // For each line item, create a separate row with common invoice data
      if (fileData.lineItems && fileData.lineItems.length > 0) {
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

  // Clean up the worker if we used it
  if (tesseractWorker) {
    try {
      await tesseractWorker.terminate();
    } catch (error) {
      console.error('Error terminating Tesseract worker:', error);
    }
    tesseractWorker = null;
  }

  return { data: processedData };
};
