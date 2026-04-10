import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { config } from './config/index.js';
import logger from './utils/logger.js';

class App {
  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }
  
  initializeMiddleware() {
    this.app.use(helmet());
    
    // CRITICAL FOR RENDER: Trust the reverse proxy so rate-limiter doesn't block innocent users
    this.app.set('trust proxy', 1);
    
    // Dynamic CORS to allow your frontend from localhost AND any hosted domain (Vercel/Netlify)
    this.app.use(cors({
      origin: function(origin, callback) {
        callback(null, true); // Temporarily allow all origins to make frontend deployment easy
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use((req, res, next) => { logger.info(`${req.method} ${req.url}`); next(); });
  }
  
  async initializeDatabase() {
    try {
      await mongoose.connect(config.mongoUri);
      logger.info('✅ MongoDB connected successfully to ' + config.mongoUri.split('@')[1]);
    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error);
      process.exit(1);
    }
  }
  
  initializeRoutes() { this.app.use('/api', routes); }
  
  initializeErrorHandling() {
    this.app.use(notFound);
    this.app.use(errorHandler);
  }
  
  async listen() {
    await this.initializeDatabase();
    const server = this.app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} (MERN DB Mode)`);
      logger.info(`📝 Environment: ${config.env}`);
      logger.info(`🤖 AI Model: ${config.aiModel}`);
    });
    
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, closing server...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          logger.info('Server closed');
          process.exit(0);
        });
      });
    });
    return server;
  }
}
export default App;
