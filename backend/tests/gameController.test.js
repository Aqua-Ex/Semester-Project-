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

vi.mock('../src/tools/logger.js', () => ({
  log: vi.fn(),
}));

const getControllers = async () => {
  const controllers = await import('../src/controllers/gameController.js');
  return controllers;
};

const createMockRequest = (params = {}, body = {}, query = {}) => ({
  params,
  body,
  query,
});

const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
};

describe('gameController', () => {
  beforeEach(async () => {
    vi.resetModules();
    const { db } = await import('../src/firebase.js');
    db._reset();
  });

  describe('getLeaderboard', () => {
    it('returns leaderboard entries', async () => {
      const { getLeaderboard } = await getControllers();
      const { db } = await import('../src/firebase.js');
      const leaderboard = db.collection('leaderboard');
      
      leaderboard.doc('user1').set({
        userId: 'user1',
        username: 'Player1',
        topScore: 1000,
        lastUpdated: new Date().toISOString(),
      });

      const req = createMockRequest({ type: 'global' });
      const res = createMockResponse();

      await getLeaderboard(req, res);

      expect(res.json).toHaveBeenCalled();
      const callArgs = res.json.mock.calls[0][0];
      expect(callArgs.entries).toBeDefined();
      expect(Array.isArray(callArgs.entries)).toBe(true);
    });

    it('handles errors correctly', async () => {
      const { getLeaderboard } = await getControllers();
      const req = createMockRequest({ type: 'invalid' });
      const res = createMockResponse();

      await getLeaderboard(req, res);

      // Should either return entries or error
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getUserHistory', () => {
    it('returns user history', async () => {
      const { getUserHistory } = await getControllers();
      const req = createMockRequest({ userId: 'test-user' });
      const res = createMockResponse();

      await getUserHistory(req, res);

      expect(res.json).toHaveBeenCalled();
      const callArgs = res.json.mock.calls[0][0];
      expect(callArgs.history).toBeDefined();
      expect(Array.isArray(callArgs.history)).toBe(true);
    });

    it('returns error when userId is missing', async () => {
      const { getUserHistory } = await getControllers();
      const req = createMockRequest({ userId: null });
      const res = createMockResponse();

      await getUserHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
    });
  });

  describe('getChatMessages', () => {
    it('returns chat messages for a game', async () => {
      const { getChatMessages } = await getControllers();
      const { db } = await import('../src/firebase.js');
      const { createGame } = await import('../src/services/gameService.js');
      
      const game = await createGame({
        hostName: 'Host',
        hostId: 'host-1',
        mode: 'multi',
      });

      const gameRef = db.collection('games').doc(game.id);
      const messagesCol = gameRef.collection('messages');
      messagesCol.add({
        playerName: 'Player1',
        playerId: 'p1',
        text: 'Hello!',
        createdAt: new Date().toISOString(),
      });

      const req = createMockRequest({ gameId: game.id });
      const res = createMockResponse();

      await getChatMessages(req, res);

      expect(res.json).toHaveBeenCalled();
      const callArgs = res.json.mock.calls[0][0];
      expect(callArgs.messages).toBeDefined();
      expect(Array.isArray(callArgs.messages)).toBe(true);
    });

    it('returns 404 when game does not exist', async () => {
      const { getChatMessages } = await getControllers();
      const req = createMockRequest({ gameId: 'non-existent' });
      const res = createMockResponse();

      await getChatMessages(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Game not found' })
      );
    });
  });

  describe('sendChatMessage', () => {
    it('sends a chat message successfully', async () => {
      const { sendChatMessage } = await getControllers();
      const { db } = await import('../src/firebase.js');
      const { createGame } = await import('../src/services/gameService.js');
      
      const game = await createGame({
        hostName: 'Host',
        hostId: 'host-1',
        mode: 'multi',
      });

      const req = createMockRequest(
        { gameId: game.id },
        {
          playerName: 'TestPlayer',
          playerId: 'test-id',
          text: 'Test message',
        }
      );
      const res = createMockResponse();

      await sendChatMessage(req, res);

      expect(res.json).toHaveBeenCalled();
      const callArgs = res.json.mock.calls[0][0];
      expect(callArgs.message).toBeDefined();
      expect(callArgs.message.text).toBe('Test message');
    });

    it('returns 400 when message text is empty', async () => {
      const { sendChatMessage } = await getControllers();
      const { db } = await import('../src/firebase.js');
      const { createGame } = await import('../src/services/gameService.js');
      
      const game = await createGame({
        hostName: 'Host',
        hostId: 'host-1',
        mode: 'multi',
      });

      const req = createMockRequest(
        { gameId: game.id },
        {
          playerName: 'TestPlayer',
          playerId: 'test-id',
          text: '',
        }
      );
      const res = createMockResponse();

      await sendChatMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Message text is required' })
      );
    });
  });
});

