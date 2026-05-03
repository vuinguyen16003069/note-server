require('dotenv/config');

const express = require('express');
const path = require('node:path');
const app = require('./api/index.js');
const PORT = process.env.PORT || 3000;

app.use(
  express.static(path.join(process.cwd(), 'public'), {
    maxAge: '1d',
    etag: true,
  }),
);

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.get('/favicon.ico', (req, res) => {
  res.redirect('https://i.imgur.com/LgH7rtS.png');
});

app.get('/note', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.get('/note/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Test at: http://localhost:${PORT}`);
});
