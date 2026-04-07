import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  logger.error(`${status} - ${message} - ${req.originalUrl} - ${req.method}`);
  
  res.status(status).json({
    error: {
      message,
      status,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

export const notFound = (req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}`, status: 404 });
};
