import {
    createGame as createGameService,
    submitTurn as submitTurnService,
    getGameState as getGameStateService,
    joinGame as joinGameService,
    getGameTurns as getGameTurnsService,
    startGame as startGameService,
    getLeaderboard as getLeaderboardService,
    getUserHistory as getUserHistoryService,
    getChatMessages as getChatMessagesService,
    sendChatMessage as sendChatMessageService
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

export const getGameTurns = async (req, res) => {
    const {gameId} = req.params;
    const result = await getGameTurnsService(gameId);

    if (result.error) {
        return res.status(result.status || 404).json({error: result.error});
    }

    res.json({turns: result.turns});
};

export const startGame = async (req, res) => {
    const {gameId} = req.params;
    const result = await startGameService(gameId);

    if (result.error) {
        return res.status(result.status || 400).json({error: result.error});
    }

    log(`Game ${gameId} started`);
    res.json({game: result.game});
};

export const getLeaderboard = async (req, res) => {
    const {type} = req.params;
    const {userId} = req.query;
    const result = await getLeaderboardService(type, userId);

    if (result.error) {
        return res.status(result.status || 500).json({error: result.error});
    }

    res.json({entries: result.entries});
};

export const getUserHistory = async (req, res) => {
    const {userId} = req.params;
    const result = await getUserHistoryService(userId);

    if (result.error) {
        return res.status(result.status || 500).json({error: result.error});
    }

    res.json({history: result.history});
};

export const getChatMessages = async (req, res) => {
    const {gameId} = req.params;
    const result = await getChatMessagesService(gameId);

    if (result.error) {
        return res.status(result.status || 404).json({error: result.error});
    }

    res.json({messages: result.messages});
};

export const sendChatMessage = async (req, res) => {
    const {gameId} = req.params;
    const {playerName, playerId, text} = req.body || {};
    const result = await sendChatMessageService(gameId, {playerName, playerId, text});

    if (result.error) {
        return res.status(result.status || 400).json({error: result.error});
    }

    res.json({message: result.message});
};
