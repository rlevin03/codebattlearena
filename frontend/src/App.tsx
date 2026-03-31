import { useState, useEffect } from 'react';
import LobbyPage from './pages/LobbyPage';
import BattlePage from './pages/BattlePage';
import ResultsPage from './pages/ResultsPage';
import type { PlayerState, TestResult } from './types/battle';

type Screen = 'lobby' | 'battle' | 'results';

interface BattleInfo {
  battleId: string;
  playerId: string;
  playerName: string;
  joinCode: string;
}

interface ResultsInfo {
  winnerName: string;
  winnerPlayerId: string;
  myPlayerId: string;
  players: PlayerState[];
}

const SESSION_KEY = 'cba_battle_info';

export default function App() {
  const [screen, setScreen] = useState<Screen>('lobby');
  const [battleInfo, setBattleInfo] = useState<BattleInfo | null>(null);
  const [resultsInfo, setResultsInfo] = useState<ResultsInfo | null>(null);

  // Restore session on page reload
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const info = JSON.parse(saved) as BattleInfo;
        setBattleInfo(info);
        setScreen('battle');
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const handleBattleJoined = (
    battleId: string,
    playerId: string,
    playerName: string,
    joinCode: string,
  ) => {
    const info: BattleInfo = { battleId, playerId, playerName, joinCode };
    setBattleInfo(info);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(info));
    setScreen('battle');
  };

  const handleBattleEnd = (
    winnerName: string,
    winnerPlayerId: string,
    myPlayerId: string,
    _myResults: TestResult[] | null,
    _opponentResults: TestResult[] | null,
    players: PlayerState[],
  ) => {
    sessionStorage.removeItem(SESSION_KEY);
    setResultsInfo({ winnerName, winnerPlayerId, myPlayerId, players });
    setScreen('results');
  };

  const handlePlayAgain = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setBattleInfo(null);
    setResultsInfo(null);
    setScreen('lobby');
  };

  if (screen === 'lobby') {
    return <LobbyPage onBattleJoined={handleBattleJoined} />;
  }

  if (screen === 'battle' && battleInfo) {
    return (
      <BattlePage
        battleId={battleInfo.battleId}
        playerId={battleInfo.playerId}
        playerName={battleInfo.playerName}
        joinCode={battleInfo.joinCode}
        onBattleEnd={handleBattleEnd}
      />
    );
  }

  if (screen === 'results' && resultsInfo && battleInfo) {
    return (
      <ResultsPage
        battleId={battleInfo.battleId}
        myPlayerId={resultsInfo.myPlayerId}
        winnerName={resultsInfo.winnerName}
        winnerPlayerId={resultsInfo.winnerPlayerId}
        players={resultsInfo.players}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return <LobbyPage onBattleJoined={handleBattleJoined} />;
}
