import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import { useBattleSocket } from '../hooks/useBattleSocket';
import BattleHeader from '../components/BattleHeader';
import ProblemPanel from '../components/ProblemPanel';
import EditorPanel from '../components/EditorPanel';
import ResultsPanel from '../components/ResultsPanel';
import type {
  Language,
  Problem,
  PlayerState,
  TestResult,
  WsMessage,
} from '../types/battle';

interface BattlePageProps {
  battleId: string;
  playerId: string;
  playerName: string;
  joinCode: string;
  onBattleEnd: (
    winnerName: string,
    winnerPlayerId: string,
    myPlayerId: string,
    myResults: TestResult[] | null,
    opponentResults: TestResult[] | null,
    players: PlayerState[]
  ) => void;
}

export default function BattlePage({
  battleId,
  playerId,
  playerName,
  joinCode,
  onBattleEnd,
}: BattlePageProps) {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [players, setPlayers] = useState<PlayerState[]>([
    { player_id: playerId, name: playerName, submitted: false, passed_cases: 0 },
  ]);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [myResults, setMyResults] = useState<TestResult[] | null>(null);
  const [opponentResults, setOpponentResults] = useState<TestResult[] | null>(null);
  const [myTotalCases, setMyTotalCases] = useState<number | null>(null);
  const [myPassedCases, setMyPassedCases] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [runResults, setRunResults] = useState<TestResult[] | null>(null);
  const [runPassed, setRunPassed] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waitingForResults, setWaitingForResults] = useState(false);

  // Hold refs for submit-on-time-up
  const codeRef = useRef<string>('');
  const languageRef = useRef<Language>('python');
  const submittedRef = useRef(false);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch problem once battle starts
  const fetchProblem = useCallback(async () => {
    try {
      const p = await api.getProblem(battleId);
      setProblem(p);
    } catch (err) {
      console.error('Failed to fetch problem:', err);
    }
  }, [battleId]);

  const handleMessage = useCallback(
    (msg: WsMessage) => {
      switch (msg.type) {
        case 'battle_state': {
          setPlayers(msg.players);
          if (msg.status === 'active' && msg.started_at) {
            setStartedAt(msg.started_at);
            fetchProblem();
          }
          break;
        }
        case 'opponent_joined': {
          setPlayers((prev) => {
            const exists = prev.find((p) => p.player_id === msg.player.player_id);
            if (exists) return prev;
            return [
              ...prev,
              {
                player_id: msg.player.player_id,
                name: msg.player.name,
                submitted: false,
                passed_cases: 0,
              },
            ];
          });
          break;
        }
        case 'battle_start': {
          setStartedAt(msg.started_at);
          fetchProblem();
          break;
        }
        case 'submission_queued': {
          setPlayers((prev) =>
            prev.map((p) =>
              p.player_id === msg.player_id ? { ...p, submitted: true } : p
            )
          );
          if (msg.player_id === playerId) {
            setWaitingForResults(true);
          }
          break;
        }
        case 'submission_result': {
          const isMe = msg.player_id === playerId;
          const results = msg.test_results;

          setPlayers((prev) =>
            prev.map((p) =>
              p.player_id === msg.player_id
                ? { ...p, submitted: true, passed_cases: msg.passed_cases }
                : p
            )
          );

          if (isMe) {
            setMyResults(results);
            setMyTotalCases(msg.total_cases);
            setMyPassedCases(msg.passed_cases);
            setSubmitting(false);
            setWaitingForResults(false);
          } else {
            setOpponentResults(results);
          }
          break;
        }
        case 'battle_end': {
          // Cancel any pending force-end grace timer
          if (endTimerRef.current !== null) {
            clearTimeout(endTimerRef.current);
            endTimerRef.current = null;
          }
          // Give a brief moment for results to render before transitioning
          setTimeout(() => {
            onBattleEnd(
              msg.winner_name,
              msg.winner_player_id,
              playerId,
              myResults,
              opponentResults,
              players
            );
          }, 1500);
          break;
        }
      }
    },
    [fetchProblem, playerId, myResults, opponentResults, players, onBattleEnd]
  );

  useBattleSocket({
    battleId,
    playerId,
    onMessage: handleMessage,
    reconnect: true,
  });

  const handleSubmit = useCallback(
    async (code: string, language: Language) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      codeRef.current = code;
      languageRef.current = language;
      setSubmitting(true);
      setSubmitted(true);
      try {
        await api.submit(battleId, playerId, code, language);
      } catch (err) {
        console.error('Submit failed:', err);
        setSubmitting(false);
        // Don't un-submit — server may have received it
      }
    },
    [battleId, playerId]
  );

  const handleRun = useCallback(
    async (code: string, language: Language) => {
      setRunning(true);
      try {
        const data = await api.runCode(battleId, playerId, code, language);
        setRunResults(data.results ?? []);
        setRunPassed(data.passed ?? 0);
      } catch (err) {
        console.error('Run failed:', err);
      } finally {
        setRunning(false);
      }
    },
    [battleId, playerId],
  );

  // Auto-submit on time up, then force-end after a grace period if no battle_end arrives
  const handleTimeUp = useCallback(() => {
    if (!submittedRef.current) {
      handleSubmit(codeRef.current, languageRef.current);
    }
    // Give 8 s for in-flight submission results to arrive, then force resolution
    endTimerRef.current = setTimeout(() => {
      api.endBattle(battleId, playerId).catch(console.error);
    }, 8000);
  }, [handleSubmit, battleId, playerId]);

  // Clean up the grace timer if the component unmounts
  useEffect(() => () => {
    if (endTimerRef.current !== null) clearTimeout(endTimerRef.current);
  }, []);

  // Keep code/language refs updated via a proxy exposed to EditorPanel
  const handleEditorChange = useCallback((code: string, language: Language) => {
    codeRef.current = code;
    languageRef.current = language;
  }, []);

  const isWaiting = !startedAt;

  return (
    <div className="flex flex-col h-screen bg-bg overflow-hidden">
      <BattleHeader
        players={players}
        myPlayerId={playerId}
        startedAt={startedAt}
        onTimeUp={handleTimeUp}
      />

      {isWaiting ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-muted text-sm mb-4">Share this code with your opponent</p>
            <div className="inline-block bg-surface border border-border rounded px-8 py-5 mb-5">
              <p className="text-muted text-xs uppercase tracking-wide mb-2">Join Code</p>
              <span className="text-accent font-mono text-4xl font-bold tracking-widest">
                {joinCode}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted text-xs">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="animate-spin">
                <path d="M7 1.5A5.5 5.5 0 1 1 1.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Waiting for opponent to join...
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Problem panel — 40% */}
          <div className="w-2/5 shrink-0 overflow-hidden">
            <ProblemPanel problem={problem} />
          </div>

          {/* Editor + results — 60% */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <EditorPanel
                problem={problem}
                onRun={handleRun}
                onSubmit={handleSubmit}
                onCodeChange={handleEditorChange}
                running={running}
                submitting={submitting}
                submitted={submitted}
              />
            </div>

            <ResultsPanel
              results={myResults ?? runResults}
              totalCases={myResults ? myTotalCases : runResults ? runResults.length : null}
              passedCases={myResults ? myPassedCases : runPassed}
              isWaiting={waitingForResults || running}
              resultSource={myResults ? 'submit' : runResults ? 'run' : null}
            />
          </div>
        </div>
      )}
    </div>
  );
}
