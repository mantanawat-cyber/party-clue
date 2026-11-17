import { useEffect, useState } from 'react';
import { useGame } from '../store/GameContext';
import { listenToLobby, writeGameState } from '../firebase/room';
import { setupGame } from '../game';

export default function LobbyScreen() {
  const { state, dispatch } = useGame();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state.roomId) return;
    const unsub = listenToLobby(state.roomId, (players) => {
      dispatch({ type: 'LOBBY_SYNC', players });
    });
    return unsub;
  }, [state.roomId]);

  async function handleStart() {
    if (!state.selectedQuestion || !state.roomId) return;
    if (state.lobbyPlayers.length < 2) { setError('ต้องมีอย่างน้อย 2 คน'); return; }

    setStarting(true);
    setError(null);
    try {
      const gs = setupGame(state.roomId, state.lobbyPlayers, state.selectedQuestion);
      await writeGameState(state.roomId, gs);
      // All devices will auto-transition via FIREBASE_SYNC
    } catch {
      setError('เริ่มเกมไม่ได้ ลองใหม่');
      setStarting(false);
    }
  }

  return (
    <div className="screen-center">
      <div className="container" style={{ maxWidth: 400 }}>
        <div className="panel">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="section-title">Room Code</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '0.2em', color: 'var(--action)' }}>
              {state.roomCode}
            </div>
            <div className="text-muted text-sm">
              {state.isHost ? 'แชร์ Code นี้ให้เพื่อนร่วมห้อง' : 'รอให้ Host เริ่มเกม...'}
            </div>
          </div>

          <div className="section-title" style={{ marginBottom: 8 }}>
            ผู้เล่นในห้อง ({state.lobbyPlayers.length} คน)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {state.lobbyPlayers.length === 0 ? (
              <div className="text-muted text-sm" style={{ textAlign: 'center', padding: 16 }}>
                รอผู้เล่นเข้าร่วม...
              </div>
            ) : (
              state.lobbyPlayers.map(p => (
                <div
                  key={p.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: 'var(--panel-alt, rgba(255,255,255,0.05))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>{p.isHost ? '👑' : '👤'}</span>
                  <span style={{ flex: 1 }}>{p.name}</span>
                  {p.id === state.myPlayerId && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--action)' }}>(คุณ)</span>
                  )}
                  {p.isHost && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Host</span>
                  )}
                </div>
              ))
            )}
          </div>

          {error && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#450a0a', borderRadius: 8, border: '1px solid var(--danger)' }}>
              <span className="text-sm" style={{ color: '#ef4444' }}>❌ {error}</span>
            </div>
          )}

          {state.isHost && (
            <button
              className="btn btn--success btn--lg btn--full"
              disabled={state.lobbyPlayers.length < 2 || starting}
              onClick={handleStart}
            >
              {starting ? 'กำลังเริ่ม...' : `เริ่มเกม (${state.lobbyPlayers.length} คน) →`}
            </button>
          )}

          <button
            className="btn btn--ghost btn--full"
            style={{ marginTop: 8 }}
            onClick={() => dispatch({ type: 'GO_HOME' })}
          >
            ← ออกจากห้อง
          </button>
        </div>
      </div>
    </div>
  );
}
