import { useState } from 'react';
import type { ReactNode } from 'react';
import { useGame } from '../store/GameContext';
import type { ActionInstance, ClueInstance, Player } from '../models';
import { GothicScreen, GothicPanel, GothicButton, GothicInput } from '../components/GothicLayout';

// ─── Card image maps ─────────────────────────────────────────────────────────

const ACTION_IMAGES: Record<string, string> = {
  DECODE:          '/cards/action-decode.png',
  ENCODE:          '/cards/action-encode.png',
  STEAL:           '/cards/action-steal.png',
  BLACKOUT:        '/cards/action-blackout.png',
  ANONYMOUS_GUESS: '/cards/action-anonymous-guess.png',
  SPY:             '/cards/action-spy.png',
  SHUTDOWN:        '/cards/action-shutdown.png',
  INVESTIGATE:     '/cards/action-investigate.png',
  SWAP:            '/cards/action-swap.png',
  DISCARD:         '/cards/action-discard.png',
};

const ACTION_CATEGORIES: { label: string; icon: string; types: string[] }[] = [
  { label: 'ข้อมูล',   icon: '🔍', types: ['SPY', 'INVESTIGATE'] },
  { label: 'เบาะแส',   icon: '🃏', types: ['DECODE', 'ENCODE', 'SWAP'] },
  { label: 'โจมตี',    icon: '⚔️', types: ['STEAL', 'DISCARD', 'BLACKOUT'] },
  { label: 'พิเศษ',    icon: '🛡', types: ['SHUTDOWN', 'ANONYMOUS_GUESS'] },
];

function clueTextSize(len: number): string {
  if (len < 20) return '0.88rem';
  if (len < 35) return '0.78rem';
  if (len < 55) return '0.68rem';
  return '0.58rem';
}

// ─── Gothic style constants ───────────────────────────────────────────────────

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

const gothicBg: React.CSSProperties = {
  backgroundImage: 'url(/cards/home-bg.png)',
  backgroundSize: 'cover',
  backgroundPosition: 'center top',
  backgroundAttachment: 'fixed',
};

const headerStyle: React.CSSProperties = {
  position: 'relative', zIndex: 2,
  background: 'rgba(6,3,12,0.92)',
  borderBottom: '1px solid rgba(120,80,40,0.4)',
  backdropFilter: 'blur(8px)',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function ClueCard({ clue, onClick, selected, blind }: { clue: ClueInstance; onClick?: () => void; selected?: boolean; blind?: boolean }) {
  const isLocked = clue.status === 'locked';
  const imgSrc = blind ? '/cards/card-back.png' : (isLocked ? '/cards/clue-locked.png' : '/cards/clue-normal.png');
  const text = isLocked ? 'ต้องใช้การ์ด Decode เพื่อปลดล็อก' : clue.content;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', width: '100%', aspectRatio: '3 / 4.2',
        cursor: onClick ? 'pointer' : 'default', borderRadius: 8,
        outline: selected ? '3px solid #c0392b' : 'none', outlineOffset: 2,
        transition: 'transform 0.15s, outline 0.1s',
        transform: selected ? 'scale(1.04)' : undefined, flexShrink: 0,
      }}
    >
      <img
        src={imgSrc}
        alt={isLocked ? 'Locked Clue' : 'Normal Clue'}
        style={{ width: '100%', height: '100%', objectFit: 'fill', borderRadius: 8, display: 'block' }}
        draggable={false}
      />
      {!blind && (
        <div style={{
          position: 'absolute', top: '63%', left: '10%', right: '10%', height: '23%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          overflow: 'hidden', fontSize: clueTextSize(text.length), lineHeight: 1.3,
          color: isLocked ? '#8b5cf6' : '#3b2000', fontWeight: isLocked ? 500 : 600,
          padding: '2px 4px', wordBreak: 'break-word',
        }}>
          {text}
        </div>
      )}
    </div>
  );
}

