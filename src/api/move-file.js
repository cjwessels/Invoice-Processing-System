import { moveFile } from '../utils/fileOperations.js';
import fs from 'node:fs/promises';

export async function POST(req) {
  try {
    const { sourcePath, targetPath } = await req.json();
    
    if (!sourcePath || !targetPath) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if source file exists before attempting to move
    try {
      await fs.access(sourcePath);
    } catch (error) {
      return new Response(JSON.stringify({ error: `Source file not found: ${sourcePath}` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await moveFile(sourcePath, targetPath);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}