import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  // Owner reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Relative path to the .txt file on disk (relative to config.storagePath)
  filePath: {
    type: String,
    required: true
  },
  tags: [String],
  views: { type: Number, default: 0 },
  metadata: {
    aiModel: { type: String, default: 'gemini-1.5-flash' },
    processingTime: { type: Number, default: 0 },
    formatVersion: { type: String, default: '1.0' }
  }
}, { timestamps: true });

documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ title: 'text' });

export const Document = mongoose.model('Document', documentSchema);

