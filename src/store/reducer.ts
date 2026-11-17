import type { GameState, Player, Question } from '../models';
import {
  setupGame,
  drawActionPhase,
  endTurn,
  redrawAction,
  startAction,
  resolveAction,
  useShutdown,
  setActionTarget,
  setSelectedClue,
  setShufflePick,
  applyDiscardChoice,
  applyInvestigateKeep,
  submitGuess,
  applyWrongGuessPenalty,
  judgeAnswer,
} from '../game';

// ─── App UI State ────────────────────────────────────────────────────────────

export type Screen =
  | 'home'       // create or join room
  | 'setup'      // host: set up player names + question
  | 'claim'      // pick which player you are (host + joiner)
  | 'join'       // enter room code
  | 'board'      // public game board
  | 'hand'       // private hand
  | 'gameover';

export interface AppState {
  screen: Screen;
  gameState: GameState | null;
  myPlayerId: string | null;      // which player this device is
  currentPlayer: Player | null;   // legacy fallback for single-device
  roomId: string | null;
  roomCode: string | null;
  isHost: boolean;
  spyReveal: string | null;
  guessPhase: 'idle' | 'pending_penalty';
  isAnonymousGuess: boolean;
  hostJudgePending: string | null;
}

export const INITIAL_STATE: AppState = {
  screen: 'home',
  gameState: null,
  myPlayerId: null,
  currentPlayer: null,
  roomId: null,
  roomCode: null,
  isHost: false,
  spyReveal: null,
  guessPhase: 'idle',
  isAnonymousGuess: false,
  hostJudgePending: null,
};

// ─── Dispatch Actions ────────────────────────────────────────────────────────

