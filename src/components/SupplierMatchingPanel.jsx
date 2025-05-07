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
} from '@mui/material';
import { supplierCodes } from '../utils/supplierCodes';

const SupplierMatchingPanel = ({ processedData, onUpdate }) => {
  const [supplierMatches, setSupplierMatches] = useState([]);

  useEffect(() => {
    if (processedData && processedData.length > 0) {
      // Extract unique suppliers from the processed data and filter out undefined values
      const uniqueSuppliers = [
        ...new Set(
          processedData.map((item) => item.supplierName).filter((name) => name) // Filter out undefined/null values
        ),
      ];

      // Create initial matches with proper null checks
      const initialMatches = uniqueSuppliers.map((supplierName) => {
        // Try to find a match in the supplier codes list with null safety
        const matchedSupplier = supplierCodes.find((s) => {
          if (!supplierName || !s.name) return false;
          return (
            s.name.toLowerCase().includes(supplierName.toLowerCase()) ||
            supplierName.toLowerCase().includes(s.name.toLowerCase())
          );
        });

        return {
          supplierName,
          matchedCode: matchedSupplier ? matchedSupplier.code : '',
          confidence: matchedSupplier ? 'high' : 'none',
        };
      });

      setSupplierMatches(initialMatches);
    }
  }, [processedData]);

  // Update supplier code in processed data
  const handleSupplierCodeUpdate = (supplierName, newCode) => {
    // Update the supplier matches
    const updatedMatches = supplierMatches.map((match) => {
      if (match.supplierName === supplierName) {
        return { ...match, matchedCode: newCode };
      }
      return match;
    });
    setSupplierMatches(updatedMatches);

    // Update the processed data
    const updatedData = processedData.map((item) => {
      if (item.supplierName === supplierName) {
        return { ...item, supplierCode: newCode };
      }
      return item;
    });

    onUpdate(updatedData);
  };

  if (!processedData || processedData.length === 0) {
    return null;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant='h6' gutterBottom>
        Supplier Matching
      </Typography>

      {supplierMatches.length > 0 ? (
        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Detected Supplier</TableCell>
                <TableCell>Matched Code</TableCell>
                <TableCell>Confidence</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {supplierMatches.map((match, index) => (
                <TableRow key={index}>
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
                          match.supplierName,
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
                    />
                  </TableCell>
                  <TableCell>
                    {match.confidence === 'high' ? 'High' : 'Not matched'}
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
                            match.supplierName,
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
        <Typography>No supplier data to match</Typography>
      )}
    </Paper>
  );
};

export default SupplierMatchingPanel;
