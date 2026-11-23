import { useState } from 'react';
import { useGame } from '../store/GameContext';
import { validateQuestionSet, pickRandomQuestion } from '../game';
import { reserveRoom, joinLobby, getOrCreatePlayerId } from '../firebase/room';
import { GothicScreen, GothicHeader, GothicPanel, GothicInput, GothicButton } from '../components/GothicLayout';
import animeData from '../data/sample-questions.json';
import homeData from '../data/home-questions.json';

const QUESTION_SETS = (() => {
  try {
    const anime = validateQuestionSet(animeData);
    const home = validateQuestionSet(homeData);
    const all = { ...anime, id: 'all', name: 'ทั้งหมด (สุ่มจากทุกชุด)', questions: [...anime.questions, ...home.questions] };
    return [
      { key: 'all',   label: '🎲 สุ่มทั้งหมด',         desc: `${all.questions.length} ข้อ`,    set: all },
      { key: 'anime', label: '🎌 ตัวละครอนิเมะ',        desc: `${anime.questions.length} ข้อ`, set: anime },
      { key: 'home',  label: '🏠 ของใช้ภายในบ้าน',      desc: `${home.questions.length} ข้อ`,  set: home },
    ];
  } catch { return []; }
})();

export default function SetupScreen() {
  const { state, dispatch } = useGame();
  const [name, setName] = useState(state.myName ?? '');
  const [selectedSet, setSelectedSet] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    const trimmedName = name.trim();
    if (!trimmedName) { setError('กรุณากรอกชื่อก่อน'); return; }
    const entry = QUESTION_SETS.find(s => s.key === selectedSet) ?? QUESTION_SETS[0];
    if (!entry) { setError('ไม่พบชุดคำถาม'); return; }
    const q = pickRandomQuestion(entry.set);
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
        {/* Name */}
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

        {/* Question set selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: 'rgba(200,180,140,0.8)', fontSize: '0.8rem', letterSpacing: '0.1em', marginBottom: 8, fontFamily: "'Cinzel', serif" }}>
            ชุดคำถาม
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {QUESTION_SETS.map(s => {
              const active = selectedSet === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setSelectedSet(s.key)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    fontFamily: "'Cinzel', serif",
                    background: active ? 'rgba(192,57,43,0.18)' : 'rgba(255,255,255,0.03)',
                    border: active ? '1px solid rgba(192,57,43,0.55)' : '1px solid rgba(120,80,40,0.3)',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  <span style={{ fontSize: '0.9rem', color: active ? '#e8d5b0' : 'rgba(200,180,140,0.7)', fontWeight: active ? 700 : 400 }}>
                    {s.label}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: active ? 'rgba(200,100,80,0.9)' : 'rgba(200,180,140,0.4)', letterSpacing: '0.05em' }}>
                    {s.desc}
                  </span>
                </button>
              );
            })}
          </div>
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
