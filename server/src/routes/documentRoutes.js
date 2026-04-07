import express from 'express';
import { documentController } from '../controllers/documentController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { validateDocument } from '../middleware/validation.js';

const router = express.Router();

router.post('/', rateLimiter, validateDocument, documentController.create);
router.put('/:id', rateLimiter, documentController.update);
router.delete('/:id', rateLimiter, documentController.delete);

router.get('/', documentController.getAll);
router.get('/search', documentController.search);
router.get('/:id', documentController.getOne);

export default router;
