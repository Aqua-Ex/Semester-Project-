import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Leaderboard from '../pages/Leaderboard/Leaderboard';
import History from '../pages/History/History';
import { UserContext } from '../context/UserContext';

// Mock the hooks
vi.mock('../hooks/useGameAPI', () => ({
  useLeaderboard: vi.fn(),
  useUserHistory: vi.fn(),
}));

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark' }),
}));

vi.mock('../hooks/useThemeClasses', () => ({
  useThemeClasses: () => ({
    bg: 'bg-deep-graphite',
    text: 'text-white',
    textSecondary: 'text-cloud-gray',
    card: 'bg-soft-charcoal',
    isDark: true,
  }),
}));

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockUser = {
    id: 'test-user-1',
    username: 'TestUser',
    avatar: null,
    score: 0,
    coins: 0,
    level: 1,
    isAuthenticated: true,
  };

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <UserContext.Provider value={{ user: mockUser }}>
        <BrowserRouter>{children}</BrowserRouter>
      </UserContext.Provider>
    </QueryClientProvider>
  );
};

describe('Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Leaderboard', () => {
    it('renders leaderboard with data', async () => {
      const { useLeaderboard } = await import('../hooks/useGameAPI');
      useLeaderboard.mockReturnValue({
        data: {
          entries: [
            { rank: 1, username: 'Player1', score: 1000, userId: 'p1' },
            { rank: 2, username: 'Player2', score: 800, userId: 'p2' },
          ],
        },
        isLoading: false,
      });

      render(<Leaderboard />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('🏆 Leaderboard')).toBeInTheDocument();
        expect(screen.getByText('Player1')).toBeInTheDocument();
        expect(screen.getByText('Player2')).toBeInTheDocument();
      });
    });

    it('shows loading state', () => {
      const { useLeaderboard } = require('../hooks/useGameAPI');
      useLeaderboard.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      render(<Leaderboard />, { wrapper: createTestWrapper() });
      expect(screen.getByText(/Loading leaderboard/i)).toBeInTheDocument();
    });

    it('shows empty state when no data', () => {
      const { useLeaderboard } = require('../hooks/useGameAPI');
      useLeaderboard.mockReturnValue({
        data: { entries: [] },
        isLoading: false,
      });

      render(<Leaderboard />, { wrapper: createTestWrapper() });
      expect(screen.getByText(/No leaderboard data available yet/i)).toBeInTheDocument();
    });
  });

  describe('History', () => {
    it('renders history with data', async () => {
      const { useUserHistory } = await import('../hooks/useGameAPI');
      useUserHistory.mockReturnValue({
        data: {
          history: [
            {
              id: 'game1',
              mode: 'Multiplayer',
              title: 'Test Story',
              players: 2,
              date: '2024-01-01T00:00:00Z',
              score: 100,
              result: 'win',
              preview: 'Story preview...',
            },
          ],
        },
        isLoading: false,
      });

      render(<History />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('📜 Story History')).toBeInTheDocument();
        expect(screen.getByText('Test Story')).toBeInTheDocument();
      });
    });

    it('shows loading state', () => {
      const { useUserHistory } = require('../hooks/useGameAPI');
      useUserHistory.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      render(<History />, { wrapper: createTestWrapper() });
      expect(screen.getByText(/Loading history/i)).toBeInTheDocument();
    });

    it('shows empty state when no history', () => {
      const { useUserHistory } = require('../hooks/useGameAPI');
      useUserHistory.mockReturnValue({
        data: { history: [] },
        isLoading: false,
      });

      render(<History />, { wrapper: createTestWrapper() });
      expect(screen.getByText(/No game history yet/i)).toBeInTheDocument();
    });
  });
});

