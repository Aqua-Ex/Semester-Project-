import { randomUUID } from 'crypto';
import { db } from '../firebase.js';
import { generateGuidePrompt, generateInitialPrompt, generateAiTurnText } from './aiService.js';
import { scoreGame } from './scoringService.js';

const gamesCollection = db.collection('games');
const usersCollection = db.collection('users');
const leaderboardCollection = db.collection('leaderboard');
const getTestUserIds = () =>
  new Set(
    (process.env.TEST_USER_IDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  );

const MODES = {
  SINGLE: 'single',
  MULTI: 'multi',
  RAPID: 'rapid',
};

const RAPID_CONFIG = {
  initialDurationSeconds: 60,
  decrementSeconds: 5,
  minimumSeconds: 20,
};

const clamp = (value, min, max, fallback) => {
  const num = Number(value);
  if (Number.isFinite(num)) {
    return Math.min(max, Math.max(min, num));
  }
  return fallback;
};

const nowIso = () => new Date().toISOString();

const AI_PLAYER = { id: 'ai-bot', name: 'AI Opponent' };
const isAiPlayer = (player) => player?.id === AI_PLAYER.id;

const scrubGameForPlayer = (game) => {
  if (!game) return game;
  const { storySoFar, ...rest } = game;
  return {
    ...rest,
    // For display purposes, show the opener as the active prompt until the first guide exists.
    guidePrompt: rest.guidePrompt ?? (rest.turnsCount ? null : rest.initialPrompt),
    pendingRequests: rest.pendingRequests || [],
  };
};

const advanceTurnState = (game) => {
  if (!game.players || game.players.length === 0) {
    return {
      ...game,
      currentPlayerIndex: 0,
      currentPlayer: null,
      currentPlayerId: null,
      turnDeadline: null,
    };
  }
  const nextIndex = (game.currentPlayerIndex + 1) % game.players.length;
  const nextPlayer = game.players[nextIndex];
  return {
    ...game,
    currentPlayerIndex: nextIndex,
    currentPlayer: nextPlayer.name,
    currentPlayerId: nextPlayer.id,
    turnDeadline: new Date(Date.now() + game.turnDurationSeconds * 1000).toISOString(),
  };
};

const shouldTriggerAiTurn = (game) =>
  game &&
  game.mode === MODES.SINGLE &&
  game.status === 'active' &&
  game.currentPlayerId === AI_PLAYER.id &&
  (game.players || []).some(isAiPlayer);

const addPlayerToGame = (game, { playerId, playerName }) => {
  const players = game.players || [];
  if (players.find((p) => p.id === playerId || p.name === playerName)) {
    return { game };
  }

  if (players.length >= game.maxPlayers) {
    return { error: 'Game is full', status: 400 };
  }

  return {
    game: {
      ...game,
      players: [...players, { id: playerId, name: playerName }],
      updatedAt: nowIso(),
    },
  };
};

const saveFinishedGameForUser = async (userId, summary) => {
  if (!userId) return;
  const savedGamesRef = usersCollection.doc(userId).collection('savedGames');
  const existing = await savedGamesRef.orderBy('createdAt', 'asc').get();

  if (existing.size >= 5) {
    const oldest = existing.docs[0];
    await savedGamesRef.doc(oldest.id).delete();
  }

  await savedGamesRef.doc(summary.gameId).set(summary);
};

export const getUserHistory = async (userId, limit = 5) => {
  if (!userId) {
    return { error: 'userId is required', status: 400 };
  }

  const savedGamesRef = usersCollection
    .doc(userId)
    .collection('savedGames')
    .orderBy('createdAt', 'desc')
    .limit(Math.max(1, Math.min(limit, 10)));

  const snap = await savedGamesRef.get();
  const games = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { games };
};

const updateLeaderboard = async (playerScores, players, summary) => {
  if (!playerScores?.players) return;
  const nameToId = new Map(players.map((p) => [p.name, p.id]));
  const entries = Object.entries(playerScores.players || {});

  for (const [name, scoreObj] of entries) {
    const userId = nameToId.get(name);
    if (!userId) continue;

    const creativity = Number(scoreObj.creativity) || 0;
    const cohesion = Number(scoreObj.cohesion ?? scoreObj.continuity) || 0;
    const promptFit = Number(scoreObj.prompt_fit ?? scoreObj.promptFit ?? scoreObj.momentum) || 0;
    const momentum = Number(scoreObj.momentum ?? promptFit) || 0;
    const total = (creativity + cohesion + promptFit) / 3;

    const ref = leaderboardCollection.doc(userId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const existing = snap.exists ? snap.data() : {};
      const topScore = existing.topScore || 0;
      const isTop = total > topScore;
      const updated = {
        userId,
        username: name,
        lastScore: total,
        topScore: Math.max(topScore, total),
        gamesPlayed: (existing.gamesPlayed || 0) + 1,
        lastUpdated: nowIso(),
      };
      if (isTop && summary) {
        updated.topGameSummary = summary;
      }
      tx.set(ref, updated, { merge: true });
    });
  }

  // Trim leaderboard to top 10 by topScore
  const snap = await leaderboardCollection.orderBy('topScore', 'desc').get();
  const docs = snap.docs;
  if (docs.length > 10) {
    const excess = docs.slice(10);
    const batch = db.batch();
    excess.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
};

export const getLeaderboard = async ({ limit = 20 } = {}) => {
  const maxLimit = Math.max(1, Math.min(limit, 50));
  const testUserIds = getTestUserIds();

  // Fetch a few extra rows in case we need to filter test users out
  const snap = await leaderboardCollection
    .orderBy('topScore', 'desc')
    .limit(maxLimit + testUserIds.size)
    .get();

  const leaderboard = [];
  const isTestUser = (entry) => {
    if (testUserIds.has(entry.userId)) return true;
    if (typeof entry.userId === 'string' && entry.userId.startsWith('test-user')) return true;
    if (typeof entry.username === 'string' && /^test[\s_-]?/i.test(entry.username.trim())) return true;
    return false;
  };
  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data?.userId || typeof data.topScore === 'undefined') continue;
    if (isTestUser(data)) continue;

    leaderboard.push({
      userId: data.userId,
      username: data.username || 'Unknown',
      topScore: Number(data.topScore) || 0,
      lastScore: Number(data.lastScore) || 0,
      gamesPlayed: Number(data.gamesPlayed) || 0,
      lastUpdated: data.lastUpdated || null,
      topGameSummary: data.topGameSummary || null,
      rank: leaderboard.length + 1,
    });

    if (leaderboard.length >= maxLimit) break;
  }

  return leaderboard;
};

