// api/index.js
import express from 'express';
import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const app = express();

app.use(express.text({ type: '*/*', limit: '100kb' }));

app.get('/', (req, res) => {
    res.redirect(302, `/note/${uuidv4()}`);
});

app.use(express.static('public'));

const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
await redisClient.connect();
console.log('[Redis] Đã kết nối thành công!');

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
        const filePath = path.join(process.cwd(), 'public', 'editor.html');
        if (!fs.existsSync(filePath)) return res.status(404).send('Editor UI not found');
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
        await redisClient.set(`note:${id}`, content, { EX: 2592000 });
        return res.status(200).send('Saved');
    } catch (error) {
        console.error('Redis Write Error:', error);
        return res.status(500).send('Internal Server Error');
    }
});

export default app;
