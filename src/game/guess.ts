import type { GameState } from '../models';
import { normalizeAnswer, addLog, makeCluePublic } from './utils';

export type GuessResult = 'correct' | 'wrong' | 'no_clue_to_discard';

export function submitGuess(
  state: GameState,
  playerId: string,
  answer: string,
  isAnonymous: boolean = false
): { state: GameState; result: GuessResult } {
  if (!state.currentQuestion) return { state, result: 'wrong' };

  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { state, result: 'wrong' };

  const isCorrect = checkAnswer(state, answer);

  if (isCorrect) {
    const newState: GameState = {
      ...state,
      gamePhase: 'gameover',
      winner: playerId,
    };
    return {
      state: addLog(newState, `🎉 ${player.name} ตอบถูก! คำตอบคือ "${state.currentQuestion.answer}"`),
      result: 'correct',
    };
  }

  // Wrong answer
  let newState = addLog(state, `${player.name} ตอบผิด${isAnonymous ? ' (Anonymous Guess — ไม่โดนโทษ)' : ''}`);

  if (isAnonymous) {
    return { state: newState, result: 'wrong' };
  }

  // Wrong guess penalty: must reveal a clue — handled via UI (player selects which clue)
  // If no clues in hand, skip penalty
  if (player.clueHand.length === 0) {
    newState = addLog(newState, `${player.name}: ไม่มี Clue ในมือ ไม่ต้องลงโทษ`);
    return { state: newState, result: 'no_clue_to_discard' };
  }

  return { state: newState, result: 'wrong' };
}

// Apply wrong guess penalty: move selected clue to public
export function applyWrongGuessPenalty(
  state: GameState,
  playerId: string,
  clueInstanceId: string
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;

  const clue = player.clueHand.find((c) => c.instanceId === clueInstanceId);
  if (!clue) return state;

  const newState = makeCluePublic(state, clueInstanceId, playerId);
  return addLog(newState, `${player.name} เปิดเผย Clue: "${clue.content}" เป็น Public Clue`);
}

function checkAnswer(state: GameState, answer: string): boolean {
  if (!state.currentQuestion) return false;

  if (state.settings.answerMode === 'manual') {
    // Manual judge mode: return false, let host decide
    return false;
  }

  const normalized = normalizeAnswer(answer);
  return state.currentQuestion.acceptedAnswers.some(
    (a) => normalizeAnswer(a) === normalized
  );
}

// Used in manual judge mode: host confirms correct/wrong
export function judgeAnswer(state: GameState, playerId: string, isCorrect: boolean): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;

  if (isCorrect) {
    return addLog(
      { ...state, gamePhase: 'gameover', winner: playerId },
      `🎉 ${player.name} ตอบถูก (ยืนยันโดย host)!`
    );
  }

  return addLog(state, `${player.name} ตอบผิด (ยืนยันโดย host)`);
}
