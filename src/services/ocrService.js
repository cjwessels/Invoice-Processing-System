import pdfjs from '../utils/pdfWorker';

export const processPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const pageTexts = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      pageTexts.push(pageText);
    }

    const fullText = pageTexts.join('\n\n');
    
    // Extract basic information - in a real implementation, you would have more sophisticated parsing
    return {
      fileName: file.name,
      supplierName: 'Extracted Supplier',
      supplierCode: 'SUP001',
      invoiceDate: '2024-01-01',
      invoiceNumber: 'INV001'
    };
  } catch (error) {
    console.error(`Error processing PDF ${file.name}:`, error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
};

export const processInvoices = async (files) => {
  const processedData = [];
  
  for (const file of files) {
    try {
      const fileData = await processPDF(file);
      processedData.push(fileData);
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      processedData.push({
        fileName: file.name,
        error: error.message,
        status: 'Error'
      });
    }
  }

  return { data: processedData };
};