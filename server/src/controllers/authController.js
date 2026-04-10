import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

const SALT_ROUNDS = 12;

/** Sign a JWT for a user */
const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, displayName: user.displayName },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

export const authController = {
  /** POST /api/auth/register */
  async register(req, res, next) {
    try {
      const { email, password, displayName } = req.body;

      // Input validation
      if (!email || !password || !displayName) {
        return res.status(400).json({ error: 'Email, password and display name are required.' });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
      }

      // Check duplicate
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const user = new User({
        email: email.toLowerCase().trim(),
        passwordHash,
        displayName: displayName.trim()
      });
      await user.save();

      const token = signToken(user);
      logger.info(`New user registered: ${user.email}`);

      res.status(201).json({
        success: true,
        token,
        user: user.toJSON() // passwordHash stripped by toJSON transform
      });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/auth/login */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const valid = await user.comparePassword(password);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const token = signToken(user);
      logger.info(`User logged in: ${user.email}`);

      res.json({
        success: true,
        token,
        user: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/auth/me  (requires authenticateToken middleware) */
  async me(req, res, next) {
    try {
      const user = await User.findById(req.user.id).select('-passwordHash');
      if (!user) return res.status(404).json({ error: 'User not found.' });
      res.json({ success: true, user });
    } catch (error) {
      next(error);
    }
  }
};
