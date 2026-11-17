import type { GameState, ClueInstance, Player } from '../models';

export function addLog(state: GameState, message: string): GameState {
  return {
    ...state,
    log: [...state.log, { timestamp: Date.now(), message }],
  };
}

export function getPlayer(state: GameState, playerId: string): Player | undefined {
  return state.players.find((p) => p.id === playerId);
}

export function getPlayerIndex(state: GameState, playerId: string): number {
  return state.players.findIndex((p) => p.id === playerId);
}

export function updatePlayer(state: GameState, playerId: string, updater: (p: Player) => Player): GameState {
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? updater(p) : p)),
  };
}

// Move a clue from one player's hand to another player's hand
export function transferClue(
  state: GameState,
  clueInstanceId: string,
  fromPlayerId: string,
  toPlayerId: string
): GameState {
  let clue: ClueInstance | undefined;

  let s = updatePlayer(state, fromPlayerId, (p) => {
    clue = p.clueHand.find((c) => c.instanceId === clueInstanceId);
    return { ...p, clueHand: p.clueHand.filter((c) => c.instanceId !== clueInstanceId) };
  });

  if (!clue) return state;
  const movedClue = { ...clue, ownerId: toPlayerId };

  s = updatePlayer(s, toPlayerId, (p) => ({
    ...p,
    clueHand: [...p.clueHand, movedClue],
  }));

  return s;
}

// Make a clue public: remove from player's hand and add to publicClues
export function makeCluePublic(
  state: GameState,
  clueInstanceId: string,
  fromPlayerId: string
): GameState {
  let clue: ClueInstance | undefined;

  let s = updatePlayer(state, fromPlayerId, (p) => {
    clue = p.clueHand.find((c) => c.instanceId === clueInstanceId);
    return { ...p, clueHand: p.clueHand.filter((c) => c.instanceId !== clueInstanceId) };
  });

  if (!clue) return state;

  const publicClue: ClueInstance = {
    ...clue,
    status: 'public',
    ownerId: null,
  };

  return { ...s, publicClues: [...s.publicClues, publicClue] };
}

// Normalize answer text for comparison
export function normalizeAnswer(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}
