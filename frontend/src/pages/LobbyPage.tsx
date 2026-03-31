import { useState } from 'react';
import { api } from '../lib/api';

type LobbyMode = 'home' | 'creating' | 'joining';

interface CreateResult {
  battle_id: string;
  join_code: string;
  player_id: string;
}

interface LobbyPageProps {
  onBattleJoined: (battleId: string, playerId: string, playerName: string, joinCode: string) => void;
}

export default function LobbyPage({ onBattleJoined }: LobbyPageProps) {
  const [mode, setMode] = useState<LobbyMode>('home');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createResult, setCreateResult] = useState<CreateResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await api.createBattle(playerName.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      setCreateResult(result as CreateResult);
      setMode('creating');
    } catch {
      setError('Failed to create battle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!joinCode.trim()) {
      setError('Please enter a join code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await api.joinBattle(joinCode.trim().toUpperCase(), playerName.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      onBattleJoined(result.battle_id, result.player_id, playerName.trim(), joinCode.trim().toUpperCase());
    } catch {
      setError('Failed to join battle. Check the join code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (createResult) {
      navigator.clipboard.writeText(createResult.join_code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
      {/* Logo / Brand */}
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="32" height="32" rx="4" fill="#58a6ff" fillOpacity="0.15" />
            <path
              d="M10 20L6 16L10 12M22 12L26 16L22 20M18 10L14 22"
              stroke="#58a6ff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-2xl font-bold text-text tracking-tight">
            Code<span className="text-accent">Battle</span>Arena
          </span>
        </div>
        <p className="text-muted text-sm">Competitive programming. Head to head. Real time.</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-surface border border-border rounded">
        {mode === 'home' && (
          <div className="p-6">
            <h2 className="text-text font-semibold text-lg mb-5">Enter the Arena</h2>

            {/* Name input */}
            <div className="mb-4">
              <label className="block text-muted text-xs font-medium mb-1.5 uppercase tracking-wide">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
                placeholder="Enter your name"
                maxLength={32}
                className="w-full bg-bg border border-border rounded px-3 py-2 text-text text-sm placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>

            {error && (
              <p className="text-fail text-xs mb-4 bg-fail/10 border border-fail/20 rounded px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full bg-accent text-bg font-semibold py-2.5 rounded text-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Battle'}
              </button>

              <div className="flex items-center gap-3">
                <hr className="flex-1 border-border" />
                <span className="text-muted text-xs">or</span>
                <hr className="flex-1 border-border" />
              </div>

              <button
                onClick={() => {
                  setError('');
                  setMode('joining');
                }}
                className="w-full bg-surface border border-border text-text font-semibold py-2.5 rounded text-sm hover:border-accent/60 hover:text-accent"
              >
                Join with Code
              </button>
            </div>
          </div>
        )}

        {mode === 'joining' && (
          <div className="p-6">
            <button
              onClick={() => {
                setMode('home');
                setError('');
                setJoinCode('');
              }}
              className="flex items-center gap-1.5 text-muted text-xs mb-5 hover:text-text"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 11L5 7L9 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back
            </button>

            <h2 className="text-text font-semibold text-lg mb-5">Join a Battle</h2>

            <div className="mb-4">
              <label className="block text-muted text-xs font-medium mb-1.5 uppercase tracking-wide">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={32}
                className="w-full bg-bg border border-border rounded px-3 py-2 text-text text-sm placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>

            <div className="mb-5">
              <label className="block text-muted text-xs font-medium mb-1.5 uppercase tracking-wide">
                Join Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleJoin();
                }}
                placeholder="e.g. ABC123"
                maxLength={12}
                className="w-full bg-bg border border-border rounded px-3 py-2 text-text text-sm placeholder:text-muted focus:outline-none focus:border-accent font-mono tracking-widest"
              />
            </div>

            {error && (
              <p className="text-fail text-xs mb-4 bg-fail/10 border border-fail/20 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={handleJoin}
              disabled={loading}
              className="w-full bg-accent text-bg font-semibold py-2.5 rounded text-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Join Battle'}
            </button>
          </div>
        )}

        {mode === 'creating' && createResult && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-pass" />
              <span className="text-pass text-sm font-medium">Battle created!</span>
            </div>

            <p className="text-muted text-sm mb-3">
              Share this code with your opponent. The battle will start when they join.
            </p>

            <div className="bg-bg border border-border rounded p-4 mb-4">
              <p className="text-muted text-xs uppercase tracking-wide mb-2">Join Code</p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-accent font-mono text-3xl font-bold tracking-widest">
                  {createResult.join_code}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-text border border-border rounded px-3 py-1.5 hover:border-accent/50"
                >
                  {copied ? (
                    <>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2 6L5 9L10 3"
                          stroke="#3fb950"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-pass">Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="4"
                          y="4"
                          width="7"
                          height="7"
                          rx="1"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                        <path
                          d="M3 8H2C1.45 8 1 7.55 1 7V2C1 1.45 1.45 1 2 1H7C7.55 1 8 1.45 8 2V3"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() =>
                onBattleJoined(
                  createResult.battle_id,
                  createResult.player_id,
                  playerName.trim(),
                  createResult.join_code,
                )
              }
              className="w-full bg-accent text-bg font-semibold py-2.5 rounded text-sm hover:bg-accent/90 mb-3"
            >
              Enter Battle Room
            </button>

            <div className="flex items-center gap-2 text-muted text-xs">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="animate-spin"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 1.5A5.5 5.5 0 1 1 1.5 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Share the code above, then enter when ready.
            </div>
          </div>
        )}
      </div>

      <p className="text-muted text-xs mt-8">
        Solve coding problems faster than your opponent. Best of luck.
      </p>
    </div>
  );
}
