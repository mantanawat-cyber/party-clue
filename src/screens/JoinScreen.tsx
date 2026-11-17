import { useState } from 'react';
import { useGame } from '../store/GameContext';
import { findRoomByCode, joinLobby, getOrCreatePlayerId } from '../firebase/room';

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
    <div className="screen-center">
      <div className="container" style={{ maxWidth: 400 }}>
        <div className="panel">
          <h2 style={{ marginBottom: 16 }}>🔑 เข้าร่วมห้อง</h2>

          <div className="field" style={{ marginBottom: 16 }}>
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

          <div className="field">
            <label>Room Code (4 ตัวเลข)</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="1234"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              style={{ fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.3em' }}
              autoFocus
            />
          </div>

          {error && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#450a0a', borderRadius: 8, border: '1px solid var(--danger)' }}>
              <span className="text-sm" style={{ color: '#ef4444' }}>❌ {error}</span>
            </div>
          )}

          <button
            className="btn btn--primary btn--lg btn--full"
            disabled={code.length !== 4 || loading}
            onClick={handleJoin}
          >
            {loading ? 'กำลังเชื่อมต่อ...' : 'เข้าร่วม →'}
          </button>

          <button
            className="btn btn--ghost btn--full"
            style={{ marginTop: 8 }}
            onClick={() => dispatch({ type: 'GO_HOME' })}
          >
            ← กลับ
          </button>
        </div>
      </div>
    </div>
  );
}
