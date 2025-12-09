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
   * Get current game state
   * @param {string} gameId - Game ID
   * @returns {Promise<Object>} Game state and info
   */
  getGameState: async (gameId) => {
    return apiRequest(`/api/game/${gameId}`, {
      method: 'GET',
    });
  },

  /**
   * Get all turns for a game
   * @param {string} gameId - Game ID
   * @returns {Promise<Object>} Array of turns
   */
  getGameTurns: async (gameId) => {
    return apiRequest(`/api/game/${gameId}/turns`, {
      method: 'GET',
    });
  },

  /**
   * Start a game (change status from waiting to active)
   * @param {string} gameId - Game ID
   * @returns {Promise<Object>} Updated game object
   */
  startGame: async (gameId) => {
    return apiRequest(`/api/game/${gameId}/start`, {
      method: 'POST',
    });
  },

  /**
   * Get leaderboard data
   * @param {string} type - 'global', 'weekly', 'friends', 'rapidfire'
   * @param {string} userId - Optional user ID for friends leaderboard
   * @returns {Promise<Object>} Leaderboard entries
   */
  getLeaderboard: async (type, userId = null) => {
    const params = userId ? `?userId=${userId}` : '';
    return apiRequest(`/api/game/leaderboard/${type}${params}`, {
      method: 'GET',
    });
  },

  /**
   * Get user's game history
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Array of finished games
   */
  getUserHistory: async (userId) => {
    return apiRequest(`/api/game/history/${userId}`, {
      method: 'GET',
    });
  },

  /**
   * Get chat messages for a game
   * @param {string} gameId - Game ID
   * @returns {Promise<Object>} Array of chat messages
   */
  getChatMessages: async (gameId) => {
    return apiRequest(`/api/game/${gameId}/chat`, {
      method: 'GET',
    });
  },

  /**
   * Send a chat message
   * @param {string} gameId - Game ID
   * @param {Object} messageData - Message data
   * @param {string} messageData.playerName - Player name
   * @param {string} messageData.playerId - Player ID
   * @param {string} messageData.text - Message text
   * @returns {Promise<Object>} Created message
   */
  sendChatMessage: async (gameId, messageData) => {
    return apiRequest(`/api/game/${gameId}/chat`, {
      method: 'POST',
      body: messageData,
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

