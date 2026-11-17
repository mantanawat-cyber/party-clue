import { useGame } from '../store/GameContext';

export default function ClaimScreen() {
  const { state, dispatch } = useGame();
  const gs = state.gameState;
  if (!gs) return null;

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
              <div className="text-muted text-sm">แชร์ Code นี้ให้เพื่อนร่วมห้อง</div>
            </div>
          )}

          <h2 style={{ marginBottom: 4 }}>คุณคือใคร?</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 16 }}>เลือกชื่อของคุณ</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {gs.players.map(p => (
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
        </div>
      </div>
    </div>
  );
}
