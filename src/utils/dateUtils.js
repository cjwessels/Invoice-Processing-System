// Parse various date formats to a standard format
export const parseDate = (dateString) => {
  if (!dateString) return 'Unknown';

  // Clean up the input
  const cleanDate = dateString.trim();

  // Try to parse with built-in Date
  const date = new Date(cleanDate);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  // Handle common date formats manually

  // Format: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyRegex = /(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/;
  const dmyMatch = cleanDate.match(dmyRegex);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    let year = dmyMatch[3];

    // Convert 2-digit year to 4-digit
    if (year.length === 2) {
      year = (parseInt(year) > 50 ? '19' : '20') + year;
    }

    return `${year}-${month}-${day}`;
  }

  // Format: Month DD, YYYY or DD Month YYYY
  const monthNameRegex =
    /(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})|([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{2,4})/;
  const monthNameMatch = cleanDate.match(monthNameRegex);
  if (monthNameMatch) {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    let day, month, year;

    if (monthNameMatch[1]) {
      // DD Month YYYY
      day = monthNameMatch[1].padStart(2, '0');
      const monthName = monthNameMatch[2];
      year = monthNameMatch[3];

      // Find month number
      month = String(
        monthNames.findIndex((m) =>
          m.toLowerCase().startsWith(monthName.toLowerCase())
        ) + 1
      ).padStart(2, '0');
    } else {
      // Month DD, YYYY
      const monthName = monthNameMatch[4];
      day = monthNameMatch[5].padStart(2, '0');
      year = monthNameMatch[6];

      // Find month number
      month = String(
        monthNames.findIndex((m) =>
          m.toLowerCase().startsWith(monthName.toLowerCase())
        ) + 1
      ).padStart(2, '0');
    }

    // Convert 2-digit year to 4-digit
    if (year.length === 2) {
      year = (parseInt(year) > 50 ? '19' : '20') + year;
    }

    return `${year}-${month}-${day}`;
  }

  // If all parsing attempts fail, return the original string
  return cleanDate;
};

// Format date from DD/MM/YYYY to DD_MM_YYYY for file naming
export const formatDateForFileName = (dateString) => {
  if (!dateString || dateString === 'Unknown') return 'unknown_date';
  return dateString.replace(/\//g, '_');
};