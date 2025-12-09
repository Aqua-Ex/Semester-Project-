import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeDb } from './fakeFirestore.js';

vi.mock('../src/firebase.js', () => {
  const db = createFakeDb();
  return { db };
});

vi.mock('../src/services/aiService.js', () => ({
  generateGuidePrompt: vi.fn(async (lastLine, order) => `GUIDE-${order}-${lastLine}`),
  callChatModel: vi.fn(),
}));

vi.mock('../src/services/scoringService.js', () => ({
  scoreGame: vi.fn(async () => ({
    players: { Tester: { creativity: 50, cohesion: 60, momentum: 70 } },
    summary: 'ok',
  })),
}));

const getServices = async () => {
  const { db } = await import('../src/firebase.js');
  const service = await import('../src/services/gameService.js');
  return { ...service, db };
};

describe('gameService', () => {
  const host = { id: 'host-1', name: 'Host' };
  beforeEach(async () => {
    vi.resetModules();
    const { db } = await import('../src/firebase.js');
    db._reset();
  });

  it('creates a single-player game with StoryBot added', async () => {
    const { createGame } = await getServices();
    const game = await createGame({
      hostName: host.name,
      hostId: host.id,
      initialPrompt: 'Start',
      maxTurns: 2,
      maxPlayers: 2,
      mode: 'single',
    });
    expect(game.mode).toBe('single');
    expect(game.players.map((p) => p.name)).toContain('StoryBot');
    expect(game.currentPlayer).toBe(host.name);
  });

  it('allows joining a multiplayer game and respects max players', async () => {
    const { createGame, joinGame } = await getServices();
    const game = await createGame({
      hostName: host.name,
      hostId: host.id,
      maxPlayers: 3,
      maxTurns: 4,
      mode: 'multi',
    });
    const g1 = await joinGame(game.id, { playerName: 'P2', playerId: 'p2' });
    expect(g1.game.players).toHaveLength(2);
    const g2 = await joinGame(game.id, { playerName: 'P3', playerId: 'p3' });
    expect(g2.game.players).toHaveLength(3);
    const full = await joinGame(game.id, { playerName: 'P4', playerId: 'p4' });
    expect(full.error).toBe('Game is full');
  });

  it('runs a single-player turn and auto-adds AI turn, finishing at maxTurns', async () => {
    const { createGame, submitTurn, getGameState } = await getServices();
    const game = await createGame({
      hostName: host.name,
      hostId: host.id,
      maxTurns: 2,
      mode: 'single',
    });
    const res = await submitTurn(game.id, {
      playerName: host.name,
      playerId: host.id,
      text: 'The hero ventures forth.',
    });
    expect(res.game.turnsCount).toBe(2); // human + AI
    expect(res.game.status).toBe('finished');
    expect(res.game.currentPlayer).toBeNull();
    expect(res.game.scores?.players?.Tester?.creativity).toBeDefined();

    const state = await getGameState(game.id);
    expect(state.game.turnsCount).toBe(2);
  });

  describe('getLeaderboard', () => {
    it('returns global leaderboard sorted by topScore', async () => {
      const { db, getLeaderboard } = await getServices();
      const leaderboard = db.collection('leaderboard');
      
      // Add some leaderboard entries
      leaderboard.doc('user1').set({
        userId: 'user1',
        username: 'Player1',
        topScore: 1000,
        lastUpdated: new Date().toISOString(),
      });
      leaderboard.doc('user2').set({
        userId: 'user2',
        username: 'Player2',
        topScore: 1500,
        lastUpdated: new Date().toISOString(),
      });
      leaderboard.doc('user3').set({
        userId: 'user3',
        username: 'Player3',
        topScore: 800,
        lastUpdated: new Date().toISOString(),
      });

      const result = await getLeaderboard('global');
      expect(result.error).toBeUndefined();
      expect(result.entries).toHaveLength(3);
      expect(result.entries[0].username).toBe('Player2'); // Highest score
      expect(result.entries[0].score).toBe(1500);
      expect(result.entries[0].rank).toBe(1);
      expect(result.entries[1].username).toBe('Player1');
      expect(result.entries[1].rank).toBe(2);
      expect(result.entries[2].username).toBe('Player3');
      expect(result.entries[2].rank).toBe(3);
    });

    it('returns weekly leaderboard filtered by date', async () => {
      const { db, getLeaderboard } = await getServices();
      const leaderboard = db.collection('leaderboard');
      
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const oldDate = new Date(now);
      oldDate.setDate(oldDate.getDate() - 10);

      leaderboard.doc('user1').set({
        userId: 'user1',
        username: 'RecentPlayer',
        topScore: 1000,
        lastUpdated: now.toISOString(),
      });
      leaderboard.doc('user2').set({
        userId: 'user2',
        username: 'OldPlayer',
        topScore: 2000,
        lastUpdated: oldDate.toISOString(),
      });

      const result = await getLeaderboard('weekly');
      expect(result.error).toBeUndefined();
      expect(result.entries.length).toBeGreaterThan(0);
      // Should only include recent entries
      const usernames = result.entries.map(e => e.username);
      expect(usernames).toContain('RecentPlayer');
    });
  });

  describe('getUserHistory', () => {
    it('returns user game history for finished games', async () => {
      const { db, createGame, submitTurn, getUserHistory } = await getServices();
      const userId = 'test-user-1';
      
      // Create and finish a game
      const game = await createGame({
        hostName: 'TestUser',
        hostId: userId,
        maxTurns: 1,
        mode: 'single',
      });
      
      await submitTurn(game.id, {
        playerName: 'TestUser',
        playerId: userId,
        text: 'Test story',
      });

      const result = await getUserHistory(userId);
      expect(result.error).toBeUndefined();
      expect(result.history).toBeDefined();
      expect(Array.isArray(result.history)).toBe(true);
    });

    it('returns error when userId is missing', async () => {
      const { getUserHistory } = await getServices();
      const result = await getUserHistory(null);
      expect(result.error).toBe('User ID is required');
      expect(result.status).toBe(400);
    });
  });

  describe('getChatMessages', () => {
    it('returns chat messages for a game', async () => {
      const { db, createGame, getChatMessages } = await getServices();
      const game = await createGame({
        hostName: host.name,
        hostId: host.id,
        mode: 'multi',
      });

      // Add some messages
      const gameRef = db.collection('games').doc(game.id);
      const messagesCol = gameRef.collection('messages');
      messagesCol.add({
        playerName: 'Player1',
        playerId: 'p1',
        text: 'Hello!',
        createdAt: new Date().toISOString(),
      });
      messagesCol.add({
        playerName: 'Player2',
        playerId: 'p2',
        text: 'Hi there!',
        createdAt: new Date().toISOString(),
      });

      const result = await getChatMessages(game.id);
      expect(result.error).toBeUndefined();
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].text).toBe('Hello!');
      expect(result.messages[1].text).toBe('Hi there!');
    });

    it('returns error when game does not exist', async () => {
      const { getChatMessages } = await getServices();
      const result = await getChatMessages('non-existent-game');
      expect(result.error).toBe('Game not found');
      expect(result.status).toBe(404);
    });
  });

  describe('sendChatMessage', () => {
    it('sends a chat message successfully', async () => {
      const { createGame, sendChatMessage, getChatMessages } = await getServices();
      const game = await createGame({
        hostName: host.name,
        hostId: host.id,
        mode: 'multi',
      });

      const result = await sendChatMessage(game.id, {
        playerName: 'TestPlayer',
        playerId: 'test-id',
        text: 'Test message',
      });

      expect(result.error).toBeUndefined();
      expect(result.message).toBeDefined();
      expect(result.message.text).toBe('Test message');
      expect(result.message.playerName).toBe('TestPlayer');
      expect(result.message.playerId).toBe('test-id');

      // Verify message was saved
      const messages = await getChatMessages(game.id);
      expect(messages.messages.length).toBeGreaterThan(0);
      expect(messages.messages.some(m => m.text === 'Test message')).toBe(true);
    });

    it('returns error when message text is empty', async () => {
      const { createGame, sendChatMessage } = await getServices();
      const game = await createGame({
        hostName: host.name,
        hostId: host.id,
        mode: 'multi',
      });

      const result = await sendChatMessage(game.id, {
        playerName: 'TestPlayer',
        playerId: 'test-id',
        text: '',
      });

      expect(result.error).toBe('Message text is required');
      expect(result.status).toBe(400);
    });

    it('returns error when game does not exist', async () => {
      const { sendChatMessage } = await getServices();
      const result = await sendChatMessage('non-existent-game', {
        playerName: 'TestPlayer',
        playerId: 'test-id',
        text: 'Test message',
      });

      expect(result.error).toBe('Game not found');
      expect(result.status).toBe(404);
    });
  });
});
