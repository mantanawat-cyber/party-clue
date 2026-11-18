import { useGame } from '../store/GameContext';
import { GothicScreen, GothicHeader, GothicPanel, GothicButton } from '../components/GothicLayout';

export default function GameOverScreen() {
  const { state } = useGame();
  const gs = state.gameState;
  if (!gs) return null;

  const winner = gs.players.find(p => p.id === gs.winner);

  return (
    <GothicScreen>
      <GothicHeader subtitle={winner ? `${winner.name} ชนะ!` : 'จบเกม'} />
      <GothicPanel>
        <div style={{ textAlign: 'center', fontSize: '3rem', marginBottom: 12 }}>🏆</div>

        {gs.currentQuestion && (
          <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(0,60,0,0.2)', border: '1px solid rgba(80,160,80,0.4)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.15em', color: 'rgba(200,180,140,0.6)', fontFamily: "'Cinzel', serif", marginBottom: 6 }}>
              คำตอบที่ถูกต้อง
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#5cb85c' }}>
              {gs.currentQuestion.answer}
            </div>
          </div>
        )}

        {gs.publicClues.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.15em', color: 'rgba(200,180,140,0.6)', fontFamily: "'Cinzel', serif", marginBottom: 8 }}>
              Public Clues ทั้งหมด
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {gs.publicClues.map(c => (
                <div key={c.instanceId} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(120,80,40,0.3)', borderRadius: 6 }}>
                  <span style={{ color: '#e8d5b0', fontSize: '0.9rem' }}>{c.content}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.15em', color: 'rgba(200,180,140,0.6)', fontFamily: "'Cinzel', serif", marginBottom: 8 }}>
            สรุปเกม
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[...gs.log].reverse().slice(0, 20).map((entry, i) => (
              <div key={i} style={{ fontSize: '0.8rem', color: 'rgba(200,180,140,0.55)', padding: '4px 0', borderBottom: '1px solid rgba(120,80,40,0.1)' }}>
                {entry.message}
              </div>
            ))}
          </div>
        </div>

        <GothicButton variant="primary" fullWidth onClick={() => window.location.reload()}>
          🎮 เล่นใหม่
        </GothicButton>
      </GothicPanel>
    </GothicScreen>
  );
}
