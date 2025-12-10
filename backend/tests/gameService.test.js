import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { webcrypto } from 'crypto';
import { createFakeDb } from './fakeFirestore.js';

// Ensure crypto.getRandomValues exists for Vitest/Vite environment
if (!globalThis.crypto?.getRandomValues) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}

vi.mock('../src/firebase.js', () => {
  const db = createFakeDb();
  return { db };
});

const aiMocks = {
  guide: vi.fn(async ({ storySoFar, turnNumber }) => `GUIDE-${turnNumber}-${storySoFar || 'EMPTY'}`),
  initial: vi.fn(async (seed) => `INIT-${seed || 'DEFAULT'}`),
  turn: vi.fn(async ({ prompt }) => `<p>AI:${prompt}</p>`),
};

vi.mock('../src/services/aiService.js', () => ({
  generateGuidePrompt: (...args) => aiMocks.guide(...args),
  generateInitialPrompt: (...args) => aiMocks.initial(...args),
  generateAiTurnText: (...args) => aiMocks.turn(...args),
  callChatModel: vi.fn(),
}));

vi.mock('../src/services/scoringService.js', () => ({
  scoreGame: vi.fn(async () => ({
    players: { Tester: { creativity: 50, cohesion: 60, momentum: 70 } },
    summary: 'ok',
  })),
}));

const getServices = async () => {
  const { db } = await import('../src/firebase.js');
  const service = await import('../src/services/gameService.js');
  return { ...service, db };
};

describe('gameService end-to-end flows', () => {
  const host = { id: 'host-1', name: 'Host' };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const { db } = await import('../src/firebase.js');
    db._reset();
    aiMocks.guide.mockClear();
    aiMocks.initial.mockClear();
    aiMocks.turn.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a single-player game with an AI opponent seeded and visible prompt for turn 1', async () => {
    const { createGame, getGameState } = await getServices();
    const game = await createGame({
      hostName: host.name,
      hostId: host.id,
      initialPrompt: 'Start',
      maxTurns: 4,
      maxPlayers: 2,
      mode: 'single',
    });
    expect(game.mode).toBe('single');
    expect(game.players).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: host.id }),
        expect.objectContaining({ id: 'ai-bot', name: 'AI Opponent' }),
      ]),
    );
    expect(game.initialPrompt).toBe('INIT-Start');
    expect(game.currentPlayerId).toBe(host.id);

    const state = await getGameState(game.id);
    expect(state.game.guidePrompt).toBe('INIT-Start');
    expect(state.info.status).toBe('active');
    expect(state.info.timeRemainingSeconds).toBeGreaterThan(0);
  });

  it('sanitizes human input, generates an AI turn, and finishes at max turns with story text and scores', async () => {
    const { createGame, submitTurn, getGameState } = await getServices();
    const game = await createGame({
      hostName: host.name,
      hostId: host.id,
      maxTurns: 2,
      mode: 'single',
    });

    const first = await submitTurn(game.id, {
      playerName: host.name,
      playerId: host.id,
      text: '<p>The hero ventures forth.</p>',
    });
    expect(first.game.turnsCount).toBe(1);
    expect(first.game.status).toBe('active');

    // Run queued AI turn
    await vi.runAllTimersAsync();

    const state = await getGameState(game.id, { includeTurns: true });
    expect(state.info.turns).toHaveLength(2);
    expect(state.info.storyText).toMatch(/The hero ventures forth/);
    expect(state.info.storyText).not.toMatch(/<p>/);
    expect(state.info.status).toBe('finished');
    expect(state.game.currentPlayer).toBeNull();
    // Scores stubbed from scoringService mock
    expect(state.info.scores?.players?.Tester?.creativity).toBeDefined();
  });

  it('allows joining a multiplayer game, enforces cap, and exposes turn history with prompts', async () => {
    const { createGame, joinGame, submitTurn, getGameState } = await getServices();
    const game = await createGame({
      hostName: host.name,
      hostId: host.id,
      maxPlayers: 2,
      maxTurns: 3,
      mode: 'multi',
    });
    const joined = await joinGame(game.id, { playerName: 'P2', playerId: 'p2' });
    expect(joined.game.players).toHaveLength(2);
    const over = await joinGame(game.id, { playerName: 'P3', playerId: 'p3' });
    expect(over.error).toBe('Game is full');

    const t1 = await submitTurn(game.id, { playerName: host.name, playerId: host.id, text: 'First move' });
    const t2 = await submitTurn(game.id, { playerName: 'P2', playerId: 'p2', text: 'Second move' });
    expect(t2.game.turnsCount).toBe(2);

    const state = await getGameState(game.id, { includeTurns: true });
    expect(state.info.turns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ order: 1, promptUsed: expect.stringContaining('INIT') }),
        expect.objectContaining({ order: 2 }),
      ]),
    );
    expect(state.info.storyText).toMatch(/First move/);
    expect(state.info.storyText).toMatch(/Second move/);
  });
});