function ActionCard({ action, onClick, selected }: { action: ActionInstance; onClick?: () => void; selected?: boolean }) {
  const imgSrc = ACTION_IMAGES[action.type] ?? null;

  if (!imgSrc) {
    return (
      <div
        onClick={onClick}
        style={{
          padding: '12px', borderRadius: 8, aspectRatio: '3 / 4.2',
          cursor: onClick ? 'pointer' : 'default',
          background: 'linear-gradient(160deg, rgba(12,6,20,0.93), rgba(6,3,12,0.96))',
          border: selected ? '2px solid #c0392b' : '1px solid rgba(120,80,40,0.55)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}
      >
        <div style={{ color: '#c0392b', fontFamily: "'Cinzel', serif", fontSize: '0.8rem', marginBottom: 4 }}>{action.name}</div>
        <div style={{ color: 'rgba(200,180,140,0.6)', fontSize: '0.72rem' }}>{action.description}</div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', width: '100%', aspectRatio: '3 / 4.2',
        cursor: onClick ? 'pointer' : 'default', borderRadius: 8,
        outline: selected ? '3px solid #c0392b' : 'none', outlineOffset: 2,
        transition: 'transform 0.15s, outline 0.1s',
        transform: selected ? 'scale(1.04)' : undefined, flexShrink: 0,
      }}
    >
      <img
        src={imgSrc}
        alt={action.name}
        style={{ width: '100%', height: '100%', objectFit: 'fill', borderRadius: 8, display: 'block' }}
        draggable={false}
      />
      {onClick && (
        <div
          style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'rgba(0,0,0,0)', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}
        />
      )}
    </div>
  );
}

// ─── Shared sub-view wrapper ──────────────────────────────────────────────────

function SubView({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <GothicScreen>
      <GothicPanel>
        <div style={{ color: '#c0392b', fontFamily: "'Cinzel', serif", fontSize: '1.1rem', fontWeight: 700, marginBottom: subtitle ? 4 : 16 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ color: 'rgba(200,180,140,0.6)', fontSize: '0.85rem', marginBottom: 16 }}>{subtitle}</div>
        )}
        {children}
      </GothicPanel>
    </GothicScreen>
  );
}

// ─── Main Hand Screen ────────────────────────────────────────────────────────

export default function HandScreen() {
  const { state } = useGame();
  const gs = state.gameState;
  if (!gs || !state.currentPlayer) return null;

  const player = gs.players.find(p => p.id === state.currentPlayer!.id)!;
  if (!player) return null;

  const pending = gs.pendingAction;

  if (state.spyReveal) return <SpyRevealView content={state.spyReveal} />;
  if (state.guessPhase === 'pending_penalty' || gs.pendingPenalty === state.myPlayerId) return <PenaltyView player={player} />;
  if (gs.hostJudgePending && state.isHost) return <ManualJudgeView />;
  const isActor = pending?.actorId === state.myPlayerId;
  const isTarget = pending?.targetId === state.myPlayerId;

  if (pending?.step === 'awaiting_investigate_keep' && isActor) return <InvestigateView />;
  if (pending?.step === 'awaiting_discard_choice' && isTarget) return <DiscardChoiceView />;

  if (pending?.step === 'awaiting_shutdown') return <ShutdownView />;
  if (pending?.step === 'awaiting_target' && isActor) return <TargetSelectView />;
  if (pending?.step === 'awaiting_clue_selection' && isActor) return <ClueSelectView />;

  return <MainHandView player={player} />;
}

// ─── Status Banner ───────────────────────────────────────────────────────────

