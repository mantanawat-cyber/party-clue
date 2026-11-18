import { useGame } from '../store/GameContext';
import { GothicScreen, GothicHeader, GothicPanel, GothicButton } from '../components/GothicLayout';

export default function ClaimScreen() {
  const { state, dispatch } = useGame();
  const gs = state.gameState;
  if (!gs) return null;

  const claimed = gs.claimedPlayerIds ?? [];
  const available = gs.players.filter(p => !claimed.includes(p.id));

  return (
    <GothicScreen>
      <GothicHeader subtitle="เลือกตัวละคร" />
      <GothicPanel>
        {state.roomCode && (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.2em', color: 'rgba(200,180,140,0.6)', fontFamily: "'Cinzel', serif", marginBottom: 4 }}>
              ROOM CODE
            </div>
            <div style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '0.3em', color: '#c0392b', fontFamily: "'Cinzel', serif", textShadow: '0 0 16px rgba(200,50,30,0.5)' }}>
              {state.roomCode}
            </div>
          </div>
        )}

        <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', color: 'rgba(200,180,140,0.6)', fontFamily: "'Cinzel', serif", marginBottom: 8 }}>
          คุณคือใคร?
        </div>
        <p style={{ color: 'rgba(200,180,140,0.5)', fontSize: '0.85rem', margin: '0 0 16px' }}>เลือกชื่อของคุณ</p>

        {available.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'rgba(200,180,140,0.4)', fontSize: '0.85rem' }}>
            ทุกชื่อถูกเลือกแล้ว
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {available.map(p => (
              <GothicButton key={p.id} fullWidth onClick={() => dispatch({ type: 'CLAIM_PLAYER', playerId: p.id })}>
                👤 {p.name}
              </GothicButton>
            ))}
          </div>
        )}

        {claimed.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(120,80,40,0.3)' }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(200,180,140,0.5)', marginBottom: 6 }}>เข้าเกมแล้ว:</div>
            {gs.players.filter(p => claimed.includes(p.id)).map(p => (
              <div key={p.id} style={{ padding: '4px 0', fontSize: '0.9rem', color: '#5cb85c' }}>✓ {p.name}</div>
            ))}
          </div>
        )}
      </GothicPanel>
    </GothicScreen>
  );
}
