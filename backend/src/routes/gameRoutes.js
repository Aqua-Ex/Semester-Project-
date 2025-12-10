import express from 'express';
import {
    createGame,
    submitTurn,
    getGameState,
    joinGame,
    startGame,
    previewTurn,
    requestToJoin,
    reviewJoinRequest,
    listLobbies,
    abandonGame,
    cleanupWaitingLobbies,
    updateGameSettings,
    getUserHistory,
} from '../controllers/gameController.js';

const router = express.Router();

router.get('/lobbies', listLobbies);
router.post('/cleanup-lobbies', cleanupWaitingLobbies);
router.post('/create', createGame);
router.post('/:gameId/settings', updateGameSettings);
router.get('/user/:userId/history', getUserHistory);
router.post('/:gameId/join', joinGame);
router.post('/:gameId/request-join', requestToJoin);
router.post('/:gameId/review-join', reviewJoinRequest);
router.post('/:gameId/abandon', abandonGame);
router.post('/:gameId/start', startGame);
router.post('/:gameId/preview', previewTurn);
router.post('/:gameId/turn', submitTurn);
router.get('/:gameId', getGameState);

export default router;