export type AppAction =
  | { type: 'GO_SETUP' }
  | { type: 'GO_JOIN' }
  | { type: 'GO_HOME' }
  | { type: 'GO_CLAIM' }
  | { type: 'INIT_GAME'; playerNames: string[]; question: Question; roomId: string }
  | { type: 'START_GAME'; gameState: GameState; roomId: string; roomCode: string }
  | { type: 'ROOM_CREATED'; roomId: string; roomCode: string }
  | { type: 'CLAIM_PLAYER'; playerId: string }
  | { type: 'FIREBASE_SYNC'; gameState: GameState }
  | { type: 'OPEN_BOARD' }
  | { type: 'OPEN_HAND' }
  | { type: 'DRAW_ACTION' }
  | { type: 'PLAY_ACTION'; actionInstanceId: string }
  | { type: 'SET_TARGET'; targetId: string }
  | { type: 'SELECT_CLUE'; clueInstanceId: string }
  | { type: 'SKIP_SHUTDOWN' }
  | { type: 'USE_SHUTDOWN'; playerId: string; shutdownInstanceId: string }
  | { type: 'APPLY_DISCARD_CHOICE'; choice: 'clue' | 'actions'; clueInstanceId?: string }
  | { type: 'KEEP_INVESTIGATE'; clueInstanceId: string }
  | { type: 'SET_SHUFFLE_PICK'; playerId: string; clueInstanceId: string }
  | { type: 'SUBMIT_GUESS'; answer: string; isAnonymous: boolean }
  | { type: 'APPLY_PENALTY'; clueInstanceId: string }
  | { type: 'JUDGE_ANSWER'; isCorrect: boolean }
  | { type: 'END_TURN' }
  | { type: 'REDRAW_ACTION'; discardInstanceId: string }
  | { type: 'CLEAR_SPY_REVEAL' };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function actorId(state: AppState): string | null {
  return state.myPlayerId ?? state.currentPlayer?.id ?? null;
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {

    case 'GO_SETUP':
      return { ...state, screen: 'setup', isHost: true };

    case 'GO_JOIN':
      return { ...state, screen: 'join' };

    case 'GO_CLAIM':
      return { ...state, screen: 'claim' };

    case 'GO_HOME':
      return { ...INITIAL_STATE };

    case 'INIT_GAME': {
      const gs = setupGame(action.roomId, action.playerNames, action.question);
      return { ...state, gameState: gs, screen: 'claim', currentPlayer: null };
    }

    case 'START_GAME': {
      return {
        ...state,
        gameState: action.gameState,
        roomId: action.roomId,
        roomCode: action.roomCode,
        screen: 'claim',
        currentPlayer: null,
        isHost: true,
      };
    }

    case 'ROOM_CREATED': {
      return { ...state, roomId: action.roomId, roomCode: action.roomCode };
    }

    case 'CLAIM_PLAYER': {
      const gs = state.gameState;
      const updatedGs = gs ? {
        ...gs,
        claimedPlayerIds: [...(gs.claimedPlayerIds ?? []), action.playerId],
      } : gs;
      return {
        ...state,
        myPlayerId: action.playerId,
        currentPlayer: gs?.players.find(p => p.id === action.playerId) ?? null,
        gameState: updatedGs,
        screen: 'board',
      };
    }

    case 'FIREBASE_SYNC': {
      // Update game state from Firebase — do not write back
      const gs = action.gameState;
      if (gs.gamePhase === 'gameover') {
        return { ...state, gameState: gs, screen: 'gameover', spyReveal: null, guessPhase: 'idle', hostJudgePending: null };
      }
      return { ...state, gameState: gs };
    }

    case 'OPEN_BOARD':
      return { ...state, screen: 'board' };

    case 'OPEN_HAND': {
      if (!state.gameState) return state;
      const pid = actorId(state);
      const player = pid
        ? state.gameState.players.find(p => p.id === pid)
        : state.gameState.players[state.gameState.currentPlayerIndex];
      let gs = state.gameState;
      if (gs.turnPhase === 'draw') gs = drawActionPhase(gs);
      return { ...state, screen: 'hand', gameState: gs, currentPlayer: player ?? null };
    }

    case 'DRAW_ACTION': {
      if (!state.gameState) return state;
      return { ...state, gameState: drawActionPhase(state.gameState) };
    }

    case 'PLAY_ACTION': {
      if (!state.gameState) return state;
      const id = actorId(state);
      if (!id) return state;
      const gs = startAction(state.gameState, id, action.actionInstanceId);
      return { ...state, gameState: gs };
    }

    case 'SET_TARGET': {
      if (!state.gameState) return state;
      const gs = setActionTarget(state.gameState, action.targetId);
      return { ...state, gameState: gs };
    }

    case 'SELECT_CLUE': {
      if (!state.gameState) return state;
      const gs = setSelectedClue(state.gameState, action.clueInstanceId);
      return { ...state, gameState: gs };
    }

    case 'SKIP_SHUTDOWN': {
      if (!state.gameState) return state;
      const pending = state.gameState.pendingAction;
      if (!pending) return state;

      if (pending.action.type === 'SPY') {
        const gs = resolveAction(state.gameState);
        const spyLog = [...gs.log].reverse().find((l) => l.message.includes('[SPY]'));
        const spyReveal = spyLog ? spyLog.message.split(': ').slice(2).join(': ').replace(/"/g, '') : null;
        return { ...state, gameState: gs, spyReveal };
      }

      const gs = resolveAction(state.gameState);
      return { ...state, gameState: gs };
    }

    case 'USE_SHUTDOWN': {
      if (!state.gameState) return state;
      const gs = useShutdown(state.gameState, action.playerId, action.shutdownInstanceId);
      return { ...state, gameState: gs };
    }

    case 'APPLY_DISCARD_CHOICE': {
      if (!state.gameState) return state;
      const gs = applyDiscardChoice(state.gameState, action.choice, action.clueInstanceId);
      return { ...state, gameState: gs };
    }

    case 'KEEP_INVESTIGATE': {
      if (!state.gameState) return state;
      const gs = applyInvestigateKeep(state.gameState, action.clueInstanceId);
      return { ...state, gameState: gs };
    }

    case 'SET_SHUFFLE_PICK': {
      if (!state.gameState) return state;
      const gs = setShufflePick(state.gameState, action.playerId, action.clueInstanceId);
      return { ...state, gameState: gs };
    }

    case 'SUBMIT_GUESS': {
      if (!state.gameState) return state;
      const id = actorId(state);
      if (!id) return state;
      const { state: gs, result } = submitGuess(
        state.gameState,
        id,
        action.answer,
        action.isAnonymous,
      );

      if (gs.gamePhase === 'gameover') {
        return { ...state, gameState: gs, screen: 'gameover' };
      }

      if (state.gameState.settings.answerMode === 'manual') {
        return { ...state, gameState: gs, hostJudgePending: id, isAnonymousGuess: action.isAnonymous };
      }

      if (result === 'wrong' && !action.isAnonymous) {
        const player = gs.players.find(p => p.id === id);
        if (player && player.clueHand.length > 0) {
          return { ...state, gameState: gs, guessPhase: 'pending_penalty', isAnonymousGuess: false };
        }
      }

      return { ...state, gameState: gs, guessPhase: 'idle', isAnonymousGuess: false };
    }

    case 'APPLY_PENALTY': {
      if (!state.gameState) return state;
      const id = actorId(state);
      if (!id) return state;
      const gs = applyWrongGuessPenalty(state.gameState, id, action.clueInstanceId);
      return { ...state, gameState: gs, guessPhase: 'idle' };
    }

    case 'JUDGE_ANSWER': {
      if (!state.gameState || !state.hostJudgePending) return state;
      const gs = judgeAnswer(state.gameState, state.hostJudgePending, action.isCorrect);

      if (action.isCorrect) {
        return { ...state, gameState: gs, screen: 'gameover', hostJudgePending: null };
      }

      const playerId = state.hostJudgePending;
      const player = gs.players.find(p => p.id === playerId);
      if (!state.isAnonymousGuess && player && player.clueHand.length > 0) {
        return { ...state, gameState: gs, hostJudgePending: null, guessPhase: 'pending_penalty' };
      }
      return { ...state, gameState: gs, hostJudgePending: null, guessPhase: 'idle' };
    }

    case 'END_TURN': {
      if (!state.gameState) return state;
      const gs = endTurn(state.gameState);
      return {
        ...state,
        gameState: gs,
        screen: 'board',
        spyReveal: null,
        guessPhase: 'idle',
        isAnonymousGuess: false,
        hostJudgePending: null,
      };
    }

    case 'REDRAW_ACTION': {
      if (!state.gameState) return state;
      const gs = redrawAction(state.gameState, action.discardInstanceId);
      return { ...state, gameState: gs };
    }

    case 'CLEAR_SPY_REVEAL':
      return { ...state, spyReveal: null };

    default:
      return state;
  }
}
