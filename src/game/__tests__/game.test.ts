import { describe, it, expect } from 'vitest';
import { setupGame } from '../setup';
import { drawActionPhase, endTurn } from '../turn';
import { startAction, resolveAction, useShutdown } from '../actions';
import { submitGuess, applyWrongGuessPenalty } from '../guess';
import { buildActionDeck, validateQuestionSet } from '../deck';
import sampleData from '../../data/sample-questions.json';

const questionSet = validateQuestionSet(sampleData);
const question = questionSet.questions[0];

function makeGame(playerCount = 3) {
  const players = Array.from({ length: playerCount }, (_, i) => ({ name: `Player${i + 1}` }));
  return setupGame('room-test', players, question);
}

// ─── Setup ──────────────────────────────────────────────────────────────────

describe('setupGame', () => {
  it('creates correct number of players', () => {
    const state = makeGame(4);
    expect(state.players).toHaveLength(4);
  });

  it('each player has 1 normal + 1 locked + 5 actions', () => {
    const state = makeGame(3);
    for (const p of state.players) {
      const normal = p.clueHand.filter((c) => c.status === 'normal');
      const locked = p.clueHand.filter((c) => c.status === 'locked');
      expect(normal.length).toBe(1);
      expect(locked.length).toBe(1);
      expect(p.actionHand).toHaveLength(5);
    }
  });

  it('opens 1 public clue', () => {
    const state = makeGame(2);
    expect(state.publicClues).toHaveLength(1);
    expect(state.publicClues[0].status).toBe('public');
  });

  it('no card exists in more than one zone', () => {
    const state = makeGame(3);
    const allIds = [
      ...state.clueDeck.map((c) => c.instanceId),
      ...state.publicClues.map((c) => c.instanceId),
      ...state.players.flatMap((p) => p.clueHand.map((c) => c.instanceId)),
      ...state.actionDeck.map((a) => a.instanceId),
      ...state.players.flatMap((p) => p.actionHand.map((a) => a.instanceId)),
    ];
    const unique = new Set(allIds);
    expect(unique.size).toBe(allIds.length);
  });
});

// ─── Deck ───────────────────────────────────────────────────────────────────

describe('buildActionDeck', () => {
  it('has exactly 60 cards', () => {
    const deck = buildActionDeck();
    expect(deck).toHaveLength(60);
  });
});

describe('validateQuestionSet', () => {
  it('passes sample data', () => {
    expect(() => validateQuestionSet(sampleData)).not.toThrow();
  });

  it('throws on bad data', () => {
    expect(() => validateQuestionSet({ schemaVersion: 2, questions: [] })).toThrow();
  });
});

// ─── Turn ───────────────────────────────────────────────────────────────────

describe('drawActionPhase', () => {
  it('gives player an action card', () => {
    const state = makeGame(2);
    const player = state.players[state.currentPlayerIndex];
    const before = player.actionHand.length;
    const after = drawActionPhase(state);
    expect(after.players[state.currentPlayerIndex].actionHand.length).toBe(before + 1);
  });

  it('skips when hand is full (7 cards)', () => {
    let state = makeGame(2);
    // Fill hand to 7
    while (state.players[state.currentPlayerIndex].actionHand.length < 7 && state.actionDeck.length > 0) {
      state = drawActionPhase(state);
      state = { ...state, turnPhase: 'draw' }; // reset phase for next draw
    }
    const countBefore = state.players[state.currentPlayerIndex].actionHand.length;
    if (countBefore < 7) return; // deck ran out first, skip
    const after = drawActionPhase(state);
    expect(after.players[state.currentPlayerIndex].actionHand.length).toBe(7);
  });
});

describe('endTurn', () => {
  it('advances to next player', () => {
    const state = makeGame(3);
    const idx = state.currentPlayerIndex;
    const after = endTurn(state);
    expect(after.currentPlayerIndex).toBe((idx + 1) % 3);
  });

  it('blackout player skips main phase', () => {
    let state = makeGame(2);
    const nextIdx = (state.currentPlayerIndex + 1) % 2;
    state = {
      ...state,
      players: state.players.map((p, i) => (i === nextIdx ? { ...p, isBlackedOut: true } : p)),
    };
    const after = endTurn(state);
    // Should have been moved to 'end' phase (skipped main)
    expect(after.turnPhase).toBe('end');
    // Blackout should be cleared
    expect(after.players[nextIdx].isBlackedOut).toBe(false);
  });
});

