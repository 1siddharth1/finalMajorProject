import express from 'express';
import { aiController } from '../controllers/aiController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { validateAIText } from '../middleware/validation.js';

const router = express.Router();

router.post('/format', rateLimiter, validateAIText, aiController.formatDocument);
router.post('/format-and-save', rateLimiter, validateAIText, aiController.formatAndSave);
router.post('/enhance', rateLimiter, aiController.enhanceFormatting);
router.get('/status', aiController.getAIStatus);

export default router;
