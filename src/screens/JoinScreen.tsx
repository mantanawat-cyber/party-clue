import { useState } from 'react';
import { useGame } from '../store/GameContext';
import { findRoomByCode, joinLobby, getOrCreatePlayerId } from '../firebase/room';
import { GothicScreen, GothicHeader, GothicPanel, GothicInput, GothicButton } from '../components/GothicLayout';

export default function JoinScreen() {
  const { state, dispatch } = useGame();
  const [name, setName] = useState(state.myName ?? '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    const trimmedName = name.trim();
    if (!trimmedName) { setError('กรุณากรอกชื่อก่อน'); return; }
    const trimmed = code.trim();
    if (trimmed.length !== 4) { setError('กรอก Code 4 ตัวเลข'); return; }
    setLoading(true);
    setError(null);
    dispatch({ type: 'SET_MY_NAME', name: trimmedName });
    try {
      const roomId = await findRoomByCode(trimmed);
      if (!roomId) { setError('ไม่พบห้องนี้'); setLoading(false); return; }
      const playerId = getOrCreatePlayerId();
      await joinLobby(roomId, playerId, trimmedName, false);
      dispatch({ type: 'GO_LOBBY', roomId, roomCode: trimmed, playerId, isHost: false });
    } catch {
      setError('เกิดข้อผิดพลาด ลองใหม่');
    }
    setLoading(false);
  }

  return (
    <GothicScreen>
      <GothicHeader subtitle="เข้าร่วมห้อง" />
      <GothicPanel>
        <div style={{ marginBottom: 14 }}>
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
            style={{ textAlign: 'center', fontSize: '1.1rem' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: 'rgba(200,180,140,0.8)', fontSize: '0.8rem', letterSpacing: '0.1em', marginBottom: 6, fontFamily: "'Cinzel', serif" }}>
            Room Code
          </label>
          <GothicInput
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="1234"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            style={{ textAlign: 'center', fontSize: '1.8rem', letterSpacing: '0.4em' }}
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
            <GothicButton variant="primary" fullWidth disabled={code.length !== 4 || loading} onClick={handleJoin}>
              {loading ? 'กำลังเชื่อมต่อ...' : '🔑 เข้าร่วม'}
            </GothicButton>
          </div>
        </div>
      </GothicPanel>
    </GothicScreen>
  );
}
