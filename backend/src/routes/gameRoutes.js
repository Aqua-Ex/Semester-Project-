import express from 'express';
import {
    createGame,
    submitTurn,
    getGameState,
    joinGame,
    getGameTurns,
    startGame,
    getLeaderboard,
    getUserHistory,
    getChatMessages,
    sendChatMessage
} from '../controllers/gameController.js';

const router = express.Router();

// Static routes first (before :gameId routes)
router.post('/create', createGame);
router.get('/history/:userId', getUserHistory);
router.get('/leaderboard/:type', getLeaderboard);

// Dynamic routes with :gameId
router.post('/:gameId/join', joinGame);
router.post('/:gameId/turn', submitTurn);
router.post('/:gameId/start', startGame);
router.get('/:gameId/chat', getChatMessages);
router.post('/:gameId/chat', sendChatMessage);
router.get('/:gameId/turns', getGameTurns);
router.get('/:gameId', getGameState);

export default router;
