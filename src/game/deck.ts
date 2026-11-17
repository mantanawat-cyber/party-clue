import { v4 as uuidv4 } from 'uuid';
import type {
  ActionInstance,
  ClueDefinition,
  ClueInstance,
  Question,
  QuestionSet,
} from '../models';
import { ACTION_DEFINITIONS } from '../data/actions';

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build a Clue deck from a question's clue definitions
export function buildClueDeck(question: Question): ClueInstance[] {
  return question.clues.map((def: ClueDefinition) => ({
    instanceId: uuidv4(),
    definitionId: def.id,
    questionId: question.id,
    content: def.content,
    status: def.type === 'locked' ? 'locked' : 'normal',
    ownerId: null,
  }));
}

// Build a full shuffled Action deck from definitions
export function buildActionDeck(): ActionInstance[] {
  const instances: ActionInstance[] = [];
  for (const def of ACTION_DEFINITIONS) {
    for (let i = 0; i < def.quantity; i++) {
      instances.push({
        instanceId: uuidv4(),
        definitionId: def.id,
        type: def.type,
        name: def.name,
        description: def.description,
        targetType: def.targetType,
      });
    }
  }
  return shuffle(instances);
}

// Draw from top of deck — returns [drawnCard, remainingDeck]
export function drawFromDeck<T>(deck: T[]): [T | null, T[]] {
  if (deck.length === 0) return [null, deck];
  const [top, ...rest] = deck;
  return [top, rest];
}

// Draw N cards from deck — returns [drawn[], remainingDeck]
export function drawMultiple<T>(deck: T[], n: number): [T[], T[]] {
  const drawn: T[] = [];
  let remaining = [...deck];
  for (let i = 0; i < n; i++) {
    const [card, rest] = drawFromDeck(remaining);
    if (!card) break;
    drawn.push(card);
    remaining = rest;
  }
  return [drawn, remaining];
}

// Put a card at the bottom of a deck
export function putUnderDeck<T>(deck: T[], card: T): T[] {
  return [...deck, card];
}

// Validate a loaded question set schema
export function validateQuestionSet(raw: unknown): QuestionSet {
  const data = raw as Record<string, unknown>;
  if (!data || typeof data !== 'object') throw new Error('Invalid question set: not an object');
  if (data.schemaVersion !== 1) throw new Error('Invalid question set: unsupported schemaVersion');
  if (!Array.isArray(data.questions) || data.questions.length === 0)
    throw new Error('Invalid question set: questions must be a non-empty array');

  for (const q of data.questions as Record<string, unknown>[]) {
    if (!q.id || !q.answer) throw new Error(`Question missing id or answer`);
    if (!Array.isArray(q.clues) || (q.clues as unknown[]).length === 0)
      throw new Error(`Question "${q.id}" has no clues`);
    for (const c of q.clues as Record<string, unknown>[]) {
      if (!c.id || !c.content || (c.type !== 'normal' && c.type !== 'locked'))
        throw new Error(`Clue in question "${q.id}" is missing id, content, or valid type`);
    }
    if (!Array.isArray(q.acceptedAnswers)) {
      (q as Record<string, unknown>).acceptedAnswers = [q.answer];
    }
  }

  return data as unknown as QuestionSet;
}

// Pick a random question from a set
export function pickRandomQuestion(set: QuestionSet): Question {
  const idx = Math.floor(Math.random() * set.questions.length);
  return set.questions[idx];
}
