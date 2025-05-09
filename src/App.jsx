import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import FileUploadComponent from './components/FileUploadComponent';
import { processInvoices } from './services/ocrService';
import { exportToCSV } from './utils/exportUtils';
import SupplierMatchingPanel from './components/SupplierMatchingPanel';
import DeleteIcon from '@mui/icons-material/Delete';

function App() {
  const [files, setFiles] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [columns, setColumns] = useState([]);

  // Handle file upload
  const handleFilesAdded = (newFiles) => {
    setFiles([...files, ...newFiles]);
  };

  // Remove file
  const handleFileRemove = (fileName) => {
    setFiles(files.filter((file) => file.name !== fileName));
  };

  // Process the invoices
  const handleProcessInvoices = async () => {
    if (files.length === 0) {
      setError('Please upload at least one invoice');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('Starting to process invoices:', files.length);
      const result = await processInvoices(files);
      console.log('Processing complete:', result.data.length, 'rows extracted');

      // Add a unique ID and fileName to each row if not present
      const dataWithIds = result.data.map((item, index) => {
        // If the item doesn't have a fileName, try to get it from the original file
        const fileName =
          item.fileName ||
          (item.fileIndex !== undefined && files[item.fileIndex]
            ? files[item.fileIndex].name
            : `File-${index % files.length}`);

        return {
          ...item,
          id: item.id || `row-${index}`,
          fileName: fileName,
        };
      });

      setProcessedData(dataWithIds);

      // Generate columns dynamically based on the data
      const dynamicColumns = generateColumns(dataWithIds);
      setColumns(dynamicColumns);

      // Check if any errors occurred
      const errors = result.data.filter((item) => item.status === 'Error');
      if (errors.length > 0) {
        setError(
          `${errors.length} file(s) couldn't be processed. Check console for details.`
        );
      }
    } catch (err) {
      console.error('Invoice processing failed:', err);
      setError(
        'Error processing invoices: ' + (err.message || 'Unknown error')
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Export data to CSV
  const handleExport = () => {
    if (processedData.length === 0) {
      setError('No data to export');
      return;
    }
    console.log('Exporting data:', processedData);

    exportToCSV(processedData, 'invoice_data.csv');
  };

  // Generate columns for the data grid
  const generateColumns = (data) => {
    if (!data || data.length === 0) return [];

    // Get all unique keys from all data objects
    const allKeys = new Set();
    data.forEach((item) => {
      Object.keys(item).forEach((key) => allKeys.add(key));
    });

    // Create column definitions
    const dynamicColumns = Array.from(allKeys)
      .filter((key) => key !== 'id') // Keep id in data but don't show as column
      .map((key) => ({
        field: key,
        headerName:
          key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        flex: 1,
        editable: true,
      }));

    // Add a delete button column
    dynamicColumns.push({
      field: 'delete',
      headerName: 'Delete',
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          variant='contained'
          color='error'
          size='small'
          onClick={() => handleDeleteRow(params.id)}
          startIcon={<DeleteIcon />}
        >
          Delete
        </Button>
      ),
      flex: 0.5,
    });

    return dynamicColumns;
  };

  // Handle row deletion
  const handleDeleteRow = (id) => {
    const updatedData = processedData.filter((row) => row.id !== id);
    setProcessedData(updatedData);
  };

  // Update columns when processedData changes
  useEffect(() => {
    if (processedData.length > 0) {
      const dynamicColumns = generateColumns(processedData);
      setColumns(dynamicColumns);
    }
  }, [processedData]);

  // Handle cell edit in the data grid
  const handleCellEdit = (params) => {
    const { id, field, value } = params;

    // Update the specific row in processedData
    const updatedData = processedData.map((row) => {
      if (row.id === id) {
        return { ...row, [field]: value }; // Update the specific field with the new value
      }
      return row;
    });

    setProcessedData(updatedData); // Update the state with the modified data
  };

  // Callback to handle updates from SupplierMatchingPanel
  const handleSupplierMatchUpdate = (updatedRowData) => {
    // Update the specific row in processedData by its ID
    const updatedData = processedData.map((row) => {
      if (row.id === updatedRowData.id) {
        // Create a new object that merges the original row with the updates
        const updatedRow = { ...row, ...updatedRowData };

        console.log('Updating row:', row.id, 'with new data:', updatedRowData);
        return updatedRow;
      }
      return row;
    });

    console.log('Updated processed data after supplier match:', updatedData);
    setProcessedData(updatedData); // Update the state with the modified data
  };

  return (
    <Container maxWidth='xl'>
      <Typography variant='h4' component='h1' gutterBottom mt={3}>
        Invoice Processing System
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <FileUploadComponent
          onFilesAdded={handleFilesAdded}
          onFileRemove={handleFileRemove}
          files={files}
        />

        <Box display='flex' justifyContent='space-between' mt={2}>
          <Button
            variant='contained'
            color='primary'
            onClick={handleProcessInvoices}
            disabled={isProcessing || files.length === 0}
          >
            {isProcessing ? <CircularProgress size={24} /> : 'Process Invoices'}
          </Button>

          <Button
            variant='contained'
            color='success'
            onClick={handleExport}
            disabled={processedData.length === 0}
          >
            Export to CSV
          </Button>
        </Box>
      </Paper>

      {processedData.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mb: 3, height: 600 }}>
          <Typography variant='h6' gutterBottom>
            Extracted Data
          </Typography>

          <DataGrid
            rows={processedData}
            columns={columns}
            pageSizeOptions={[10, 25, 50, 100]}
            autoHeight
            onCellEditStop={(params, event) => {
              // Only update if the value has actually changed
              if (params.value !== params.row[params.field]) {
                handleCellEdit(params);
              }
            }}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            getRowId={(row) => row.id}
          />
        </Paper>
      )}

      <SupplierMatchingPanel
        processedData={processedData}
        onUpdate={handleSupplierMatchUpdate}
      />
    </Container>
  );
}

export default App;
