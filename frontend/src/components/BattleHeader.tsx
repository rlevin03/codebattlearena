import { useEffect, useState } from 'react';
import type { PlayerState } from '../types/battle';

interface BattleHeaderProps {
  players: PlayerState[];
  myPlayerId: string;
  startedAt: string | null;
  onTimeUp: () => void;
}

const BATTLE_DURATION_SECONDS = 5 * 60; // 5 minutes

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function BattleHeader({
  players,
  myPlayerId,
  startedAt,
  onTimeUp,
}: BattleHeaderProps) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [timeUpFired, setTimeUpFired] = useState(false);

  useEffect(() => {
    if (!startedAt) return;

    const calcSeconds = () => {
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      return Math.max(0, BATTLE_DURATION_SECONDS - elapsed);
    };

    setSecondsLeft(calcSeconds());

    const interval = setInterval(() => {
      const left = calcSeconds();
      setSecondsLeft(left);
      if (left === 0 && !timeUpFired) {
        setTimeUpFired(true);
        onTimeUp();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [startedAt, onTimeUp, timeUpFired]);

  const isLow = secondsLeft !== null && secondsLeft < 60;

  const me = players.find((p) => p.player_id === myPlayerId);
  const opponent = players.find((p) => p.player_id !== myPlayerId);

  return (
    <header className="h-12 bg-surface border-b border-border flex items-center px-4 gap-4 shrink-0">
      <div className="flex items-center gap-2 mr-2">
        <svg
          width="20"
          height="20"
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
        <span className="text-text font-semibold text-sm tracking-tight hidden sm:inline">
          Code<span className="text-accent">Battle</span>Arena
        </span>
      </div>

      <div className="h-5 w-px bg-border" />

      <div className="flex items-center gap-1.5">
        <svg
          width="13"
          height="13"
          viewBox="0 0 13 13"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="6.5"
            cy="7"
            r="5"
            stroke={isLow ? '#f85149' : '#8b949e'}
            strokeWidth="1.3"
          />
          <path
            d="M6.5 4.5V7L8 8"
            stroke={isLow ? '#f85149' : '#8b949e'}
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path d="M5 1.5H8" stroke={isLow ? '#f85149' : '#8b949e'} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <span
          className={`font-mono text-sm font-semibold tabular-nums ${
            isLow ? 'text-fail' : secondsLeft !== null ? 'text-text' : 'text-muted'
          }`}
        >
          {secondsLeft !== null ? formatTime(secondsLeft) : '--:--'}
        </span>
      </div>

      <div className="h-5 w-px bg-border" />

      <div className="flex items-center gap-4 flex-1">
        {me && <PlayerChip player={me} isMe />}
        <span className="text-muted text-xs font-medium">vs</span>
        {opponent ? (
          <PlayerChip player={opponent} isMe={false} />
        ) : (
          <span className="text-muted text-xs italic">Waiting for opponent...</span>
        )}
      </div>
    </header>
  );
}

interface PlayerChipProps {
  player: PlayerState;
  isMe: boolean;
}

function PlayerChip({ player, isMe }: PlayerChipProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm font-medium ${isMe ? 'text-accent' : 'text-text'}`}>
        {player.name}
        {isMe && <span className="text-muted text-xs ml-1">(you)</span>}
      </span>

      {player.submitted ? (
        <div className="flex items-center gap-1">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.5 7L5.5 10L11.5 4"
              stroke="#3fb950"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {player.passed_cases > 0 && (
            <span className="text-pass text-xs font-mono">{player.passed_cases}</span>
          )}
        </div>
      ) : (
        <span className="text-muted text-xs">...</span>
      )}
    </div>
  );
}
