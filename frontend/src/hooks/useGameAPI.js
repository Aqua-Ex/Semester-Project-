/**
 * React Query hooks for game API calls
 * Provides convenient hooks for fetching and mutating game data
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gameAPI } from '../utils/api';

/**
 * Hook to create a new game
 */
export const useCreateGame = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (gameData) => gameAPI.createGame(gameData),
    onSuccess: (data) => {
      // Invalidate and refetch game queries
      queryClient.invalidateQueries({ queryKey: ['games'] });
      // Set the new game in cache
      if (data?.game?.id) {
        queryClient.setQueryData(['game', data.game.id], data);
      }
    },
  });
};

/**
 * Hook to join a game
 */
export const useJoinGame = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, playerData }) => gameAPI.joinGame(gameId, playerData),
    onSuccess: (data, variables) => {
      // Invalidate and immediately refetch game state
      queryClient.invalidateQueries({ queryKey: ['game', variables.gameId] });
      // Force immediate refetch
      queryClient.refetchQueries({ queryKey: ['game', variables.gameId] });
    },
  });
};

/**
 * Hook to submit a turn
 */
export const useSubmitTurn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, turnData }) => gameAPI.submitTurn(gameId, turnData),
    onSuccess: (data, variables) => {
      // Update game state in cache
      queryClient.invalidateQueries({ queryKey: ['game', variables.gameId] });
      // Refetch to get latest state
      queryClient.refetchQueries({ queryKey: ['game', variables.gameId] });
    },
  });
};

/**
 * Hook to fetch game state
 * Automatically polls if game is active
 */
export const useGameState = (gameId, options = {}) => {
  const { enabled = true, refetchInterval = null, pollWaiting = false } = options;
  const pollInterval = refetchInterval || 2000;

  return useQuery({
    queryKey: ['game', gameId],
    queryFn: () => gameAPI.getGameState(gameId),
    enabled: enabled && !!gameId,
    refetchInterval: (query) => {
      // If pollWaiting is enabled, always poll (for lobby)
      if (pollWaiting) {
        return pollInterval;
      }
      
      // Auto-refetch if game is active
      const game = query?.state?.data?.game;
      if (game) {
        if (game.status === 'active') {
          return pollInterval; // Poll every 2 seconds for active games
        }
      }
      return false; // Don't poll for finished games or when not needed
    },
    refetchIntervalInBackground: true,
    staleTime: 0, // Always consider data stale for real-time updates
  });
};

/**
 * Hook to poll game state (for real-time updates)
 */
export const usePollGameState = (gameId, interval = 2000) => {
  return useGameState(gameId, {
    refetchInterval: interval,
  });
};

/**
 * Hook to fetch game turns
 */
export const useGameTurns = (gameId) => {
  return useQuery({
    queryKey: ['game', gameId, 'turns'],
    queryFn: () => gameAPI.getGameTurns(gameId),
    enabled: !!gameId,
    staleTime: 2000,
  });
};

/**
 * Hook to start a game
 */
export const useStartGame = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (gameId) => gameAPI.startGame(gameId),
    onSuccess: (data, gameId) => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
    },
  });
};

/**
 * Hook to fetch leaderboard
 */
export const useLeaderboard = (type, userId = null, options = {}) => {
  const { enabled = true } = options;
  return useQuery({
    queryKey: ['leaderboard', type, userId],
    queryFn: () => gameAPI.getLeaderboard(type, userId),
    enabled: enabled,
    staleTime: 30000, // Cache for 30 seconds
  });
};

/**
 * Hook to fetch user's game history
 */
export const useUserHistory = (userId, options = {}) => {
  const { enabled = true } = options;
  return useQuery({
    queryKey: ['history', userId],
    queryFn: () => gameAPI.getUserHistory(userId),
    enabled: enabled && !!userId,
    staleTime: 60000, // Cache for 1 minute
  });
};

/**
 * Hook to fetch chat messages
 */
export const useChatMessages = (gameId, options = {}) => {
  const { enabled = true, refetchInterval = null } = options;
  return useQuery({
    queryKey: ['chat', gameId],
    queryFn: () => gameAPI.getChatMessages(gameId),
    enabled: enabled && !!gameId,
    refetchInterval: refetchInterval || false,
    staleTime: 1000, // Consider stale after 1 second
  });
};

/**
 * Hook to send a chat message
 */
export const useSendChatMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, messageData }) => gameAPI.sendChatMessage(gameId, messageData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch chat messages
      queryClient.invalidateQueries({ queryKey: ['chat', variables.gameId] });
      queryClient.refetchQueries({ queryKey: ['chat', variables.gameId] });
    },
  });
};

