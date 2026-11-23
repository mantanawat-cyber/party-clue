import { useEffect, useRef, useState } from 'react';
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

function ActionToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
      zIndex: 100, maxWidth: 'calc(100vw - 32px)', width: 340,
      background: 'linear-gradient(135deg, rgba(80,20,0,0.97), rgba(50,10,0,0.98))',
      border: '1px solid rgba(220,100,30,0.6)',
      borderRadius: 10, padding: '12px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(220,100,30,0.2)',
      display: 'flex', alignItems: 'flex-start', gap: 10,
      animation: 'slideDown 0.25s ease',
    }}>
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateX(-50%) translateY(-12px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }`}</style>
      <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: 1 }}>⚠️</span>
      <span style={{ flex: 1, color: '#f5c97a', fontSize: '0.9rem', lineHeight: 1.4, fontFamily: "'Cinzel', serif" }}>{message}</span>
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(220,180,120,0.5)', cursor: 'pointer', fontSize: '1rem', padding: '0 0 0 4px', flexShrink: 0 }}>✕</button>
    </div>
  );
}

export default function BoardScreen() {
  const { state, dispatch } = useGame();
  const gs = state.gameState;
  const [toast, setToast] = useState<string | null>(null);
  const seenActionRef = useRef<string | null>(null);
  const seenShutdownRef = useRef<string | null>(null);

  const pending = gs?.pendingAction ?? null;

  useEffect(() => {
    if (!pending || !state.myPlayerId || !gs) return;

    const actionKey = pending.action.instanceId;
    if (seenActionRef.current === actionKey) return;

    const isTarget = pending.targetId === state.myPlayerId;
    const canShutdown =
      pending.step === 'awaiting_shutdown' &&
      pending.actorId !== state.myPlayerId &&
      gs.players.find(p => p.id === state.myPlayerId)?.actionHand.some(a => a.type === 'SHUTDOWN');

    if (isTarget || canShutdown) {
      seenActionRef.current = actionKey;
      const actor = gs.players.find(p => p.id === pending.actorId)?.name ?? '???';
      const msg = isTarget
        ? `${actor} เล่น ${pending.action.name} ใส่คุณ!`
        : `${actor} เล่น ${pending.action.name} — กด Shutdown ได้!`;
      setToast(msg);
      try { navigator.vibrate?.([200, 80, 200]); } catch {}
    }
  }, [pending?.action.instanceId]);

  useEffect(() => {
    const sd = gs?.lastShutdown;
    if (!sd || !state.myPlayerId) return;
    const key = `${sd.byPlayerId}-${sd.cancelledActorId}-${sd.actionName}`;
    if (seenShutdownRef.current === key) return;
    seenShutdownRef.current = key;

    const shutdownName = gs!.players.find(p => p.id === sd.byPlayerId)?.name ?? '???';
    const actorName = gs!.players.find(p => p.id === sd.cancelledActorId)?.name ?? '???';

    let msg: string;
    if (state.myPlayerId === sd.byPlayerId) {
      msg = `✅ คุณ Shutdown ${sd.actionName} ของ ${actorName} สำเร็จ!`;
    } else if (state.myPlayerId === sd.cancelledActorId) {
      msg = `⛔ ${shutdownName} Shutdown ${sd.actionName} ของคุณ!`;
    } else {
      msg = `⛔ ${shutdownName} Shutdown ${sd.actionName} ของ ${actorName}`;
    }
    setToast(msg);
    try { navigator.vibrate?.([100, 50, 100]); } catch {}
  }, [gs?.lastShutdown]);

  if (!gs) return null;

  const currentTurnPlayer = gs.players[gs.currentPlayerIndex];
  const isMyTurn = state.myPlayerId === currentTurnPlayer.id;

  const pendingAction = gs.pendingAction;
  const needsMyResponse = (pendingAction && (
    pendingAction.actorId === state.myPlayerId ||
    pendingAction.targetId === state.myPlayerId ||
    (pendingAction.step === 'awaiting_shutdown' &&
      gs.players.find(p => p.id === state.myPlayerId)?.actionHand.some(a => a.type === 'SHUTDOWN'))
  )) || (gs.hostJudgePending && state.isHost) || gs.pendingPenalty === state.myPlayerId;

  return (
    <div className="screen" style={{
      backgroundImage: 'url(/cards/home-bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundAttachment: 'fixed',
    }}>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', pointerEvents: 'none', zIndex: 0 }} />
      {toast && <ActionToast message={toast} onClose={() => setToast(null)} />}

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
        {/* Status banner */}
        {(() => {
          const pa = pendingAction;
          const myHasShutdown = gs.players.find(p => p.id === state.myPlayerId)?.actionHand.some(a => a.type === 'SHUTDOWN') ?? false;
          const actorName = gs.players.find(p => p.id === pa?.actorId)?.name ?? '???';
          const iAm = (id?: string) => id === state.myPlayerId;
          let msg = ''; let accent = '#5cb85c';
          if (pa?.step === 'awaiting_shutdown') {
            if (iAm(pa.actorId)) { msg = '❓ ถามเพื่อนว่าต้องการ Shutdown ไหม — เปิดมือเพื่อดำเนินการต่อ'; accent = '#e67e22'; }
            else if (myHasShutdown) { msg = `⛔ ${actorName} เล่น ${pa.action.name} — คุณมี Shutdown! เปิดมือเพื่อใช้`; accent = '#c0392b'; }
            else { msg = `รอ ${actorName} ดำเนินการ...`; accent = 'rgba(200,180,140,0.5)'; }
          } else if (pa?.step === 'awaiting_target' && iAm(pa.actorId)) {
            msg = `🎯 เปิดมือเพื่อเลือกเป้าหมายของ ${pa.action.name}`; accent = '#e67e22';
          } else if (pa?.step === 'awaiting_clue_selection' && iAm(pa.actorId)) {
            msg = `เปิดมือเพื่อเลือก Clue สำหรับ ${pa.action.name}`; accent = '#e67e22';
          } else if (pa?.step === 'awaiting_discard_choice' && iAm(pa.targetId)) {
            msg = `⚠️ ${actorName} ใช้ Discard — เปิดมือเพื่อเลือกว่าจะทิ้งอะไร`; accent = '#c0392b';
          } else if (pa?.step === 'awaiting_investigate_keep' && iAm(pa.actorId)) {
            msg = '🔎 เปิดมือเพื่อเลือก Clue จาก Investigate'; accent = '#e67e22';
          } else if (pa && !iAm(pa.actorId) && !iAm(pa.targetId)) {
            msg = `รอ ${actorName} ดำเนินการ...`; accent = 'rgba(200,180,140,0.5)';
          } else if (isMyTurn) {
            msg = '🎯 ถึงตาคุณแล้ว — เปิดมือเพื่อเล่น'; accent = '#5cb85c';
          } else {
            msg = `รอเทิร์นของ ${currentTurnPlayer.name}...`; accent = 'rgba(200,180,140,0.5)';
          }
          return (
            <div style={{ background: 'rgba(0,0,0,0.6)', border: `1px solid ${accent}50`, borderRadius: 10, padding: '10px 16px', textAlign: 'center', marginBottom: 4 }}>
              <span style={{ color: accent, fontWeight: 700, fontFamily: "'Cinzel', serif", fontSize: '0.85rem' }}>{msg}</span>
            </div>
          );
        })()}

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

        {/* Question */}
        {gs.currentQuestion?.question && (
          <div style={{ ...gpanel, textAlign: 'center' }}>
            <div style={gsec}>คำถาม</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#e8d5b0', fontFamily: "'Cinzel', serif" }}>
              {gs.currentQuestion.question}
            </div>
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

        {/* Open hand button — always visible; urgent style when action needed */}
        <style>{`
          @keyframes handBtnPulse { 0%,100%{box-shadow:0 0 12px rgba(180,40,30,0.4),inset 0 1px 0 rgba(255,180,160,0.15)} 50%{box-shadow:0 0 28px rgba(210,50,30,0.7),0 0 44px rgba(200,40,20,0.25),inset 0 1px 0 rgba(255,180,160,0.15)} }
          @keyframes handBtnPulseUrgent { 0%,100%{box-shadow:0 0 14px rgba(200,40,30,0.5),inset 0 1px 0 rgba(255,180,160,0.15)} 50%{box-shadow:0 0 36px rgba(220,50,30,0.85),0 0 56px rgba(210,40,20,0.35),inset 0 1px 0 rgba(255,180,160,0.2)} }
        `}</style>
        <button
          onClick={() => dispatch({ type: 'OPEN_HAND' })}
          style={{
            width: '100%', padding: '14px 20px',
            fontFamily: "'Cinzel', serif", fontSize: '1rem', fontWeight: 700, letterSpacing: '0.06em',
            borderRadius: 6, cursor: 'pointer',
            ...(needsMyResponse ? {
              background: 'linear-gradient(135deg, #8b1a1a 0%, #c0392b 60%, #962020 100%)',
              color: '#f5e6b8', border: '1px solid rgba(200,80,60,0.5)',
              animation: 'handBtnPulseUrgent 1.2s ease-in-out infinite',
            } : isMyTurn ? {
              background: 'linear-gradient(135deg, #8b1a1a 0%, #c0392b 60%, #962020 100%)',
              color: '#f5e6b8', border: '1px solid rgba(200,80,60,0.5)',
              animation: 'handBtnPulse 2s ease-in-out infinite',
            } : {
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(200,180,140,0.7)', border: '1px solid rgba(120,80,40,0.3)',
              boxShadow: 'none',
            }),
          }}
        >
          {needsMyResponse ? '⚠️ ตอบสนองเลย →' : '🃏 ดูมือของฉัน'}
        </button>
      </div>
    </div>
  );
}
