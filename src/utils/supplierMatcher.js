import Fuse from 'fuse.js';
import { supplierCodes } from './supplierCodes';

// Setup Fuse.js for fuzzy matching
const fuse = new Fuse(supplierCodes, {
  keys: ['name'],
  threshold: 0.3, // Lower threshold means more strict matching
  distance: 100, // How far to search for matches
});

// Match supplier name to supplier code
export const matchSupplier = (supplierName) => {
  if (!supplierName || supplierName === 'Unknown Supplier') {
    return { code: '', confidence: 'none' };
  }
  // Direct match first (case insensitive)
  const directMatch = supplierCodes.find(
    (s) => s.name.toLowerCase() === supplierName.toLowerCase()
  );

  if (directMatch) {
    return { code: directMatch.code, confidence: 'high' };
  }

  // Try partial match
  const partialMatch = supplierCodes.find(
    (s) =>
      s.name.toLowerCase().includes(supplierName.toLowerCase()) ||
      supplierName.toLowerCase().includes(s.name.toLowerCase())
  );

  if (partialMatch) {
    return { code: partialMatch.code, confidence: 'medium' };
  }

  // Try fuzzy matching
  const fuzzyResults = fuse.search(supplierName);

  if (fuzzyResults.length > 0) {
    const bestMatch = fuzzyResults[0].item;

    // Calculate confidence based on score
    const confidence = fuzzyResults[0].score < 0.2 ? 'medium' : 'low';

    return { code: bestMatch.code, confidence };
  }

  return { code: '', confidence: 'none' };
};