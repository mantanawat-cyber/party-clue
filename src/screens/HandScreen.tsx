import { useState } from 'react';
import { useGame } from '../store/GameContext';
import type { ActionInstance, ClueInstance, Player } from '../models';

// ─── Card image maps ─────────────────────────────────────────────────────────

const ACTION_IMAGES: Record<string, string> = {
  DECODE:          '/cards/action-decode.png',
  ENCODE:          '/cards/action-encode.png',
  SHUFFLE:         '/cards/action-shuffle.png',
  BLACKOUT:        '/cards/action-blackout.png',
  ANONYMOUS_GUESS: '/cards/action-anonymous-guess.png',
  SPY:             '/cards/action-spy.png',
  SHUTDOWN:        '/cards/action-shutdown.png',
  INVESTIGATE:     '/cards/action-investigate.png',
  SWAP:            '/cards/action-swap.png',
  DISCARD:         '/cards/action-discard.png',
};

function clueTextSize(len: number): string {
  if (len < 30) return '1rem';
  if (len < 50) return '0.88rem';
  if (len < 70) return '0.78rem';
  return '0.68rem';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ClueCard({ clue, onClick, selected }: { clue: ClueInstance; onClick?: () => void; selected?: boolean }) {
  const isLocked = clue.status === 'locked';
  const imgSrc = isLocked ? '/cards/clue-locked.png' : '/cards/clue-normal.png';
  const text = isLocked ? 'ต้องใช้การ์ด Decode เพื่อปลดล็อก' : clue.content;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '3 / 4.2',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 8,
        outline: selected ? '3px solid var(--action)' : 'none',
        outlineOffset: 2,
        transition: 'transform 0.15s, outline 0.1s',
        transform: selected ? 'scale(1.04)' : undefined,
        flexShrink: 0,
      }}
    >
      <img
        src={imgSrc}
        alt={isLocked ? 'Locked Clue' : 'Normal Clue'}
        style={{ width: '100%', height: '100%', objectFit: 'fill', borderRadius: 8, display: 'block' }}
        draggable={false}
      />
      {/* Text overlay — calibrated to blank text box area */}
      <div
        style={{
          position: 'absolute',
          top: '61%',
          left: '10%',
          right: '10%',
          height: '23%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          overflow: 'hidden',
          fontSize: clueTextSize(text.length),
          lineHeight: 1.35,
          color: isLocked ? '#8b5cf6' : '#3b2000',
          fontWeight: isLocked ? 500 : 600,
          padding: '0 4px',
          wordBreak: 'break-word',
        }}
      >
        {text}
      </div>
    </div>
  );
}

function ActionCard({ action, onClick, selected }: { action: ActionInstance; onClick?: () => void; selected?: boolean }) {
  const imgSrc = ACTION_IMAGES[action.type] ?? null;

  if (!imgSrc) {
    return (
      <div className={`card card--action${onClick ? ' card--clickable' : ''}${selected ? ' card--selected' : ''}`} onClick={onClick}>
        <div className="card__name">{action.name}</div>
        <div className="card__desc">{action.description}</div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '3 / 4.2',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 8,
        outline: selected ? '3px solid var(--action)' : 'none',
        outlineOffset: 2,
        transition: 'transform 0.15s, outline 0.1s',
        transform: selected ? 'scale(1.04)' : undefined,
        flexShrink: 0,
      }}
    >
      <img
        src={imgSrc}
        alt={action.name}
        style={{ width: '100%', height: '100%', objectFit: 'fill', borderRadius: 8, display: 'block' }}
        draggable={false}
      />
      {onClick && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 8,
          background: 'rgba(0,0,0,0)',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}
        />
      )}
    </div>
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

  // Render different sub-views based on what's happening
  if (state.spyReveal) return <SpyRevealView content={state.spyReveal} />;
  if (state.guessPhase === 'pending_penalty') return <PenaltyView player={player} />;
  if (state.hostJudgePending) return <ManualJudgeView />;
  if (pending?.step === 'awaiting_investigate_keep') return <InvestigateView />;
  if (pending?.step === 'awaiting_discard_choice') return <DiscardChoiceView />;
  if (pending?.step === 'awaiting_shuffle_picks') return <ShufflePickView />;
  if (pending?.step === 'awaiting_shutdown') return <ShutdownView />;
  if (pending?.step === 'awaiting_target') return <TargetSelectView />;
  if (pending?.step === 'awaiting_clue_selection') return <ClueSelectView />;

  return <MainHandView player={player} />;
}