// ─── Guess ──────────────────────────────────────────────────────────────────

describe('submitGuess', () => {
  it('correct answer triggers gameover', () => {
    const state = makeGame(2);
    const playerId = state.players[0].id;
    const { state: after, result } = submitGuess(state, playerId, question.answer);
    expect(result).toBe('correct');
    expect(after.gamePhase).toBe('gameover');
    expect(after.winner).toBe(playerId);
  });

  it('wrong answer requires penalty', () => {
    const state = makeGame(2);
    const playerId = state.players[0].id;
    const { result } = submitGuess(state, playerId, 'wrong answer here');
    expect(result).toBe('wrong');
  });

  it('anonymous guess wrong — no_clue_to_discard not forced', () => {
    const state = makeGame(2);
    const playerId = state.players[0].id;
    const { state: after, result } = submitGuess(state, playerId, 'wrong', true);
    expect(result).toBe('wrong');
    expect(after.gamePhase).toBe('playing'); // game continues
  });

  it('wrong guess penalty makes clue public', () => {
    const state = makeGame(2);
    const player = state.players[0];
    const clue = player.clueHand[0];
    const after = applyWrongGuessPenalty(state, player.id, clue.instanceId);
    expect(after.publicClues.some((c) => c.instanceId === clue.instanceId)).toBe(true);
    expect(after.players[0].clueHand.some((c) => c.instanceId === clue.instanceId)).toBe(false);
  });
});

// ─── Actions ────────────────────────────────────────────────────────────────

describe('Decode action', () => {
  it('converts locked clue to normal', () => {
    let state = makeGame(2);
    const player = state.players[state.currentPlayerIndex];
    const decodeAction = player.actionHand.find((a) => a.type === 'DECODE');
    const lockedClue = player.clueHand.find((c) => c.status === 'locked');
    if (!decodeAction || !lockedClue) return; // skip if not in hand

    state = startAction(state, player.id, decodeAction.instanceId);
    state = { ...state, pendingAction: { ...state.pendingAction!, selectedClueInstanceId: lockedClue.instanceId, step: 'awaiting_shutdown' } };
    state = resolveAction(state);

    const updated = state.players.find((p) => p.id === player.id);
    const clue = updated?.clueHand.find((c) => c.instanceId === lockedClue.instanceId);
    expect(clue?.status).toBe('normal');
  });
});

describe('Blackout action', () => {
  it('marks target as blacked out', () => {
    let state = makeGame(2);
    const actor = state.players[state.currentPlayerIndex];
    const target = state.players[(state.currentPlayerIndex + 1) % 2];
    const blackout = actor.actionHand.find((a) => a.type === 'BLACKOUT');
    if (!blackout) return;

    state = startAction(state, actor.id, blackout.instanceId);
    state = { ...state, pendingAction: { ...state.pendingAction!, targetId: target.id, step: 'awaiting_shutdown' } };
    state = resolveAction(state);

    const updatedTarget = state.players.find((p) => p.id === target.id);
    expect(updatedTarget?.isBlackedOut).toBe(true);
  });
});

describe('Shutdown', () => {
  it('cancels pending action', () => {
    let state = makeGame(2);
    const actor = state.players[state.currentPlayerIndex];
    const target = state.players[(state.currentPlayerIndex + 1) % 2];
    const blackout = actor.actionHand.find((a) => a.type === 'BLACKOUT');
    const shutdownCard = target.actionHand.find((a) => a.type === 'SHUTDOWN');
    if (!blackout || !shutdownCard) return;

    state = startAction(state, actor.id, blackout.instanceId);
    state = { ...state, pendingAction: { ...state.pendingAction!, targetId: target.id, step: 'awaiting_shutdown' } };
    state = useShutdown(state, target.id, shutdownCard.instanceId);

    expect(state.pendingAction).toBeNull();
    // Target should NOT be blacked out
    const updatedTarget = state.players.find((p) => p.id === target.id);
    expect(updatedTarget?.isBlackedOut).toBe(false);
  });
});
