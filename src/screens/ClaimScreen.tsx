import { useGame } from '../store/GameContext';

export default function ClaimScreen() {
  const { state, dispatch } = useGame();
  const gs = state.gameState;
  if (!gs) return null;

  const claimed = gs.claimedPlayerIds ?? [];
  const available = gs.players.filter(p => !claimed.includes(p.id));

  return (
    <div className="screen-center">
      <div className="container" style={{ maxWidth: 400 }}>
        <div className="panel">
          {state.roomCode && (
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div className="section-title">Room Code</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '0.2em', color: 'var(--action)' }}>
                {state.roomCode}
              </div>
              <div className="text-muted text-sm">
                {state.isHost ? 'แชร์ Code นี้ให้เพื่อนร่วมห้อง' : 'เข้าร่วมสำเร็จแล้ว'}
              </div>
            </div>
          )}

          <h2 style={{ marginBottom: 4 }}>คุณคือใคร?</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 16 }}>เลือกชื่อของคุณ</p>

          {available.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
              ทุกชื่อถูกเลือกแล้ว
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {available.map(p => (
                <button
                  key={p.id}
                  className="btn btn--ghost btn--full"
                  style={{ justifyContent: 'flex-start', fontSize: '1rem', padding: '14px 16px' }}
                  onClick={() => dispatch({ type: 'CLAIM_PLAYER', playerId: p.id })}
                >
                  👤 {p.name}
                </button>
              ))}
            </div>
          )}

          {claimed.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <div className="text-muted text-sm" style={{ marginBottom: 6 }}>เข้าเกมแล้ว:</div>
              {gs.players.filter(p => claimed.includes(p.id)).map(p => (
                <div key={p.id} className="text-sm" style={{ padding: '4px 0', color: 'var(--success)' }}>
                  ✓ {p.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