export const createGame = async ({
  hostName = 'Host',
  hostId,
  initialPrompt,
  turnDurationSeconds,
  maxTurns,
  maxPlayers,
  mode = MODES.MULTI,
}) => {
  const cleanHost = hostName?.trim() || 'Host';
  if (!hostId) {
    throw new Error('hostId is required (Google user id)');
  }
  const seedPrompt = initialPrompt?.trim() || '';
  const prompt = await generateInitialPrompt(seedPrompt);

  const isRapid = mode === MODES.RAPID;
  const isSingle = mode === MODES.SINGLE;
  const duration = isRapid
    ? RAPID_CONFIG.initialDurationSeconds
    : clamp(turnDurationSeconds, 30, 600, 60);
  const turnsCap = clamp(maxTurns, 1, 50, isRapid ? 50 : 5);
  const minPlayers = mode === MODES.SINGLE ? 2 : isRapid ? 1 : 2;
  const defaultCap = isRapid ? 2 : mode === MODES.SINGLE ? 2 : 3;
  const playerCap = clamp(maxPlayers, minPlayers, 7, defaultCap);

  const gameId = randomUUID();
  const createdAt = nowIso();

  const players = isSingle ? [{ id: hostId, name: cleanHost }, AI_PLAYER] : [{ id: hostId, name: cleanHost }];

  const gameMode = isRapid ? MODES.RAPID : isSingle ? MODES.SINGLE : MODES.MULTI;
  const initialStatus = isRapid || isSingle ? 'active' : 'waiting';
  const initialDeadline =
    initialStatus === 'active'
      ? new Date(Date.now() + duration * 1000).toISOString()
      : null;

  const game = {
    id: gameId,
    hostId,
    hostName: cleanHost,
    status: initialStatus,
    initialPrompt: prompt,
    guidePrompt: null,
    storySoFar: prompt,
    lastTurn: null,
    players,
    turnsCount: 0,
    turnDurationSeconds: duration,
    maxTurns: turnsCap,
    maxPlayers: playerCap,
    requiresApproval: gameMode === MODES.MULTI,
    pendingRequests: [],
    turnDeadline: initialDeadline,
    currentPlayerIndex: 0,
    currentPlayer: cleanHost,
    currentPlayerId: hostId,
    mode: gameMode,
    createdAt,
    updatedAt: createdAt,
  };

  await gamesCollection.doc(gameId).set(game);
  return game;
};

