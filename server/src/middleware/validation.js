export const validateDocument = (req, res, next) => {
  const data = req.body;
  if (!data.title || data.title.trim().length === 0) return res.status(400).json({ error: 'Title is required' });
  if (data.title.length > 200) return res.status(400).json({ error: 'Title cannot exceed 200 characters' });
  if (!data.content || !data.content.raw) return res.status(400).json({ error: 'Content is required' });
  if (data.content.raw.length > 1000000) return res.status(400).json({ error: 'Content exceeds maximum size (1MB)' });
  next();
};

export const validateAIText = (req, res, next) => {
  const { text } = req.body;
  if (!text || text.trim().length === 0) return res.status(400).json({ error: 'Text to format is required' });
  if (text.length > 50000) return res.status(400).json({ error: 'Text exceeds maximum length' });
  next();
};
