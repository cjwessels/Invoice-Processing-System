// Export data to CSV file
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  // Get all column headers from the data
  const headers = Array.from(
    new Set(data.flatMap((item) => Object.keys(item)))
  ).filter((header) => header !== 'id'); // Exclude the id field

  // Create CSV header row
  let csvContent = headers.join(',') + '\n';

  // Add data rows
  data.forEach((item) => {
    const row = headers.map((header) => {
      // Get the value, or empty string if undefined
      const value = item[header] !== undefined ? item[header] : '';

      // Handle values with commas, quotes or newlines by wrapping in quotes
      if (
        typeof value === 'string' &&
        (value.includes(',') || value.includes('"') || value.includes('\n'))
      ) {
        // Escape any double quotes by doubling them
        return `"${value.replace(/"/g, '""')}"`;
      }

      return value;
    });

    csvContent += row.join(',') + '\n';
  });

  // Create a blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  // Create a temporary link and trigger download
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