export const updateGameSettings = async (gameId, { hostId, maxPlayers, turnDurationSeconds }) => {
  const gameRef = gamesCollection.doc(gameId);
  if (!hostId) {
    return { error: 'Host id is required', status: 400 };
  }

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(gameRef);
    if (!snap.exists) {
      return { error: 'Game not found', status: 404 };
    }

    const game = snap.data();

    if (game.hostId !== hostId) {
      return { error: 'Only the host can update lobby settings', status: 403 };
    }

    if (game.status !== 'waiting') {
      return { error: 'Game has already started', status: 400 };
    }

    const updates = {};

    if (typeof maxPlayers !== 'undefined') {
      const currentPlayers = (game.players || []).length;
      const minPlayers = game.mode === MODES.SINGLE ? 1 : 2;
      const minCap = Math.max(currentPlayers, minPlayers);
      const requestedCap = clamp(maxPlayers, minCap, 7, game.maxPlayers || minCap);

      if (!Number.isFinite(requestedCap)) {
        return { error: 'Invalid maxPlayers value', status: 400 };
      }

      if (requestedCap !== game.maxPlayers) {
        updates.maxPlayers = requestedCap;
      }
    }

    if (typeof turnDurationSeconds !== 'undefined') {
      const requestedDuration = clamp(turnDurationSeconds, 30, 600, game.turnDurationSeconds || 60);
      if (!Number.isFinite(requestedDuration)) {
        return { error: 'Invalid turnDurationSeconds value', status: 400 };
      }
      if (requestedDuration !== game.turnDurationSeconds) {
        updates.turnDurationSeconds = requestedDuration;
      }
    }

    if (Object.keys(updates).length === 0) {
      return { game };
    }

    const updated = {
      ...game,
      ...updates,
      updatedAt: nowIso(),
    };
    tx.set(gameRef, updated);
    return { game: updated };
  });

  return result;
};

export const joinGame = async (gameId, { playerName = 'Anonymous', playerId }) => {
  const gameRef = gamesCollection.doc(gameId);
  const trimmedName = playerName?.trim();

  if (!trimmedName) {
    return { error: 'Player name is required', status: 400 };
  }
  if (!playerId) {
    return { error: 'Player id is required', status: 400 };
  }

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(gameRef);
    if (!snap.exists) {
      return { error: 'Game not found', status: 404 };
    }

    const game = snap.data();

    if (game.status === 'finished') {
      return { error: 'Game has finished', status: 400 };
    }

    if (game.status !== 'waiting') {
      return { error: 'Game is not accepting new players', status: 400 };
    }

    if (game.mode !== MODES.MULTI) {
      return { error: 'Cannot join a single-player game', status: 400 };
    }

    const requiresApproval = game.requiresApproval ?? game.mode === MODES.MULTI;
    if (requiresApproval && playerId !== game.hostId) {
      return { error: 'Host approval required', status: 403 };
    }

    const already = (game.players || []).find((p) => p.id === playerId || p.name === trimmedName);
    if (already) {
      return { game };
    }

    const addition = addPlayerToGame(game, { playerId, playerName: trimmedName });
    if (addition.error) return addition;

    tx.set(gameRef, addition.game);
    return addition;
  });

  return result;
};

export const previewTurn = async (gameId, { playerName = 'Anonymous', playerId, text }) => {
  const trimmedName = playerName?.trim();

  if (!trimmedName) {
    return { error: 'Player name is required', status: 400 };
  }
  if (!playerId) {
    return { error: 'Player id is required', status: 400 };
  }

  const snap = await gamesCollection.doc(gameId).get();
  if (!snap.exists) {
    return { error: 'Game not found', status: 404 };
  }

  const game = snap.data();

  if (game.status === 'finished') {
    return { error: 'Game has finished', status: 400 };
  }

  const playerObj = (game.players || []).find((p) => p.id === playerId);
  if (!playerObj) {
    return { error: 'Player must join the game before previewing a turn', status: 403 };
  }

  if (!text || !text.trim()) {
    return { error: 'Turn text is required', status: 400 };
  }

  const cleanText = text.trim();
  const order = (game.turnsCount || 0) + 1;
  const storySoFar = game.storySoFar || game.initialPrompt || '';
  const combinedStory = [storySoFar, cleanText].filter(Boolean).join('\n');
  const guidePrompt = await generateGuidePrompt({
    storySoFar: combinedStory,
    lastTurnText: cleanText,
    previousPrompt: game.guidePrompt,
    turnNumber: order + 1,
    initialPrompt: game.initialPrompt,
  });

  return {
    preview: guidePrompt,
    order,
  };
};

