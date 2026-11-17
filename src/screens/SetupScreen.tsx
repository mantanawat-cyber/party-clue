import { useState } from 'react';
import { useGame } from '../store/GameContext';
import { validateQuestionSet, pickRandomQuestion } from '../game';
import { reserveRoom, writeGameState } from '../firebase/room';
import type { QuestionSet, Question } from '../models';
import sampleData from '../data/sample-questions.json';

export default function SetupScreen() {
  const { dispatch } = useGame();
  const [playerCount, setPlayerCount] = useState(3);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '']);
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'names' | 'questions'>('names');
  const [loading, setLoading] = useState(false);

  function handleCountChange(n: number) {
    const count = Math.max(2, Math.min(8, n));
    setPlayerCount(count);
    setPlayerNames((prev) => {
      const next = [...prev];
      while (next.length < count) next.push('');
      return next.slice(0, count);
    });
  }

  function handleNameChange(i: number, v: string) {
    setPlayerNames((prev) => prev.map((n, idx) => (idx === i ? v : n)));
  }

  function handleLoadSample() {
    try {
      const qs = validateQuestionSet(sampleData);
      setQuestionSet(qs);
      setSelectedQuestion(null);
      setError(null);
      setMode('questions');
    } catch (e) {
      setError(String(e));
    }
  }

  function handleLoadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string);
        const qs = validateQuestionSet(raw);
        setQuestionSet(qs);
        setSelectedQuestion(null);
        setError(null);
        setMode('questions');
      } catch (err) {
        setError(`ไฟล์ไม่ถูกต้อง: ${err}`);
      }
    };
    reader.readAsText(file);
  }

  async function handleStart() {
    const names = playerNames.map((n, i) => n.trim() || `Player ${i + 1}`);
    const q = selectedQuestion ?? (questionSet ? pickRandomQuestion(questionSet) : null);
    if (!q) { setError('กรุณาโหลด Question Set ก่อน'); return; }

    setError(null);
    setLoading(true);
    try {
      // 1. Reserve room slot → get real roomId
      const { roomId, roomCode } = await reserveRoom();
      // 2. Build game state once with the real roomId
      const { setupGame } = await import('../game');
      const gs = setupGame(roomId, names, q);
      // 3. Write final state to Firebase
      await writeGameState(roomId, gs);
      // 4. Enter game (host still needs to claim a player)
      dispatch({ type: 'START_GAME', gameState: gs, roomId, roomCode });
    } catch {
      setError('สร้างห้องไม่ได้ ตรวจสอบการเชื่อมต่อ');
    }
    setLoading(false);
  }

  const namesOk = playerNames.length >= 2;
  const questionOk = !!questionSet;

  if (mode === 'questions' && questionSet) {
    return (
      <div className="screen-center">
        <div className="container" style={{ maxWidth: 480 }}>
          <div className="panel">
            <h2 style={{ marginBottom: 4 }}>เลือกโจทย์</h2>
            <p className="text-muted text-sm" style={{ marginBottom: 16 }}>{questionSet.name}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {questionSet.questions.map((q) => (
                <button
                  key={q.id}
                  className={`btn ${selectedQuestion?.id === q.id ? 'btn--success' : 'btn--ghost'} btn--full`}
                  onClick={() => setSelectedQuestion(q)}
                >
                  {selectedQuestion?.id === q.id ? '✓ ' : ''}{q.category ? `[${q.category}] ` : ''}โจทย์ {q.id}
                </button>
              ))}
            </div>
            <div className="btn-row">
              <button className="btn btn--ghost" onClick={() => setMode('names')}>← กลับ</button>
              <button
                className="btn btn--success btn--lg"
                style={{ flex: 1 }}
                disabled={loading}
                onClick={handleStart}
              >
                {loading ? 'กำลังสร้างห้อง...' : selectedQuestion ? 'สร้างห้อง!' : 'สุ่มโจทย์ + สร้างห้อง!'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-center">
      <div className="container" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="setup-title">🃏 Party Clue</div>
          <div className="setup-subtitle">Deduction + Take That Party Game</div>
        </div>

        <div className="panel">
          <h2 style={{ marginBottom: 16 }}>ตั้งค่าผู้เล่น</h2>

          <div className="field">
            <label>จำนวนผู้เล่น ({playerCount} คน)</label>
            <div className="btn-row" style={{ marginTop: 6 }}>
              {[2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  className={`btn ${playerCount === n ? 'btn--primary' : 'btn--ghost'}`}
                  style={{ minWidth: 42 }}
                  onClick={() => handleCountChange(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="player-inputs" style={{ marginBottom: 20 }}>
            {playerNames.map((name, i) => (
              <div className="player-input-row" key={i}>
                <span className="text-muted text-sm" style={{ width: 32 }}>P{i + 1}</span>
                <input
                  type="text"
                  placeholder={`Player ${i + 1}`}
                  value={name}
                  onChange={(e) => handleNameChange(i, e.target.value)}
                  maxLength={16}
                />
              </div>
            ))}
          </div>

          <div className="section-title">Question Set</div>
          <div className="btn-row" style={{ marginBottom: 12 }}>
            <button className="btn btn--ghost" onClick={handleLoadSample}>
              📋 ใช้ Sample
            </button>
            <label className="btn btn--ghost" style={{ cursor: 'pointer' }}>
              📁 โหลดไฟล์ JSON
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleLoadFile} />
            </label>
          </div>

          {questionSet && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--public-bg)', borderRadius: 8, border: '1px solid var(--public)' }}>
              <span className="text-sm">✅ โหลด: <strong>{questionSet.name}</strong> ({questionSet.questions.length} โจทย์)</span>
            </div>
          )}

          {error && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#450a0a', borderRadius: 8, border: '1px solid var(--danger)' }}>
              <span className="text-sm" style={{ color: '#ef4444' }}>❌ {error}</span>
            </div>
          )}

          <div className="btn-row">
            <button
              className="btn btn--ghost"
              onClick={() => dispatch({ type: 'GO_HOME' })}
            >
              ← กลับ
            </button>
            <button
              className="btn btn--success btn--lg"
              style={{ flex: 1 }}
              disabled={!namesOk || !questionOk}
              onClick={() => setMode('questions')}
            >
              ถัดไป →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
