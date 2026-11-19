import { Component } from 'react';
import type { ReactNode } from 'react';
import { GameProvider, useGame } from './store/GameContext';
import HomeScreen from './screens/HomeScreen';
import SetupScreen from './screens/SetupScreen';
import JoinScreen from './screens/JoinScreen';
import LobbyScreen from './screens/LobbyScreen';
import ClaimScreen from './screens/ClaimScreen';
import BoardScreen from './screens/BoardScreen';
import HandScreen from './screens/HandScreen';
import GameOverScreen from './screens/GameOverScreen';
import HowToPlayScreen from './screens/HowToPlayScreen';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100dvh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(160deg, rgba(12,6,20,1), rgba(6,3,12,1))',
          padding: 24, textAlign: 'center', gap: 16,
        }}>
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <div style={{ color: '#c0392b', fontFamily: "'Cinzel', serif", fontSize: '1.1rem', fontWeight: 700 }}>
            เกิดข้อผิดพลาด
          </div>
          <div style={{ color: 'rgba(200,180,140,0.6)', fontSize: '0.85rem' }}>
            กดปุ่มด้านล่างเพื่อโหลดหน้าใหม่
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px', borderRadius: 6, cursor: 'pointer',
              background: 'linear-gradient(135deg, #8b1a1a 0%, #c0392b 100%)',
              color: '#f5e6b8', border: '1px solid rgba(200,80,60,0.5)',
              fontFamily: "'Cinzel', serif", fontSize: '0.95rem', fontWeight: 700,
            }}
          >
            🔄 โหลดใหม่
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppInner() {
  const { state } = useGame();

  switch (state.screen) {
    case 'home':     return <HomeScreen />;
    case 'setup':    return <SetupScreen />;
    case 'join':     return <JoinScreen />;
    case 'lobby':     return <LobbyScreen />;
    case 'howtoplay': return <HowToPlayScreen />;
    case 'claim':     return <ClaimScreen />;
    case 'board':    return <BoardScreen />;
    case 'hand':     return <HandScreen />;
    case 'gameover': return <GameOverScreen />;
    default:         return <HomeScreen />;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <AppInner />
      </GameProvider>
    </ErrorBoundary>
  );
}
