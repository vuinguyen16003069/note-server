const express = require('express');
const { Redis } = require('@upstash/redis');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const { v4: uuidv4 } = require('uuid');
const path = require('node:path');
const fs = require('node:fs');

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);
app.use(compression());
app.use(morgan('dev'));
app.use(express.text({ type: '*/*', limit: '100kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nAllow: /\nDisallow: /api/');
});

app.get('/note', (req, res) => {
  res.redirect(302, `/note/${uuidv4()}`);
});

app.use(express.static(path.join(process.cwd(), 'public')));

const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

app.post('/api/create', (req, res) => {
  const id = uuidv4();
  res.redirect(302, `/note/${id}`);
});

app.get('/note/:id', async (req, res) => {
  const { id } = req.params;

  if (req.query.raw === 'true') {
    try {
      const content = await redisClient.get(`note:${id}`);
      return res.status(200).send(content || '');
    } catch (error) {
      console.error('Redis Read Error:', error);
      return res.status(500).send('Database Error');
    }
  } else {
    const filePath = path.join(process.cwd(), 'public', 'index.html');
    if (!fs.existsSync(filePath)) return res.status(404).send('UI not found');
    return res.status(200).send(fs.readFileSync(filePath, 'utf8'));
  }
});

app.put('/note/:id', async (req, res) => {
  const { id } = req.params;

  let content = '';
  if (typeof req.body === 'string') {
    content = req.body;
  } else if (typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    content = JSON.stringify(req.body);
  }

  try {
    await redisClient.set(`note:${id}`, content, { ex: 2592000 });
    return res.status(200).send('Saved');
  } catch (error) {
    console.error('Redis Write Error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

app.use((req, res) => {
  res.status(404).send('Not Found');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app;
