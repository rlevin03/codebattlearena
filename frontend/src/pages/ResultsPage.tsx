import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { PlayerState } from '../types/battle';

interface FullTestCase {
  id: number;
  input_display: string;
  expected_output: string;
  visible: boolean;
  passed: boolean | null;
  actual_output: string | null;
  execution_time_ms: number | null;
  error: string | null;
}

interface FullResults {
  problem_title: string;
  submitted: boolean;
  test_cases: FullTestCase[];
}

interface ResultsPageProps {
  battleId: string;
  myPlayerId: string;
  winnerName: string;
  winnerPlayerId: string;
  players: PlayerState[];
  onPlayAgain: () => void;
}

export default function ResultsPage({
  battleId,
  myPlayerId,
  winnerName,
  winnerPlayerId,
  players,
  onPlayAgain,
}: ResultsPageProps) {
  const [fullResults, setFullResults] = useState<FullResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCase, setExpandedCase] = useState<number | null>(null);

  const iWon = winnerPlayerId === myPlayerId;
  const me = players.find((p) => p.player_id === myPlayerId);
  const opponent = players.find((p) => p.player_id !== myPlayerId);

  useEffect(() => {
    api
      .getFullResults(battleId, myPlayerId)
      .then((data) => setFullResults(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [battleId, myPlayerId]);

  const passed = fullResults?.test_cases.filter((tc) => tc.passed).length ?? me?.passed_cases ?? 0;
  const total = fullResults?.test_cases.length ?? null;

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center py-10 px-4">
      {/* Brand */}
      <div className="flex items-center gap-2 mb-10">
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="4" fill="#58a6ff" fillOpacity="0.15" />
          <path
            d="M10 20L6 16L10 12M22 12L26 16L22 20M18 10L14 22"
            stroke="#58a6ff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-text font-semibold text-sm tracking-tight">
          Code<span className="text-accent">Battle</span>Arena
        </span>
      </div>

      {/* Winner banner */}
      <div
        className={`w-full max-w-2xl border rounded mb-6 ${
          iWon ? 'bg-pass/10 border-pass/30' : 'bg-fail/10 border-fail/30'
        }`}
      >
        <div className="px-6 py-6 text-center">
          <div className="text-4xl mb-3">{iWon ? '🏆' : '💀'}</div>
          <h1 className={`text-2xl font-bold mb-1 ${iWon ? 'text-pass' : 'text-fail'}`}>
            {iWon ? 'Victory!' : 'Defeated'}
          </h1>
          <p className="text-muted text-sm">
            {iWon ? 'You won this battle. Well played.' : `${winnerName} won this battle.`}
          </p>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="w-full max-w-2xl bg-surface border border-border rounded mb-6">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-muted text-xs font-medium uppercase tracking-wide">Scoreboard</span>
        </div>
        <div className="divide-y divide-border">
          <ScoreRow
            name={me?.name ?? 'You'}
            isMe
            isWinner={winnerPlayerId === myPlayerId}
            passed={me?.passed_cases ?? 0}
          />
          {opponent && (
            <ScoreRow
              name={opponent.name}
              isMe={false}
              isWinner={winnerPlayerId === opponent.player_id}
              passed={opponent.passed_cases}
            />
          )}
        </div>
      </div>

      {/* Full test case breakdown */}
      <div className="w-full max-w-2xl bg-surface border border-border rounded mb-6">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-muted text-xs font-medium uppercase tracking-wide">
            {fullResults?.problem_title ?? 'Your Results'}
          </span>
          {total !== null && (
            <span
              className={`text-xs font-semibold font-mono ${
                passed === total ? 'text-pass' : passed > 0 ? 'text-warn' : 'text-fail'
              }`}
            >
              {passed}/{total} passed
            </span>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10 gap-2 text-muted text-sm">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
              <path d="M7 1.5A5.5 5.5 0 1 1 1.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Loading results...
          </div>
        )}

        {!loading && !fullResults?.submitted && (
          <div className="flex items-center justify-center py-10 text-muted text-sm">
            No submission recorded for this battle.
          </div>
        )}

        {!loading && fullResults?.submitted && (
          <div className="divide-y divide-border">
            {fullResults.test_cases.map((tc) => {
              const isExpanded = expandedCase === tc.id;
              const hasDetail = tc.passed === false;
              return (
                <div key={tc.id}>
                  <button
                    onClick={() => hasDetail && setExpandedCase(isExpanded ? null : tc.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left ${
                      hasDetail ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    {/* Pass/fail icon */}
                    {tc.passed === true ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                        <path d="M2.5 7L5.5 10L11.5 4" stroke="#3fb950" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : tc.passed === false ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                        <path d="M4 4L10 10M10 4L4 10" stroke="#f85149" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-muted">
                        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" strokeDasharray="3 2" />
                      </svg>
                    )}

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-text text-xs font-medium">
                          {tc.visible ? `Case ${tc.id}` : `Hidden Case ${tc.id}`}
                        </span>
                        {!tc.visible && (
                          <span className="text-muted text-xs bg-border/50 rounded px-1.5 py-0.5">hidden</span>
                        )}
                      </div>
                      {/* Input preview always shown */}
                      <p className="text-muted text-xs font-mono truncate mt-0.5">
                        input: {tc.input_display}
                      </p>
                    </div>

                    {/* Time */}
                    {tc.execution_time_ms !== null && (
                      <span className="text-muted text-xs font-mono shrink-0">{tc.execution_time_ms}ms</span>
                    )}

                    {/* Chevron for expandable rows */}
                    {hasDetail && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        className={`text-muted shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      >
                        <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && tc.passed === false && (
                    <div className="mx-4 mb-3 bg-bg border border-border rounded p-3 flex flex-col gap-3">
                      {/* Input */}
                      <div>
                        <p className="text-muted text-xs mb-1">Input</p>
                        <pre className="font-mono text-xs text-text bg-surface border border-border rounded px-2.5 py-2 overflow-x-auto">
                          {tc.input_display}
                        </pre>
                      </div>

                      {tc.error ? (
                        <div>
                          <p className="text-muted text-xs mb-1">Error</p>
                          <pre className="font-mono text-xs text-fail bg-fail/5 border border-fail/20 rounded px-2.5 py-2 overflow-x-auto whitespace-pre-wrap">
                            {tc.error}
                          </pre>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-muted text-xs mb-1">Expected</p>
                            <pre className="font-mono text-xs text-pass bg-pass/5 border border-pass/20 rounded px-2.5 py-2 overflow-x-auto">
                              {tc.expected_output}
                            </pre>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-muted text-xs mb-1">Got</p>
                            <pre className="font-mono text-xs text-fail bg-fail/5 border border-fail/20 rounded px-2.5 py-2 overflow-x-auto">
                              {tc.actual_output ?? '(no output)'}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={onPlayAgain}
        className="bg-accent text-bg font-semibold px-6 py-2.5 rounded text-sm hover:bg-accent/90"
      >
        Back to Lobby
      </button>
    </div>
  );
}

interface ScoreRowProps {
  name: string;
  isMe: boolean;
  isWinner: boolean;
  passed: number;
}

function ScoreRow({ name, isMe, isWinner, passed }: ScoreRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        {isWinner && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 4L7 2L12 4L11 9H3L2 4Z" stroke="#d29922" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M5 9V11H9V9" stroke="#d29922" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        )}
        <span className={`text-sm font-medium ${isMe ? 'text-accent' : 'text-text'}`}>
          {name}
          {isMe && <span className="text-muted text-xs ml-1">(you)</span>}
        </span>
      </div>
      <span className="text-muted text-sm font-mono">{passed} passed</span>
    </div>
  );
}
