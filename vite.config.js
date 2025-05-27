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

async function deleteFile(filePath, retries = 5, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await fs.unlink(filePath);
      return;
    } catch (error) {
      if (error.code === 'EBUSY' && attempt < retries) {
        console.log(`File busy, retrying deletion in ${delayMs}ms... (Attempt ${attempt}/${retries})`);
        await delay(delayMs);
        delayMs = delayMs * 1.5;
        continue;
      }
      throw error;
    }
  }
}

function fileOperationsMiddleware() {
  return {
    name: 'file-operations',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        next();
      });

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
                const normalizedSourcePath = path.normalize(sourcePath);
                const normalizedTargetPath = path.normalize(targetPath);

                try {
                  await fs.access(normalizedSourcePath);
                } catch (error) {
                  res.statusCode = 404;
                  res.end(JSON.stringify({ error: `Source file not found: ${normalizedSourcePath}` }));
                  return;
                }

                await fs.mkdir(path.dirname(normalizedTargetPath), { recursive: true });
                await copyFile(normalizedSourcePath, normalizedTargetPath);
                await delay(1000);

                try {
                  await deleteFile(normalizedSourcePath);
                } catch (error) {
                  console.error('Failed to delete original file:', error);
                  res.statusCode = 200;
                  res.end(JSON.stringify({ 
                    success: true,
                    warning: 'File was copied but original could not be deleted'
                  }));
                  return;
                }

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
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
          });
        }
      }
    }
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