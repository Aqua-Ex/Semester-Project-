import express from 'express';
import {createGame, submitTurn, getGameState, joinGame, startGame} from '../controllers/gameController.js';

const router = express.Router();

router.post('/create', createGame);
router.post('/:gameId/join', joinGame);
router.post('/:gameId/start', startGame);
router.post('/:gameId/turn', submitTurn);
router.get('/:gameId', getGameState);

export default router;
