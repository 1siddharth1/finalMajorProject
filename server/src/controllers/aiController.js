import aiFormatterService from '../services/aiFormatterService.js';
import documentService from '../services/documentService.js';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

export const aiController = {
  async formatDocument(req, res, next) {
    const startTime = Date.now();
    try {
      const { text, documentType = 'general', useCache = true, temperature } = req.body;
      
      if (useCache) {
        const formattedHtml = await documentService.getCachedFormatting(text);
        if (formattedHtml) {
          logger.info('Returning cached formatting');
          return res.json({ success: true, html: formattedHtml, fromCache: true, processingTime: Date.now() - startTime });
        }
      }
      
      const result = await aiFormatterService.structureDocument(text, { documentType, temperature });
      if (result.success && useCache) await documentService.cacheDocumentFormatting(text, result.html);
      
      res.json({ success: result.success, html: result.html, fromCache: false, model: result.model, processingTime: result.processingTime, fallback: result.fallback || false });
    } catch (error) { logger.error('AI formatting error:', error); next(error); }
  },
  
  async formatAndSave(req, res, next) {
    try {
      const { title, text, tags, documentType, metadata } = req.body;
      const formatResult = await aiFormatterService.structureDocument(text, { documentType });
      
      if (!formatResult.success) {
        logger.warn('AI format failed, proceeding with fallback HTML');
      }
      
      const document = await documentService.createDocument({
        title: title || 'Untitled Document',
        content: { raw: text, formatted: formatResult.html, html: formatResult.html },
        tags: tags || [],
        metadata: { ...metadata, processingTime: formatResult.processingTime || 0, aiModel: formatResult.model || 'fallback' }
      });
      
      res.json({ success: true, document, formatting: formatResult, fallbackMode: !formatResult.success });
    } catch (error) { next(error); }
  },
  
  async enhanceFormatting(req, res, next) {
    try {
      const { html, instructions } = req.body;
      if (!html) return res.status(400).json({ error: 'HTML content required' });
      const enhanced = await aiFormatterService.enhanceFormatting(html, instructions);
      res.json({ success: true, html: enhanced, instructions: instructions || 'general enhancement' });
    } catch (error) { next(error); }
  },
  
  async getAIStatus(req, res, next) {
    try {
      res.json({ available: aiFormatterService.isAvailable, model: config.aiModel || 'gemini-1.5-flash' });
    } catch (error) { next(error); }
  }
};
