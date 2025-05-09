// General parser for NASHUA invoices
function extractNashuaLineItems(text) {
  const lineItems = [];

  if (text.includes('Bridoon Trade and Invest 197')) {
    // Find the table section between headers and Total (excl VAT)
    // First locate the line with headers
    const headerPattern =
      /Description\s+Qty\s+Unit\s+Price\s+Price\s+VAT\s+Total/i;
    const headerMatch = text.match(headerPattern);

    if (headerMatch) {
      // Get the index where headers are found
      const headerIndex = text.indexOf(headerMatch[0]);

      // Get the index where "Total (excl VAT)" is found
      const totalExclPattern = /Total\s+\(excl\s+VAT\)/i;
      const totalExclMatch = text.match(totalExclPattern);
      const totalExclIndex = totalExclMatch
        ? text.indexOf(totalExclMatch[0])
        : -1;

      if (headerIndex >= 0 && totalExclIndex > headerIndex) {
        // Extract the table content between these markers
        const tableContent = text
          .substring(headerIndex + headerMatch[0].length, totalExclIndex)
          .trim();

        // Split into lines and process each line that contains data
        const lines = tableContent
          .split('\n')
          .filter((line) => line.trim() !== '');

        for (const line of lines) {
          // For each line, extract item details
          // We'll use a more flexible approach to handle different item types

          // First, try to match a "standard" line with description, quantities and prices
          const standardLine = line.match(
            /([^0-9]+)\s+(\d+(?:\.\d+)?)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/
          );

          if (standardLine) {
            // This is a regular line item
            lineItems.push({
              description: standardLine[1].trim(),
              itemCode: extractItemCode(standardLine[1].trim()),
              quantity: standardLine[2].trim(),
              unitPrice: standardLine[3].trim(),
              price: standardLine[4].trim(),
              vat: standardLine[5].trim(),
              total: standardLine[6].trim(),
            });
            continue;
          }

          // Try to match meter reading patterns which span multiple lines
          const meterStart = line.match(/\*\s+([^*]+)\*\s*$/);
          if (meterStart) {
            // This is the start of a meter reading section
            // Need to collect multiple lines to form a complete item
            const meterType = meterStart[1].trim();
            let meterInfo = line;
            let i = lines.indexOf(line) + 1;

            // Collect lines until we find a quantity-unit price-amount pattern
            while (i < lines.length) {
              meterInfo += ' ' + lines[i];

              // Check if this line contains the numeric values we need
              const valuePattern =
                /(\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/;
              const valueMatch = lines[i].match(valuePattern);

              if (valueMatch) {
                // We have found the values, create the item
                lineItems.push({
                  description: meterInfo.replace(valueMatch[0], '').trim(),
                  itemCode: extractItemCodeFromMeter(meterInfo),
                  quantity: valueMatch[1].trim(),
                  unitPrice: valueMatch[2].trim(),
                  price: valueMatch[3].trim(),
                  vat: valueMatch[4].trim(),
                  total: valueMatch[5].trim(),
                });
                break;
              }
              i++;
            }
            continue;
          }

          // Try to match minimum charge patterns
          const minChargePattern = /Min\.Copy\s+Chg\s+([\d.]+)/;
          const minChargeMatch = line.match(minChargePattern);

          if (minChargeMatch) {
            // Find the associated values in subsequent lines
            let i = lines.indexOf(line) + 1;
            let minChargeInfo = line;

            while (i < lines.length) {
              minChargeInfo += ' ' + lines[i];

              // Look for shortfall and values
              if (lines[i].includes('Shortfall')) {
                // Look for the numeric values in the next lines
                let j = i + 1;
                while (j < lines.length) {
                  const valuePattern = /(\d+(?:\.\d+)?)\s+([\d.]+)\s+([\d.]+)/;
                  const valueMatch = lines[j].match(valuePattern);

                  if (valueMatch) {
                    lineItems.push({
                      description: minChargeInfo.trim(),
                      itemCode: 'Min.Copy Chg Shortfall',
                      quantity: '1', // Min charges are typically counted as 1
                      unitPrice: valueMatch[1].trim(),
                      price: valueMatch[1].trim(),
                      vat: valueMatch[2].trim(),
                      total: valueMatch[3].trim(),
                    });
                    break;
                  }
                  j++;
                }
                break;
              }
              i++;
            }
          }
        }
      }
    }
  }

  return lineItems;
}

// Helper function to extract item code from description
function extractItemCode(description) {
  // Extract the most likely item code from the description
  // This will vary based on the patterns in your invoices

  // For meter readings like "Copies Made at Tier 1"
  const tierMatch = description.match(/Copies Made at Tier (\d+)/);
  if (tierMatch) {
    return `Copies Made at Tier ${tierMatch[1]}`;
  }

  // For other items, use the first part that looks like a code
  const codeMatch = description.match(/^([A-Z0-9]+(?:\/[A-Z0-9]+)*)/);
  if (codeMatch) {
    return codeMatch[1];
  }

  // Default case: first part of the description
  const parts = description.split(/\s+/);
  return parts[0] || description;
}

// Helper function to extract item code specifically from meter readings
function extractItemCodeFromMeter(meterInfo) {
  const tierMatch = meterInfo.match(/Copies Made at Tier (\d+)/);
  if (tierMatch) {
    return `Copies Made at Tier ${tierMatch[1]}`;
  }

  const meterTypeMatch = meterInfo.match(/\*\s+([^*]+)\s+\*/);
  if (meterTypeMatch) {
    return `${meterTypeMatch[1].trim()} Meter`;
  }

  return 'Meter Reading';
}

// Main extraction function that can be integrated into your codebase
function extractLineItems(text) {
  let lineItems = [];

  if (text.includes('Bridoon Trade and Invest 197')) {
    lineItems = extractNashuaLineItems(text);
  }

  return lineItems;
}

// Example usage:
// const extractedItems = extractLineItems(invoiceText);
// console.log(JSON.stringify(extractedItems, null, 2));
