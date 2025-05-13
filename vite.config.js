import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs/promises';
import path from 'node:path';

// File operations middleware
function fileOperationsMiddleware() {
  return {
    name: 'file-operations',
    configureServer(server) {
      // Create directory endpoint
      server.middlewares.use('/api/create-directory', async (req, res) => {
        if (req.method === 'POST') {
          try {
            const chunks = [];
            req.on('data', chunk => chunks.push(chunk));
            req.on('end', async () => {
              const { path: dirPath } = JSON.parse(Buffer.concat(chunks).toString());
              
              try {
                await fs.mkdir(dirPath, { recursive: true });
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true }));
              } catch (error) {
                console.error('Error creating directory:', error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: error.message }));
              }
            });
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
        } else {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });

      // Move file endpoint
      server.middlewares.use('/api/move-file', async (req, res) => {
        if (req.method === 'POST') {
          try {
            const chunks = [];
            req.on('data', chunk => chunks.push(chunk));
            req.on('end', async () => {
              const data = JSON.parse(Buffer.concat(chunks).toString());
              const { sourcePath, targetPath } = data;

              if (!sourcePath || !targetPath) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing required parameters' }));
                return;
              }

              try {
                // Check if source file exists
                try {
                  await fs.access(sourcePath);
                } catch (error) {
                  res.statusCode = 404;
                  res.end(JSON.stringify({ error: `Source file not found: ${sourcePath}` }));
                  return;
                }

                // Create the target directory if it doesn't exist
                await fs.mkdir(path.dirname(targetPath), { recursive: true });
                
                // Move the file
                await fs.rename(sourcePath, targetPath);
                
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true }));
              } catch (error) {
                console.error('Error moving file:', error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: `Error moving file: ${error.message}` }));
              }
            });
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
        } else {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), fileOperationsMiddleware()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    include: [
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
      'react-dropzone',
    ],
  },
});