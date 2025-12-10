import { randomUUID } from 'crypto';
import { db } from '../firebase.js';
import { generateGuidePrompt } from './aiService.js';
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

const updateLeaderboard = async (playerScores, players, summary) => {
  if (!playerScores?.players) return;
  const nameToId = new Map(players.map((p) => [p.name, p.id]));
  const entries = Object.entries(playerScores.players || {});

  for (const [name, scoreObj] of entries) {
    const userId = nameToId.get(name);
    if (!userId) continue;

    const creativity = Number(scoreObj.creativity) || 0;
    const cohesion = Number(scoreObj.cohesion) || 0;
    const momentum = Number(scoreObj.momentum) || 0;
    const total = (creativity + cohesion + momentum) / 3;

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
  const prompt = initialPrompt?.trim() || 'A traveler enters a mysterious forest...';

  const isRapid = mode === MODES.RAPID;
  const duration = isRapid
    ? RAPID_CONFIG.initialDurationSeconds
    : clamp(turnDurationSeconds, 30, 120, 60);
  const turnsCap = clamp(maxTurns, 1, 50, isRapid ? 50 : 5);
  const playerCap = clamp(maxPlayers, 2, 7, isRapid ? 2 : 3);

  const gameId = randomUUID();
  const createdAt = nowIso();

  const players = [{ id: hostId, name: cleanHost }];
  if (mode === MODES.SINGLE || isRapid) {
    players.push({ id: 'ai-bot', name: 'StoryBot' });
  }

  const gameMode = isRapid ? MODES.RAPID : mode === MODES.SINGLE ? MODES.SINGLE : MODES.MULTI;

  const game = {
    id: gameId,
    hostId,
    hostName: cleanHost,
    status: isRapid ? 'active' : 'waiting',
    initialPrompt: prompt,
    guidePrompt: prompt,
    players,
    turnsCount: 0,
    turnDurationSeconds: duration,
    maxTurns: turnsCap,
    maxPlayers: playerCap,
    turnDeadline: isRapid
      ? new Date(Date.now() + duration * 1000).toISOString()
      : null,
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

    if (game.mode !== MODES.MULTI) {
      return { error: 'Cannot join a single-player game', status: 400 };
    }

    const already = (game.players || []).find((p) => p.id === playerId || p.name === trimmedName);
    if (already) {
      return { game };
    }

    if ((game.players || []).length >= game.maxPlayers) {
      return { error: 'Game is full', status: 400 };
    }

    const updated = {
      ...game,
      players: [...(game.players || []), { id: playerId, name: trimmedName }],
      updatedAt: nowIso(),
    };

    tx.set(gameRef, updated);
    return { game: updated };
  });

  return result;
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
    const lines = cleanText.split(/\n/).filter(Boolean);
    const lastLine = lines[lines.length - 1] || cleanText;

    const order = (game.turnsCount || 0) + 1;
    const guidePrompt = await generateGuidePrompt(lastLine, order);

    const turnId = randomUUID();
    const turn = {
      id: turnId,
      order,
      playerName: trimmedName,
      playerId,
      text: cleanText,
      guidePrompt,
      createdAt: nowIso(),
    };

    const finishedHuman = game.maxTurns ? order >= game.maxTurns : false;

    const nextDuration =
      game.mode === MODES.RAPID
        ? Math.max(
            RAPID_CONFIG.minimumSeconds,
            (game.turnDurationSeconds || RAPID_CONFIG.initialDurationSeconds) - RAPID_CONFIG.decrementSeconds,
          )
        : game.turnDurationSeconds;

    const baseUpdate = {
      ...game,
      guidePrompt,
      turnsCount: order,
      updatedAt: nowIso(),
      status: finishedHuman ? 'finished' : 'active',
      turnDurationSeconds: nextDuration,
      turnDeadline: finishedHuman
        ? null
        : new Date(Date.now() + nextDuration * 1000).toISOString(),
    };

    let progressed = finishedHuman ? { ...baseUpdate, currentPlayerId: null, currentPlayer: null } : advanceTurnState(baseUpdate);

    tx.set(gameRef, progressed);
    tx.set(gameRef.collection('turns').doc(turnId), turn);

    // Single-player: auto AI turn
    const isSinglePlayerMode = game.mode === MODES.SINGLE || game.mode === MODES.RAPID;
    if (!finishedHuman && isSinglePlayerMode) {
      const aiOrder = progressed.turnsCount + 1;
      const aiLastLine = cleanText;
      const aiGuide = await generateGuidePrompt(aiLastLine, aiOrder);
      const aiTurnId = randomUUID();
      const aiTurn = {
        id: aiTurnId,
        order: aiOrder,
        playerName: 'StoryBot',
        playerId: 'ai-bot',
        text: aiGuide,
        guidePrompt: aiGuide,
        createdAt: nowIso(),
      };
      progressed.turnsCount = aiOrder;
      progressed.guidePrompt = aiGuide;
      const finishedAfterAi = game.maxTurns ? aiOrder >= game.maxTurns : false;
      progressed.status = finishedAfterAi ? 'finished' : 'active';
      progressed.currentPlayer = finishedAfterAi ? null : game.players[0]?.name;
      progressed.currentPlayerId = finishedAfterAi ? null : game.players[0]?.id;
      progressed.turnDeadline = finishedAfterAi
        ? null
        : new Date(Date.now() + (progressed.turnDurationSeconds || game.turnDurationSeconds) * 1000).toISOString();
      progressed.updatedAt = nowIso();

      tx.set(gameRef, progressed);
      tx.set(gameRef.collection('turns').doc(aiTurnId), aiTurn);

      return { game: progressed, turn, finished: finishedAfterAi };
    }

    return { game: progressed, turn, finished: finishedHuman };
  });

  if (result?.error) {
    return result;
  }

  let scores = null;
  if (result?.finished) {
    try {
      scores = await scoreGame(result.game);
      await gamesCollection.doc(gameId).set({ scores }, { merge: true });
      result.game.scores = scores;
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
        guidePrompt: d.data().guidePrompt,
      }));
      const summary = {
        gameId,
        createdAt: nowIso(),
        summary: scores?.summary || 'Game finished',
        maxTurns: result.game.maxTurns,
        turns: turnSummaries,
        scores: scores?.players || null,
      };
      const humanPlayers = (result.game.players || []).filter((p) => p.id !== 'ai-bot');
      await Promise.all(
        humanPlayers.map((p) => saveFinishedGameForUser(p.id, { ...summary, playerName: p.name })),
      );
      // Leaderboard update
      await updateLeaderboard(scores, humanPlayers, summary);
    } catch (error) {
      console.warn('[gameService] scoring persistence failed:', error);
    }
  }

  return { ...result, scores };
};

export const getGameState = async (gameId) => {
  const snap = await gamesCollection.doc(gameId).get();
  if (!snap.exists) {
    return { error: 'Game not found', status: 404 };
  }

  let game = snap.data();

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
  const remainingTurns = game.maxTurns
    ? Math.max(0, game.maxTurns - (game.turnsCount || 0))
    : null;
  const isFull = game.players.length >= game.maxPlayers;

  return {
    game,
    info: {
      status: game.status,
      currentPlayer: game.currentPlayer,
      nextDeadline: game.turnDeadline,
      timeRemainingSeconds,
      remainingTurns,
      maxTurns: game.maxTurns,
      playerCount: game.players.length,
      maxPlayers: game.maxPlayers,
      isFull,
      scores: game.scores || null,
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