export const submitTurn = async (gameId, { playerName = 'Anonymous', playerId, text }) => {
  const gameRef = gamesCollection.doc(gameId);
  const trimmedName = playerName?.trim();

  if (!trimmedName) {
    return { error: 'Player name is required', status: 400 };
  }
  if (!playerId) {
    return { error: 'Player id is required', status: 400 };
  }

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(gameRef);
    if (!snap.exists) {
      return { error: 'Game not found', status: 404 };
    }

    const game = snap.data();

    if (game.status === 'finished') {
      return { error: 'Game has finished', status: 400 };
    }

    const playerObj = (game.players || []).find((p) => p.id === playerId);
    if (!playerObj) {
      return { error: 'Player must join the game before submitting a turn', status: 403 };
    }

    if (playerId !== game.currentPlayerId) {
      return {
        error: `It is not ${trimmedName}'s turn`,
        status: 403,
        currentPlayer: game.currentPlayer,
      };
    }

    // Start deadline if not set, then check timeout.
    if (!game.turnDeadline) {
      game.turnDeadline = new Date(Date.now() + game.turnDurationSeconds * 1000).toISOString();
    }

    if (game.turnDeadline) {
      const deadlineMs = new Date(game.turnDeadline).getTime();
      if (Number.isFinite(deadlineMs) && Date.now() > deadlineMs) {
        if (game.mode === MODES.RAPID) {
          const finishedState = {
            ...game,
            status: 'finished',
            currentPlayer: null,
            currentPlayerId: null,
            turnDeadline: null,
            updatedAt: nowIso(),
          };
          tx.set(gameRef, finishedState);
          return {
            error: 'Turn timed out',
            status: 409,
            finished: true,
          };
        }

        const nextState = advanceTurnState({ ...game, status: 'timeout', updatedAt: nowIso() });
        tx.set(gameRef, nextState);
        return {
          error: 'Turn timed out',
          status: 409,
          timedOutPlayer: game.currentPlayer,
          nextPlayer: nextState.currentPlayer,
          turnDeadline: nextState.turnDeadline,
        };
      }
    }

    if (!text || !text.trim()) {
      return { error: 'Turn text is required', status: 400 };
    }

    const cleanText = text.trim();
    const order = (game.turnsCount || 0) + 1;
    const currentPrompt = game.guidePrompt || game.initialPrompt;
    const storySoFar = game.storySoFar || game.initialPrompt || '';
    const updatedStory = [storySoFar, cleanText].filter(Boolean).join('\n');

    const willFinish = game.maxTurns ? order >= game.maxTurns : false;
    const nextPrompt = willFinish
      ? null
      : await generateGuidePrompt({
          storySoFar: updatedStory,
          lastTurnText: cleanText,
          previousPrompt: currentPrompt,
          turnNumber: order + 1,
          initialPrompt: game.initialPrompt,
        });

    const turnId = randomUUID();
    const turn = {
      id: turnId,
      order,
      playerName: trimmedName,
      playerId,
      text: cleanText,
      promptUsed: currentPrompt,
      guidePrompt: currentPrompt,
      createdAt: nowIso(),
    };

    const nextDuration =
      game.mode === MODES.RAPID
        ? Math.max(
            RAPID_CONFIG.minimumSeconds,
            (game.turnDurationSeconds || RAPID_CONFIG.initialDurationSeconds) - RAPID_CONFIG.decrementSeconds,
          )
        : game.turnDurationSeconds;

    const baseUpdate = {
      ...game,
      guidePrompt: nextPrompt,
      storySoFar: updatedStory,
      lastTurn: {
        playerName: trimmedName,
        playerId,
        text: cleanText,
        order,
        promptUsed: currentPrompt,
      },
      turnsCount: order,
      updatedAt: nowIso(),
      status: willFinish ? 'finished' : 'active',
      turnDurationSeconds: nextDuration,
      turnDeadline: willFinish
        ? null
        : new Date(Date.now() + nextDuration * 1000).toISOString(),
    };

    let progressed = willFinish ? { ...baseUpdate, currentPlayerId: null, currentPlayer: null } : advanceTurnState(baseUpdate);

    tx.set(gameRef, progressed);
    tx.set(gameRef.collection('turns').doc(turnId), turn);
    return { game: progressed, turn, finished: willFinish };
  });

  if (result?.error) {
    return result;
  }

  let scores = null;
  if (result?.finished) {
    try {
      scores = await scoreGame(result.game);
      // Add simple total metric for quick display
      const scoresWithTotals = scores
        ? {
            ...scores,
            players: Object.fromEntries(
              Object.entries(scores.players || {}).map(([name, metrics]) => {
                const creativity = Number(metrics?.creativity) || 0;
                const cohesion = Number(metrics?.cohesion ?? metrics?.continuity) || 0;
                const promptFit = Number(metrics?.prompt_fit ?? metrics?.promptFit ?? metrics?.momentum) || 0;
                const total = Math.round((creativity + cohesion + promptFit) / 3);
                return [name, { ...metrics, total }];
              }),
            ),
          }
        : null;

      await gamesCollection.doc(gameId).set({ scores: scoresWithTotals }, { merge: true });
      result.game.scores = scoresWithTotals;
      // Persist last 5 games per player (exclude AI)
      const turnsSnapshot = await gamesCollection
        .doc(gameId)
        .collection('turns')
        .orderBy('order', 'asc')
        .get();
      const turnSummaries = turnsSnapshot.docs.map((d) => ({
        order: d.data().order,
        playerName: d.data().playerName,
        text: d.data().text,
        guidePrompt: d.data().promptUsed || d.data().guidePrompt,
        promptUsed: d.data().promptUsed || d.data().guidePrompt,
      }));
      const summary = {
        gameId,
        createdAt: nowIso(),
        finishedAt: nowIso(),
        summary: scores?.summary || 'Game finished',
        maxTurns: result.game.maxTurns,
        maxPlayers: result.game.maxPlayers,
        mode: result.game.mode,
        hostId: result.game.hostId,
        hostName: result.game.hostName,
        playerCount: (result.game.players || []).length,
        turnDurationSeconds: result.game.turnDurationSeconds,
        turns: turnSummaries,
        scores: scoresWithTotals?.players || null,
      };
      const humanPlayers = (result.game.players || []).filter((p) => p.id !== 'ai-bot');
      await Promise.all(
        humanPlayers.map((p) => saveFinishedGameForUser(p.id, { ...summary, playerName: p.name })),
      );
      // Leaderboard update
      await updateLeaderboard(scoresWithTotals || scores, humanPlayers, summary);
    } catch (error) {
      console.warn('[gameService] scoring persistence failed:', error);
    }
  }

  // If we're in a single-player (1v1 vs AI) game and it's now the AI's turn, queue an AI response.
  if (!result?.finished && shouldTriggerAiTurn(result.game)) {
    queueAiTurn(gameId);
  }

  return { ...result, scores };
};

