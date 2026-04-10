import { Document } from '../models/Document.js';
import { Cache } from '../models/Cache.js';
import storageService from './storageService.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';

class DocumentService {
  /**
   * Create a new document: writes .txt file + saves DB record.
   * @param {string} userId - Authenticated user's _id
   * @param {{ title, htmlContent, tags, metadata }} data
   */
  async createDocument(userId, { title, htmlContent, tags = [], metadata = {} }) {
    // Create a temporary DB record to get an _id for the filename
    const doc = new Document({
      title: title || 'Untitled Document',
      userId,
      filePath: 'pending', // will be updated after file is written
      tags,
      metadata
    });
    await doc.save();

    // Write the HTML content to the user's .txt file
    const relativePath = await storageService.saveDocument(userId, doc._id.toString(), htmlContent);

    // Update the DB record with the real file path
    doc.filePath = relativePath;
    await doc.save();

    logger.info(`Document created: ${doc._id} for user ${userId}`);
    return doc;
  }

  /**
   * Get all documents for a user (metadata only, no file content).
   */
  async getDocumentsByUser(userId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [documents, total] = await Promise.all([
      Document.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-filePath'), // Don't expose internal path to client
      Document.countDocuments({ userId })
    ]);
    return { documents, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get a single document's metadata + read its file content.
   */
  async getDocumentById(userId, docId) {
    const doc = await Document.findOne({ _id: docId, userId });
    if (!doc) return null;

    doc.views += 1;
    await doc.save();

    const htmlContent = await storageService.readDocument(userId, docId);
    return { ...doc.toJSON(), htmlContent };
  }

  /**
   * Rename a document (title only).
   */
  async renameDocument(userId, docId, newTitle) {
    const doc = await Document.findOneAndUpdate(
      { _id: docId, userId },
      { title: newTitle },
      { new: true, runValidators: true }
    );
    return doc;
  }

  /**
   * Update a document's content (overwrites file + optionally updates title/tags).
   */
  async updateDocument(userId, docId, { title, htmlContent, tags }) {
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (tags !== undefined) updateFields.tags = tags;

    if (htmlContent !== undefined) {
      await storageService.updateDocument(userId, docId, htmlContent);
    }

    const doc = await Document.findOneAndUpdate(
      { _id: docId, userId },
      updateFields,
      { new: true, runValidators: true }
    );
    return doc;
  }

  /**
   * Delete a document: removes the file and the DB record.
   */
  async deleteDocument(userId, docId) {
    const doc = await Document.findOneAndDelete({ _id: docId, userId });
    if (doc) {
      await storageService.deleteDocument(userId, docId);
      logger.info(`Document deleted: ${docId} for user ${userId}`);
    }
    return doc;
  }

  // ─── Cache helpers (used by AI routes for repeated text) ─────────────────

  async cacheDocumentFormatting(rawText, formattedHtml) {
    const key = this.generateCacheKey(rawText);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    await Cache.findOneAndUpdate(
      { key }, { value: formattedHtml, expiresAt }, { upsert: true, new: true }
    );
    return true;
  }

  async getCachedFormatting(rawText) {
    const key = this.generateCacheKey(rawText);
    const cached = await Cache.findOne({ key });
    if (cached && cached.expiresAt > new Date()) {
      logger.info(`Cache hit for key: ${key}`);
      return cached.value;
    }
    return null;
  }

  generateCacheKey(text) {
    return crypto.createHash('md5').update(text).digest('hex');
  }
}

export default new DocumentService();
