import { useState } from 'react';
import { useGame } from '../store/GameContext';
import { validateQuestionSet, pickRandomQuestion } from '../game';
import { reserveRoom, joinLobby, getOrCreatePlayerId } from '../firebase/room';
import sampleData from '../data/sample-questions.json';

const questionSet = (() => {
  try { return validateQuestionSet(sampleData); } catch { return null; }
})();

export default function SetupScreen() {
  const { state, dispatch } = useGame();
  const [name, setName] = useState(state.myName ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    const trimmedName = name.trim();
    if (!trimmedName) { setError('กรุณากรอกชื่อก่อน'); return; }
    const q = questionSet ? pickRandomQuestion(questionSet) : null;
    if (!q) { setError('ไม่พบโจทย์'); return; }

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
      <div className="container" style={{ maxWidth: 400 }}>
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
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              style={{ fontSize: '1.1rem', textAlign: 'center' }}
            />
          </div>

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
              disabled={!name.trim() || loading}
              onClick={handleCreate}
            >
              {loading ? 'กำลังสร้างห้อง...' : 'สร้างห้อง →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
