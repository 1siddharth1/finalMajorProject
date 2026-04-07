import dotenv from 'dotenv';
dotenv.config({ path: '../.env' }); // or just dotenv.config() if root
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
  
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  cache: {
    ttl: 3600, // 1 hour in seconds
    maxSize: 100 // max number of cached items
  }
};