const queueAiTurn = (gameId) => {
  setTimeout(() => {
    performAiTurn(gameId).catch((err) => console.warn('[gameService] AI turn failed:', err?.message || err));
  }, 0);
};

const performAiTurn = async (gameId) => {
  const snap = await gamesCollection.doc(gameId).get();
  if (!snap.exists) return;

  const game = snap.data();
  if (!shouldTriggerAiTurn(game)) return;
  const startedAt = Date.now();

  // Keep the AI's deadline fresh while it generates text
  const freshDeadline = new Date(Date.now() + (Math.max(10, game.turnDurationSeconds || 60)) * 1000).toISOString();
  await gamesCollection.doc(gameId).set({ turnDeadline: freshDeadline, updatedAt: nowIso() }, { merge: true });

  const promptForAi = game.guidePrompt || game.initialPrompt || 'Continue the story.';
  const storySoFar = game.storySoFar || game.initialPrompt || '';
  console.log('[gameService] AI turn begin', {
    gameId,
    promptLength: (promptForAi || '').length,
    storyLength: (storySoFar || '').length,
  });
  const aiText = await generateAiTurnText({
    storySoFar,
    prompt: promptForAi,
    initialPrompt: game.initialPrompt,
  });

  await submitTurn(gameId, { playerId: AI_PLAYER.id, playerName: AI_PLAYER.name, text: aiText });
  console.log('[gameService] AI turn submitted', {
    gameId,
    durationMs: Date.now() - startedAt,
    textLength: (aiText || '').length,
  });
};

