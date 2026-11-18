import { useEffect, useState } from 'react';
import { useGame } from '../store/GameContext';
import { listenToLobby, writeGameState } from '../firebase/room';
import { setupGame } from '../game';
import { GothicScreen, GothicHeader, GothicPanel, GothicButton } from '../components/GothicLayout';

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
    <GothicScreen>
      <GothicHeader subtitle={state.isHost ? 'ห้องรอ — Host' : 'ห้องรอ'} />
      <GothicPanel>
        {/* Room Code */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.2em', color: 'rgba(200,180,140,0.6)', fontFamily: "'Cinzel', serif", marginBottom: 4 }}>
            ROOM CODE
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '0.3em', color: '#c0392b', fontFamily: "'Cinzel', serif", textShadow: '0 0 16px rgba(200,50,30,0.5)' }}>
            {state.roomCode}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(200,180,140,0.6)' }}>
            {state.isHost ? 'แชร์ Code นี้ให้เพื่อน' : 'รอให้ Host เริ่มเกม...'}
          </div>
        </div>

        {/* Player list */}
        <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', color: 'rgba(200,180,140,0.6)', fontFamily: "'Cinzel', serif", marginBottom: 8 }}>
          ผู้เล่น ({state.lobbyPlayers.length} คน)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {state.lobbyPlayers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 16, color: 'rgba(200,180,140,0.4)', fontSize: '0.85rem' }}>
              รอผู้เล่นเข้าร่วม...
            </div>
          ) : (
            state.lobbyPlayers.map(p => (
              <div key={p.id} style={{
                padding: '10px 14px', borderRadius: 6,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(120,80,40,0.3)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>{p.isHost ? '👑' : '👻'}</span>
                <span style={{ flex: 1, color: '#e8d5b0', fontSize: '0.95rem' }}>{p.name}</span>
                {p.id === state.myPlayerId && <span style={{ fontSize: '0.72rem', color: '#c0392b' }}>(คุณ)</span>}
                {p.isHost && <span style={{ fontSize: '0.72rem', color: 'rgba(200,180,140,0.5)' }}>Host</span>}
              </div>
            ))
          )}
        </div>

        {error && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(80,10,10,0.7)', borderRadius: 6, border: '1px solid rgba(180,40,40,0.5)' }}>
            <span style={{ fontSize: '0.85rem', color: '#ef4444' }}>❌ {error}</span>
          </div>
        )}

        {state.isHost && (
          <GothicButton variant="primary" fullWidth disabled={state.lobbyPlayers.length < 2 || starting} onClick={handleStart}>
            {starting ? 'กำลังเริ่ม...' : `💀 เริ่มเกม (${state.lobbyPlayers.length} คน)`}
          </GothicButton>
        )}

        <div style={{ marginTop: 8 }}>
          <GothicButton variant="ghost" fullWidth onClick={() => dispatch({ type: 'GO_HOME' })}>
            ← ออกจากห้อง
          </GothicButton>
        </div>
      </GothicPanel>
    </GothicScreen>
  );
}
