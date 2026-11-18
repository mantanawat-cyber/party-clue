import type { ReactNode } from 'react';

export function GothicScreen({ children }: { children: ReactNode }) {
  return (
    <div style={{
      minHeight: '100dvh',
      backgroundImage: 'url(/cards/home-bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundAttachment: 'fixed',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'max(16px, env(safe-area-inset-top, 0px)) 16px max(16px, env(safe-area-inset-bottom, 0px))',
    }}>
      <div style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.6) 100%)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
        {children}
      </div>
    </div>
  );
}

export function GothicHeader({ subtitle }: { subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <img
        src="/cards/logo-ghost.png"
        alt="logo"
        style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: 4, filter: 'drop-shadow(0 0 12px rgba(140,80,255,0.6))' }}
      />
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: 'clamp(1.6rem, 7vw, 2.2rem)',
        fontWeight: 900,
        color: '#c0392b',
        textShadow: '0 0 16px rgba(200,50,30,0.7), 1px 1px 3px rgba(0,0,0,0.9)',
        letterSpacing: '0.08em',
        lineHeight: 1,
      }}>
        Party Clue
      </div>
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: '0.85rem',
        color: 'rgba(220,200,160,0.8)',
        letterSpacing: '0.15em',
        marginTop: 4,
        textShadow: '0 1px 4px rgba(0,0,0,0.8)',
      }}>
        {subtitle}
      </div>
    </div>
  );
}

export function GothicPanel({ children }: { children: ReactNode }) {
  return (
    <div style={{
      background: 'linear-gradient(160deg, rgba(12,6,20,0.93), rgba(6,3,12,0.96))',
      border: '1px solid rgba(120,80,40,0.55)',
      borderRadius: 10,
      padding: '20px 20px',
      boxShadow: '0 0 0 1px rgba(60,40,20,0.25), 0 8px 32px rgba(0,0,0,0.85), inset 0 1px 0 rgba(180,140,80,0.08)',
    }}>
      {children}
    </div>
  );
}

export function GothicInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        padding: '12px 16px',
        background: 'rgba(8,4,2,0.75)',
        border: '1px solid rgba(130,85,40,0.5)',
        borderRadius: 6,
        color: '#e8d5b0',
        fontSize: '1rem',
        fontFamily: 'inherit',
        outline: 'none',
        boxSizing: 'border-box',
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
        ...props.style,
      }}
    />
  );
}

export function GothicButton({
  children, onClick, disabled, variant = 'default', fullWidth,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'default' | 'ghost';
  fullWidth?: boolean;
}) {
  const base: React.CSSProperties = {
    width: fullWidth ? '100%' : undefined,
    padding: '12px 20px',
    fontFamily: "'Cinzel', serif",
    fontSize: '0.95rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    borderRadius: 6,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'transform 0.1s, box-shadow 0.1s',
    border: 'none',
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #8b1a1a 0%, #c0392b 60%, #962020 100%)',
      color: '#f5e6b8',
      boxShadow: '0 0 12px rgba(180,40,30,0.4), inset 0 1px 0 rgba(255,180,160,0.15)',
      border: '1px solid rgba(200,80,60,0.5)',
    },
    default: {
      background: 'rgba(20,10,5,0.7)',
      color: '#c8b080',
      border: '1px solid rgba(120,80,40,0.45)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
    },
    ghost: {
      background: 'transparent',
      color: 'rgba(200,180,140,0.7)',
      border: '1px solid rgba(100,70,40,0.35)',
    },
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant] }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {children}
    </button>
  );
}
