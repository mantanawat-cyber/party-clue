import { createContext, useContext, useReducer, useEffect, useRef, type ReactNode } from 'react';
import { appReducer, INITIAL_STATE, type AppState, type AppAction } from './reducer';
import { writeGameState, listenToGameState } from '../firebase/room';
import type { GameState } from '../models';

// Actions that change game state and should be written to Firebase
// OPEN_HAND is included because it may auto-draw an action card
// START_GAME is excluded — SetupScreen already writes to Firebase before dispatching
const FIREBASE_WRITE_ACTIONS = new Set([
  'CLAIM_PLAYER',
  'OPEN_HAND',
  'DRAW_ACTION', 'PLAY_ACTION', 'SET_TARGET', 'SELECT_CLUE',
  'SKIP_SHUTDOWN', 'USE_SHUTDOWN', 'APPLY_DISCARD_CHOICE', 'KEEP_INVESTIGATE',
  'SET_SHUFFLE_PICK', 'SUBMIT_GUESS', 'APPLY_PENALTY', 'JUDGE_ANSWER',
  'END_TURN', 'REDRAW_ACTION',
]);

interface GameContextValue {
  state: AppState;
  dispatch: (action: AppAction) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, localDispatch] = useReducer(appReducer, INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Write game state to Firebase after each relevant action
  function dispatch(action: AppAction) {
    localDispatch(action);

    if (!FIREBASE_WRITE_ACTIONS.has(action.type)) return;

    // Run reducer eagerly to get new state for Firebase write
    const current = stateRef.current;
    if (!current.roomId) return;
    const next = appReducer(current, action);
    if (next.gameState) {
      writeGameState(current.roomId, next.gameState).catch(console.error);
    }
  }

  // Listen to Firebase when we have a roomId
  useEffect(() => {
    const { roomId } = state;
    if (!roomId) return;

    const unsubscribe = listenToGameState(roomId, (gs: GameState) => {
      localDispatch({ type: 'FIREBASE_SYNC', gameState: gs });
    });

    return unsubscribe;
  }, [state.roomId]);

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
