import * as pdfjs from 'pdfjs-dist';

// Instead of importing the worker as a default export, set the worker source directly
if (typeof window !== 'undefined') {
  const pdfjsWorkerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
}

export default pdfjs;
