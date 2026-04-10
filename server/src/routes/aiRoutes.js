import express from 'express';
import { aiController } from '../controllers/aiController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { validateAIText } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public: format without saving (landing page still works unauthenticated)
router.post('/format', rateLimiter, validateAIText, aiController.formatDocument);
router.get('/status', aiController.getAIStatus);

// Protected: format + save requires a logged-in user
router.post('/format-and-save', rateLimiter, authenticateToken, validateAIText, aiController.formatAndSave);
router.post('/enhance', rateLimiter, authenticateToken, aiController.enhanceFormatting);

export default router;
