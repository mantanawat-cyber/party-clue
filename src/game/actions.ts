import type { GameState, PendingAction, ActionInstance, ClueInstance } from '../models';
import { addLog, updatePlayer, transferClue, makeCluePublic } from './utils';
import { drawMultiple, putUnderDeck } from './deck';

// ─── Start Action ───────────────────────────────────────────────────────────
// Called when a player selects an Action card from their hand.
// Returns updated state with pendingAction set (awaiting target/selection).

export function startAction(
  state: GameState,
  actorId: string,
  actionInstanceId: string
): GameState {
  const actor = state.players.find((p) => p.id === actorId);
  if (!actor) return state;

  const action = actor.actionHand.find((a) => a.instanceId === actionInstanceId);
  if (!action) return state;

  // Remove from hand immediately (returned if Shutdown)
  const stateWithoutCard = updatePlayer(state, actorId, (p) => ({
    ...p,
    actionHand: p.actionHand.filter((a) => a.instanceId !== actionInstanceId),
  }));

  const pending: PendingAction = {
    action,
    actorId,
    step: getInitialStep(action),
  };

  return addLog(
    { ...stateWithoutCard, pendingAction: pending },
    `${actor.name} เล่น ${action.name}`
  );
}

function getInitialStep(action: ActionInstance): PendingAction['step'] {
  switch (action.type) {
    case 'SPY':
    case 'DISCARD':
    case 'BLACKOUT':
    case 'SWAP':
    case 'STEAL':
      return 'awaiting_target';
    case 'DECODE':
    case 'ENCODE':
      return 'awaiting_clue_selection';
    case 'INVESTIGATE':
      return 'awaiting_shutdown'; // goes to investigate draw after shutdown window
    case 'ANONYMOUS_GUESS':
      return 'awaiting_shutdown';
    default:
      return 'awaiting_shutdown';
  }
}

// ─── Shutdown ───────────────────────────────────────────────────────────────

export function useShutdown(state: GameState, playerId: string, shutdownInstanceId: string): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || !state.pendingAction) return state;

  // Cannot shutdown a Shutdown
  if (state.pendingAction.action.type === 'SHUTDOWN') return state;

  const shutdown = player.actionHand.find((a) => a.instanceId === shutdownInstanceId);
  if (!shutdown) return state;

  // Remove shutdown from hand, discard both cards
  const stateWithoutShutdown = updatePlayer(state, playerId, (p) => ({
    ...p,
    actionHand: p.actionHand.filter((a) => a.instanceId !== shutdownInstanceId),
  }));

  // Return the original action card to discard (it was already removed from actor's hand)
  const newState: GameState = {
    ...stateWithoutShutdown,
    pendingAction: null,
    actionDiscard: [
      ...stateWithoutShutdown.actionDiscard,
      state.pendingAction.action,
      shutdown,
    ],
    lastShutdown: {
      byPlayerId: playerId,
      cancelledActorId: state.pendingAction.actorId,
      actionName: state.pendingAction.action.name,
    },
  };

  return addLog(newState, `${player.name} ใช้ Shutdown! ยกเลิก ${state.pendingAction.action.name}`);
}

// ─── Set Target ─────────────────────────────────────────────────────────────

export function setActionTarget(state: GameState, targetId: string): GameState {
  if (!state.pendingAction) return state;

  const pending: PendingAction = { ...state.pendingAction, targetId };

  // After target is set, determine next step
  let nextStep = pending.step;
  switch (pending.action.type) {
    case 'SPY':
    case 'STEAL':
      nextStep = 'awaiting_clue_selection'; // actor picks from target's hand
      break;
    case 'DISCARD':
      nextStep = 'awaiting_shutdown';
      break;
    case 'BLACKOUT':
      nextStep = 'awaiting_shutdown';
      break;
    case 'SWAP':
      nextStep = 'awaiting_clue_selection'; // actor picks their own clue first
      break;
  }

  return { ...state, pendingAction: { ...pending, step: nextStep } };
}

// ─── Set Clue Selection ─────────────────────────────────────────────────────

export function setSelectedClue(state: GameState, clueInstanceId: string): GameState {
  if (!state.pendingAction) return state;
  const pending = state.pendingAction;

  if (pending.action.type === 'SWAP' && !pending.selectedClueInstanceId) {
    // First pick = actor's own clue; now need target's clue
    return {
      ...state,
      pendingAction: {
        ...pending,
        selectedClueInstanceId: clueInstanceId,
        step: 'awaiting_clue_selection', // still selecting — now target picks
      },
    };
  }

  if (pending.action.type === 'SWAP' && pending.selectedClueInstanceId) {
    // Second pick = target's clue → ready to resolve
    return {
      ...state,
      pendingAction: {
        ...pending,
        selectedTargetClueInstanceId: clueInstanceId,
        step: 'awaiting_shutdown',
      },
    };
  }

  return {
    ...state,
    pendingAction: { ...pending, selectedClueInstanceId: clueInstanceId, step: 'awaiting_shutdown' },
  };
}

