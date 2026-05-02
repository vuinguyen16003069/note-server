require('dotenv/config');

const express = require('express');
const path = require('node:path');
const app = require('./api/index.js');
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(process.cwd(), 'public')));

app.get('/note*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running robustly on port ${PORT}`);
  console.log(`Test at: http://localhost:${PORT}`);
});
