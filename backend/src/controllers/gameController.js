import {
    createGame as createGameService,
    updateGameSettings as updateGameSettingsService,
    submitTurn as submitTurnService,
    getGameState as getGameStateService,
    joinGame as joinGameService,
    startGame as startGameService,
    previewTurn as previewTurnService,
    requestToJoin as requestToJoinService,
    reviewJoinRequest as reviewJoinRequestService,
    listLobbies as listLobbiesService,
    abandonGame as abandonGameService,
    cleanupWaitingLobbies as cleanupWaitingLobbiesService,
    getUserHistory as getUserHistoryService,
} from '../services/gameService.js';
import {log} from '../tools/logger.js';

const scrubGame = (game) => {
    if (!game) return game;
    const {storySoFar, ...rest} = game;
    return {
        ...rest,
        guidePrompt: rest.guidePrompt ?? (rest.turnsCount ? null : rest.initialPrompt),
    };
};

export const createGame = async (req, res) => {
    const {hostName, hostId, initialPrompt, turnDurationSeconds, maxTurns, maxPlayers, mode} = req.body || {};
    const game = await createGameService({hostName, hostId, initialPrompt, turnDurationSeconds, maxTurns, maxPlayers, mode});

    log('Created game', game.id);
    res.status(201).json({game: scrubGame(game)});
};

export const updateGameSettings = async (req, res) => {
    const {gameId} = req.params;
    const {hostId, maxPlayers} = req.body || {};
    const result = await updateGameSettingsService(gameId, {hostId, maxPlayers});

    if (result.error) {
        return res.status(result.status || 400).json({error: result.error});
    }

    res.json({game: scrubGame(result.game)});
};

export const submitTurn = async (req, res) => {
    const {gameId} = req.params;
    const {playerName, playerId, text} = req.body || {};

    const result = await submitTurnService(gameId, {playerName, playerId, text});

    if (result.error) {
        return res.status(result.status || 400).json({error: result.error});
    }

    log(`Turn ${result.turn.order} submitted to game ${gameId} by ${result.turn.playerName}`);
    res.json({game: scrubGame(result.game), turn: result.turn, scores: result.scores});
};

export const previewTurn = async (req, res) => {
    const {gameId} = req.params;
    const {playerName, playerId, text} = req.body || {};

    const result = await previewTurnService(gameId, {playerName, playerId, text});

    if (result.error) {
        return res.status(result.status || 400).json({error: result.error});
    }

    log(`Preview turn requested for game ${gameId} by ${playerName}`);
    res.json({preview: result.preview, order: result.order});
};

export const getGameState = async (req, res) => {
    const {gameId} = req.params;
    const includeTurns = ['true', '1', 'yes'].includes(String(req.query.includeTurns || '').toLowerCase());
    const result = await getGameStateService(gameId, {includeTurns});

    if (result.error) {
        return res.status(result.status || 404).json({error: result.error});
    }

    res.json({game: scrubGame(result.game), info: result.info});
};

export const joinGame = async (req, res) => {
    const {gameId} = req.params;
    const {playerName, playerId} = req.body || {};

    const result = await joinGameService(gameId, {playerName, playerId});

    if (result.error) {
        return res.status(result.status || 400).json({error: result.error});
    }

    log(`Player ${playerName} joined game ${gameId}`);
    res.json({game: scrubGame(result.game)});
};

export const startGame = async (req, res) => {
    const {gameId} = req.params;
    const {playerId} = req.body || {};

    const result = await startGameService(gameId, {playerId});

    if (result.error) {
        return res.status(result.status || 400).json({error: result.error});
    }

    log(`Game ${gameId} started by ${playerId || 'unknown'}`);
    res.json({game: scrubGame(result.game)});
};

export const requestToJoin = async (req, res) => {
    const {gameId} = req.params;
    const {playerName, playerId} = req.body || {};

    const result = await requestToJoinService(gameId, {playerName, playerId});

    if (result.error) {
        return res.status(result.status || 400).json({error: result.error});
    }

    log(`Player ${playerName} requested to join game ${gameId}`);
    res.status(202).json({game: scrubGame(result.game), requested: true});
};

export const reviewJoinRequest = async (req, res) => {
    const {gameId} = req.params;
    const {hostId, playerId, approve} = req.body || {};

    const result = await reviewJoinRequestService(gameId, {hostId, playerId, approve});

    if (result.error) {
        return res.status(result.status || 400).json({error: result.error});
    }

    log(`Host ${hostId} ${approve ? 'approved' : 'denied'} player ${playerId} for game ${gameId}`);
    res.json({game: scrubGame(result.game), approved: approve});
};

export const listLobbies = async (req, res) => {
    const limit = Number(req.query.limit) || 25;
    const minCreatedAt = req.query.minCreatedAt || null;
    const lobbies = await listLobbiesService({limit, minCreatedAt});

    res.json({lobbies});
};

export const abandonGame = async (req, res) => {
    const {gameId} = req.params;
    const {playerId, reason} = req.body || {};

    const result = await abandonGameService(gameId, {playerId, reason});

    if (result.error) {
        return res.status(result.status || 400).json({error: result.error});
    }

    log(`Game ${gameId} closed by host ${playerId}`);
    res.json({game: scrubGame(result.game)});
};

export const cleanupWaitingLobbies = async (req, res) => {
    const {before} = req.body || {};
    const result = await cleanupWaitingLobbiesService({before});
    log(`Cleaned up ${result.cleared} waiting lobbies${before ? ` before ${before}` : ''}`);
    res.json(result);
};

export const getUserHistory = async (req, res) => {
    const {userId} = req.params;
    const limit = Number(req.query.limit) || 5;
    const result = await getUserHistoryService(userId, limit);

    if (result.error) {
        return res.status(result.status || 400).json({error: result.error});
    }

    res.json({games: result.games});
};
