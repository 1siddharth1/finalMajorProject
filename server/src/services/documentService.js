import { Document } from '../models/Document.js';
import { Cache } from '../models/Cache.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';

class DocumentService {
  async createDocument(documentData) {
    try {
      const document = new Document(documentData);
      await document.save();
      logger.info(`Document created in DB: ${document._id}`);
      return document;
    } catch (error) {
      logger.error('Document creation failed:', error);
      throw error;
    }
  }

  async getDocumentById(id, incrementViews = true) {
    const document = await Document.findById(id);
    if (document && incrementViews) {
      document.views += 1;
      await document.save();
    }
    return document;
  }

  async getAllDocuments(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const query = {};
    if (filters.isPublic !== undefined) query.isPublic = filters.isPublic;
    if (filters.tags && filters.tags.length > 0) query.tags = { $in: filters.tags };
    
    const [documents, total] = await Promise.all([
      Document.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-content.raw'),
      Document.countDocuments(query)
    ]);
    
    return { documents, total, page, totalPages: Math.ceil(total / limit), hasMore: page * limit < total };
  }

  async updateDocument(id, updateData) {
    const document = await Document.findByIdAndUpdate(
      id, { ...updateData, 'metadata.updatedAt': new Date() }, { new: true, runValidators: true }
    );
    if (document) {
      await this.invalidateCache(`document:${id}`);
      logger.info(`Document updated: ${id}`);
    }
    return document;
  }

  async deleteDocument(id) {
    const document = await Document.findByIdAndDelete(id);
    if (document) {
      await this.invalidateCache(`document:${id}`);
      logger.info(`Document deleted: ${id}`);
    }
    return document;
  }

  async searchDocuments(query, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return await Document.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).skip(skip).limit(limit);
  }

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

  async invalidateCache(pattern) {
    const keys = await Cache.find({ key: { $regex: pattern } });
    if (keys.length > 0) {
      await Cache.deleteMany({ _id: { $in: keys.map(k => k._id) } });
    }
  }
}

export default new DocumentService();
