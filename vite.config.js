import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs/promises';
import path from 'node:path';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function copyFile(sourcePath, targetPath) {
  try {
    await fs.copyFile(sourcePath, targetPath);
  } catch (error) {
    throw new Error(`Failed to copy file: ${error.message}`);
  }
}

async function deleteFile(filePath, retries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await fs.unlink(filePath);
      return;
    } catch (error) {
      if (error.code === 'EBUSY' && attempt < retries) {
        console.log(`File busy, retrying deletion in ${delayMs}ms... (Attempt ${attempt}/${retries})`);
        await delay(delayMs);
        continue;
      }
      throw error;
    }
  }
}

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
              const { sourcePath, targetPath } = JSON.parse(Buffer.concat(chunks).toString());

              if (!sourcePath || !targetPath) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing required parameters' }));
                return;
              }

              try {
                // Normalize paths for Windows
                const normalizedSourcePath = path.normalize(sourcePath);
                const normalizedTargetPath = path.normalize(targetPath);

                // Check if source file exists
                try {
                  await fs.access(normalizedSourcePath);
                } catch (error) {
                  res.statusCode = 404;
                  res.end(JSON.stringify({ error: `Source file not found: ${normalizedSourcePath}` }));
                  return;
                }

                // Create the target directory if it doesn't exist
                await fs.mkdir(path.dirname(normalizedTargetPath), { recursive: true });

                // First copy the file
                await copyFile(normalizedSourcePath, normalizedTargetPath);

                // Then try to delete the original with retries
                await deleteFile(normalizedSourcePath);

                res.statusCode = 200;
                res.end(JSON.stringify({ success: true }));
              } catch (error) {
                console.error('Error during file operation:', error);
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