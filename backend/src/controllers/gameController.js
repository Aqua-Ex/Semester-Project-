import {
    createGame as createGameService,
    submitTurn as submitTurnService,
    getGameState as getGameStateService,
    joinGame as joinGameService
} from '../services/gameService.js';
import {log} from '../tools/logger.js';

export const createGame = async (req, res) => {
    const {hostName, hostId, initialPrompt, turnDurationSeconds, maxTurns, maxPlayers, mode} = req.body || {};
    const game = await createGameService({hostName, hostId, initialPrompt, turnDurationSeconds, maxTurns, maxPlayers, mode});

    log('Created game', game.id);
    res.status(201).json({game});
};

export const submitTurn = async (req, res) => {
    const {gameId} = req.params;
    const {playerName, playerId, text} = req.body || {};

    const result = await submitTurnService(gameId, {playerName, playerId, text});

    if (result.error) {
        return res.status(result.status || 400).json({error: result.error});
    }

    log(`Turn ${result.turn.order} submitted to game ${gameId} by ${result.turn.playerName}`);
    res.json({game: result.game, turn: result.turn, scores: result.scores});
};

export const getGameState = async (req, res) => {
    const {gameId} = req.params;
    const result = await getGameStateService(gameId);

    if (result.error) {
        return res.status(result.status || 404).json({error: result.error});
    }

    res.json({game: result.game, info: result.info});
};

export const joinGame = async (req, res) => {
    const {gameId} = req.params;
    const {playerName, playerId} = req.body || {};

    const result = await joinGameService(gameId, {playerName, playerId});

    if (result.error) {
        return res.status(result.status || 400).json({error: result.error});
    }

    log(`Player ${playerName} joined game ${gameId}`);
    res.json({game: result.game});
};
