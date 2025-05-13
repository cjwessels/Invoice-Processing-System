import React, { useState } from 'react';
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

function App() {
  const [files, setFiles] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const columns = [
    { field: 'fileName', headerName: 'File Name', flex: 1, editable: true },
    { field: 'supplierName', headerName: 'Supplier Name', flex: 1, editable: true },
    { field: 'supplierCode', headerName: 'Supplier Code', flex: 1, editable: true },
    { field: 'invoiceDate', headerName: 'Invoice Date', flex: 1, editable: true },
    { field: 'invoiceNumber', headerName: 'Invoice Number', flex: 1, editable: true }
  ];

  const handleFilesAdded = (newFiles) => {
    setFiles([...files, ...newFiles]);
  };

  const handleFileRemove = (fileName) => {
    setFiles(files.filter((file) => file.name !== fileName));
  };

  const handleProcessInvoices = async () => {
    if (files.length === 0) {
      setError('Please upload at least one invoice');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await processInvoices(files);
      const dataWithIds = result.data.map((item, index) => ({
        ...item,
        id: `row-${index}`,
      }));
      setProcessedData(dataWithIds);
    } catch (err) {
      setError('Error processing invoices: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCellEdit = (params) => {
    const updatedData = processedData.map((row) =>
      row.id === params.id ? { ...row, [params.field]: params.value } : row
    );
    setProcessedData(updatedData);
  };

  const handleRenameAndMove = async () => {
    try {
      const processedPath = import.meta.env.VITE_PROCESSED_FILES_PATH;
      if (!processedPath) {
        throw new Error('Processed files path not configured');
      }

      // In a real implementation, you would handle the file operations here
      console.log('Files would be renamed and moved to:', processedPath);
      console.log('Processed data:', processedData);

      setError(null);
    } catch (err) {
      setError('Error renaming files: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" component="h1" gutterBottom mt={3}>
        Invoice Processing System V2
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <FileUploadComponent
          onFilesAdded={handleFilesAdded}
          onFileRemove={handleFileRemove}
          files={files}
        />

        <Box display="flex" justifyContent="space-between" mt={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleProcessInvoices}
            disabled={isProcessing || files.length === 0}
          >
            {isProcessing ? <CircularProgress size={24} /> : 'Process Invoices'}
          </Button>

          <Button
            variant="contained"
            color="success"
            onClick={handleRenameAndMove}
            disabled={processedData.length === 0}
          >
            Rename and Move Files
          </Button>
        </Box>
      </Paper>

      {processedData.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mb: 3, height: 600 }}>
          <DataGrid
            rows={processedData}
            columns={columns}
            pageSizeOptions={[10, 25, 50]}
            autoHeight
            onCellEditStop={handleCellEdit}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
          />
        </Paper>
      )}
    </Container>
  );
}

export default App;