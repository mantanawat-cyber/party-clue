import { ref, set, get, onValue, off, push, update } from 'firebase/database';
import { db } from './config';
import type { GameState } from '../models';

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
export function listenToGameState(
  roomId: string,
  onUpdate: (gs: GameState) => void,
): () => void {
  const r = stateRef(roomId);
  onValue(r, (snap) => {
    if (snap.exists()) onUpdate(snap.val() as GameState);
  });
  return () => off(r);
}

// Mark room as finished
export async function closeRoom(roomId: string): Promise<void> {
  await update(metaRef(roomId), { phase: 'gameover' });
}
