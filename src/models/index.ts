// ─── Clue ──────────────────────────────────────────────────────────────────

export type ClueStatus = 'normal' | 'locked' | 'public';

export interface ClueDefinition {
  id: string;
  type: 'normal' | 'locked'; // initial state from JSON
  content: string;
}

export interface ClueInstance {
  instanceId: string;
  definitionId: string;
  questionId: string;
  content: string;
  status: ClueStatus;
  ownerId: string | null; // null = in deck or public area
}

// ─── Action ────────────────────────────────────────────────────────────────

export type ActionType =
  | 'SPY'
  | 'DECODE'
  | 'ENCODE'
  | 'SWAP'
  | 'SHUFFLE'
  | 'SHUTDOWN'
  | 'DISCARD'
  | 'BLACKOUT'
  | 'ANONYMOUS_GUESS'
  | 'INVESTIGATE';

export type TargetType = 'self' | 'one_opponent' | 'all_players' | 'reaction';

export interface ActionDefinition {
  id: string;
  type: ActionType;
  name: string;
  description: string;
  targetType: TargetType;
  quantity: number;
}

export interface ActionInstance {
  instanceId: string;
  definitionId: string;
  type: ActionType;
  name: string;
  description: string;
  targetType: TargetType;
}

// ─── Question ──────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  answer: string;
  acceptedAnswers: string[];
  category?: string;
  clues: ClueDefinition[];
}

export interface QuestionSet {
  schemaVersion: number;
  id: string;
  name: string;
  questions: Question[];
}

// ─── Player ────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  clueHand: ClueInstance[];
  actionHand: ActionInstance[];
  isBlackedOut: boolean;
}

// ─── Pending Action (waiting for target selection / shutdown window) ───────

export type PendingActionStep =
  | 'awaiting_target'
  | 'awaiting_clue_selection'
  | 'awaiting_shutdown'
  | 'awaiting_shuffle_picks'
  | 'awaiting_discard_choice' // target chooses: clue or actions
  | 'awaiting_investigate_keep'; // player picks 1 of 2 drawn clues

export interface PendingAction {
  action: ActionInstance;
  actorId: string;
  targetId?: string;
  selectedClueInstanceId?: string;
  selectedTargetClueInstanceId?: string;
  step: PendingActionStep;
  drawnClues?: ClueInstance[]; // for Investigate
  shufflePicks?: Record<string, string>; // playerId → clueInstanceId
}

// ─── Log ───────────────────────────────────────────────────────────────────

export interface LogEntry {
  timestamp: number;
  message: string;
}

// ─── Turn ──────────────────────────────────────────────────────────────────

export type TurnPhase = 'draw' | 'main' | 'end';

// ─── Game State ────────────────────────────────────────────────────────────

export type GamePhase = 'lobby' | 'playing' | 'gameover';

export interface GameState {
  roomId: string;
  gamePhase: GamePhase;
  players: Player[];
  claimedPlayerIds: string[];
  currentPlayerIndex: number;
  turnPhase: TurnPhase;
  turnNumber: number;
  clueDeck: ClueInstance[];
  actionDeck: ActionInstance[];
  actionDiscard: ActionInstance[];
  publicClues: ClueInstance[];
  currentQuestion: Question | null;
  winner: string | null; // playerId
  pendingAction: PendingAction | null;
  log: LogEntry[];
  settings: GameSettings;
}

export interface GameSettings {
  allowActionRedraw: boolean;   // discard 1 action to draw 1 (optional rule)
  answerMode: 'normalized' | 'manual'; // normalized = auto match, manual = host judges
  shutdownWindowMs: number;     // ms to wait for shutdown (default 5000)
  maxPlayers: number;
}

// ─── Room (Firebase top-level) ─────────────────────────────────────────────

export interface RoomMeta {
  roomId: string;
  hostId: string;
  createdAt: number;
  status: 'waiting' | 'playing' | 'finished';
  playerIds: string[];
}
