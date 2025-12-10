/**
 * API Configuration and Base Functions
 * Handles all communication with the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Base fetch wrapper with error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `API Error: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * Game API Functions
 */
export const gameAPI = {
  /**
   * Create a new game
   * @param {Object} gameData - Game creation parameters
   * @param {string} gameData.hostName - Host player name
   * @param {string} gameData.hostId - Host player ID
   * @param {string} gameData.initialPrompt - Starting prompt for the story
   * @param {number} gameData.turnDurationSeconds - Duration per turn in seconds
   * @param {number} gameData.maxTurns - Maximum number of turns
   * @param {number} gameData.maxPlayers - Maximum number of players
   * @param {string} gameData.mode - Game mode ('single' or 'multi')
   * @returns {Promise<Object>} Created game object
   */
  createGame: async (gameData) => {
    return apiRequest('/api/game/create', {
      method: 'POST',
      body: gameData,
    });
  },

  /**
   * Join an existing game
   * @param {string} gameId - Game ID to join
   * @param {Object} playerData - Player information
   * @param {string} playerData.playerName - Player name
   * @param {string} playerData.playerId - Player ID
   * @returns {Promise<Object>} Updated game object
   */
  joinGame: async (gameId, playerData) => {
    return apiRequest(`/api/game/${gameId}/join`, {
      method: 'POST',
      body: playerData,
    });
  },

  /**
   * Submit a turn in a game
   * @param {string} gameId - Game ID
   * @param {Object} turnData - Turn submission data
   * @param {string} turnData.playerName - Player name
   * @param {string} turnData.playerId - Player ID
   * @param {string} turnData.text - Story text for this turn
   * @returns {Promise<Object>} Game state with turn and scores
   */
  submitTurn: async (gameId, turnData) => {
    return apiRequest(`/api/game/${gameId}/turn`, {
      method: 'POST',
      body: turnData,
    });
  },

  /**
   * Preview a turn without committing it
   * @param {string} gameId - Game ID
   * @param {Object} turnData - Turn text and player info
   * @returns {Promise<Object>} Preview response from AI
   */
  previewTurn: async (gameId, turnData) => {
    return apiRequest(`/api/game/${gameId}/preview`, {
      method: 'POST',
      body: turnData,
    });
  },

  /**
   * Get current game state
   * @param {string} gameId - Game ID
   * @returns {Promise<Object>} Game state and info
   */
  getGameState: async (gameId, opts = {}) => {
    const search = new URLSearchParams();
    if (opts.includeTurns) {
      search.set('includeTurns', 'true');
    }
    const query = search.toString();
    const url = query ? `/api/game/${gameId}?${query}` : `/api/game/${gameId}`;
    return apiRequest(url, {
      method: 'GET',
    });
  },

  /**
   * Start a waiting game (host only for multiplayer)
   * @param {string} gameId - Game ID
   * @param {Object} data - Additional info (e.g., playerId)
   * @returns {Promise<Object>} Started game object
   */
  startGame: async (gameId, data = {}) => {
    return apiRequest(`/api/game/${gameId}/start`, {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Update lobby settings (host only)
   */
  updateGameSettings: async (gameId, settings) => {
    return apiRequest(`/api/game/${gameId}/settings`, {
      method: 'POST',
      body: settings,
    });
  },

  /**
   * Host abandons/finishes a lobby
   */
  abandonGame: async (gameId, data = {}) => {
    return apiRequest(`/api/game/${gameId}/abandon`, {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Cleanup all waiting lobbies (admin)
   */
  cleanupLobbies: async () => {
    return apiRequest('/api/game/cleanup-lobbies', {
      method: 'POST',
    });
  },

  /**
   * List available multiplayer lobbies waiting for players
   * @param {number} limit - Maximum number of lobbies to return
   */
  listLobbies: async (limit = 25, opts = {}) => {
    const searchParams = new URLSearchParams({ limit: String(limit) });
    if (opts.minCreatedAt) {
      searchParams.set('minCreatedAt', opts.minCreatedAt);
    }
    return apiRequest(`/api/game/lobbies?${searchParams.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * Request to join a multiplayer lobby (host approval required)
   * @param {string} gameId - Lobby/game ID
   * @param {Object} playerData - Player info
   */
  requestToJoin: async (gameId, playerData) => {
    return apiRequest(`/api/game/${gameId}/request-join`, {
      method: 'POST',
      body: playerData,
    });
  },

  /**
   * Host reviews a join request
   * @param {string} gameId - Lobby/game ID
   * @param {Object} decision - Review payload containing hostId, playerId, approve
   */
  reviewJoinRequest: async (gameId, decision) => {
    return apiRequest(`/api/game/${gameId}/review-join`, {
      method: 'POST',
      body: decision,
    });
  },

  /**
   * Get latest finished games for a user
   */
  getUserHistory: async (userId, limit = 5) => {
    return apiRequest(`/api/game/user/${userId}/history?limit=${limit}`, {
      method: 'GET',
    });
  },
};

/**
 * Leaderboard API Functions
 */
export const leaderboardAPI = {
  /**
   * Get the leaderboard (top scores)
   * @param {number} limit - Maximum number of entries to return (default 20)
   */
  getLeaderboard: async (limit = 20) => {
    const search = new URLSearchParams({ limit: String(limit) });
    return apiRequest(`/api/leaderboard?${search.toString()}`, {
      method: 'GET',
    });
  },
};

/**
 * Health check endpoint
 */
export const healthCheck = async () => {
  return apiRequest('/', {
    method: 'GET',
  });
};