// ─── Main hand view ──────────────────────────────────────────────────────────

function MainHandView({ player }: { player: Player }) {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;
  const [showGuess, setShowGuess] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [useAnon, setUseAnon] = useState(false);
  const [selectedRedraw, setSelectedRedraw] = useState<string | null>(null);

  const isMainPhase = gs.turnPhase === 'main';
  const isBlackedOut = player.isBlackedOut;
  const anonCard = player.actionHand.find(a => a.type === 'ANONYMOUS_GUESS');

  function handleGuessSubmit() {
    if (!guessInput.trim()) return;
    dispatch({ type: 'SUBMIT_GUESS', answer: guessInput.trim(), isAnonymous: useAnon });
    setGuessInput('');
    setShowGuess(false);
  }

  if (showGuess) {
    return (
      <div className="screen">
        <div className="board-header">
          <span>🎯 ทายคำตอบ</span>
          <button className="btn btn--ghost" onClick={() => setShowGuess(false)}>✕</button>
        </div>
        <div className="board-content">
          <div className="panel">
            <div className="section-title">Public Clues ที่เปิดเผยแล้ว</div>
            <div className="card-grid" style={{ marginBottom: 12 }}>
              {gs.publicClues.map(c => (
                <div key={c.instanceId} className="card card--public">
                  <div className="card__content">{c.content}</div>
                </div>
              ))}
            </div>
            <div className="section-title">Clues ในมือของคุณ</div>
            <div className="card-grid" style={{ marginBottom: 16 }}>
              {player.clueHand.filter(c => c.status === 'normal').map(c => (
                <div key={c.instanceId} className="card card--normal">
                  <div className="card__content">{c.content}</div>
                </div>
              ))}
              {player.clueHand.filter(c => c.status === 'locked').map(c => (
                <div key={c.instanceId} className="card card--locked">
                  <div className="card__content text-muted">🔒 Locked</div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            {anonCard && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={useAnon} onChange={e => setUseAnon(e.target.checked)} />
                  <span>ใช้ Anonymous Guess (ไม่โดนโทษถ้าผิด) — ใช้การ์ด {anonCard.name}</span>
                </label>
              </div>
            )}
            <div className="field">
              <label>คำตอบของคุณ</label>
              <input
                type="text"
                placeholder="พิมพ์คำตอบ..."
                value={guessInput}
                onChange={e => setGuessInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGuessSubmit()}
                autoFocus
              />
            </div>
            <button className="btn btn--success btn--lg btn--full" disabled={!guessInput.trim()} onClick={handleGuessSubmit}>
              ส่งคำตอบ →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      {/* Header */}
      <div className="board-header">
        <div>
          <span style={{ fontWeight: 700 }}>{player.name}</span>
          <span className="text-muted text-sm" style={{ marginLeft: 8 }}>มือของคุณ</span>
        </div>
        <div className="board-deck-count">
          Clue Deck: {gs.clueDeck.length}
        </div>
      </div>

      <div className="board-content">
        {/* Clue hand */}
        <div className="panel">
          <div className="section-title">Clues ในมือ ({player.clueHand.length})</div>
          {player.clueHand.length === 0 ? (
            <p className="text-muted text-sm">ไม่มี Clue ในมือ</p>
          ) : (
            <div className="card-grid">
              {player.clueHand.map(c => <ClueCard key={c.instanceId} clue={c} />)}
            </div>
          )}
        </div>

        {/* Action hand */}
        <div className="panel">
          <div className="section-title">Action Cards ({player.actionHand.length})</div>
          {!isMainPhase || isBlackedOut ? (
            <p className="text-muted text-sm">
              {isBlackedOut ? '⚡ Blackout — ข้าม Main Phase' : 'รอ Draw Action ก่อน'}
            </p>
          ) : (
            <div className="card-grid">
              {player.actionHand.map(a => (
                <ActionCard
                  key={a.instanceId}
                  action={a}
                  onClick={() => dispatch({ type: 'PLAY_ACTION', actionInstanceId: a.instanceId })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action redraw option */}
        {isMainPhase && !isBlackedOut && gs.settings.allowActionRedraw && gs.actionDeck.length > 0 && (
          <div className="panel">
            <div className="section-title">ทิ้ง Action เพื่อจั่วใหม่</div>
            <p className="text-sm text-muted" style={{ marginBottom: 8 }}>เลือก Action ที่จะทิ้ง</p>
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
              <button
                className="btn btn--ghost btn--full"
                onClick={() => { dispatch({ type: 'REDRAW_ACTION', discardInstanceId: selectedRedraw }); setSelectedRedraw(null); }}
              >
                ✓ ทิ้งแล้วจั่วใหม่
              </button>
            )}
          </div>
        )}

        {/* Main action buttons */}
        {isMainPhase && !isBlackedOut && (
          <button className="btn btn--success btn--lg btn--full" onClick={() => setShowGuess(true)}>
            🎯 ทายคำตอบ
          </button>
        )}

        <button
          className="btn btn--ghost btn--lg btn--full"
          onClick={() => dispatch({ type: 'END_TURN' })}
        >
          จบเทิร์น →
        </button>

        <button className="btn btn--ghost" onClick={() => dispatch({ type: 'OPEN_BOARD' })}>
          ← ดู Board สาธารณะ
        </button>
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
    <div className="screen-center">
      <div className="container">
        <div className="panel">
          <h2 style={{ marginBottom: 4 }}>{pending.action.name}</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 16 }}>เลือกเป้าหมาย</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {opponents.map(p => (
              <button
                key={p.id}
                className="btn btn--ghost btn--full"
                onClick={() => dispatch({ type: 'SET_TARGET', targetId: p.id })}
              >
                {p.name}
                <span className="text-muted text-sm" style={{ marginLeft: 8 }}>
                  ({p.clueHand.filter(c => c.status === 'normal').length}N {p.clueHand.filter(c => c.status === 'locked').length}L)
                </span>
              </button>
            ))}
          </div>
          <button className="btn btn--danger btn--full" style={{ marginTop: 12 }} onClick={() => dispatch({ type: 'OPEN_HAND' })}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Clue selection ──────────────────────────────────────────────────────────

function ClueSelectView() {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;
  const pending = gs.pendingAction!;
  const target = pending.targetId ? gs.players.find(p => p.id === pending.targetId) : null;

  const actor = gs.players.find(p => p.id === pending.actorId)!;
  const isSwapSecondPick = pending.action.type === 'SWAP' && !!pending.selectedClueInstanceId;
  const pickOwner = isSwapSecondPick ? target : actor;
  const eligible = (pickOwner?.clueHand ?? []).filter((c: import('../models').ClueInstance) => {
    if (pending.action.type === 'SPY') return c.status === 'normal';
    if (pending.action.type === 'DECODE') return c.status === 'locked';
    if (pending.action.type === 'ENCODE') return c.status === 'normal';
    return true; // SWAP allows any
  });

  const title = isSwapSecondPick ? `เลือก Clue ของ ${target?.name}` : `เลือก Clue ของคุณ`;

  return (
    <div className="screen-center">
      <div className="container">
        <div className="panel">
          <h2 style={{ marginBottom: 4 }}>{pending.action.name}</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 16 }}>{title}</p>
          {eligible.length === 0 ? (
            <p className="text-muted">ไม่มี Clue ที่ใช้ได้</p>
          ) : (
            <div className="card-grid">
              {eligible.map(c => (
                <ClueCard
                  key={c.instanceId}
                  clue={c}
                  onClick={() => dispatch({ type: 'SELECT_CLUE', clueInstanceId: c.instanceId })}
                />
              ))}
            </div>
          )}
          <button className="btn btn--danger btn--full" style={{ marginTop: 12 }} onClick={() => dispatch({ type: 'OPEN_HAND' })}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shutdown window ──────────────────────────────────────────────────────────

function ShutdownView() {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;
  const pending = gs.pendingAction!;
  const [shutdownWho, setShutdownWho] = useState<string | null>(null);

  const others = gs.players.filter(p => p.id !== pending.actorId);
  const actor = gs.players.find(p => p.id === pending.actorId)!;

  if (shutdownWho) {
    const whoPlayer = gs.players.find(p => p.id === shutdownWho)!;
    const shutdownCards = whoPlayer.actionHand.filter(a => a.type === 'SHUTDOWN');
    return (
      <div className="screen-center">
        <div className="container">
          <div className="panel">
            <h2 style={{ marginBottom: 4 }}>Shutdown!</h2>
            <p className="text-muted text-sm" style={{ marginBottom: 16 }}>{whoPlayer.name} เลือก Shutdown card</p>
            <div className="card-grid">
              {shutdownCards.map(a => (
                <ActionCard key={a.instanceId} action={a} onClick={() => dispatch({ type: 'USE_SHUTDOWN', playerId: shutdownWho, shutdownInstanceId: a.instanceId })} />
              ))}
            </div>
            <button className="btn btn--ghost btn--full" style={{ marginTop: 12 }} onClick={() => setShutdownWho(null)}>← กลับ</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-center">
      <div className="container">
        <div className="panel" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 4 }}>⚠️ {actor.name} เล่น {pending.action.name}</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 20 }}>มีใครต้องการใช้ Shutdown ไหม?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {others.filter(p => p.actionHand.some(a => a.type === 'SHUTDOWN')).map(p => (
              <button key={p.id} className="btn btn--danger btn--full" onClick={() => setShutdownWho(p.id)}>
                ⛔ {p.name} ใช้ Shutdown
              </button>
            ))}
          </div>
          <button className="btn btn--success btn--lg btn--full" onClick={() => dispatch({ type: 'SKIP_SHUTDOWN' })}>
            ไม่มี — ดำเนินการต่อ ✓
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Investigate keep ────────────────────────────────────────────────────────

function InvestigateView() {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;
  const drawn = gs.pendingAction?.drawnClues ?? [];

  return (
    <div className="screen-center">
      <div className="container">
        <div className="panel">
          <h2 style={{ marginBottom: 4 }}>Investigate</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 16 }}>เลือก Clue 1 ใบที่จะเก็บไว้ (อีกใบจะไปใต้กอง)</p>
          <div className="card-grid">
            {drawn.map(c => <ClueCard key={c.instanceId} clue={c} onClick={() => dispatch({ type: 'KEEP_INVESTIGATE', clueInstanceId: c.instanceId })} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Discard choice (target chooses) ────────────────────────────────────────

function DiscardChoiceView() {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;
  const pending = gs.pendingAction!;
  const target = gs.players.find(p => p.id === pending.targetId)!;
  const [pickClue, setPickClue] = useState(false);

  if (pickClue) {
    return (
      <div className="screen-center">
        <div className="container">
          <div className="panel">
            <h2 style={{ marginBottom: 4 }}>เลือก Clue ที่จะทิ้ง → Public</h2>
            <p className="text-muted text-sm" style={{ marginBottom: 16 }}>Clue ที่เลือกจะกลายเป็น Public Clue</p>
            <div className="card-grid">
              {target.clueHand.map(c => (
                <ClueCard key={c.instanceId} clue={c} onClick={() => dispatch({ type: 'APPLY_DISCARD_CHOICE', choice: 'clue', clueInstanceId: c.instanceId })} />
              ))}
            </div>
            <button className="btn btn--ghost btn--full" style={{ marginTop: 12 }} onClick={() => setPickClue(false)}>← กลับ</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-center">
      <div className="container">
        <div className="panel" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 4 }}>Discard — {target.name}</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 20 }}>เลือกหนึ่งทาง:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {target.clueHand.length > 0 && (
              <button className="btn btn--danger btn--lg btn--full" onClick={() => setPickClue(true)}>
                ทิ้ง Clue 1 ใบ → Public Clue
              </button>
            )}
            <button
              className="btn btn--ghost btn--lg btn--full"
              onClick={() => dispatch({ type: 'APPLY_DISCARD_CHOICE', choice: 'actions' })}
            >
              ทิ้ง Action {Math.min(3, target.actionHand.length)} ใบ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shuffle pick (each player picks in turn) ────────────────────────────────

function ShufflePickView() {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;
  const pending = gs.pendingAction!;
  const picks = pending.shufflePicks ?? {};
  const playersWithClues = gs.players.filter(p => p.clueHand.length > 0);
  const nextPicker = playersWithClues.find(p => !picks[p.id]);

  if (!nextPicker) {
    return (
      <div className="screen-center">
        <div className="container">
          <div className="panel" style={{ textAlign: 'center' }}>
            <h2>ทุกคนเลือกแล้ว</h2>
            <p className="text-muted text-sm" style={{ marginBottom: 16 }}>กด Resolve เพื่อสุ่มแจกใหม่</p>
            <button className="btn btn--success btn--lg btn--full" onClick={() => dispatch({ type: 'SKIP_SHUTDOWN' })}>
              🔀 Shuffle ทันที
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-center">
      <div className="container">
        <div className="panel">
          <h2 style={{ marginBottom: 4 }}>Shuffle</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 4 }}>ส่งอุปกรณ์ให้ <strong>{nextPicker.name}</strong></p>
          <p className="text-muted text-sm" style={{ marginBottom: 16 }}>เลือก Clue 1 ใบที่จะส่งเข้า Shuffle</p>
          <div className="card-grid">
            {nextPicker.clueHand.map(c => (
              <ClueCard key={c.instanceId} clue={c} onClick={() => dispatch({ type: 'SET_SHUFFLE_PICK', playerId: nextPicker.id, clueInstanceId: c.instanceId })} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Spy reveal ──────────────────────────────────────────────────────────────

function SpyRevealView({ content }: { content: string }) {
  const { dispatch } = useGame();
  return (
    <div className="screen-center">
      <div className="container">
        <div className="panel" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 4 }}>🔍 Spy Result</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 16 }}>เฉพาะคุณเท่านั้นที่เห็น</p>
          <div className="card card--normal" style={{ marginBottom: 20 }}>
            <div className="card__content">{content}</div>
          </div>
          <button className="btn btn--primary btn--full" onClick={() => dispatch({ type: 'CLEAR_SPY_REVEAL' })}>
            รับทราบ ✓
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Wrong guess penalty ──────────────────────────────────────────────────────

function PenaltyView({ player }: { player: Player }) {
  const { dispatch } = useGame();
  return (
    <div className="screen-center">
      <div className="container">
        <div className="panel">
          <h2 style={{ marginBottom: 4 }}>❌ ตอบผิด</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 16 }}>เลือก Clue 1 ใบที่จะเปิดเป็น Public Clue</p>
          <div className="card-grid">
            {player.clueHand.map(c => (
              <ClueCard key={c.instanceId} clue={c} onClick={() => dispatch({ type: 'APPLY_PENALTY', clueInstanceId: c.instanceId })} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Manual judge ────────────────────────────────────────────────────────────

function ManualJudgeView() {
  const { dispatch } = useGame();
  return (
    <div className="screen-center">
      <div className="container">
        <div className="panel" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 4 }}>⚖️ Host ตัดสิน</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 24 }}>คำตอบนี้ถูกต้องหรือไม่?</p>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <button className="btn btn--success btn--lg" onClick={() => dispatch({ type: 'JUDGE_ANSWER', isCorrect: true })}>
              ✓ ถูก
            </button>
            <button className="btn btn--danger btn--lg" onClick={() => dispatch({ type: 'JUDGE_ANSWER', isCorrect: false })}>
              ✕ ผิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
