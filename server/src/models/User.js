import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60
  },
  // Relative path to user's storage directory (set on first document save)
  storageDir: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Never return passwordHash in JSON responses
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    return ret;
  }
});

// Instance method: verify plain password
userSchema.methods.comparePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
