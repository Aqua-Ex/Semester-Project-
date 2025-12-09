import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gameAPI } from '../utils/api';

// Mock fetch globally
global.fetch = vi.fn();

describe('gameAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLeaderboard', () => {
    it('fetches leaderboard data', async () => {
      const mockData = {
        entries: [
          { rank: 1, username: 'Player1', score: 1000 },
          { rank: 2, username: 'Player2', score: 800 },
        ],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await gameAPI.getLeaderboard('global');
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/game/leaderboard/global'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('includes userId in query params for friends leaderboard', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ entries: [] }),
      });

      await gameAPI.getLeaderboard('friends', 'user123');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/game/leaderboard/friends?userId=user123'),
        expect.any(Object)
      );
    });
  });

  describe('getUserHistory', () => {
    it('fetches user history', async () => {
      const mockData = {
        history: [
          {
            id: 'game1',
            mode: 'Multiplayer',
            title: 'Test Story',
            players: 2,
            date: '2024-01-01',
            score: 100,
            result: 'win',
          },
        ],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await gameAPI.getUserHistory('user123');
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/game/history/user123'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('getChatMessages', () => {
    it('fetches chat messages for a game', async () => {
      const mockData = {
        messages: [
          {
            id: 'msg1',
            playerName: 'Player1',
            playerId: 'p1',
            text: 'Hello!',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await gameAPI.getChatMessages('game123');
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/game/game123/chat'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('sendChatMessage', () => {
    it('sends a chat message', async () => {
      const mockData = {
        message: {
          id: 'msg1',
          playerName: 'Player1',
          playerId: 'p1',
          text: 'Hello!',
          createdAt: '2024-01-01T00:00:00Z',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const messageData = {
        playerName: 'Player1',
        playerId: 'p1',
        text: 'Hello!',
      };

      const result = await gameAPI.sendChatMessage('game123', messageData);
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/game/game123/chat'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(messageData),
        })
      );
    });
  });

  describe('error handling', () => {
    it('handles API errors correctly', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Game not found' }),
      });

      await expect(gameAPI.getChatMessages('invalid')).rejects.toThrow();
    });

    it('handles network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(gameAPI.getLeaderboard('global')).rejects.toThrow('Network error');
    });
  });
});

