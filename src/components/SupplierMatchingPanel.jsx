import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
} from '@mui/material';
import { supplierCodes } from '../utils/supplierCodes';

const SupplierMatchingPanel = ({ processedData, onUpdate }) => {
  const [invoiceMatches, setInvoiceMatches] = useState([]);

  useEffect(() => {
    if (processedData && processedData.length > 0) {
      // Group the processed data by invoice filename
      const invoiceGroups = {};

      processedData.forEach((item) => {
        const fileName = item.fileName || 'Unknown File';
        if (!invoiceGroups[fileName]) {
          invoiceGroups[fileName] = {
            fileName,
            supplierName: item.supplierName || 'Unknown Supplier',
            supplierCode: item.supplierCode || '',
            invoiceNumber: item.invoiceNumber || '',
            rowIds: [], // track all row IDs associated with this invoice
          };
        }
        invoiceGroups[fileName].rowIds.push(item.id);
      });

      // Create an array of invoice matches from the groups
      const initialMatches = Object.values(invoiceGroups).map((invoice) => {
        // Try to find a match in the supplier codes list with null safety
        const matchedSupplier = supplierCodes.find((s) => {
          if (!invoice.supplierName || !s.name) return false;
          return (
            s.name.toLowerCase().includes(invoice.supplierName.toLowerCase()) ||
            invoice.supplierName.toLowerCase().includes(s.name.toLowerCase())
          );
        });

        return {
          fileName: invoice.fileName,
          supplierName: invoice.supplierName,
          invoiceNumber: invoice.invoiceNumber,
          matchedCode:
            invoice.supplierCode ||
            (matchedSupplier ? matchedSupplier.code : ''),
          confidence: invoice.supplierCode
            ? 'high'
            : matchedSupplier
            ? 'medium'
            : 'none',
          rowIds: invoice.rowIds,
        };
      });

      setInvoiceMatches(initialMatches);
    }
  }, [processedData]);

  // Update supplier code in processed data
  const handleSupplierCodeUpdate = (fileName, rowIds, newCode) => {
    // Get the matched supplier details
    const selectedSupplier = supplierCodes.find((s) => s.code === newCode);

    // Update the invoice matches
    const updatedMatches = invoiceMatches.map((match) => {
      if (match.fileName === fileName) {
        return {
          ...match,
          matchedCode: newCode,
          confidence: selectedSupplier ? 'high' : 'low',
        };
      }
      return match;
    });
    setInvoiceMatches(updatedMatches);

    // Update all rows associated with this invoice
    rowIds.forEach((rowId) => {
      const updates = {
        id: rowId,
        supplierCode: newCode,
      };

      // Update supplier name if we have a standardized name
      if (selectedSupplier && selectedSupplier.name) {
        updates.supplierName = selectedSupplier.name;
      }

      onUpdate(updates);
    });
  };

  if (!processedData || processedData.length === 0) {
    return null;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant='h6' gutterBottom>
        Invoice Supplier Matching
      </Typography>

      {invoiceMatches.length > 0 ? (
        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>File Name</TableCell>
                <TableCell>Invoice Number</TableCell>
                <TableCell>Detected Supplier</TableCell>
                <TableCell>Matched Code</TableCell>
                <TableCell>Confidence</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoiceMatches.map((match, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Typography variant='body2' noWrap sx={{ maxWidth: 180 }}>
                      {match.fileName}
                    </Typography>
                  </TableCell>
                  <TableCell>{match.invoiceNumber || '—'}</TableCell>
                  <TableCell>{match.supplierName}</TableCell>
                  <TableCell>
                    <Autocomplete
                      value={
                        supplierCodes.find(
                          (s) => s.code === match.matchedCode
                        ) || null
                      }
                      onChange={(event, newValue) => {
                        handleSupplierCodeUpdate(
                          match.fileName,
                          match.rowIds,
                          newValue ? newValue.code : ''
                        );
                      }}
                      options={supplierCodes}
                      getOptionLabel={(option) =>
                        `${option.code} - ${option.name}`
                      }
                      renderInput={(params) => (
                        <TextField {...params} size='small' />
                      )}
                      size='small'
                      sx={{ minWidth: 300 }}
                      isOptionEqualToValue={(option, value) =>
                        option && value && option.code === value.code
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {match.confidence === 'high' && (
                      <Chip label='High' size='small' color='success' />
                    )}
                    {match.confidence === 'medium' && (
                      <Chip label='Medium' size='small' color='primary' />
                    )}
                    {match.confidence === 'none' && (
                      <Chip label='Not matched' size='small' color='default' />
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size='small'
                      variant='outlined'
                      onClick={() => {
                        if (!match.supplierName) return;

                        const matchedSupplier = supplierCodes.find((s) => {
                          if (!s.name) return false;
                          return s.name
                            .toLowerCase()
                            .includes(match.supplierName.toLowerCase());
                        });

                        if (matchedSupplier) {
                          handleSupplierCodeUpdate(
                            match.fileName,
                            match.rowIds,
                            matchedSupplier.code
                          );
                        }
                      }}
                    >
                      Auto-Match
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography>No invoice data to match</Typography>
      )}
    </Paper>
  );
};

export default SupplierMatchingPanel;
