import { useState } from 'react';
import type { TestResult } from '../types/battle';

interface ResultsPanelProps {
  results: TestResult[] | null;
  totalCases: number | null;
  passedCases: number | null;
  isWaiting: boolean;
  resultSource: 'run' | 'submit' | null;
}

export default function ResultsPanel({
  results,
  totalCases,
  passedCases,
  isWaiting,
  resultSource,
}: ResultsPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedCase, setExpandedCase] = useState<number | null>(null);

  const hasResults = results && results.length > 0;

  return (
    <div
      className={`border-t border-border bg-surface flex flex-col shrink-0 ${
        collapsed ? 'h-10' : 'h-52'
      }`}
    >
      <div
        className="h-10 flex items-center justify-between px-4 cursor-pointer hover:bg-white/5 shrink-0"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-3">
          <span className="text-muted text-xs font-medium uppercase tracking-wide">
            {resultSource === 'submit' ? 'Submission Results' : resultSource === 'run' ? 'Run Results' : 'Test Results'}
          </span>

          {hasResults && (
            <span
              className={`text-xs font-semibold ${
                passedCases === totalCases ? 'text-pass' : 'text-fail'
              }`}
            >
              {passedCases}/{totalCases} passed
            </span>
          )}

          {isWaiting && !hasResults && (
            <span className="text-warn text-xs flex items-center gap-1.5">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className="animate-spin"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 1.5A4.5 4.5 0 1 1 1.5 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Running tests...
            </span>
          )}
        </div>

        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`text-muted transition-transform ${collapsed ? '' : 'rotate-180'}`}
        >
          <path
            d="M3 5L7 9L11 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {!hasResults && !isWaiting && (
            <div className="flex items-center justify-center h-full text-muted text-xs">
              Submit your code to see results
            </div>
          )}

          {hasResults && (
            <div className="flex flex-col gap-1">
              {results.map((result) => (
                <div key={result.case_id}>
                  <button
                    onClick={() =>
                      setExpandedCase(expandedCase === result.case_id ? null : result.case_id)
                    }
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left hover:bg-white/5 border ${
                      result.passed
                        ? 'border-pass/20 bg-pass/5'
                        : 'border-fail/20 bg-fail/5'
                    }`}
                  >
                    {result.passed ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="shrink-0"
                      >
                        <path
                          d="M2.5 7L5.5 10L11.5 4"
                          stroke="#3fb950"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="shrink-0"
                      >
                        <path
                          d="M4 4L10 10M10 4L4 10"
                          stroke="#f85149"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}

                    <span className="text-text text-xs font-medium flex-1">
                      {result.visible ? `Case ${result.case_id}` : `Hidden Case ${result.case_id}`}
                    </span>

                    <span className="text-muted text-xs font-mono">
                      {result.execution_time_ms}ms
                    </span>

                    {!result.passed && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={`text-muted transition-transform shrink-0 ${
                          expandedCase === result.case_id ? 'rotate-180' : ''
                        }`}
                      >
                        <path
                          d="M2 4L6 8L10 4"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>

                  {expandedCase === result.case_id && !result.passed && (
                    <div className="ml-4 mt-1 mb-1 bg-bg border border-border rounded p-3 flex flex-col gap-2">
                      {result.error ? (
                        <div>
                          <p className="text-muted text-xs mb-1">Error</p>
                          <pre className="font-mono text-xs text-fail bg-fail/5 border border-fail/20 rounded px-2.5 py-2 overflow-x-auto whitespace-pre-wrap">
                            {result.error}
                          </pre>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="text-muted text-xs mb-1">Expected</p>
                            <pre className="font-mono text-xs text-pass bg-pass/5 border border-pass/20 rounded px-2.5 py-2 overflow-x-auto">
                              {result.expected_output}
                            </pre>
                          </div>
                          <div>
                            <p className="text-muted text-xs mb-1">Got</p>
                            <pre className="font-mono text-xs text-fail bg-fail/5 border border-fail/20 rounded px-2.5 py-2 overflow-x-auto">
                              {result.actual_output}
                            </pre>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
