import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const FileUploadComponent = ({ onFilesAdded, onFileRemove, files }) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      onFilesAdded(acceptedFiles);
    },
    [onFilesAdded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
  });

  return (
    <Box>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed #cccccc',
          borderRadius: 2,
          p: 3,
          mb: 2,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragActive ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.05)',
          },
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant='h6'>
          {isDragActive
            ? 'Drop the files here'
            : 'Drag & drop invoice PDFs here'}
        </Typography>
        <Typography variant='body2' color='textSecondary'>
          Or click to browse files
        </Typography>
      </Box>

      {files.length > 0 && (
        <Box>
          <Typography variant='subtitle1' gutterBottom>
            Selected Files ({files.length})
          </Typography>
          <List dense>
            {files.map((file, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton
                    edge='end'
                    onClick={() => onFileRemove(file.name)}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={file.name}
                  secondary={`${(file.size / 1024).toFixed(1)} KB`}
                />
                <Chip label='PDF' size='small' color='primary' sx={{ ml: 1 }} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default FileUploadComponent;
