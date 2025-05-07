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
      setProcessedData(result.data);

      // Generate columns dynamically based on the data
      const dynamicColumns = generateColumns(result.data);
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
    return Array.from(allKeys)
      .filter((key) => key !== 'id') // Keep id in data but don't show as column
      .map((key) => ({
        field: key,
        headerName:
          key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        flex: 1,
        editable: true,
      }));
  };

  // Handle cell edit in the data grid
  const handleCellEdit = (params) => {
    const updatedData = processedData.map((row) => {
      if (row.id === params.id) {
        return { ...row, [params.field]: params.value };
      }
      return row;
    });

    setProcessedData(updatedData);
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
            onCellEditCommit={handleCellEdit}
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
        onUpdate={(updatedData) => setProcessedData(updatedData)}
      />
    </Container>
  );
}

export default App;
