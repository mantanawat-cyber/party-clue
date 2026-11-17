import { GameProvider, useGame } from './store/GameContext';
import HomeScreen from './screens/HomeScreen';
import SetupScreen from './screens/SetupScreen';
import JoinScreen from './screens/JoinScreen';
import LobbyScreen from './screens/LobbyScreen';
import ClaimScreen from './screens/ClaimScreen';
import BoardScreen from './screens/BoardScreen';
import HandScreen from './screens/HandScreen';
import GameOverScreen from './screens/GameOverScreen';

function AppInner() {
  const { state } = useGame();

  switch (state.screen) {
    case 'home':     return <HomeScreen />;
    case 'setup':    return <SetupScreen />;
    case 'join':     return <JoinScreen />;
    case 'lobby':    return <LobbyScreen />;
    case 'claim':    return <ClaimScreen />;
    case 'board':    return <BoardScreen />;
    case 'hand':     return <HandScreen />;
    case 'gameover': return <GameOverScreen />;
    default:         return <HomeScreen />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <AppInner />
    </GameProvider>
  );
}
