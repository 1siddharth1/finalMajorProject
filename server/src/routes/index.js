import express from 'express';
import documentRoutes from './documentRoutes.js';
import aiRoutes from './aiRoutes.js';
import authRoutes from './authRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/ai', aiRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

export default router;
