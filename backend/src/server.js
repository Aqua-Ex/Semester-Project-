import 'dotenv/config';
import express from 'express';
import gameRoutes from './routes/gameRoutes.js';
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
})

app.use('/api/game', gameRoutes);
app.get('/', (req, res) => {
    res.json({
        message: 'StoryGame API is running'
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
})