// ─── Resolve Action ─────────────────────────────────────────────────────────

export function resolveAction(state: GameState): GameState {
  const pending = state.pendingAction;
  if (!pending) return state;

  let newState: GameState = { ...state, pendingAction: null };
  newState = { ...newState, actionDiscard: [...newState.actionDiscard, pending.action] };

  switch (pending.action.type) {
    case 'SPY':          return resolveSpy(newState, pending);
    case 'DECODE':       return resolveDecode(newState, pending);
    case 'ENCODE':       return resolveEncode(newState, pending);
    case 'SWAP':         return resolveSwap(newState, pending);
    case 'STEAL':        return resolveSteal(newState, pending);
    case 'DISCARD':      return resolveDiscard(newState, pending);
    case 'BLACKOUT':     return resolveBlackout(newState, pending);
    case 'ANONYMOUS_GUESS': return resolveAnonymousGuess(newState, pending);
    case 'INVESTIGATE':  return resolveInvestigate(newState, pending);
    default:             return newState;
  }
}

// ─── Individual resolvers ───────────────────────────────────────────────────

function resolveSpy(state: GameState, pending: PendingAction): GameState {
  const actor = state.players.find((p) => p.id === pending.actorId);
  const target = state.players.find((p) => p.id === pending.targetId);
  const clueId = pending.selectedClueInstanceId;
  if (!actor || !target || !clueId) return state;

  const clue = target.clueHand.find((c) => c.instanceId === clueId && c.status === 'normal');
  if (!clue) return addLog(state, `Spy ล้มเหลว: ไม่พบ Normal Clue ที่เลือก`);

  return addLog({ ...state, spyResult: clue.content }, `🔍 ${actor.name} สอดแนม ${target.name}`);
}

function resolveDecode(state: GameState, pending: PendingAction): GameState {
  const actor = state.players.find((p) => p.id === pending.actorId);
  const clueId = pending.selectedClueInstanceId;
  if (!actor || !clueId) return state;

  const newState = updatePlayer(state, pending.actorId, (p) => ({
    ...p,
    clueHand: p.clueHand.map((c) =>
      c.instanceId === clueId && c.status === 'locked' ? { ...c, status: 'normal' } : c
    ),
  }));

  return addLog(newState, `🔓 ${actor.name} ปลดล็อก Clue 1 ใบ`);
}

function resolveEncode(state: GameState, pending: PendingAction): GameState {
  const actor = state.players.find((p) => p.id === pending.actorId);
  const clueId = pending.selectedClueInstanceId;
  if (!actor || !clueId) return state;

  const clue = actor.clueHand.find((c) => c.instanceId === clueId);
  if (!clue || clue.status !== 'normal') return addLog(state, `Encode ล้มเหลว: ต้องเลือก Normal Clue`);

  const newState = updatePlayer(state, pending.actorId, (p) => ({
    ...p,
    clueHand: p.clueHand.map((c) =>
      c.instanceId === clueId ? { ...c, status: 'locked' } : c
    ),
  }));

  return addLog(newState, `🔒 ${actor.name} Encode Clue`);
}

function resolveSwap(state: GameState, pending: PendingAction): GameState {
  const actor = state.players.find((p) => p.id === pending.actorId);
  const target = state.players.find((p) => p.id === pending.targetId);
  const actorClueId = pending.selectedClueInstanceId;
  const targetClueId = pending.selectedTargetClueInstanceId;
  if (!actor || !target || !actorClueId || !targetClueId) return state;

  // Public Clue check
  const actorClue = actor.clueHand.find((c) => c.instanceId === actorClueId);
  const targetClue = target.clueHand.find((c) => c.instanceId === targetClueId);
  if (!actorClue || !targetClue) return addLog(state, `Swap ล้มเหลว: ไม่พบการ์ด`);
  if (actorClue.status === 'public' || targetClue.status === 'public')
    return addLog(state, `Swap ล้มเหลว: ไม่สามารถ Swap Public Clue ได้`);

  let s = transferClue(state, actorClueId, pending.actorId, pending.targetId!);
  s = transferClue(s, targetClueId, pending.targetId!, pending.actorId);
  return addLog(s, `🔄 ${actor.name} Swap Clue กับ ${target.name}`);
}

function resolveSteal(state: GameState, pending: PendingAction): GameState {
  const actor = state.players.find((p) => p.id === pending.actorId);
  const target = state.players.find((p) => p.id === pending.targetId);
  const clueId = pending.selectedClueInstanceId;
  if (!actor || !target || !clueId) return state;

  const clue = target.clueHand.find((c) => c.instanceId === clueId);
  if (!clue) return addLog(state, `Steal ล้มเหลว: ไม่พบ Clue ที่เลือก`);

  let s = updatePlayer(state, target.id, (p) => ({
    ...p,
    clueHand: p.clueHand.filter((c) => c.instanceId !== clueId),
  }));
  s = updatePlayer(s, actor.id, (p) => ({
    ...p,
    clueHand: [...p.clueHand, { ...clue, ownerId: actor.id }],
  }));

  return addLog(s, `🫳 ${actor.name} Steal Clue จาก ${target.name}`);
}

