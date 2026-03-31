import type { Problem } from '../types/battle';

interface ProblemPanelProps {
  problem: Problem | null;
}

const difficultyConfig = {
  easy: { label: 'Easy', color: 'text-pass', bg: 'bg-pass/10 border-pass/20' },
  medium: { label: 'Medium', color: 'text-warn', bg: 'bg-warn/10 border-warn/20' },
  hard: { label: 'Hard', color: 'text-fail', bg: 'bg-fail/10 border-fail/20' },
};

export default function ProblemPanel({ problem }: ProblemPanelProps) {
  if (!problem) {
    return (
      <div className="flex flex-col h-full bg-bg border-r border-border overflow-auto p-5">
        <div className="flex flex-col gap-3">
          <div className="h-5 w-1/2 bg-surface rounded animate-pulse" />
          <div className="h-3 w-1/4 bg-surface rounded animate-pulse" />
          <div className="h-24 bg-surface rounded animate-pulse mt-2" />
        </div>
      </div>
    );
  }

  const diff = difficultyConfig[problem.difficulty];

  return (
    <div className="flex flex-col h-full bg-bg border-r border-border overflow-auto">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-text font-semibold text-base leading-snug">{problem.title}</h1>
          <span
            className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded border ${diff.color} ${diff.bg}`}
          >
            {diff.label}
          </span>
        </div>
        <div className="flex items-center gap-4 text-muted text-xs">
          <span>Time limit: {problem.time_limit_ms}ms</span>
          <span>Memory: {problem.memory_limit_mb}MB</span>
        </div>
      </div>

      {/* Description */}
      <div className="px-5 py-4 border-b border-border shrink-0">
        <div className="prose-sm text-text text-sm leading-relaxed whitespace-pre-wrap">
          {problem.description}
        </div>
      </div>

      {/* Visible Test Cases */}
      <div className="px-5 py-4">
        <h2 className="text-muted text-xs font-medium uppercase tracking-wide mb-3">
          Examples
        </h2>
        <div className="flex flex-col gap-3">
          {problem.visible_test_cases.map((tc, idx) => (
            <div key={tc.id} className="bg-surface border border-border rounded">
              <div className="px-3 py-1.5 border-b border-border">
                <span className="text-muted text-xs font-medium">Example {idx + 1}</span>
              </div>
              <div className="px-3 py-2.5 flex flex-col gap-2">
                <div>
                  <span className="text-muted text-xs">Input</span>
                  <pre className="mt-1 font-mono text-xs text-text bg-bg border border-border rounded px-2.5 py-2 overflow-x-auto">
                    {tc.input_display}
                  </pre>
                </div>
                <div>
                  <span className="text-muted text-xs">Expected Output</span>
                  <pre className="mt-1 font-mono text-xs text-text bg-bg border border-border rounded px-2.5 py-2 overflow-x-auto">
                    {tc.expected_output}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
