import documentService from '../services/documentService.js';
import logger from '../utils/logger.js';

export const documentController = {
  /** GET /api/documents — list all documents for the authenticated user */
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const result = await documentService.getDocumentsByUser(
        req.user.id, parseInt(page), parseInt(limit)
      );
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  },

  /** GET /api/documents/:id */
  async getOne(req, res, next) {
    try {
      const doc = await documentService.getDocumentById(req.user.id, req.params.id);
      if (!doc) return res.status(404).json({ error: 'Document not found.' });
      res.json({ success: true, data: doc });
    } catch (error) { next(error); }
  },

  /** PUT /api/documents/:id — update title and/or content */
  async update(req, res, next) {
    try {
      const { title, htmlContent, tags } = req.body;
      const doc = await documentService.updateDocument(req.user.id, req.params.id, { title, htmlContent, tags });
      if (!doc) return res.status(404).json({ error: 'Document not found.' });
      res.json({ success: true, data: doc, message: 'Document updated successfully.' });
    } catch (error) { next(error); }
  },

  /** PATCH /api/documents/:id/rename — rename only */
  async rename(req, res, next) {
    try {
      const { title } = req.body;
      if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required.' });
      const doc = await documentService.renameDocument(req.user.id, req.params.id, title.trim());
      if (!doc) return res.status(404).json({ error: 'Document not found.' });
      res.json({ success: true, data: doc, message: 'Document renamed.' });
    } catch (error) { next(error); }
  },

  /** DELETE /api/documents/:id */
  async delete(req, res, next) {
    try {
      const doc = await documentService.deleteDocument(req.user.id, req.params.id);
      if (!doc) return res.status(404).json({ error: 'Document not found.' });
      res.json({ success: true, message: 'Document deleted successfully.' });
    } catch (error) { next(error); }
  }
};
