import {randomUUID} from 'crypto';
import {generateGuidePrompt} from './aiService';

const games = new Map();

export const createGame = ({ hostName = 'Host', initialPrompt }) => {
  const gameId = randomUUID();
  const prompt = initialPrompt?.trim() || 'A traveler enters a mysterious forest...';

  const newGame = {
    id: gameId,
    createdAt: new Date().toISOString(),
    hostName,
    status: 'waiting',
    initialPrompt: prompt,
    guidePrompt: prompt,
    players: [hostName],
    turns: [],
  };

  games.set(gameId, newGame);
  return newGame;
};

export const submitTurn = async (gameId, { playerName = 'Anonymous', text }) => {
  const game = games.get(gameId);

  if (!game) {
    return { error: 'Game not found', status: 404 };
  }

  if (!text || !text.trim()) {
    return { error: 'Turn text is required', status: 400 };
  }

  const cleanText = text.trim();
  const lines = cleanText.split(/\n/).filter(Boolean);
  const lastLine = lines[lines.length - 1] || cleanText;

  const guidePrompt = await generateGuidePrompt(lastLine, game.turns.length + 1);

  const turn = {
    id: randomUUID(),
    order: game.turns.length + 1,
    playerName,
    text: cleanText,
    guidePrompt,
    createdAt: new Date().toISOString(),
  };

  game.turns.push(turn);
  game.status = 'active';
  game.guidePrompt = guidePrompt;

  if (!game.players.includes(playerName)) {
    game.players.push(playerName);
  }

  return { game, turn };
};

export const getGameState = (gameId) => {
  const game = games.get(gameId);

  if (!game) {
    return { error: 'Game not found', status: 404 };
  }

  return { game };
};

export const resetGames = () => games.clear();
