import { useState } from 'react';
import { useGame } from '../store/GameContext';
import { validateQuestionSet, pickRandomQuestion } from '../game';
import { reserveRoom, joinLobby, getOrCreatePlayerId } from '../firebase/room';
import type { QuestionSet, Question } from '../models';
import sampleData from '../data/sample-questions.json';

export default function SetupScreen() {
  const { state, dispatch } = useGame();
  const [name, setName] = useState(state.myName ?? '');
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleLoadSample() {
    try {
      const qs = validateQuestionSet(sampleData);
      setQuestionSet(qs);
      setSelectedQuestion(null);
      setError(null);
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
      } catch (err) {
        setError(`ไฟล์ไม่ถูกต้อง: ${err}`);
      }
    };
    reader.readAsText(file);
  }

  async function handleCreate() {
    const trimmedName = name.trim();
    if (!trimmedName) { setError('กรุณากรอกชื่อก่อน'); return; }
    const q = selectedQuestion ?? (questionSet ? pickRandomQuestion(questionSet) : null);
    if (!q) { setError('กรุณาโหลด Question Set ก่อน'); return; }

    dispatch({ type: 'SET_MY_NAME', name: trimmedName });
    setError(null);
    setLoading(true);
    try {
      const { roomId, roomCode } = await reserveRoom();
      const playerId = getOrCreatePlayerId();
      await joinLobby(roomId, playerId, trimmedName, true);
      dispatch({ type: 'GO_LOBBY', roomId, roomCode, playerId, isHost: true, question: q });
    } catch {
      setError('สร้างห้องไม่ได้ ตรวจสอบการเชื่อมต่อ');
    }
    setLoading(false);
  }

  return (
    <div className="screen-center">
      <div className="container" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="setup-title">🃏 Party Clue</div>
          <div className="setup-subtitle">สร้างห้อง</div>
        </div>

        <div className="panel">
          <div className="field" style={{ marginBottom: 20 }}>
            <label>ชื่อของคุณ</label>
            <input
              type="text"
              placeholder="กรอกชื่อ..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={16}
              autoFocus
              style={{ fontSize: '1.1rem', textAlign: 'center' }}
            />
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
            <>
              <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--public-bg)', borderRadius: 8, border: '1px solid var(--public)' }}>
                <span className="text-sm">✅ โหลด: <strong>{questionSet.name}</strong> ({questionSet.questions.length} โจทย์)</span>
              </div>
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
            </>
          )}

          {error && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#450a0a', borderRadius: 8, border: '1px solid var(--danger)' }}>
              <span className="text-sm" style={{ color: '#ef4444' }}>❌ {error}</span>
            </div>
          )}

          <div className="btn-row">
            <button className="btn btn--ghost" onClick={() => dispatch({ type: 'GO_HOME' })}>
              ← กลับ
            </button>
            <button
              className="btn btn--success btn--lg"
              style={{ flex: 1 }}
              disabled={!questionSet || loading}
              onClick={handleCreate}
            >
              {loading ? 'กำลังสร้างห้อง...' : selectedQuestion ? 'สร้างห้อง!' : 'สุ่มโจทย์ + สร้างห้อง!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
