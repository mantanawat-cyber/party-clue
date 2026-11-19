import { ref, set, get, onValue, off, push, update } from 'firebase/database';
import { db } from './config';
import type { GameState, LobbyPlayer } from '../models';

const BASE = 'party-clue';

function stateRef(roomId: string) {
  return ref(db, `${BASE}/rooms/${roomId}/state`);
}

function metaRef(roomId: string) {
  return ref(db, `${BASE}/rooms/${roomId}/meta`);
}

// Generate a unique player ID (persisted in localStorage)
export function getOrCreatePlayerId(): string {
  try {
    let id = localStorage.getItem('party-clue-player-id');
    if (!id) {
      id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem('party-clue-player-id', id);
    }
    return id;
  } catch {
    return `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
}

// Host reserves a room slot and gets roomId + code (before game state is ready)
export async function reserveRoom(): Promise<{ roomId: string; roomCode: string }> {
  const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
  const newRoomRef = push(ref(db, `${BASE}/rooms`));
  const roomId = newRoomRef.key!;

  await set(newRoomRef, {
    meta: { roomCode, phase: 'pending', createdAt: Date.now() },
  });

  // Store code → roomId index for quick lookup
  await set(ref(db, `${BASE}/codes/${roomCode}`), roomId);

  return { roomId, roomCode };
}

// Host creates a new room, writes initial game state
export async function createRoom(gameState: GameState): Promise<{ roomId: string; roomCode: string }> {
  const { roomId, roomCode } = await reserveRoom();
  await set(ref(db, `${BASE}/rooms/${roomId}`), {
    meta: { roomCode, phase: 'playing', createdAt: Date.now() },
    state: gameState,
  });
  return { roomId, roomCode };
}

// Look up roomId by code
export async function findRoomByCode(code: string): Promise<string | null> {
  const snap = await get(ref(db, `${BASE}/codes/${code}`));
  return snap.exists() ? (snap.val() as string) : null;
}

// Get current game state once
export async function fetchGameState(roomId: string): Promise<GameState | null> {
  const snap = await get(stateRef(roomId));
  return snap.exists() ? (snap.val() as GameState) : null;
}

// Write updated game state (called after every action)
export async function writeGameState(roomId: string, gameState: GameState): Promise<void> {
  await set(stateRef(roomId), gameState);
}

// Listen to game state changes
// Firebase RTDB serializes empty arrays as null — restore them before use
function normalizeGameState(raw: GameState): GameState {
  return {
    ...raw,
    actionDeck: raw.actionDeck ?? [],
    actionDiscard: raw.actionDiscard ?? [],
    drawOrder: raw.drawOrder ?? [],
    clueDeck: raw.clueDeck ?? [],
    publicClues: raw.publicClues ?? [],
    log: raw.log ?? [],
    claimedPlayerIds: raw.claimedPlayerIds ?? [],
    players: (raw.players ?? []).map(p => ({
      ...p,
      actionHand: p.actionHand ?? [],
      clueHand: p.clueHand ?? [],
    })),
    spyResult: raw.spyResult ?? null,
    pendingAction: raw.pendingAction ? {
      ...raw.pendingAction,
      drawnClues: raw.pendingAction.drawnClues ?? [],
    } : null,
  };
}

export function listenToGameState(
  roomId: string,
  onUpdate: (gs: GameState) => void,
): () => void {
  const r = stateRef(roomId);
  onValue(r, (snap) => {
    if (snap.exists()) onUpdate(normalizeGameState(snap.val() as GameState));
  });
  return () => off(r);
}

// Mark room as finished
export async function closeRoom(roomId: string): Promise<void> {
  await update(metaRef(roomId), { phase: 'gameover' });
}

// Join the room lobby
export async function joinLobby(roomId: string, playerId: string, name: string, isHost: boolean): Promise<void> {
  await set(ref(db, `${BASE}/rooms/${roomId}/lobby/${playerId}`), { name, isHost });
}

// Listen to lobby player list
export function listenToLobby(
  roomId: string,
  onUpdate: (players: LobbyPlayer[]) => void,
): () => void {
  const r = ref(db, `${BASE}/rooms/${roomId}/lobby`);
  onValue(r, (snap) => {
    if (!snap.exists()) { onUpdate([]); return; }
    const data = snap.val() as Record<string, { name: string; isHost: boolean }>;
    const players: LobbyPlayer[] = Object.entries(data).map(([id, v]) => ({
      id, name: v.name, isHost: v.isHost,
    }));
    onUpdate(players);
  });
  return () => off(r);
}
