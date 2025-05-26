export function dateConverter(dateString) {
    // Remove extra whitespace and normalize
    const cleaned = dateString.trim();
    
    // Month names for conversion
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthAbbr = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };
    
    let day, month, year;
    
    // Pattern 1: MM/dd/yyyy or dd/MM/yyyy (04/03/2025)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) {
        const [first, second, yearPart] = cleaned.split('/');
        const firstNum = parseInt(first);
        const secondNum = parseInt(second);
        year = parseInt(yearPart);
        
        // Smart detection: if first number > 12, it must be day (dd/MM/yyyy)
        // if second number > 12, it must be day (MM/dd/yyyy)
        if (firstNum > 12) {
            // dd/MM/yyyy format
            day = firstNum;
            month = secondNum - 1;
        } else if (secondNum > 12) {
            // MM/dd/yyyy format
            month = firstNum - 1;
            day = secondNum;
        } else {
            // Ambiguous case (both <= 12), assume dd/MM/yyyy (European format)
            // Change this to MM/dd/yyyy if you prefer US format as default
            day = firstNum;
            month = secondNum - 1;
        }
    }
    
    // Pattern 2: yyyy/MM/dd (2025/03/20)
    else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(cleaned)) {
        const [yearPart, monthPart, dayPart] = cleaned.split('/');
        year = parseInt(yearPart);
        month = parseInt(monthPart) - 1;
        day = parseInt(dayPart);
    }
    
    // Pattern 3: MM/dd/yy (03/03/25)
    else if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(cleaned)) {
        const [monthPart, dayPart, yearPart] = cleaned.split('/');
        month = parseInt(monthPart) - 1;
        day = parseInt(dayPart);
        year = 2000 + parseInt(yearPart); // Assuming 20xx
    }
    
    // Pattern 4: d MMM yyyy (1 Mar 2025)
    else if (/^\d{1,2}\s+[a-zA-Z]{3}\s+\d{4}$/.test(cleaned)) {
        const parts = cleaned.split(/\s+/);
        day = parseInt(parts[0]);
        const monthStr = parts[1].toLowerCase();
        month = monthAbbr[monthStr];
        year = parseInt(parts[2]);
    }
    
    // Pattern 5: yyyy-MM-dd (2025-03-25)
    else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleaned)) {
        const [yearPart, monthPart, dayPart] = cleaned.split('-');
        year = parseInt(yearPart);
        month = parseInt(monthPart) - 1;
        day = parseInt(dayPart);
    }
    
    // Pattern 6: dd-MM-yyyy (01-03-2025)
    else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(cleaned)) {
        const [dayPart, monthPart, yearPart] = cleaned.split('-');
        day = parseInt(dayPart);
        month = parseInt(monthPart) - 1;
        year = parseInt(yearPart);
    }
    
    // Pattern 7: dd MM yyyy (26 03 2025)
    else if (/^\d{1,2}\s+\d{1,2}\s+\d{4}$/.test(cleaned)) {
        const parts = cleaned.split(/\s+/);
        day = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        year = parseInt(parts[2]);
    }
    
    else {
        return dateString; // Return original if format not recognized
    }
    
    // Validate the parsed date
    if (month < 0 || month > 11 || day < 1 || day > 31 || year < 1900) {
        return dateString; // Return original if invalid values
    }
    
    // Create date object and validate it exists
    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
        return dateString; // Return original if invalid date
    }
    
    // Format as dd-MMMM-yyyy
    const formattedDay = day.toString().padStart(2, '0');
    const formattedMonth = monthNames[month];
    const formattedYear = year.toString();
    
    return `${formattedDay}-${formattedMonth}-${formattedYear}`;
}

// Test with your examples - now using async/await
const testDates = [
    '04/03/2025',
    '2025/03/20', 
    '03/03/25',
    '1 Mar 2025',
    '2025-03-25',
    '01-03-2025',
    '26 03 2025',
    'invalid format',
    '99/99/9999'
];

async function runTests() {
    console.log('Testing date conversions:');
    for (const dateStr of testDates) {
        const converted = await dateConverter(dateStr);
        console.log(`${dateStr} → ${converted}`);
    }
}

// Run tests
runTests();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = dateConverter;
}