function resolveDiscard(state: GameState, pending: PendingAction): GameState {
  // This action requires the target to choose (clue or actions)
  // The actual resolution happens in applyDiscardChoice
  const actor = state.players.find((p) => p.id === pending.actorId);
  const target = state.players.find((p) => p.id === pending.targetId);
  if (!actor || !target) return state;
  return addLog(
    { ...state, pendingAction: { ...pending, step: 'awaiting_discard_choice' } },
    `${actor.name} ใช้ Discard กับ ${target.name} — รอ ${target.name} เลือก`
  );
}

export function applyDiscardChoice(
  state: GameState,
  choice: 'clue' | 'actions',
  clueInstanceId?: string
): GameState {
  const pending = state.pendingAction;
  if (!pending || !pending.targetId) return state;

  const target = state.players.find((p) => p.id === pending.targetId);
  if (!target) return state;

  let newState: GameState = {
    ...state,
    pendingAction: null,
  };

  if (choice === 'clue') {
    if (!clueInstanceId) return newState;
    newState = makeCluePublic(newState, clueInstanceId, pending.targetId);
    const clue = target.clueHand.find((c) => c.instanceId === clueInstanceId);
    return addLog(newState, `${target.name} เปิดเผย Clue: "${clue?.content ?? ''}" เป็น Public`);
  }

  // Discard actions
  const toDiscard = target.actionHand.slice(0, 3);
  newState = updatePlayer(newState, pending.targetId, (p) => ({
    ...p,
    actionHand: p.actionHand.slice(toDiscard.length),
  }));
  newState = { ...newState, actionDiscard: [...newState.actionDiscard, ...toDiscard] };
  return addLog(newState, `${target.name} ทิ้ง Action ${toDiscard.length} ใบ`);
}

function resolveBlackout(state: GameState, pending: PendingAction): GameState {
  const actor = state.players.find((p) => p.id === pending.actorId);
  const target = state.players.find((p) => p.id === pending.targetId);
  if (!actor || !target) return state;

  // Don't stack blackout
  if (target.isBlackedOut) return addLog(state, `Blackout ล้มเหลว: ${target.name} ถูก Blackout อยู่แล้ว`);

  const newState = updatePlayer(state, pending.targetId!, (p) => ({ ...p, isBlackedOut: true }));
  return addLog(newState, `⚡ ${actor.name} Blackout ${target.name} — ข้าม Main Phase เทิร์นหน้า`);
}

function resolveAnonymousGuess(state: GameState, pending: PendingAction): GameState {
  const actor = state.players.find((p) => p.id === pending.actorId);
  if (!actor) return state;
  // Set flag for this turn so guess knows it's anonymous — handled via UI state
  return addLog(state, `🎭 ${actor.name} ใช้ Anonymous Guess`);
}

function resolveInvestigate(state: GameState, pending: PendingAction): GameState {
  const actor = state.players.find((p) => p.id === pending.actorId);
  if (!actor) return state;

  const count = Math.min(2, state.clueDeck.length);
  if (count === 0) return addLog(state, `Investigate: Clue Deck หมด`);

  const [drawn, remainingDeck] = drawMultiple(state.clueDeck, count);

  return addLog(
    {
      ...state,
      clueDeck: remainingDeck,
      pendingAction: { ...pending, drawnClues: drawn, step: 'awaiting_investigate_keep' },
    },
    `${actor.name} Investigate: จั่ว ${drawn.length} ใบ — รอเลือกเก็บ`
  );
}

export function applyInvestigateKeep(state: GameState, keepInstanceId: string): GameState {
  const pending = state.pendingAction;
  if (!pending?.drawnClues) return state;

  const actor = state.players.find((p) => p.id === pending.actorId);
  if (!actor) return state;

  const kept = pending.drawnClues.find((c) => c.instanceId === keepInstanceId);
  const discard = pending.drawnClues.filter((c) => c.instanceId !== keepInstanceId);

  if (!kept) return state;

  const keptClue: ClueInstance = { ...kept, ownerId: pending.actorId };
  let newState: GameState = {
    ...state,
    pendingAction: null,
  };

  // Add kept to player's hand
  newState = updatePlayer(newState, pending.actorId, (p) => ({
    ...p,
    clueHand: [...p.clueHand, keptClue],
  }));

  // Put the other back under deck
  for (const c of discard) {
    newState = { ...newState, clueDeck: putUnderDeck(newState.clueDeck, c) };
  }

  return addLog(newState, `${actor.name} Investigate เก็บ Clue 1 ใบ`);
}

// Set shuffle picks (called per player as they submit their pick)
