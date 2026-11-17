import { useGame } from '../store/GameContext';
import type { ClueInstance } from '../models';

function ClueCard({ clue }: { clue: ClueInstance }) {
  return (
    <div className="card card--public">
      <div className="card__label">Public Clue</div>
      <div className="card__content">{clue.content}</div>
    </div>
  );
}

export default function BoardScreen() {
  const { state, dispatch } = useGame();
  const gs = state.gameState;
  if (!gs) return null;

  const currentTurnPlayer = gs.players[gs.currentPlayerIndex];
  const isMyTurn = state.myPlayerId === currentTurnPlayer.id;

  // If there's a pending action that needs MY response, show my hand
  const pending = gs.pendingAction;
  const needsMyResponse = pending && (
    pending.actorId === state.myPlayerId ||
    pending.targetId === state.myPlayerId ||
    (pending.step === 'awaiting_shutdown' &&
      gs.players.find(p => p.id === state.myPlayerId)?.actionHand.some(a => a.type === 'SHUTDOWN')) ||
    (pending.step === 'awaiting_shuffle_picks' &&
      gs.players.find(p => p.id === state.myPlayerId)?.clueHand.length &&
      !pending.shufflePicks?.[state.myPlayerId!])
  );

  return (
    <div className="screen">
      {/* Header */}
      <div className="board-header">
        <div>
          <span className="board-turn-indicator">ถึงตา {currentTurnPlayer.name}</span>
          {currentTurnPlayer.isBlackedOut && (
            <span className="badge badge--warning" style={{ marginLeft: 8 }}>⚡ Blackout</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {state.roomCode && (
            <span style={{ fontWeight: 700, color: 'var(--action)', fontSize: '0.9rem', letterSpacing: '0.08em' }}>
              #{state.roomCode}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Clue Deck */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ position: 'relative', width: 28, height: 38 }}>
                <img src="/cards/card-back.png" alt="Clue Deck" style={{ width: '100%', height: '100%', objectFit: 'fill', borderRadius: 3 }} />
                <span style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 800, color: '#fff',
                  textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                }}>
                  {gs.clueDeck.length}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>เบาะแส</span>
            </div>
            {/* Action Deck */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⚡{gs.actionDeck.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="board-content">
        {/* My turn banner */}
        {isMyTurn && !pending && (
          <div style={{ background: 'var(--action-bg)', border: '1px solid var(--action)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
            <span style={{ color: 'var(--action)', fontWeight: 700 }}>🎯 ถึงตาคุณแล้ว!</span>
          </div>
        )}

        {/* Waiting banner */}
        {!isMyTurn && !needsMyResponse && (
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
            <span className="text-muted">⏳ รอ {currentTurnPlayer.name} เล่น...</span>
          </div>
        )}

        {/* Needs my response */}
        {needsMyResponse && (
          <div style={{ background: '#2d1f00', border: '1px solid var(--locked)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
            <span style={{ color: 'var(--locked)', fontWeight: 700 }}>⚠️ คุณต้องตอบสนองก่อน!</span>
          </div>
        )}

        {/* Public Clues */}
        <div className="panel">
          <div className="section-title">Public Clues ({gs.publicClues.length})</div>
          {gs.publicClues.length === 0 ? (
            <p className="text-muted text-sm">ยังไม่มี Public Clue</p>
          ) : (
            <div className="card-grid">
              {gs.publicClues.map((c) => <ClueCard key={c.instanceId} clue={c} />)}
            </div>
          )}
        </div>

        {/* Players overview */}
        <div className="panel">
          <div className="section-title">ผู้เล่น</div>
          {gs.players.map((p, i) => {
            const isCurrentTurn = i === gs.currentPlayerIndex;
            const isMe = p.id === state.myPlayerId;
            return (
              <div
                key={p.id}
                className={`player-row${isCurrentTurn ? ' player-row--active' : ''}${p.isBlackedOut ? ' player-row--blackout' : ''}`}
              >
                <span className="player-name">
                  {isCurrentTurn ? '▶ ' : ''}{p.name}
                  {isMe && <span style={{ marginLeft: 6, fontSize: '0.72rem', color: 'var(--action)' }}>(คุณ)</span>}
                  {p.isBlackedOut && <span className="badge badge--warning" style={{ marginLeft: 6 }}>⚡</span>}
                </span>
                <div className="player-counts">
                  <span className="badge badge--normal">{p.clueHand.filter(c => c.status === 'normal').length} เบาะแส</span>
                  <span className="badge badge--locked">{p.clueHand.filter(c => c.status === 'locked').length} ล็อค</span>
                  <span className="badge badge--action">{p.actionHand.length} แอ็กชัน</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent log */}
        <div className="panel">
          <div className="section-title">Log</div>
          <div className="log">
            {[...gs.log].reverse().slice(0, 20).map((entry, i) => (
              <div key={i} className="log-entry">{entry.message}</div>
            ))}
          </div>
        </div>

        {/* Open hand button — only my turn or needs response */}
        {(isMyTurn || needsMyResponse) && (
          <button
            className="btn btn--primary btn--lg btn--full"
            onClick={() => dispatch({ type: 'OPEN_HAND' })}
          >
            {needsMyResponse ? '⚠️ ตอบสนองเลย →' : '🃏 เปิดมือของฉัน →'}
          </button>
        )}
      </div>
    </div>
  );
}
