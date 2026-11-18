import type { GameState, LobbyPlayer, Player, Question } from '../models';
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
  applyDiscardChoice,
  applyInvestigateKeep,
  submitGuess,
  applyWrongGuessPenalty,
  judgeAnswer,
} from '../game';

// ─── App UI State ────────────────────────────────────────────────────────────

export type Screen =
  | 'home'       // enter name, choose create or join
  | 'setup'      // host: pick question
  | 'join'       // enter room code
  | 'lobby'      // waiting room (all players)
  | 'claim'      // legacy fallback
  | 'board'      // public game board
  | 'hand'       // private hand
  | 'gameover';

export interface AppState {
  screen: Screen;
  myName: string | null;
  myPlayerId: string | null;
  lobbyPlayers: LobbyPlayer[];
  selectedQuestion: Question | null;
  gameState: GameState | null;
  currentPlayer: Player | null;
  roomId: string | null;
  roomCode: string | null;
  isHost: boolean;
  spyReveal: string | null;
  guessPhase: 'idle' | 'pending_penalty';
  isAnonymousGuess: boolean;
  hasRedrawnThisTurn: boolean;
}

export const INITIAL_STATE: AppState = {
  screen: 'home',
  myName: null,
  myPlayerId: null,
  lobbyPlayers: [],
  selectedQuestion: null,
  gameState: null,
  currentPlayer: null,
  roomId: null,
  roomCode: null,
  isHost: false,
  spyReveal: null,
  guessPhase: 'idle',
  isAnonymousGuess: false,
  hasRedrawnThisTurn: false,
};

// ─── Dispatch Actions ────────────────────────────────────────────────────────

export type AppAction =
  | { type: 'SET_MY_NAME'; name: string }
  | { type: 'GO_SETUP' }
  | { type: 'GO_JOIN' }
  | { type: 'GO_HOME' }
  | { type: 'GO_CLAIM' }
  | { type: 'GO_LOBBY'; roomId: string; roomCode: string; playerId: string; isHost: boolean; question?: Question }
  | { type: 'LOBBY_SYNC'; players: LobbyPlayer[] }
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
  | { type: 'SUBMIT_GUESS'; answer: string; isAnonymous: boolean }
  | { type: 'APPLY_PENALTY'; clueInstanceId: string }
  | { type: 'JUDGE_ANSWER'; isCorrect: boolean }
  | { type: 'END_TURN' }
  | { type: 'REDRAW_ACTION'; discardInstanceId: string }
  | { type: 'CLEAR_SPY_REVEAL' }
  | { type: 'CANCEL_ACTION' };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function actorId(state: AppState): string | null {
  return state.myPlayerId ?? state.currentPlayer?.id ?? null;
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {

    case 'SET_MY_NAME':
      return { ...state, myName: action.name };

    case 'GO_SETUP':
      return { ...state, screen: 'setup', isHost: true };

    case 'GO_JOIN':
      return { ...state, screen: 'join' };

    case 'GO_CLAIM':
      return { ...state, screen: 'claim' };

    case 'GO_LOBBY':
      return {
        ...state,
        screen: 'lobby',
        roomId: action.roomId,
        roomCode: action.roomCode,
        myPlayerId: action.playerId,
        isHost: action.isHost,
        selectedQuestion: action.question ?? state.selectedQuestion,
      };

    case 'LOBBY_SYNC':
      return { ...state, lobbyPlayers: action.players };

    case 'GO_HOME':
      return { ...INITIAL_STATE, myName: state.myName };

    case 'INIT_GAME': {
      const gs = setupGame(action.roomId, action.playerNames.map(name => ({ name })), action.question);
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
      const gs = action.gameState;
      if (gs.gamePhase === 'gameover') {
        return { ...state, gameState: gs, screen: 'gameover', spyReveal: null, guessPhase: 'idle' };
      }
      // Auto-transition from lobby to board when host starts the game
      if (state.screen === 'lobby' && gs.gamePhase === 'playing') {
        return { ...state, gameState: gs, screen: 'board' };
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
      return { ...state, screen: 'hand', currentPlayer: player ?? null };
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
        const gsEnd = gs.pendingAction === null ? { ...gs, turnPhase: 'end' as const } : gs;
        return { ...state, gameState: gsEnd, spyReveal };
      }

      const gs = resolveAction(state.gameState);
      if (pending.action.type === 'ANONYMOUS_GUESS') {
        return { ...state, gameState: gs, isAnonymousGuess: true };
      }
      const gsEnd = gs.pendingAction === null ? { ...gs, turnPhase: 'end' as const } : gs;
      return { ...state, gameState: gsEnd };
    }

    case 'USE_SHUTDOWN': {
      if (!state.gameState) return state;
      const gs = useShutdown(state.gameState, action.playerId, action.shutdownInstanceId);
      return { ...state, gameState: gs };
    }

    case 'APPLY_DISCARD_CHOICE': {
      if (!state.gameState) return state;
      const gs = applyDiscardChoice(state.gameState, action.choice, action.clueInstanceId);
      const gsEnd = { ...gs, turnPhase: 'end' as const };
      const isCurrentPlayer = gsEnd.players[gsEnd.currentPlayerIndex].id === state.myPlayerId;
      return { ...state, gameState: gsEnd, screen: isCurrentPlayer ? state.screen : 'board' };
    }

    case 'KEEP_INVESTIGATE': {
      if (!state.gameState) return state;
      const gs = applyInvestigateKeep(state.gameState, action.clueInstanceId);
      return { ...state, gameState: { ...gs, turnPhase: 'end' } };
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

      // Manual mode: gs.hostJudgePending is set — Firebase syncs it to host device
      if (gs.hostJudgePending) {
        return { ...state, gameState: gs, isAnonymousGuess: false };
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
      if (!state.gameState?.hostJudgePending) return state;
      const pendingId = state.gameState.hostJudgePending;
      const gs = judgeAnswer(state.gameState, pendingId, action.isCorrect);

      if (action.isCorrect) {
        return { ...state, gameState: gs, screen: 'gameover' };
      }

      // gs.pendingPenalty is set by judgeAnswer when penalty is needed
      return { ...state, gameState: gs, guessPhase: 'idle' };
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
        hasRedrawnThisTurn: false,
      };
    }

    case 'REDRAW_ACTION': {
      if (!state.gameState || state.hasRedrawnThisTurn) return state;
      const gs = redrawAction(state.gameState, action.discardInstanceId);
      return { ...state, gameState: gs, hasRedrawnThisTurn: true };
    }

    case 'CLEAR_SPY_REVEAL':
      return { ...state, spyReveal: null };

    case 'CANCEL_ACTION': {
      if (!state.gameState) return state;
      const pending = state.gameState.pendingAction;
      if (!pending) return { ...state, screen: 'hand' };
      const updatedPlayers = state.gameState.players.map(p =>
        p.id === pending.actorId
          ? { ...p, actionHand: [...p.actionHand, pending.action] }
          : p
      );
      return {
        ...state,
        gameState: { ...state.gameState, pendingAction: null, players: updatedPlayers },
        screen: 'hand',
      };
    }

    default:
      return state;
  }
}
