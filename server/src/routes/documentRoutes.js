import express from 'express';
import { documentController } from '../controllers/documentController.js';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All document routes require authentication
router.use(authenticateToken);

router.get('/', documentController.getAll);
router.get('/:id', documentController.getOne);
router.put('/:id', rateLimiter, documentController.update);
router.patch('/:id/rename', rateLimiter, documentController.rename);
router.delete('/:id', rateLimiter, documentController.delete);

export default router;
