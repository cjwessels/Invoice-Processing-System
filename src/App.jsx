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

function App() {
  const [files, setFiles] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Create uploads directory if it doesn't exist
    const createUploadsDir = async () => {
      try {
        const response = await fetch('/api/create-directory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: import.meta.env.VITE_SOURCE_FILES_PATH
          }),
        });
        if (!response.ok) {
          console.error('Failed to create uploads directory');
        }
      } catch (err) {
        console.error('Error creating uploads directory:', err);
      }
    };

    createUploadsDir();
  }, []);

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

  const formatDateForFileName = (dateString) => {
    if (!dateString || dateString === 'Unknown') return 'unknown_date';
    return dateString.replace(/[\/.-]/g, '_');
  };

  const handleRenameAndMove = async () => {
    try {
      setIsMoving(true);
      setError(null);

      const sourcePath = import.meta.env.VITE_SOURCE_FILES_PATH;
      const processedPath = import.meta.env.VITE_PROCESSED_FILES_PATH;
      
      if (!sourcePath || !processedPath) {
        throw new Error('Source or processed files path not configured');
      }

      for (const item of processedData) {
        const formattedDate = formatDateForFileName(item.invoiceDate);
        const newFileName = `${item.supplierName}~${item.supplierCode}~${formattedDate}~${item.invoiceNumber}.pdf`;

        // Add delay between file operations
        await new Promise(resolve => setTimeout(resolve, 500));

        const response = await fetch('/api/move-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourcePath: `${sourcePath}\\${item.fileName}`,
            targetPath: `${processedPath}\\${newFileName}`,
            useCopyMethod: true, // Signal to use copy-then-delete approach
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to move file ${item.fileName}`);
        }
      }

      setFiles([]);
      setProcessedData([]);
      
    } catch (err) {
      setError('Error moving files: ' + (err.message || 'Unknown error'));
    } finally {
      setIsMoving(false);
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
            disabled={isMoving || processedData.length === 0}
          >
            {isMoving ? <CircularProgress size={24} /> : 'Rename and Move Files'}
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