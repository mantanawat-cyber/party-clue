import type { GameState } from '../models';
import { drawFromDeck } from './deck';
import { addLog } from './utils';

const ACTION_HAND_LIMIT = 7;

// Phase 1: Draw Action
export function drawActionPhase(state: GameState): GameState {
  const player = state.players[state.currentPlayerIndex];

  // Skip if hand full or deck empty
  if (player.actionHand.length >= ACTION_HAND_LIMIT || state.actionDeck.length === 0) {
    return addLog(
      { ...state, turnPhase: 'main' },
      player.actionHand.length >= ACTION_HAND_LIMIT
        ? `${player.name}: Action เต็มมือ ข้าม Draw`
        : `${player.name}: Action Deck หมด ข้าม Draw`
    );
  }

  const [drawn, remainingDeck] = drawFromDeck(state.actionDeck);
  if (!drawn) return { ...state, turnPhase: 'main' };

  const updatedPlayers = state.players.map((p, i) =>
    i === state.currentPlayerIndex
      ? { ...p, actionHand: [...p.actionHand, drawn] }
      : p
  );

  return addLog(
    { ...state, players: updatedPlayers, actionDeck: remainingDeck, turnPhase: 'main' },
    `${player.name} จั่ว Action: ${drawn.name}`
  );
}

// Phase 3: End Turn — advance to next player
export function endTurn(state: GameState): GameState {
  const nextIndex = getNextPlayerIndex(state);
  const nextPlayer = state.players[nextIndex];

  // Check if next player is blacked out — skip their Main Phase
  const isBlackedOut = nextPlayer.isBlackedOut;

  // Clear blackout status for next player
  const updatedPlayers = state.players.map((p, i) =>
    i === nextIndex ? { ...p, isBlackedOut: false } : p
  );

  let next: GameState = {
    ...state,
    players: updatedPlayers,
    currentPlayerIndex: nextIndex,
    turnPhase: 'draw',
    turnNumber: nextIndex === 0 ? state.turnNumber + 1 : state.turnNumber,
    pendingAction: null,
  };

  next = addLog(next, `ถึงตา ${nextPlayer.name}${isBlackedOut ? ' (Blacked Out — ข้าม Main Phase)' : ''}`);

  if (isBlackedOut) {
    // Auto-execute draw phase and jump to end (skip main)
    next = drawActionPhase(next);
    next = { ...next, turnPhase: 'end' };
  }

  return next;
}

function getNextPlayerIndex(state: GameState): number {
  return (state.currentPlayerIndex + 1) % state.players.length;
}

// Optional rule: discard 1 action to draw 1 new action
export function redrawAction(state: GameState, discardInstanceId: string): GameState {
  if (!state.settings.allowActionRedraw) return state;

  const player = state.players[state.currentPlayerIndex];
  const discarded = player.actionHand.find((a) => a.instanceId === discardInstanceId);
  if (!discarded) return state;

  const [drawn, remainingDeck] = drawFromDeck(state.actionDeck);
  if (!drawn) return state;

  const newHand = player.actionHand
    .filter((a) => a.instanceId !== discardInstanceId)
    .concat(drawn);

  const updatedPlayers = state.players.map((p, i) =>
    i === state.currentPlayerIndex ? { ...p, actionHand: newHand } : p
  );

  return addLog(
    {
      ...state,
      players: updatedPlayers,
      actionDeck: remainingDeck,
      actionDiscard: [...state.actionDiscard, discarded],
      turnPhase: 'end',
    },
    `${player.name} ทิ้ง ${discarded.name} และจั่ว ${drawn.name}`
  );
}
