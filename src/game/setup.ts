import { v4 as uuidv4 } from 'uuid';
import type { GameState, Player, Question, GameSettings } from '../models';
import { buildActionDeck, buildClueDeck, drawFromDeck, drawMultiple, shuffle } from './deck';

const DEFAULT_SETTINGS: GameSettings = {
  allowActionRedraw: true,
  answerMode: 'normalized',
  shutdownWindowMs: 5000,
  maxPlayers: 8,
};

export function createPlayers(players: { id?: string; name: string }[]): Player[] {
  return players.map(({ id, name }) => ({
    id: id ?? uuidv4(),
    name,
    clueHand: [],
    actionHand: [],
    isBlackedOut: false,
  }));
}

export function setupGame(
  roomId: string,
  playerDefs: { id?: string; name: string }[],
  question: Question,
  settings: Partial<GameSettings> = {}
): GameState {
  const players = createPlayers(playerDefs);
  let clueDeck = shuffle(buildClueDeck(question));
  let actionDeck = buildActionDeck();

  // Deal starting hands: Normal 1 + Locked 1 + Action 5 per player
  for (const player of players) {
    // Draw 1 normal clue
    const normalClue = clueDeck.find((c) => c.status === 'normal');
    if (normalClue) {
      clueDeck = clueDeck.filter((c) => c.instanceId !== normalClue.instanceId);
      player.clueHand.push({ ...normalClue, ownerId: player.id });
    }

    // Draw 1 locked clue
    const lockedClue = clueDeck.find((c) => c.status === 'locked');
    if (lockedClue) {
      clueDeck = clueDeck.filter((c) => c.instanceId !== lockedClue.instanceId);
      player.clueHand.push({ ...lockedClue, ownerId: player.id });
    }

    // Draw 3 actions
    const [actions, remainingActions] = drawMultiple(actionDeck, 1);
    player.actionHand = actions;
    actionDeck = remainingActions;
  }

  // Open 1 public clue
  const [firstPublic, remainingClues] = drawFromDeck(clueDeck);
  const publicClues = firstPublic ? [{ ...firstPublic, status: 'public' as const, ownerId: null }] : [];

  // Build drawOrder: 1 clue per 4 actions
  const totalDraws = actionDeck.length + Math.floor(remainingClues.length * 0.25);
  const clueSlots = Math.floor(totalDraws / 5);
  const rawOrder: ('action' | 'clue')[] = [
    ...Array(totalDraws - clueSlots).fill('action'),
    ...Array(clueSlots).fill('clue'),
  ];
  const drawOrder = shuffle(rawOrder);

  // Pick random starting player
  const startIndex = Math.floor(Math.random() * players.length);

  return {
    roomId,
    gamePhase: 'playing',
    claimedPlayerIds: [],
    players,
    currentPlayerIndex: startIndex,
    turnPhase: 'draw',
    turnNumber: 1,
    clueDeck: remainingClues,
    actionDeck,
    drawOrder,
    actionDiscard: [],
    publicClues,
    currentQuestion: question,
    winner: null,
    pendingAction: null,
    spyResult: null,
    lastShutdown: null,
    hostJudgePending: null,
    pendingGuessIsAnonymous: false,
    pendingPenalty: null,
    log: [{ timestamp: Date.now(), message: 'เกมเริ่มต้นแล้ว' }],
    settings: { ...DEFAULT_SETTINGS, ...settings },
  };
}
