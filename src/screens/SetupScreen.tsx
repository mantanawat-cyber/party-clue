import { useState } from 'react';
import { useGame } from '../store/GameContext';
import { validateQuestionSet, pickRandomQuestion } from '../game';
import { reserveRoom, joinLobby, getOrCreatePlayerId } from '../firebase/room';
import { GothicScreen, GothicHeader, GothicPanel, GothicInput, GothicButton } from '../components/GothicLayout';
import animeData from '../data/sample-questions.json';
import homeData from '../data/home-questions.json';

const questionSet = (() => {
  try {
    const anime = validateQuestionSet(animeData);
    const home = validateQuestionSet(homeData);
    return { ...anime, questions: [...anime.questions, ...home.questions] };
  } catch { return null; }
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
    <GothicScreen>
      <GothicHeader subtitle="สร้างห้อง" />
      <GothicPanel>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: 'rgba(200,180,140,0.8)', fontSize: '0.8rem', letterSpacing: '0.1em', marginBottom: 6, fontFamily: "'Cinzel', serif" }}>
            ชื่อของคุณ
          </label>
          <GothicInput
            type="text"
            placeholder="กรอกชื่อ..."
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={16}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            style={{ textAlign: 'center', fontSize: '1.1rem' }}
          />
        </div>

        {error && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(80,10,10,0.7)', borderRadius: 6, border: '1px solid rgba(180,40,40,0.5)' }}>
            <span style={{ fontSize: '0.85rem', color: '#ef4444' }}>❌ {error}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <GothicButton variant="ghost" onClick={() => dispatch({ type: 'GO_HOME' })}>
            ← กลับ
          </GothicButton>
          <div style={{ flex: 1 }}>
            <GothicButton variant="primary" fullWidth disabled={!name.trim() || loading} onClick={handleCreate}>
              {loading ? 'กำลังสร้างห้อง...' : '💀 สร้างห้อง'}
            </GothicButton>
          </div>
        </div>
      </GothicPanel>
    </GothicScreen>
  );
}
