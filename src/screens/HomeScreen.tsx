import { useGame } from '../store/GameContext';

export default function HomeScreen() {
  const { dispatch } = useGame();

  return (
    <div className="screen-center">
      <div className="container" style={{ maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="setup-title">🃏 Party Clue</div>
          <div className="setup-subtitle">Deduction + Take That Party Game</div>
        </div>

        <div className="panel">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="btn btn--primary btn--lg btn--full"
              onClick={() => dispatch({ type: 'GO_SETUP' })}
            >
              🏠 สร้างห้อง (Host)
            </button>
            <button
              className="btn btn--ghost btn--lg btn--full"
              onClick={() => dispatch({ type: 'GO_JOIN' })}
            >
              🔑 เข้าร่วมด้วย Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
