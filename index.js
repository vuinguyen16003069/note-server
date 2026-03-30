import 'dotenv/config'; // Nạp biến môi trường từ file .env
import app from './api/index.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running robustly on port ${PORT}`);
    console.log(`Test at: http://localhost:${PORT}`);
});
