const express = require('express');
const { Redis } = require('@upstash/redis');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();

const NOTE_TTL = 30 * 24 * 60 * 60;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isCLI = (req) => {
  const ua = req.headers['user-agent'] ?? '';
  return !/Mozilla|Chrome|Safari|Edge|OPR|Firefox/i.test(ua);
};

const validateNoteId = (req, res, next) => {
  const { id } = req.params;
  if (!UUID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Invalid note ID format. Expected UUID v4.' });
  }
  next();
};

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(compression());
app.use(express.text({ type: 'text/plain', limit: '200kb' }));
app.use(express.json({ limit: '200kb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

app.get('/api/note/:id', validateNoteId, async (req, res) => {
  const { id } = req.params;
  try {
    const content = await redisClient.get(`note:${id}`);
    res.set('Cache-Control', 'no-cache');
    return res
      .status(200)
      .type('text/plain')
      .send(content || '');
  } catch (error) {
    console.error('Database read error:', error.message);
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }
});

app.get('/note/:id', validateNoteId, async (req, res) => {
  const { id } = req.params;
  if (isCLI(req) || req.query.raw === 'true') {
    try {
      const content = await redisClient.get(`note:${id}`);
      res.set('Cache-Control', 'no-cache');
      return res
        .status(200)
        .type('text/plain')
        .send(content || '');
    } catch (error) {
      console.error('Database read error:', error.message);
      return res.status(503).send('Service temporarily unavailable');
    }
  }
  const filePath = require('node:path').join(process.cwd(), 'public', 'index.html');
  return res.sendFile(filePath);
});

app.put(['/api/note/:id', '/note/:id'], validateNoteId, async (req, res) => {
  const { id } = req.params;
  let content = '';
  if (typeof req.body === 'string') {
    content = req.body;
  } else if (typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    content = JSON.stringify(req.body);
  }

  if (content.length > 200 * 1024) {
    return res.status(413).json({ error: 'Content too large. Maximum 200KB.' });
  }

  try {
    await redisClient.set(`note:${id}`, content, { ex: NOTE_TTL });
    return res.status(200).json({ status: 'saved', id, size: content.length });
  } catch (error) {
    console.error('Database write error:', error.message);
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }
});

app.delete(['/api/note/:id', '/note/:id'], validateNoteId, async (req, res) => {
  const { id } = req.params;
  try {
    await redisClient.del(`note:${id}`);
    return res.status(200).json({ status: 'deleted', id });
  } catch (error) {
    console.error('Database delete error:', error.message);
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }
});

app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