export const getGameState = async (gameId, { includeTurns = false } = {}) => {
  const snap = await gamesCollection.doc(gameId).get();
  if (!snap.exists) {
    return { error: 'Game not found', status: 404 };
  }

  let game = snap.data();

  // Ensure active games always have a running deadline (especially for initial turn)
  if (game.status === 'active' && (!game.turnDeadline || !Number.isFinite(new Date(game.turnDeadline).getTime()))) {
    const restoredDeadline = new Date(Date.now() + (game.turnDurationSeconds || 60) * 1000).toISOString();
    game = {
      ...game,
      turnDeadline: restoredDeadline,
      updatedAt: nowIso(),
    };
    await gamesCollection.doc(gameId).set({ turnDeadline: restoredDeadline, updatedAt: game.updatedAt }, { merge: true });
  }

  // Auto-finish rapid games when the timer expires
  if (game.mode === MODES.RAPID && game.status === 'active' && game.turnDeadline) {
    const deadlineMs = new Date(game.turnDeadline).getTime();
    if (Number.isFinite(deadlineMs) && Date.now() > deadlineMs) {
      const finished = {
        ...game,
        status: 'finished',
        currentPlayer: null,
        currentPlayerId: null,
        turnDeadline: null,
        updatedAt: nowIso(),
      };
      await gamesCollection.doc(gameId).set(finished);
      game = finished;
    }
  }

  const deadlineMs = game.turnDeadline ? new Date(game.turnDeadline).getTime() : null;
  const timeRemainingSeconds = Number.isFinite(deadlineMs)
    ? Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000))
    : null;
  const playerCount = (game.players || []).length;
  const remainingTurns = game.maxTurns
    ? Math.max(0, game.maxTurns - (game.turnsCount || 0))
    : null;
  const isFull = playerCount >= game.maxPlayers;

  const visibleGame = scrubGameForPlayer(game);
  let turns = [];
  let storyText = null;

  if (includeTurns) {
    const turnsSnap = await gamesCollection.doc(gameId).collection('turns').orderBy('order', 'asc').get();
    turns = turnsSnap.docs.map((d) => {
      const t = d.data();
      return {
        order: t.order,
        playerName: t.playerName,
        playerId: t.playerId || null,
        text: t.text,
        promptUsed: t.promptUsed || t.guidePrompt || null,
        createdAt: t.createdAt || null,
      };
    });
    const parts = [game.initialPrompt || ''];
    turns.forEach((t) => parts.push(t.text));
    storyText = parts.filter(Boolean).join('\n');
  }

  return {
    game: visibleGame,
    info: {
      status: game.status,
      currentPlayer: game.currentPlayer,
      nextDeadline: game.turnDeadline,
      timeRemainingSeconds,
      remainingTurns,
      maxTurns: game.maxTurns,
      playerCount,
      maxPlayers: game.maxPlayers,
      isFull,
      scores: game.scores || null,
      lastTurn: game.lastTurn || null,
      turns: includeTurns ? turns : undefined,
      storyText: includeTurns ? storyText : undefined,
    },
  };
};

export const startGame = async (gameId, { playerId } = {}) => {
  const gameRef = gamesCollection.doc(gameId);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(gameRef);
    if (!snap.exists) {
      return { error: 'Game not found', status: 404 };
    }

    const game = snap.data();

    if (game.status === 'finished') {
      return { error: 'Game has finished', status: 400 };
    }

    if (game.status === 'active') {
      return { game }; // Already started
    }

    if (game.mode === MODES.MULTI) {
      if (playerId && playerId !== game.hostId) {
        return { error: 'Only the host can start the game', status: 403 };
      }

      if ((game.players || []).length < 2) {
        return { error: 'At least 2 players are required to start', status: 400 };
      }
    }

    const updated = {
      ...game,
      status: 'active',
      updatedAt: nowIso(),
      turnDeadline: new Date(Date.now() + game.turnDurationSeconds * 1000).toISOString(),
    };

    tx.set(gameRef, updated);
    return { game: updated };
  });

  return result;
};

export const abandonGame = async (gameId, { playerId, reason = 'host_left' } = {}) => {
  const gameRef = gamesCollection.doc(gameId);

  if (!playerId) {
    return { error: 'playerId is required', status: 400 };
  }

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(gameRef);
    if (!snap.exists) {
      return { error: 'Game not found', status: 404 };
    }

    const game = snap.data();
    if (game.hostId !== playerId) {
      return { error: 'Only the host can close the lobby', status: 403 };
    }

    if (game.status === 'finished') {
      return { game };
    }

    const updated = {
      ...game,
      status: 'finished',
      currentPlayer: null,
      currentPlayerId: null,
      turnDeadline: null,
      endedReason: reason,
      updatedAt: nowIso(),
    };

    tx.set(gameRef, updated);
    return { game: updated };
  });

  return result;
};

