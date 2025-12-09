import express from 'express';
import {createGame, submitTurn, getGameState, joinGame, getGameTurns, startGame} from '../controllers/gameController.js';

const router = express.Router();

router.post('/create', createGame);
router.post('/:gameId/join', joinGame);
router.post('/:gameId/turn', submitTurn);
router.post('/:gameId/start', startGame);
router.get('/:gameId', getGameState);
router.get('/:gameId/turns', getGameTurns);

export default router;
