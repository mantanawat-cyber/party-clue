import { useState } from 'react';
import { useGame } from '../store/GameContext';

export default function HomeScreen() {
  const { state, dispatch } = useGame();
  const [name, setName] = useState(state.myName ?? '');

  function handleAction(action: 'create' | 'join') {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({ type: 'SET_MY_NAME', name: trimmed });
    if (action === 'create') dispatch({ type: 'GO_SETUP' });
    else dispatch({ type: 'GO_JOIN' });
  }

  return (
    <div className="screen-center">
      <div className="container" style={{ maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="setup-title">🃏 Party Clue</div>
          <div className="setup-subtitle">Deduction + Take That Party Game</div>
        </div>

        <div className="panel">
          <div className="field" style={{ marginBottom: 20 }}>
            <label>ชื่อของคุณ</label>
            <input
              type="text"
              placeholder="กรอกชื่อ..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={16}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAction('join')}
              style={{ fontSize: '1.1rem', textAlign: 'center' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="btn btn--primary btn--lg btn--full"
              disabled={!name.trim()}
              onClick={() => handleAction('create')}
            >
              🏠 สร้างห้อง (Host)
            </button>
            <button
              className="btn btn--ghost btn--lg btn--full"
              disabled={!name.trim()}
              onClick={() => handleAction('join')}
            >
              🔑 เข้าร่วมด้วย Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