function StatusBanner() {
  const { state } = useGame();
  const gs = state.gameState!;
  const pending = gs.pendingAction;
  const isMyTurn = gs.players[gs.currentPlayerIndex].id === state.myPlayerId;
  const isActor = pending?.actorId === state.myPlayerId;
  const isTarget = pending?.targetId === state.myPlayerId;
  const myHasShutdown = gs.players.find(p => p.id === state.myPlayerId)?.actionHand.some(a => a.type === 'SHUTDOWN') ?? false;
  const actorName = gs.players.find(p => p.id === pending?.actorId)?.name ?? '???';
  const targetName = gs.players.find(p => p.id === pending?.targetId)?.name ?? '???';
  const currentName = gs.players[gs.currentPlayerIndex].name;

  let msg = '';
  let accent = 'rgba(200,180,140,0.55)';

  if (pending?.step === 'awaiting_shutdown') {
    if (isActor) { msg = '❓ ถามเพื่อนว่ามีใครอยากใช้ Shutdown ไหม แล้วกดดำเนินการต่อ'; accent = '#e67e22'; }
    else if (myHasShutdown) { msg = `⛔ ${actorName} เล่น ${pending.action.name} — คุณมี Shutdown ต้องการใช้ไหม?`; accent = '#c0392b'; }
    else { msg = `รอ ${actorName} ดำเนินการ...`; }
  } else if (pending?.step === 'awaiting_target' && isActor) {
    msg = `🎯 เลือกเป้าหมายสำหรับ ${pending.action.name}`; accent = '#e67e22';
  } else if (pending?.step === 'awaiting_clue_selection' && isActor) {
    if (pending.action.type === 'SWAP' && !pending.selectedClueInstanceId) { msg = '🔄 SWAP — เลือก Clue ของคุณที่จะแลก'; accent = '#e67e22'; }
    else if (pending.action.type === 'SWAP') { msg = `🔄 SWAP — เลือก Clue ของ ${targetName} (ไม่เห็นเนื้อหา)`; accent = '#e67e22'; }
    else if (pending.action.type === 'SPY') { msg = `🔍 SPY — เลือก Clue ของ ${targetName} (ไม่เห็นเนื้อหา)`; accent = '#e67e22'; }
    else if (pending.action.type === 'STEAL') { msg = `🫳 STEAL — เลือก Clue ของ ${targetName} (ไม่เห็นเนื้อหา)`; accent = '#e67e22'; }
    else { msg = `เลือก Clue สำหรับ ${pending.action.name}`; accent = '#e67e22'; }
  } else if (pending && !isActor && !isTarget) {
    msg = `รอ ${actorName} ดำเนินการ...`;
  } else if (isMyTurn && gs.turnPhase === 'draw') {
    msg = '🎯 เทิร์นคุณ — กดจั่วการ์ดหรือเล่น Action'; accent = '#27ae60';
  } else if (isMyTurn && gs.turnPhase === 'end' && state.lastDrawnCard) {
    msg = '✨ ดูการ์ดที่ได้ แล้วกดจบเทิร์น'; accent = '#e67e22';
  } else if (isMyTurn && gs.turnPhase === 'end') {
    msg = '✓ ทำเสร็จแล้ว — กดจบเทิร์น'; accent = '#27ae60';
  } else if (!isMyTurn) {
    msg = `รอเทิร์นของ ${currentName}...`;
  }

  if (!msg) return null;
  return (
    <div style={{
      padding: '8px 14px', borderRadius: 8, marginBottom: 12,
      background: 'rgba(0,0,0,0.5)', border: `1px solid ${accent}50`,
      textAlign: 'center', fontSize: '0.82rem', color: accent,
      fontFamily: "'Cinzel', serif", letterSpacing: '0.03em', lineHeight: 1.5,
    }}>
      {msg}
    </div>
  );
}

// ─── Main hand view ──────────────────────────────────────────────────────────

