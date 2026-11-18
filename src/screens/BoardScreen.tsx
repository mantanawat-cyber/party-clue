import { useGame } from '../store/GameContext';
import type { ClueInstance } from '../models';

const gpanel: React.CSSProperties = {
  background: 'linear-gradient(160deg, rgba(12,6,20,0.93), rgba(6,3,12,0.96))',
  border: '1px solid rgba(120,80,40,0.55)',
  borderRadius: 10,
  padding: '20px 20px',
  boxShadow: '0 0 0 1px rgba(60,40,20,0.25), 0 8px 32px rgba(0,0,0,0.85)',
  marginBottom: 12,
};

const gsec: React.CSSProperties = {
  fontFamily: "'Cinzel', serif",
  fontSize: '0.72rem',
  letterSpacing: '0.15em',
  color: 'rgba(200,180,140,0.6)',
  marginBottom: 8,
  textTransform: 'uppercase',
};

function ClueCard({ clue }: { clue: ClueInstance }) {
  return (
    <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(120,80,40,0.3)', borderRadius: 6 }}>
      <div style={{ fontSize: '0.72rem', color: 'rgba(200,180,140,0.45)', marginBottom: 4 }}>Public Clue</div>
      <div style={{ color: '#e8d5b0', fontSize: '0.9rem' }}>{clue.content}</div>
    </div>
  );
}

