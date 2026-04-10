import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

class StorageService {
  /**
   * Returns the absolute path to a user's storage directory.
   */
  getUserDir(userId) {
    return path.join(config.storagePath, 'users', userId.toString());
  }

  /**
   * Returns the absolute path to a specific document .txt file.
   */
  getFilePath(userId, docId) {
    return path.join(this.getUserDir(userId), `${docId}.txt`);
  }

  /**
   * Ensures the user's directory exists (creates it recursively if needed).
   */
  async ensureUserDir(userId) {
    const dir = this.getUserDir(userId);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  /**
   * Saves formatted HTML content to a .txt file for the user.
   * Returns the relative filePath (relative to config.storagePath).
   */
  async saveDocument(userId, docId, htmlContent) {
    await this.ensureUserDir(userId);
    const absPath = this.getFilePath(userId, docId);
    await fs.writeFile(absPath, htmlContent, 'utf-8');
    // Store a relative path in DB so it's portable
    const relativePath = path.relative(config.storagePath, absPath);
    logger.info(`Saved document file: ${relativePath}`);
    return relativePath;
  }

  /**
   * Reads a document's .txt file content.
   */
  async readDocument(userId, docId) {
    const absPath = this.getFilePath(userId, docId);
    try {
      const content = await fs.readFile(absPath, 'utf-8');
      return content;
    } catch (err) {
      if (err.code === 'ENOENT') return null;
      throw err;
    }
  }

  /**
   * Overwrites a document file with new content.
   */
  async updateDocument(userId, docId, htmlContent) {
    await this.ensureUserDir(userId);
    const absPath = this.getFilePath(userId, docId);
    await fs.writeFile(absPath, htmlContent, 'utf-8');
    logger.info(`Updated document file for user ${userId}, doc ${docId}`);
  }

  /**
   * Deletes a document's .txt file from disk.
   */
  async deleteDocument(userId, docId) {
    const absPath = this.getFilePath(userId, docId);
    try {
      await fs.unlink(absPath);
      logger.info(`Deleted document file: ${docId}.txt`);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }
}

export default new StorageService();