export const cleanupWaitingLobbies = async ({ before = null } = {}) => {
  const snap = await gamesCollection.where('status', '==', 'waiting').get();
  const batch = db.batch();
  const cutoffMs = before ? Date.parse(before) : null;
  let cleared = 0;

  snap.docs.forEach((doc) => {
    const data = doc.data();
    if (cutoffMs) {
      const createdMs = Date.parse(data.createdAt || '');
      if (!Number.isFinite(createdMs) || createdMs >= cutoffMs) {
        return;
      }
    }
    const updated = {
      ...data,
      status: 'finished',
      currentPlayer: null,
      currentPlayerId: null,
      turnDeadline: null,
      endedReason: 'cleanup',
      updatedAt: nowIso(),
    };
    batch.set(doc.ref, updated);
    cleared += 1;
  });

  await batch.commit();
  return { cleared };
};

export const requestToJoin = async (gameId, { playerName = 'Anonymous', playerId }) => {
  const gameRef = gamesCollection.doc(gameId);
  const trimmedName = playerName?.trim();

  if (!trimmedName) {
    return { error: 'Player name is required', status: 400 };
  }
  if (!playerId) {
    return { error: 'Player id is required', status: 400 };
  }

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(gameRef);
    if (!snap.exists) {
      return { error: 'Game not found', status: 404 };
    }

    const game = snap.data();

    if (game.status === 'finished') {
      return { error: 'Game has finished', status: 400 };
    }

    if (game.status !== 'waiting') {
      return { error: 'Game is not accepting new players', status: 400 };
    }

    if (game.mode !== MODES.MULTI) {
      return { error: 'Cannot join a single-player game', status: 400 };
    }

    if ((game.players || []).some((p) => p.id === playerId || p.name === trimmedName)) {
      return { game };
    }

  if ((game.players || []).length >= game.maxPlayers) {
    return { error: 'Game is full', status: 400 };
  }

  const now = nowIso();
  const pending = game.pendingRequests || [];
  if (pending.some((req) => req.playerId === playerId)) {
    return { game: { ...game, pendingRequests: pending, updatedAt: now } };
  }

  const updated = {
    ...game,
    pendingRequests: [
        ...pending,
        {
          playerId,
          playerName: trimmedName,
          requestedAt: nowIso(),
        },
      ],
      updatedAt: now,
    };

    tx.set(gameRef, updated);
    return { game: updated, requested: true };
  });

  return result;
};

export const reviewJoinRequest = async (gameId, { hostId, playerId, approve = false }) => {
  const gameRef = gamesCollection.doc(gameId);

  if (!hostId) {
    return { error: 'hostId is required', status: 400 };
  }
  if (!playerId) {
    return { error: 'playerId is required', status: 400 };
  }

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(gameRef);
    if (!snap.exists) {
      return { error: 'Game not found', status: 404 };
    }

    const game = snap.data();
    if (game.hostId !== hostId) {
      return { error: 'Only the host can manage join requests', status: 403 };
    }

    if (game.status !== 'waiting') {
      return { error: 'Game is not accepting new players', status: 400 };
    }

    const pending = game.pendingRequests || [];
    const request = pending.find((req) => req.playerId === playerId);
    if (!request) {
      return { error: 'Join request not found', status: 404 };
    }

    const remainingRequests = pending.filter((req) => req.playerId !== playerId);
    let updatedGame = {
      ...game,
      pendingRequests: remainingRequests,
      updatedAt: nowIso(),
    };

    if (approve) {
      const addition = addPlayerToGame(updatedGame, {
        playerId: request.playerId,
        playerName: request.playerName,
      });
      if (addition.error) return addition;
      updatedGame = addition.game;
    }

    tx.set(gameRef, updatedGame);
    return { game: updatedGame, approved: approve };
  });

  return result;
};

const createdToMs = (value) => {
  if (!value) return 0;
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : 0;
  }
  // Firestore Timestamp-like object
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    const ms = value.toDate().getTime();
    return Number.isFinite(ms) ? ms : 0;
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1e6);
  }
  return 0;
};

