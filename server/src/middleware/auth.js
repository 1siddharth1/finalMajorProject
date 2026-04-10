import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

/**
 * Middleware: verify JWT from Authorization header.
 * Attaches req.user = { id, email, displayName } on success.
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded; // { id, email, displayName, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * Optional auth: attaches req.user if token present, but doesn't block if missing.
 */
export const optionalToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (token) {
    try {
      req.user = jwt.verify(token, config.jwt.secret);
    } catch (_) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};
