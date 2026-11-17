import { useGame } from '../store/GameContext';

export default function GameOverScreen() {
  const { state } = useGame();
  const gs = state.gameState;
  if (!gs) return null;

  const winner = gs.players.find(p => p.id === gs.winner);

  return (
    <div className="screen-center" style={{ textAlign: 'center' }}>
      <div className="container" style={{ maxWidth: 480 }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🏆</div>
        <h1 style={{ marginBottom: 8 }}>{winner ? `${winner.name} ชนะ!` : 'จบเกม'}</h1>
        {gs.currentQuestion && (
          <div className="panel" style={{ marginBottom: 24 }}>
            <div className="section-title">คำตอบที่ถูกต้อง</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>
              {gs.currentQuestion.answer}
            </div>
          </div>
        )}

        {/* Final public clues */}
        {gs.publicClues.length > 0 && (
          <div className="panel" style={{ marginBottom: 24, textAlign: 'left' }}>
            <div className="section-title">Public Clues ทั้งหมด</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {gs.publicClues.map(c => (
                <div key={c.instanceId} className="card card--public">
                  <div className="card__content">{c.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Log summary */}
        <div className="panel" style={{ marginBottom: 24, textAlign: 'left' }}>
          <div className="section-title">สรุปเกม</div>
          <div className="log">
            {[...gs.log].reverse().slice(0, 20).map((entry, i) => (
              <div key={i} className="log-entry">{entry.message}</div>
            ))}
          </div>
        </div>

        <button
          className="btn btn--primary btn--lg btn--full"
          onClick={() => window.location.reload()}
        >
          เล่นใหม่
        </button>
      </div>
    </div>
  );
}
