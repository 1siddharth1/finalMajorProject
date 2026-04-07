import mongoose from 'mongoose';

const cacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true, index: true }
}, {
  timestamps: true
});

// TTL index - MongoDB will auto-delete expired documents
cacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Cache = mongoose.model('Cache', cacheSchema);
