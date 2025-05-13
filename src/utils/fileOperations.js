import fs from 'node:fs/promises';
import path from 'node:path';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function tryMove(sourcePath, targetPath, retries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await fs.rename(sourcePath, targetPath);
      return { success: true };
    } catch (error) {
      if (error.code === 'EBUSY' && attempt < retries) {
        console.log(`File busy, retrying in ${delayMs}ms... (Attempt ${attempt}/${retries})`);
        await delay(delayMs);
        continue;
      }
      throw error;
    }
  }
}

export async function moveFile(sourcePath, targetPath) {
  try {
    // Create the target directory if it doesn't exist
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    
    // Try to move the file with retries
    return await tryMove(sourcePath, targetPath);
  } catch (error) {
    console.error('Error moving file:', error);
    throw new Error(`Failed to move file: ${error.message}`);
  }
}