function MainHandView({ player }: { player: Player }) {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;
  const [showGuess, setShowGuess] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [useAnon, setUseAnon] = useState(false);
  const [selectedRedraw, setSelectedRedraw] = useState<string | null>(null);
  const [showRedraw, setShowRedraw] = useState(false);

  const isDrawPhase = gs.turnPhase === 'draw';
  const isEndPhase = gs.turnPhase === 'end';
  const isBlackedOut = player.isBlackedOut;
  const isMyTurn = gs.players[gs.currentPlayerIndex].id === state.myPlayerId;
  const anonCard = player.actionHand.find(a => a.type === 'ANONYMOUS_GUESS');
  const hasAnonReady = !!anonCard || state.isAnonymousGuess;

  function handleGuessSubmit() {
    if (!guessInput.trim()) return;
    dispatch({ type: 'SUBMIT_GUESS', answer: guessInput.trim(), isAnonymous: useAnon || state.isAnonymousGuess });
    setGuessInput('');
    setShowGuess(false);
  }

  if (showGuess) {
    return (
      <div className="screen" style={gothicBg}>
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', pointerEvents: 'none', zIndex: 0 }} />
        <div className="board-header" style={headerStyle}>
          <span style={{ color: '#e8d5b0', fontFamily: "'Cinzel', serif", fontWeight: 700 }}>🎯 ทายคำตอบ</span>
          <button style={{ background: 'transparent', border: 'none', color: 'rgba(200,180,140,0.7)', fontSize: '1.1rem', cursor: 'pointer', padding: '4px 8px' }} onClick={() => setShowGuess(false)}>✕</button>
        </div>
        <div className="board-content" style={{ position: 'relative', zIndex: 1 }}>
          {gs.currentQuestion?.question && (
            <div style={{ ...gpanel, textAlign: 'center' }}>
              <div style={gsec}>คำถาม</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#e8d5b0', fontFamily: "'Cinzel', serif" }}>
                {gs.currentQuestion.question}
              </div>
            </div>
          )}
          <div style={gpanel}>
            <div style={gsec}>Public Clues ที่เปิดเผยแล้ว</div>
            <div className="card-grid" style={{ marginBottom: 12 }}>
              {gs.publicClues.map(c => (
                <div key={c.instanceId} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(120,80,40,0.3)', borderRadius: 6 }}>
                  <div style={{ color: '#e8d5b0', fontSize: '0.9rem' }}>{c.content}</div>
                </div>
              ))}
            </div>
            <div style={gsec}>Clues ในมือของคุณ</div>
            <div className="card-grid">
              {player.clueHand.map(c => <ClueCard key={c.instanceId} clue={c} />)}
            </div>
          </div>
          <div style={gpanel}>
            {hasAnonReady && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', color: '#e8d5b0', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={state.isAnonymousGuess ? true : useAnon}
                    disabled={state.isAnonymousGuess}
                    onChange={e => !state.isAnonymousGuess && setUseAnon(e.target.checked)}
                  />
                  <span>
                    Anonymous Guess
                    {state.isAnonymousGuess
                      ? ' — การ์ดถูกใช้แล้ว (บังคับ)'
                      : ` — ใช้การ์ด ${anonCard!.name}`}
                  </span>
                </label>
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', color: 'rgba(200,180,140,0.8)', fontSize: '0.8rem', letterSpacing: '0.1em', marginBottom: 6, fontFamily: "'Cinzel', serif" }}>
                คำตอบของคุณ
              </label>
              <GothicInput
                type="text"
                placeholder="พิมพ์คำตอบ..."
                value={guessInput}
                onChange={e => setGuessInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGuessSubmit()}
                autoFocus
              />
            </div>
            <GothicButton variant="primary" fullWidth disabled={!guessInput.trim()} onClick={handleGuessSubmit}>
              ส่งคำตอบ →
            </GothicButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen" style={gothicBg}>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', pointerEvents: 'none', zIndex: 0 }} />

      <div className="board-header" style={headerStyle}>
        <div>
          <span style={{ fontWeight: 700, color: '#e8d5b0', fontFamily: "'Cinzel', serif" }}>{player.name}</span>
          <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'rgba(200,180,140,0.5)' }}>มือของคุณ</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(200,180,140,0.5)' }}>
          Clue Deck: {gs.clueDeck.length}
        </div>
      </div>

      <div className="board-content" style={{ position: 'relative', zIndex: 1 }}>
        <StatusBanner />
        {/* Clue hand */}
        <div style={gpanel}>
          <div style={gsec}>Clues ในมือ ({player.clueHand.length})</div>
          {player.clueHand.length === 0 ? (
            <p style={{ color: 'rgba(200,180,140,0.4)', fontSize: '0.85rem', margin: 0 }}>ไม่มี Clue ในมือ</p>
          ) : (
            <div className="card-grid">
              {player.clueHand.map(c => <ClueCard key={c.instanceId} clue={c} />)}
            </div>
          )}
        </div>

        {/* Action hand */}
        <div style={gpanel}>
          <div style={gsec}>Action Cards ({player.actionHand.length})</div>

          {/* Not my turn — view only */}
          {!isMyTurn && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {player.actionHand.length === 0
                ? <p style={{ color: 'rgba(200,180,140,0.4)', fontSize: '0.85rem', margin: 0 }}>ไม่มี Action ในมือ</p>
                : ACTION_CATEGORIES.map(cat => {
                    const cards = player.actionHand.filter(a => cat.types.includes(a.type));
                    if (cards.length === 0) return null;
                    return (
                      <div key={cat.label}>
                        <div style={{ ...gsec, marginBottom: 6 }}>{cat.icon} {cat.label}</div>
                        <div className="card-grid">
                          {cards.map(a => <ActionCard key={a.instanceId} action={a} />)}
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          )}

          {/* My turn — blacked out */}
          {isMyTurn && isBlackedOut && (
            <p style={{ color: 'rgba(200,180,140,0.4)', fontSize: '0.85rem', margin: 0 }}>⚡ Blackout — ข้าม Main Phase</p>
          )}

          {/* My turn — draw phase: choose action */}
          {isMyTurn && !isBlackedOut && isDrawPhase && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <style>{`@keyframes cardPulse { 0%,100%{box-shadow:0 0 12px rgba(200,160,60,0.3),0 4px 20px rgba(0,0,0,0.6)} 50%{box-shadow:0 0 24px rgba(200,160,60,0.6),0 4px 24px rgba(0,0,0,0.7)} }`}</style>
                <div
                  onClick={() => dispatch({ type: 'DRAW_ACTION' })}
                  style={{
                    width: 110, aspectRatio: '3 / 4.2', cursor: 'pointer',
                    borderRadius: 10, overflow: 'hidden',
                    animation: 'cardPulse 2s ease-in-out infinite',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06) translateY(-4px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onTouchStart={e => (e.currentTarget.style.transform = 'scale(1.06) translateY(-4px)')}
                  onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <img src="/cards/card-back.png" alt="จั่วการ์ด" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(200,180,120,0.6)', letterSpacing: '0.1em', fontFamily: "'Cinzel', serif" }}>
                  กดเพื่อจั่วการ์ด
                </div>
              </div>
              {player.actionHand.length > 0 && (
                <>
                  <div style={{ borderTop: '1px solid rgba(120,80,40,0.3)', paddingTop: 12 }}>
                    <div style={{ ...gsec, marginBottom: 8 }}>หรือเล่นการ์ดในมือ</div>
                    {ACTION_CATEGORIES.map(cat => {
                      const cards = player.actionHand.filter(a => cat.types.includes(a.type));
                      if (cards.length === 0) return null;
                      return (
                        <div key={cat.label} style={{ marginBottom: 10 }}>
                          <div style={{ ...gsec, marginBottom: 6 }}>{cat.icon} {cat.label}</div>
                          <div className="card-grid">
                            {cards.map(a => (
                              <ActionCard
                                key={a.instanceId}
                                action={a}
                                onClick={() => dispatch({ type: 'PLAY_ACTION', actionInstanceId: a.instanceId })}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* My turn — end phase: done */}
          {isMyTurn && !isBlackedOut && isEndPhase && !state.lastDrawnCard && (
            <p style={{ color: 'rgba(200,180,140,0.4)', fontSize: '0.85rem', margin: 0 }}>✓ ทำแล้ว — กดจบเทิร์น</p>
          )}
        </div>

        {/* Redraw — free once per turn, draw phase only */}
        {isMyTurn && !isBlackedOut && isDrawPhase && !state.hasRedrawnThisTurn && gs.settings.allowActionRedraw && gs.actionDeck.length > 0 && player.actionHand.length > 0 && (
          <div>
            <GothicButton variant="ghost" fullWidth onClick={() => { setShowRedraw(v => !v); setSelectedRedraw(null); }}>
              {showRedraw ? '▲ ซ่อน Redraw' : '🔄 Redraw (ฟรี)'}
            </GothicButton>
            {showRedraw && (
              <div style={{ ...gpanel, marginTop: 8 }}>
                <div style={gsec}>เลือก Action ที่จะทิ้ง</div>
                <div className="card-grid" style={{ marginBottom: 10 }}>
                  {player.actionHand.map(a => (
                    <ActionCard
                      key={a.instanceId}
                      action={a}
                      onClick={() => setSelectedRedraw(a.instanceId)}
                      selected={selectedRedraw === a.instanceId}
                    />
                  ))}
                </div>
                {selectedRedraw && (
                  <GothicButton variant="ghost" fullWidth onClick={() => { dispatch({ type: 'REDRAW_ACTION', discardInstanceId: selectedRedraw }); setSelectedRedraw(null); setShowRedraw(false); }}>
                    ✓ ทิ้งแล้วจั่วใหม่
                  </GothicButton>
                )}
              </div>
            )}
          </div>
        )}

        {/* Guess — counts as 1 action, draw phase only */}
        {isMyTurn && !isBlackedOut && isDrawPhase && (
          <GothicButton variant="primary" fullWidth onClick={() => setShowGuess(true)}>
            🎯 ทายคำตอบ
          </GothicButton>
        )}

        {/* Drawn card reveal */}
        {isMyTurn && isEndPhase && state.lastDrawnCard && (
          <div style={{ ...gpanel, border: '1px solid rgba(200,160,60,0.5)', background: 'rgba(20,12,4,0.95)' }}>
            <div style={{ ...gsec, color: 'rgba(220,180,80,0.8)' }}>✨ การ์ดที่ได้</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              {state.lastDrawnCard.kind === 'action'
                ? <ActionCard action={state.lastDrawnCard.card} />
                : <ClueCard clue={state.lastDrawnCard.card} />
              }
            </div>
            <div style={{ textAlign: 'center', color: 'rgba(200,180,140,0.6)', fontSize: '0.85rem', marginBottom: 12 }}>
              {state.lastDrawnCard.kind === 'action'
                ? state.lastDrawnCard.card.description
                : state.lastDrawnCard.card.status === 'locked' ? '🔒 Locked Clue' : '🔍 Normal Clue'
              }
            </div>
            <GothicButton variant="ghost" fullWidth onClick={() => dispatch({ type: 'END_TURN' })}>
              รับทราบ — จบเทิร์น →
            </GothicButton>
          </div>
        )}

        {/* End turn — only after action done, and no drawn card pending reveal */}
        {isMyTurn && (isEndPhase || isBlackedOut) && !state.lastDrawnCard && (
          <div style={{ marginTop: 8 }}>
            <GothicButton variant="ghost" fullWidth onClick={() => dispatch({ type: 'END_TURN' })}>
              จบเทิร์น →
            </GothicButton>
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          <GothicButton variant="ghost" onClick={() => dispatch({ type: 'OPEN_BOARD' })}>
            ← ดู Board สาธารณะ
          </GothicButton>
        </div>
      </div>
    </div>
  );
}

// ─── Target selection ────────────────────────────────────────────────────────

function TargetSelectView() {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;
  const pending = gs.pendingAction!;
  const opponents = gs.players.filter(p => p.id !== pending.actorId);

  return (
    <SubView title={pending.action.name} subtitle="เลือกเป้าหมาย">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {opponents.map(p => (
          <GothicButton key={p.id} fullWidth onClick={() => dispatch({ type: 'SET_TARGET', targetId: p.id })}>
            {p.name}
            <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'rgba(200,180,140,0.5)' }}>
              ({p.clueHand.filter(c => c.status === 'normal').length}N {p.clueHand.filter(c => c.status === 'locked').length}L)
            </span>
          </GothicButton>
        ))}
      </div>
      <GothicButton variant="ghost" fullWidth onClick={() => dispatch({ type: 'CANCEL_ACTION' })}>
        ยกเลิก
      </GothicButton>
    </SubView>
  );
}

// ─── Clue selection ──────────────────────────────────────────────────────────

function ClueSelectView() {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;
  const pending = gs.pendingAction!;
  const target = pending.targetId ? gs.players.find(p => p.id === pending.targetId) : null;

  const actor = gs.players.find(p => p.id === pending.actorId)!;
  const isTargetPick =
    pending.action.type === 'SPY' ||
    pending.action.type === 'STEAL' ||
    (pending.action.type === 'SWAP' && !!pending.selectedClueInstanceId);
  const pickOwner = isTargetPick ? target : actor;
  const eligible = (pickOwner?.clueHand ?? []).filter((c: ClueInstance) => {
    if (pending.action.type === 'SPY') return c.status === 'normal';
    if (pending.action.type === 'DECODE') return c.status === 'locked';
    if (pending.action.type === 'ENCODE') return c.status === 'normal';
    if (pending.action.type === 'SWAP') return c.status !== 'public';
    if (pending.action.type === 'STEAL') return c.status !== 'public';
    return true;
  });

  const title = isTargetPick ? `เลือก Clue ของ ${target?.name ?? '...'}` : 'เลือก Clue ของคุณ';

  return (
    <SubView title={pending.action.name} subtitle={title}>
      {eligible.length === 0 ? (
        <p style={{ color: 'rgba(200,180,140,0.4)', margin: '0 0 12px' }}>ไม่มี Clue ที่ใช้ได้</p>
      ) : (
        <div className="card-grid" style={{ marginBottom: 12 }}>
          {eligible.map(c => (
            <ClueCard key={c.instanceId} clue={c} blind={pending.action.type === 'STEAL' || pending.action.type === 'SPY' || (pending.action.type === 'SWAP' && isTargetPick)} onClick={() => dispatch({ type: 'SELECT_CLUE', clueInstanceId: c.instanceId })} />
          ))}
        </div>
      )}
      <GothicButton variant="ghost" fullWidth onClick={() => dispatch({ type: 'CANCEL_ACTION' })}>
        ยกเลิก
      </GothicButton>
    </SubView>
  );
}

// ─── Shutdown window ──────────────────────────────────────────────────────────

function ShutdownView() {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;
  const pending = gs.pendingAction!;
  const [shutdownWho, setShutdownWho] = useState<string | null>(null);

  const isActor = state.myPlayerId === pending.actorId;
  const actor = gs.players.find(p => p.id === pending.actorId)!;
  const myShutdownCards = gs.players.find(p => p.id === state.myPlayerId)?.actionHand.filter(a => a.type === 'SHUTDOWN') ?? [];

  if (shutdownWho) {
    const whoPlayer = gs.players.find(p => p.id === shutdownWho)!;
    const shutdownCards = whoPlayer.actionHand.filter(a => a.type === 'SHUTDOWN');
    return (
      <SubView title="Shutdown!" subtitle={`${whoPlayer.name} เลือก Shutdown card`}>
        <div className="card-grid" style={{ marginBottom: 12 }}>
          {shutdownCards.map(a => (
            <ActionCard key={a.instanceId} action={a} onClick={() => dispatch({ type: 'USE_SHUTDOWN', playerId: shutdownWho, shutdownInstanceId: a.instanceId })} />
          ))}
        </div>
        <GothicButton variant="ghost" fullWidth onClick={() => setShutdownWho(null)}>← กลับ</GothicButton>
      </SubView>
    );
  }

  // Actor: ไม่แสดงว่าใครมี Shutdown (ไพ่ลับ) — แค่ถามและรอ แล้วกดดำเนินการต่อ
  if (isActor) {
    return (
      <SubView title={`⚠️ ${pending.action.name}`} subtitle="ถามเพื่อนว่ามีใครต้องการใช้ Shutdown ไหม?">
        <GothicButton variant="primary" fullWidth onClick={() => dispatch({ type: 'SKIP_SHUTDOWN' })}>
          {pending.action.type === 'SPY' ? 'เปิดเผยผล SPY →' : 'ไม่มี — ดำเนินการต่อ ✓'}
        </GothicButton>
      </SubView>
    );
  }

  // Non-actor: sees only their own shutdown option, or a waiting message
  if (myShutdownCards.length > 0) {
    return (
      <SubView title={`⚠️ ${actor.name} เล่น ${pending.action.name}`} subtitle="คุณมี Shutdown — ใช้ไหม?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <GothicButton variant="primary" fullWidth onClick={() => setShutdownWho(state.myPlayerId!)}>
            ⛔ ใช้ Shutdown ของฉัน
          </GothicButton>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'rgba(200,180,140,0.5)', margin: 0, textAlign: 'center' }}>
          รอ {actor.name} ดำเนินการต่อ...
        </p>
      </SubView>
    );
  }

  return (
    <SubView title={`⚠️ ${actor.name} เล่น ${pending.action.name}`} subtitle="รอดำเนินการ...">
      <p style={{ fontSize: '0.85rem', color: 'rgba(200,180,140,0.5)', margin: 0, textAlign: 'center' }}>
        รอ {actor.name} ยืนยันว่าไม่มีใช้ Shutdown
      </p>
    </SubView>
  );
}

// ─── Investigate keep ────────────────────────────────────────────────────────

function InvestigateView() {
  const { state, dispatch } = useGame();
  const gs = state.gameState;
  const drawn = gs?.pendingAction?.drawnClues ?? [];

  return (
    <SubView title="Investigate" subtitle="เลือก Clue 1 ใบที่จะเก็บไว้ (อีกใบจะไปใต้กอง)">
      <div className="card-grid">
        {drawn.map(c => <ClueCard key={c.instanceId} clue={c} onClick={() => dispatch({ type: 'KEEP_INVESTIGATE', clueInstanceId: c.instanceId })} />)}
      </div>
    </SubView>
  );
}

// ─── Discard choice (target chooses) ────────────────────────────────────────

function DiscardChoiceView() {
  const { state, dispatch } = useGame();
  const gs = state.gameState;
  const pending = gs?.pendingAction;
  const target = gs?.players.find(p => p.id === pending?.targetId);
  const [pickClue, setPickClue] = useState(false);

  if (!gs || !pending || !target) return null;

  // In multiplayer: only the target picks — actor waits
  const amTarget = state.myPlayerId === pending.targetId;
  if (!amTarget) {
    return (
      <SubView title="Discard" subtitle={`รอ ${target.name} ตัดสินใจ...`}>
        <div style={{ textAlign: 'center', color: 'rgba(200,180,140,0.5)', fontSize: '0.9rem', marginBottom: 16 }}>
          ⏳ รอ {target.name} เลือก
        </div>
        <GothicButton variant="ghost" fullWidth onClick={() => dispatch({ type: 'OPEN_BOARD' })}>
          ← กลับ Board
        </GothicButton>
      </SubView>
    );
  }

  if (pickClue) {
    return (
      <SubView title="เลือก Clue ที่จะทิ้ง → Public" subtitle="Clue ที่เลือกจะกลายเป็น Public Clue">
        <div className="card-grid" style={{ marginBottom: 12 }}>
          {target.clueHand.map(c => (
            <ClueCard key={c.instanceId} clue={c} onClick={() => dispatch({ type: 'APPLY_DISCARD_CHOICE', choice: 'clue', clueInstanceId: c.instanceId })} />
          ))}
        </div>
        <GothicButton variant="ghost" fullWidth onClick={() => setPickClue(false)}>← กลับ</GothicButton>
      </SubView>
    );
  }

  return (
    <SubView title={`Discard — ${target.name}`} subtitle="เลือกหนึ่งทาง:">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {target.clueHand.length > 0 && (
          <GothicButton variant="primary" fullWidth onClick={() => setPickClue(true)}>
            ทิ้ง Clue 1 ใบ → Public Clue
          </GothicButton>
        )}
        <GothicButton variant="ghost" fullWidth onClick={() => dispatch({ type: 'APPLY_DISCARD_CHOICE', choice: 'actions' })}>
          ทิ้ง Action {Math.min(3, target.actionHand.length)} ใบ
        </GothicButton>
      </div>
    </SubView>
  );
}

// ─── Spy reveal ──────────────────────────────────────────────────────────────

function SpyRevealView({ content }: { content: string }) {
  const { dispatch } = useGame();
  return (
    <SubView title="🔍 Spy Result" subtitle="เฉพาะคุณเท่านั้นที่เห็น">
      <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(120,80,40,0.3)', borderRadius: 8, marginBottom: 20, textAlign: 'center' }}>
        <span style={{ color: '#e8d5b0', fontSize: '1rem' }}>{content}</span>
      </div>
      <GothicButton variant="primary" fullWidth onClick={() => dispatch({ type: 'CLEAR_SPY_REVEAL' })}>
        รับทราบ ✓
      </GothicButton>
    </SubView>
  );
}

// ─── Wrong guess penalty ──────────────────────────────────────────────────────

function PenaltyView({ player }: { player: Player }) {
  const { dispatch } = useGame();
  return (
    <SubView title="❌ ตอบผิด" subtitle="เลือก Clue 1 ใบที่จะเปิดเป็น Public Clue">
      <div className="card-grid">
        {player.clueHand.map(c => (
          <ClueCard key={c.instanceId} clue={c} onClick={() => dispatch({ type: 'APPLY_PENALTY', clueInstanceId: c.instanceId })} />
        ))}
      </div>
    </SubView>
  );
}

// ─── Manual judge ────────────────────────────────────────────────────────────

function ManualJudgeView() {
  const { dispatch } = useGame();
  return (
    <SubView title="⚖️ Host ตัดสิน" subtitle="คำตอบนี้ถูกต้องหรือไม่?">
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <GothicButton variant="primary" onClick={() => dispatch({ type: 'JUDGE_ANSWER', isCorrect: true })}>
          ✓ ถูก
        </GothicButton>
        <GothicButton onClick={() => dispatch({ type: 'JUDGE_ANSWER', isCorrect: false })}>
          ✕ ผิด
        </GothicButton>
      </div>
    </SubView>
  );
}
