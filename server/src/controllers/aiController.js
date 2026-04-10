import aiFormatterService from '../services/aiFormatterService.js';
import documentService from '../services/documentService.js';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

export const aiController = {
  /**
   * POST /api/ai/format  (public — just formats, no save)
   */
  async formatDocument(req, res, next) {
    const startTime = Date.now();
    try {
      const { text, documentType = 'general', useCache = true, temperature } = req.body;

      if (useCache) {
        const cached = await documentService.getCachedFormatting(text);
        if (cached) {
          return res.json({
            success: true, html: cached, fromCache: true,
            processingTime: Date.now() - startTime
          });
        }
      }

      const result = await aiFormatterService.structureDocument(text, { documentType, temperature });
      if (result.success && useCache) await documentService.cacheDocumentFormatting(text, result.html);

      res.json({
        success: result.success,
        html: result.html,
        fromCache: false,
        model: result.model,
        processingTime: result.processingTime,
        fallback: result.fallback || false
      });
    } catch (error) { logger.error('AI formatting error:', error); next(error); }
  },

  /**
   * POST /api/ai/format-and-save  (requires auth — formats + saves to user's storage)
   */
  async formatAndSave(req, res, next) {
    try {
      const { title, text, tags, documentType } = req.body;
      const userId = req.user.id;

      const formatResult = await aiFormatterService.structureDocument(text, { documentType });
      if (!formatResult.success) {
        logger.warn('AI format returned fallback HTML for formatAndSave');
      }

      const document = await documentService.createDocument(userId, {
        title: title || 'Untitled Document',
        htmlContent: formatResult.html,
        tags: tags || [],
        metadata: {
          processingTime: formatResult.processingTime || 0,
          aiModel: formatResult.model || 'fallback'
        }
      });

      res.json({
        success: true,
        document,
        formatting: { html: formatResult.html, model: formatResult.model },
        fallbackMode: !formatResult.success
      });
    } catch (error) { next(error); }
  },

  /** POST /api/ai/enhance */
  async enhanceFormatting(req, res, next) {
    try {
      const { html, instructions } = req.body;
      if (!html) return res.status(400).json({ error: 'HTML content required' });
      const enhanced = await aiFormatterService.enhanceFormatting(html, instructions);
      res.json({ success: true, html: enhanced });
    } catch (error) { next(error); }
  },

  /** GET /api/ai/status */
  async getAIStatus(req, res, next) {
    try {
      res.json({ available: aiFormatterService.isAvailable, model: config.aiModel });
    } catch (error) { next(error); }
  }
};
