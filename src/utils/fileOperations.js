import fs from 'node:fs/promises';
import path from 'node:path';

export async function moveFile(sourcePath, targetPath) {
  try {
    // Create the target directory if it doesn't exist
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    
    // Move the file
    await fs.rename(sourcePath, targetPath);
    
    return { success: true };
  } catch (error) {
    console.error('Error moving file:', error);
    throw new Error(`Failed to move file: ${error.message}`);
  }
}