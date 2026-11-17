import { useState } from 'react';
import { useGame } from '../store/GameContext';
import { findRoomByCode, fetchGameState } from '../firebase/room';

export default function JoinScreen() {
  const { dispatch } = useGame();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    const trimmed = code.trim();
    if (trimmed.length !== 4) { setError('กรอก Code 4 ตัวเลข'); return; }
    setLoading(true);
    setError(null);
    try {
      const roomId = await findRoomByCode(trimmed);
      if (!roomId) { setError('ไม่พบห้องนี้'); setLoading(false); return; }
      const gs = await fetchGameState(roomId);
      if (!gs) { setError('ห้องยังไม่เริ่ม'); setLoading(false); return; }

      dispatch({ type: 'ROOM_CREATED', roomId, roomCode: trimmed });
      dispatch({ type: 'FIREBASE_SYNC', gameState: gs });
      dispatch({ type: 'GO_CLAIM' });
    } catch {
      setError('เกิดข้อผิดพลาด ลองใหม่');
    }
    setLoading(false);
  }

  return (
    <div className="screen-center">
      <div className="container" style={{ maxWidth: 400 }}>
        <div className="panel">
          <h2 style={{ marginBottom: 4 }}>🔑 เข้าร่วมห้อง</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 20 }}>ขอ Room Code จาก Host</p>

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