export default function BoardScreen() {
  const { state, dispatch } = useGame();
  const gs = state.gameState;
  if (!gs) return null;

  const currentTurnPlayer = gs.players[gs.currentPlayerIndex];
  const isMyTurn = state.myPlayerId === currentTurnPlayer.id;

  const pending = gs.pendingAction;
  const needsMyResponse = (pending && (
    pending.actorId === state.myPlayerId ||
    pending.targetId === state.myPlayerId ||
    (pending.step === 'awaiting_shutdown' &&
      gs.players.find(p => p.id === state.myPlayerId)?.actionHand.some(a => a.type === 'SHUTDOWN')) ||
    (pending.step === 'awaiting_shuffle_picks' &&
      gs.players.find(p => p.id === state.myPlayerId)?.clueHand.length &&
      !pending.shufflePicks?.[state.myPlayerId!])
  )) || (gs.hostJudgePending && state.isHost) || gs.pendingPenalty === state.myPlayerId;

  return (
    <div className="screen" style={{
      backgroundImage: 'url(/cards/home-bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundAttachment: 'fixed',
    }}>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <div className="board-header" style={{
        position: 'relative', zIndex: 2,
        background: 'rgba(6,3,12,0.92)',
        borderBottom: '1px solid rgba(120,80,40,0.4)',
        backdropFilter: 'blur(8px)',
      }}>
        <div>
          <span style={{ fontWeight: 700, color: '#e8d5b0', fontFamily: "'Cinzel', serif" }}>
            ถึงตา {currentTurnPlayer.name}
          </span>
          {currentTurnPlayer.isBlackedOut && (
            <span style={{ marginLeft: 8, fontSize: '0.72rem', background: 'rgba(200,120,0,0.2)', color: '#f59e0b', padding: '2px 8px', borderRadius: 12, border: '1px solid rgba(200,120,0,0.4)' }}>
              ⚡ Blackout
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {state.roomCode && (
            <span style={{ fontWeight: 700, color: '#c0392b', fontSize: '0.9rem', letterSpacing: '0.08em', fontFamily: "'Cinzel', serif" }}>
              #{state.roomCode}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ position: 'relative', width: 28, height: 38 }}>
                <img src="/cards/card-back.png" alt="Clue Deck" style={{ width: '100%', height: '100%', objectFit: 'fill', borderRadius: 3 }} />
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                  {gs.clueDeck.length}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'rgba(200,180,140,0.5)' }}>เบาะแส</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'rgba(200,180,140,0.5)' }}>⚡{gs.actionDeck.length}</span>
          </div>
        </div>
      </div>

      <div className="board-content" style={{ position: 'relative', zIndex: 1 }}>
        {/* My turn banner */}
        {isMyTurn && !pending && (
          <div style={{ background: 'rgba(10,30,10,0.8)', border: '1px solid rgba(80,160,80,0.4)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
            <span style={{ color: '#5cb85c', fontWeight: 700, fontFamily: "'Cinzel', serif" }}>🎯 ถึงตาคุณแล้ว!</span>
          </div>
        )}

        {/* Waiting banner */}
        {!isMyTurn && !needsMyResponse && (
          <div style={{ background: 'rgba(10,5,2,0.6)', border: '1px solid rgba(120,80,40,0.3)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
            <span style={{ color: 'rgba(200,180,140,0.5)', fontSize: '0.9rem' }}>⏳ รอ {currentTurnPlayer.name} เล่น...</span>
          </div>
        )}

        {/* Needs my response */}
        {needsMyResponse && (
          <div style={{ background: 'rgba(80,20,0,0.6)', border: '1px solid rgba(200,100,30,0.5)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>⚠️ คุณต้องตอบสนองก่อน!</span>
          </div>
        )}

        {/* Public Clues */}
        <div style={gpanel}>
          <div style={gsec}>Public Clues ({gs.publicClues.length})</div>
          {gs.publicClues.length === 0 ? (
            <p style={{ color: 'rgba(200,180,140,0.4)', fontSize: '0.85rem', margin: 0 }}>ยังไม่มี Public Clue</p>
          ) : (
            <div className="card-grid">
              {gs.publicClues.map((c) => <ClueCard key={c.instanceId} clue={c} />)}
            </div>
          )}
        </div>

        {/* Players overview */}
        <div style={gpanel}>
          <div style={gsec}>ผู้เล่น</div>
          {gs.players.map((p, i) => {
            const isCurrentTurn = i === gs.currentPlayerIndex;
            const isMe = p.id === state.myPlayerId;
            return (
              <div
                key={p.id}
                style={{
                  padding: '10px 14px', borderRadius: 6, marginBottom: 6,
                  background: isCurrentTurn ? 'rgba(192,57,43,0.15)' : 'rgba(255,255,255,0.03)',
                  border: isCurrentTurn ? '1px solid rgba(192,57,43,0.4)' : '1px solid rgba(120,80,40,0.25)',
                  display: 'flex', alignItems: 'center', gap: 8,
                  opacity: p.isBlackedOut ? 0.6 : 1,
                }}
              >
                <span style={{ flex: 1, color: '#e8d5b0', fontSize: '0.9rem', fontWeight: isCurrentTurn ? 700 : 400 }}>
                  {isCurrentTurn ? '▶ ' : ''}{p.name}
                  {isMe && <span style={{ marginLeft: 6, fontSize: '0.72rem', color: '#c0392b' }}>(คุณ)</span>}
                  {p.isBlackedOut && <span style={{ marginLeft: 6, fontSize: '0.72rem', color: '#f59e0b' }}>⚡</span>}
                </span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 10, background: 'rgba(100,160,100,0.15)', color: '#5cb85c', border: '1px solid rgba(80,160,80,0.3)' }}>
                    {p.clueHand.filter(c => c.status === 'normal').length} เบาะแส
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 10, background: 'rgba(100,50,160,0.15)', color: '#a78bfa', border: '1px solid rgba(100,50,160,0.3)' }}>
                    {p.clueHand.filter(c => c.status === 'locked').length} ล็อค
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 10, background: 'rgba(200,120,0,0.15)', color: '#f59e0b', border: '1px solid rgba(200,120,0,0.3)' }}>
                    {p.actionHand.length} แอ็กชัน
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent log */}
        <div style={gpanel}>
          <div style={gsec}>Log</div>
          <div style={{ maxHeight: 160, overflowY: 'auto' }}>
            {[...gs.log].reverse().slice(0, 20).map((entry, i) => (
              <div key={i} style={{ fontSize: '0.8rem', color: 'rgba(200,180,140,0.55)', padding: '4px 0', borderBottom: '1px solid rgba(120,80,40,0.1)' }}>
                {entry.message}
              </div>
            ))}
          </div>
        </div>

        {/* Open hand button */}
        {(isMyTurn || needsMyResponse) && (
          <button
            onClick={() => dispatch({ type: 'OPEN_HAND' })}
            style={{
              width: '100%', padding: '14px 20px',
              fontFamily: "'Cinzel', serif", fontSize: '1rem', fontWeight: 700, letterSpacing: '0.06em',
              borderRadius: 6, cursor: 'pointer',
              background: 'linear-gradient(135deg, #8b1a1a 0%, #c0392b 60%, #962020 100%)',
              color: '#f5e6b8', border: '1px solid rgba(200,80,60,0.5)',
              boxShadow: '0 0 12px rgba(180,40,30,0.4), inset 0 1px 0 rgba(255,180,160,0.15)',
            }}
          >
            {needsMyResponse ? '⚠️ ตอบสนองเลย →' : '🃏 เปิดมือของฉัน →'}
          </button>
        )}
      </div>
    </div>
  );
}
