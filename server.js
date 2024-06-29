import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendStockData } from './kinesis/producer.js';

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const router = express.Router();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

router.post('/sendStockData', sendStockData);

// Default route to serve the index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/api', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
