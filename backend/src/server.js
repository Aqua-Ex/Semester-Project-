import express from 'express';
import * as functions from 'firebase-functions';
import gameRoutes from './routes/gameRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/api/game', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.get('/', (_req, res) => {
    res.json({
        message: 'StoryGame API is running'
    });
});

// Export the Express app for Firebase Functions or other hosts
export const createServer = () => app;
export default app;

// Firebase HTTPS function handler (used when deployed to Firebase)
export const api = functions.https.onRequest(app);

// Only start a local listener outside of serverless/function environments
if (!process.env.FUNCTION_NAME && !process.env.FIREBASE_CONFIG) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
