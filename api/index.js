const express = require('express');
const { Redis } = require('@upstash/redis');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const path = require('node:path');
const fs = require('node:fs');

const CLI_UA = /^(curl|Wget|Postman|insomnia|HTTPie)/i;
const isCLI = (req) => CLI_UA.test(req.headers['user-agent'] ?? '');

const { v4: uuidv4 } = require('uuid');

const app = express();

const NOTE_TTL = 30 * 24 * 60 * 60;

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);
app.use(compression());
app.use(express.text({ type: '*/*', limit: '200kb' }));

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

app.get('/api/note', (req, res) => {
  res.json({ id: uuidv4() });
});

app.post('/api/create', (req, res) => {
  res.json({ id: uuidv4() });
});

app.get('/api/note/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const content = await redisClient.get(`note:${id}`);
    return res.status(200).send(content || '');
  } catch (error) {
    console.error('Database access error');
    return res.status(500).send('Database Error');
  }
});

app.get('/note/:id', async (req, res) => {
  const { id } = req.params;
  if (isCLI(req) || req.query.raw === 'true') {
    try {
      const content = await redisClient.get(`note:${id}`);
      return res.status(200).send(content || '');
    } catch (error) {
      return res.status(500).send('Database Error');
    }
  }
  const filePath = path.join(process.cwd(), 'public', 'index.html');
  return res.sendFile(filePath);
});

app.put('/api/note/:id', async (req, res) => {
  const { id } = req.params;
  let content = '';
  if (typeof req.body === 'string') {
    content = req.body;
  } else if (typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    content = JSON.stringify(req.body);
  }

  try {
    await redisClient.set(`note:${id}`, content, { ex: NOTE_TTL });
    return res.status(200).send('Saved');
  } catch (error) {
    console.error('Database write error');
    return res.status(500).send('Internal Server Error');
  }
});

app.use('/api/*', (req, res) => {
  res.status(404).send('API Route Not Found');
});

app.use((err, req, res, next) => {
  console.error('Application error');
  res.status(500).send('Something broke!');
});

module.exports = app;
