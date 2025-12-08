import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeDb } from './fakeFirestore.js';

vi.mock('../src/firebase.js', () => {
  const db = createFakeDb();
  return { db };
});

vi.mock('../src/services/aiService.js', () => ({
  generateGuidePrompt: vi.fn(async (lastLine, order) => `GUIDE-${order}-${lastLine}`),
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

describe('gameService', () => {
  const host = { id: 'host-1', name: 'Host' };
  beforeEach(async () => {
    vi.resetModules();
    const { db } = await import('../src/firebase.js');
    db._reset();
  });

  it('creates a single-player game with StoryBot added', async () => {
    const { createGame } = await getServices();
    const game = await createGame({
      hostName: host.name,
      hostId: host.id,
      initialPrompt: 'Start',
      maxTurns: 2,
      maxPlayers: 2,
      mode: 'single',
    });
    expect(game.mode).toBe('single');
    expect(game.players.map((p) => p.name)).toContain('StoryBot');
    expect(game.currentPlayer).toBe(host.name);
  });

  it('allows joining a multiplayer game and respects max players', async () => {
    const { createGame, joinGame } = await getServices();
    const game = await createGame({
      hostName: host.name,
      hostId: host.id,
      maxPlayers: 3,
      maxTurns: 4,
      mode: 'multi',
    });
    const g1 = await joinGame(game.id, { playerName: 'P2', playerId: 'p2' });
    expect(g1.game.players).toHaveLength(2);
    const g2 = await joinGame(game.id, { playerName: 'P3', playerId: 'p3' });
    expect(g2.game.players).toHaveLength(3);
    const full = await joinGame(game.id, { playerName: 'P4', playerId: 'p4' });
    expect(full.error).toBe('Game is full');
  });

  it('runs a single-player turn and auto-adds AI turn, finishing at maxTurns', async () => {
    const { createGame, submitTurn, getGameState } = await getServices();
    const game = await createGame({
      hostName: host.name,
      hostId: host.id,
      maxTurns: 2,
      mode: 'single',
    });
    const res = await submitTurn(game.id, {
      playerName: host.name,
      playerId: host.id,
      text: 'The hero ventures forth.',
    });
    expect(res.game.turnsCount).toBe(2); // human + AI
    expect(res.game.status).toBe('finished');
    expect(res.game.currentPlayer).toBeNull();
    expect(res.game.scores?.players?.Tester?.creativity).toBeDefined();

    const state = await getGameState(game.id);
    expect(state.game.turnsCount).toBe(2);
  });
});
