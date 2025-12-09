import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useLeaderboard,
  useUserHistory,
  useChatMessages,
  useSendChatMessage,
} from '../hooks/useGameAPI';
import { gameAPI } from '../utils/api';

// Mock the API
vi.mock('../utils/api', () => ({
  gameAPI: {
    getLeaderboard: vi.fn(),
    getUserHistory: vi.fn(),
    getChatMessages: vi.fn(),
    sendChatMessage: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useGameAPI hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useLeaderboard', () => {
    it('fetches leaderboard data', async () => {
      const mockData = {
        entries: [
          { rank: 1, username: 'Player1', score: 1000 },
          { rank: 2, username: 'Player2', score: 800 },
        ],
      };

      gameAPI.getLeaderboard.mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useLeaderboard('global'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockData);
      expect(gameAPI.getLeaderboard).toHaveBeenCalledWith('global', null);
    });

    it('includes userId for friends leaderboard', async () => {
      const mockData = { entries: [] };
      gameAPI.getLeaderboard.mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useLeaderboard('friends', 'user123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(gameAPI.getLeaderboard).toHaveBeenCalledWith('friends', 'user123');
    });
  });

  describe('useUserHistory', () => {
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

      gameAPI.getUserHistory.mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useUserHistory('user123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockData);
      expect(gameAPI.getUserHistory).toHaveBeenCalledWith('user123');
    });

    it('does not fetch when userId is missing', () => {
      const { result } = renderHook(() => useUserHistory(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(gameAPI.getUserHistory).not.toHaveBeenCalled();
    });
  });

  describe('useChatMessages', () => {
    it('fetches chat messages', async () => {
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

      gameAPI.getChatMessages.mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useChatMessages('game123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockData);
      expect(gameAPI.getChatMessages).toHaveBeenCalledWith('game123');
    });

    it('does not fetch when gameId is missing', () => {
      const { result } = renderHook(() => useChatMessages(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(gameAPI.getChatMessages).not.toHaveBeenCalled();
    });
  });

  describe('useSendChatMessage', () => {
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

      gameAPI.sendChatMessage.mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useSendChatMessage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        gameId: 'game123',
        messageData: {
          playerName: 'Player1',
          playerId: 'p1',
          text: 'Hello!',
        },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(gameAPI.sendChatMessage).toHaveBeenCalledWith('game123', {
        playerName: 'Player1',
        playerId: 'p1',
        text: 'Hello!',
      });
    });
  });
});

