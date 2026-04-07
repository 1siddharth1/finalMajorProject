import documentService from '../services/documentService.js';
import logger from '../utils/logger.js';

export const documentController = {
  async create(req, res, next) {
    try {
      const { title, content, tags, metadata } = req.body;
      const document = await documentService.createDocument({
        title, content, tags: tags || [], metadata: metadata || {}
      });
      res.status(201).json({ success: true, data: document, message: 'Document created successfully' });
    } catch (error) { next(error); }
  },
  
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, tags, isPublic } = req.query;
      const filters = {};
      if (tags) filters.tags = tags.split(',');
      if (isPublic !== undefined) filters.isPublic = isPublic === 'true';
      const result = await documentService.getAllDocuments(filters, parseInt(page), parseInt(limit));
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  },
  
  async getOne(req, res, next) {
    try {
      const document = await documentService.getDocumentById(req.params.id);
      if (!document) return res.status(404).json({ error: 'Document not found' });
      res.json({ success: true, data: document });
    } catch (error) { next(error); }
  },
  
  async update(req, res, next) {
    try {
      const document = await documentService.updateDocument(req.params.id, req.body);
      if (!document) return res.status(404).json({ error: 'Document not found' });
      res.json({ success: true, data: document, message: 'Document updated successfully' });
    } catch (error) { next(error); }
  },
  
  async delete(req, res, next) {
    try {
      const document = await documentService.deleteDocument(req.params.id);
      if (!document) return res.status(404).json({ error: 'Document not found' });
      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) { next(error); }
  },
  
  async search(req, res, next) {
    try {
      const { q, page = 1, limit = 20 } = req.query;
      if (!q) return res.status(400).json({ error: 'Search query required' });
      const results = await documentService.searchDocuments(q, parseInt(page), parseInt(limit));
      res.json({ success: true, data: results, query: q });
    } catch (error) { next(error); }
  }
};
