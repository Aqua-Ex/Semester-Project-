import express from 'express';
import {createGame, submitTurn, getGameState} from '../controllers/gameController.js';

const router = express.Router();

router.post('/create', createGame);
router.post('/:gameId/turn', submitTurn);
router.get('/:gameId', getGameState);

export default router;