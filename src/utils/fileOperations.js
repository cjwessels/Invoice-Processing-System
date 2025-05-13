import fs from 'node:fs/promises';
import path from 'node:path';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function copyFile(sourcePath, targetPath) {
  await fs.copyFile(sourcePath, targetPath);
}

async function deleteFile(filePath, retries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await fs.unlink(filePath);
      return;
    } catch (error) {
      if (error.code === 'EBUSY' && attempt < retries) {
        console.log(`File busy during deletion, retrying in ${delayMs}ms... (Attempt ${attempt}/${retries})`);
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
    
    // First copy the file
    await copyFile(sourcePath, targetPath);
    
    // Then delete the original file
    await deleteFile(sourcePath);
    
    return { success: true };
  } catch (error) {
    console.error('Error during file operation:', error);
    throw new Error(`Failed to move file: ${error.message}`);
  }
}