import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    raw: { type: String, required: true },
    formatted: { type: String },
    html: { type: String }
  },
  metadata: {
    llmSource: { type: String, enum: ['chatgpt', 'claude', 'deepseek', 'gemini', 'other'], default: 'gemini' },
    tokensUsed: { type: Number, default: 0 },
    processingTime: { type: Number },
    formatVersion: { type: String, default: '1.0' }
  },
  tags: [String],
  isPublic: { type: Boolean, default: true },
  views: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Index for search
documentSchema.index({ title: 'text', 'content.raw': 'text' });

// Virtual for URL
documentSchema.virtual('url').get(function() {
  return `/documents/${this._id}`;
});

export const Document = mongoose.model('Document', documentSchema);
