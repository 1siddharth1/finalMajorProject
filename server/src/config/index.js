import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/llm_doc_formatter',
  aiModel: process.env.AI_MODEL || 'gemini-1.5-flash',
  geminiApiKey: process.env.GEMINI_API_KEY,
  env: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_change_this',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  storagePath: process.env.STORAGE_PATH
    ? path.resolve(process.env.STORAGE_PATH)
    : path.join(__dirname, '../../storage'),

  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100
  },

  cache: {
    ttl: 3600,
    maxSize: 100
  }
};
