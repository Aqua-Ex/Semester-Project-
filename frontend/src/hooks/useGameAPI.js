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
 * Hook to fetch game state
 * Automatically polls if game is active
 */
export const useGameState = (gameId, options = {}) => {
  const { enabled = true, refetchInterval = null } = options;

  return useQuery({
    queryKey: ['game', gameId],
    queryFn: () => gameAPI.getGameState(gameId),
    enabled: enabled && !!gameId,
    refetchInterval: (query) => {
      // Auto-refetch if game is active
      const game = query?.state?.data?.game;
      if (game && game.status === 'active') {
        return refetchInterval || 2000; // Poll every 2 seconds for active games
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

