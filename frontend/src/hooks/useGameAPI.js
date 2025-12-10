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
      // Invalidate game state to refetch
      queryClient.invalidateQueries({ queryKey: ['game', variables.gameId] });
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
 * Hook to preview an AI response for a staged turn
 */
export const usePreviewTurn = () => {
  return useMutation({
    mutationFn: ({ gameId, turnData }) => gameAPI.previewTurn(gameId, turnData),
  });
};

/**
 * Hook to start a waiting game
 */
export const useStartGame = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, playerId }) => gameAPI.startGame(gameId, { playerId }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['game', variables.gameId] });
    },
  });
};

/**
 * Hook to update lobby settings (e.g., max players)
 */
export const useUpdateGameSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, settings }) => gameAPI.updateGameSettings(gameId, settings),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['game', variables.gameId] });
      queryClient.invalidateQueries({ queryKey: ['lobbies'] });
    },
  });
};

/**
 * Hook to request to join a lobby (host approval)
 */
export const useRequestJoin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, playerData }) => gameAPI.requestToJoin(gameId, playerData),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['game', variables.gameId] });
      queryClient.invalidateQueries({ queryKey: ['lobbies'] });
    },
  });
};

/**
 * Hook for hosts to review join requests
 */
export const useReviewJoinRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, decision }) => gameAPI.reviewJoinRequest(gameId, decision),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['game', variables.gameId] });
    },
  });
};

/**
 * Hook to fetch game state
 * Automatically polls if game is active
 */
export const useGameState = (gameId, options = {}) => {
  const { enabled = true, refetchInterval = null, refetchWhileWaiting = false, includeTurns = false } = options;

  return useQuery({
    queryKey: ['game', gameId],
    queryFn: () => gameAPI.getGameState(gameId, { includeTurns }),
    enabled: enabled && !!gameId,
    refetchInterval: (query) => {
      // Explicit interval overrides
      if (typeof refetchInterval === 'function') return refetchInterval(query);
      if (refetchInterval) return refetchInterval;

      // Auto-refetch if game is active or if caller wants updates while waiting
      const game = query?.state?.data?.game;
      if (game && (game.status === 'active' || (refetchWhileWaiting && game.status === 'waiting'))) {
        return 2000; // Poll every 2 seconds
      }
      return false; // Don't poll for finished/waiting games
    },
    refetchIntervalInBackground: true,
    staleTime: 1000, // Consider data stale after 1 second
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
 * Hook to fetch open multiplayer lobbies
 */
export const useAvailableLobbies = (options = {}) => {
  const { enabled = true, refetchInterval = 5000, minCreatedAt = null } = options;

  return useQuery({
    queryKey: ['lobbies', minCreatedAt],
    queryFn: () => gameAPI.listLobbies(undefined, { minCreatedAt }),
    enabled,
    refetchInterval,
    refetchIntervalInBackground: true,
  });
};

/**
 * Host abandons/finishes a lobby
 */
export const useAbandonGame = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, playerId, reason }) => gameAPI.abandonGame(gameId, { playerId, reason }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['game', variables.gameId] });
      queryClient.invalidateQueries({ queryKey: ['lobbies'] });
    },
  });
};

/**
 * Hook to fetch recent games for a user
 */
export const useUserHistory = (userId, limit = 5) => {
  return useQuery({
    queryKey: ['user-history', userId, limit],
    queryFn: () => gameAPI.getUserHistory(userId, limit),
    enabled: !!userId,
    staleTime: 60_000,
  });
};
