import { useGame } from '../store/GameContext';

export default function HomeScreen() {
  const { dispatch } = useGame();

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundImage: 'url(/cards/home-bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: "'Cinzel', serif",
    }}>
      {/* Top gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.75) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Title */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', paddingTop: 'max(48px, env(safe-area-inset-top, 0px) + 32px)' }}>
        <div style={{
          fontSize: 'clamp(2.2rem, 10vw, 3.2rem)',
          fontWeight: 900,
          letterSpacing: '0.08em',
          color: '#c0392b',
          textShadow: '0 0 16px rgba(200,50,30,0.7), 1px 1px 3px rgba(0,0,0,0.9)',
          lineHeight: 1.1,
        }}>
          PARTY
        </div>
        <div style={{
          fontSize: 'clamp(2.8rem, 13vw, 4.2rem)',
          fontWeight: 900,
          letterSpacing: '0.12em',
          color: '#c0392b',
          textShadow: '0 0 20px rgba(200,50,30,0.8), 2px 2px 6px rgba(0,0,0,0.9)',
          lineHeight: 1,
          marginTop: -4,
        }}>
          CLUE
        </div>
        <div style={{
          fontSize: 'clamp(0.7rem, 3vw, 0.9rem)',
          letterSpacing: '0.3em',
          color: 'rgba(220,200,160,0.85)',
          textTransform: 'uppercase',
          marginTop: 6,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}>
          Deduction Card Game
        </div>
      </div>

      {/* Buttons */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 360,
        padding: '0 24px',
        paddingBottom: 'max(32px, env(safe-area-inset-bottom, 0px) + 24px)',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <GameButton
          onClick={() => dispatch({ type: 'GO_SETUP' })}
          primary
        >
          🏠 สร้างห้อง
        </GameButton>
        <GameButton onClick={() => dispatch({ type: 'GO_JOIN' })}>
          🔑 เข้าร่วมด้วย Code
        </GameButton>
        <GameButton onClick={() => dispatch({ type: 'GO_HOWTOPLAY', from: 'home' })}>
          📖 วิธีเล่น
        </GameButton>
      </div>
    </div>
  );
}

function GameButton({ children, onClick, primary }: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '14px 20px',
        fontSize: '1.05rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        fontFamily: "'Cinzel', serif",
        color: '#f5e6b8',
        background: primary
          ? 'linear-gradient(135deg, #8b1a1a 0%, #c0392b 60%, #962020 100%)'
          : 'rgba(10,5,20,0.65)',
        border: primary
          ? '1px solid rgba(200,80,60,0.5)'
          : '1px solid rgba(180,140,80,0.5)',
        borderRadius: 8,
        cursor: 'pointer',
        boxShadow: primary
          ? '0 0 12px rgba(180,40,30,0.4), inset 0 1px 0 rgba(255,180,160,0.15)'
          : '0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        transition: 'transform 0.1s, box-shadow 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {children}
    </button>
  );
}