export const listLobbies = async ({ limit = 25, minCreatedAt = null } = {}) => {
  const maxLimit = Math.max(1, Math.min(limit, 50));
  const cutoffMs = minCreatedAt ? Date.parse(minCreatedAt) : null;
  const staleMs = 5 * 60 * 1000; // 5 minutes

  const toLobby = (game) => ({
    id: game.id,
    hostName: game.hostName || 'Host',
    createdAt: game.createdAt || null,
    playerCount: (game.players || []).length,
    maxPlayers: game.maxPlayers || 0,
    requiresApproval: game.requiresApproval ?? game.mode === MODES.MULTI,
    pendingRequests: (game.pendingRequests || []).length,
  });

  try {
    let query = gamesCollection.where('status', '==', 'waiting');
    if (minCreatedAt) {
      query = query.where('createdAt', '>=', minCreatedAt);
    }
    query = query.orderBy('createdAt', 'desc').limit(maxLimit);

    const snap = await query.get();
    const raw = snap.docs.map((doc) => doc.data());
    const now = Date.now();
    const staleIds = [];
    const filtered = raw
      .filter((g) => (g.mode || MODES.MULTI) === MODES.MULTI)
      .filter((g) => {
        const createdMs = createdToMs(g.createdAt);
        const updatedMs = createdToMs(g.updatedAt) || createdMs;
        const age = now - (updatedMs || createdMs);
        const isStale = age > staleMs;
        if (isStale) {
          staleIds.push(g.id);
          return false;
        }
        if (cutoffMs && createdMs < cutoffMs) return false;
        return true;
      });

    if (staleIds.length) {
      const batch = db.batch();
      staleIds.forEach((id) => {
        const ref = gamesCollection.doc(id);
        batch.set(ref, {
          status: 'finished',
          currentPlayer: null,
          currentPlayerId: null,
          turnDeadline: null,
          endedReason: 'stale_cleanup',
          updatedAt: nowIso(),
        }, { merge: true });
      });
      batch.commit().catch((err) => console.warn('[listLobbies] stale cleanup failed', err?.message));
    }

    console.info('[listLobbies]', {
      path: 'indexed',
      limit,
      minCreatedAt,
      snapCount: snap.size,
      returned: filtered.length,
      staleFiltered: staleIds.length,
      first: filtered.slice(0, 3).map((g) => ({
        id: g.id,
        status: g.status,
        mode: g.mode,
        createdAt: g.createdAt,
      })),
    });

    return filtered.map(toLobby);
  } catch (error) {
    // Fallback for index/type issues: scan waiting lobbies in-memory and limit the result
    console.warn('[listLobbies] indexed query failed, using fallback', {
      limit,
      minCreatedAt,
      error: error?.message,
    });

    const snap = await gamesCollection.where('status', '==', 'waiting').get();
    const raw = snap.docs.map((doc) => doc.data());
    const now = Date.now();
    const staleIds = [];
    const filtered = raw
      .filter((g) => (g.mode || MODES.MULTI) === MODES.MULTI)
      .filter((g) => {
        const createdMs = createdToMs(g.createdAt);
        const updatedMs = createdToMs(g.updatedAt) || createdMs;
        const age = now - (updatedMs || createdMs);
        const isStale = age > staleMs;
        if (isStale) {
          staleIds.push(g.id);
          return false;
        }
        if (cutoffMs && createdMs < cutoffMs) return false;
        return true;
      })
      .sort((a, b) => {
        const aTime = createdToMs(a.createdAt);
        const bTime = createdToMs(b.createdAt);
        return bTime - aTime;
      })
      .slice(0, maxLimit);

    if (staleIds.length) {
      const batch = db.batch();
      staleIds.forEach((id) => {
        const ref = gamesCollection.doc(id);
        batch.set(ref, {
          status: 'finished',
          currentPlayer: null,
          currentPlayerId: null,
          turnDeadline: null,
          endedReason: 'stale_cleanup',
          updatedAt: nowIso(),
        }, { merge: true });
      });
      batch.commit().catch((err) => console.warn('[listLobbies] stale cleanup failed (fallback)', err?.message));
    }

    console.info('[listLobbies]', {
      path: 'fallback',
      limit,
      minCreatedAt,
      snapCount: snap.size,
      returned: filtered.length,
      staleFiltered: staleIds.length,
      first: filtered.slice(0, 3).map((g) => ({
        id: g.id,
        status: g.status,
        mode: g.mode,
        createdAt: g.createdAt,
      })),
    });

    return filtered.map(toLobby);
  }
};

export const resetGames = async () => {
  // Caution: for testing only; deletes all games.
  const snaps = await gamesCollection.listDocuments();
  const batches = [];
  let batch = db.batch();
  snaps.forEach((doc, idx) => {
    batch.delete(doc);
    if ((idx + 1) % 400 === 0) {
      batches.push(batch.commit());
      batch = db.batch();
    }
  });
  batches.push(batch.commit());
  await Promise.all(batches);
};
