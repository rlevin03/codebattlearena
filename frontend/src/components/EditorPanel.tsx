import { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type { Language, Problem } from '../types/battle';

interface EditorPanelProps {
  problem: Problem | null;
  onRun: (code: string, language: Language) => void;
  onSubmit: (code: string, language: Language) => void;
  onCodeChange?: (code: string, language: Language) => void;
  running: boolean;
  submitting: boolean;
  submitted: boolean;
}

const LANGUAGES: { value: Language; label: string; monacoLang: string }[] = [
  { value: 'python', label: 'Python', monacoLang: 'python' },
  { value: 'javascript', label: 'JavaScript', monacoLang: 'javascript' },
  { value: 'java', label: 'Java', monacoLang: 'java' },
];

const starters: Record<Language, (sig: string) => string> = {
  python: (sig) => `${sig}\n    # Write your solution here\n    pass\n`,
  javascript: (sig) => `${sig}\n    // Write your solution here\n}\n`,
  java: (sig) =>
    `class Solution {\n    ${sig}\n        // Write your solution here\n    }\n}\n`,
};

function getStarterCode(problem: Problem | null, language: Language): string {
  if (!problem) return '';
  const sig = problem.function_signature[language] ?? '';
  return starters[language](sig);
}

export default function EditorPanel({
  problem,
  onRun,
  onSubmit,
  onCodeChange,
  running,
  submitting,
  submitted,
}: EditorPanelProps) {
  const [language, setLanguage] = useState<Language>('python');
  const [code, setCode] = useState<string>(() => getStarterCode(problem, 'python'));

  const handleLanguageChange = useCallback(
    (lang: Language) => {
      const newCode = getStarterCode(problem, lang);
      setLanguage(lang);
      setCode(newCode);
      onCodeChange?.(newCode, lang);
    },
    [problem, onCodeChange]
  );

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      const newCode = value ?? '';
      setCode(newCode);
      onCodeChange?.(newCode, language);
    },
    [language, onCodeChange]
  );

  const handleRun = () => {
    if (!running && !submitting) onRun(code, language);
  };

  const handleSubmit = () => {
    if (!submitted && !submitting && !running) onSubmit(code, language);
  };

  const selectedLang = LANGUAGES.find((l) => l.value === language)!;

  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="h-10 shrink-0 border-b border-border bg-surface flex items-center justify-between px-3 gap-3">
        <div className="flex items-center gap-0.5">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              onClick={() => handleLanguageChange(lang.value)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                language === lang.value
                  ? 'bg-accent/15 text-accent'
                  : 'text-muted hover:text-text hover:bg-white/5'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            disabled={running || submitting || submitted || !problem}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border border-border text-muted hover:text-text hover:border-accent/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {running ? (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="animate-spin">
                  <path d="M6 1.5A4.5 4.5 0 1 1 1.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Running...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 2.5L9.5 6L3 9.5V2.5Z" fill="currentColor" />
                </svg>
                Run
              </>
            )}
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting || submitted || running || !problem}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold transition-colors ${
              submitted
                ? 'bg-pass/10 text-pass border border-pass/30 cursor-default'
                : submitting
                ? 'bg-accent/10 text-muted border border-border cursor-not-allowed'
                : 'bg-accent text-bg hover:bg-accent/90 disabled:opacity-50'
            }`}
          >
            {submitted ? (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 6L5 9L10 3" stroke="#3fb950" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Submitted
              </>
            ) : submitting ? (
              'Submitting...'
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 6H10M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Submit
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {problem ? (
          <Editor
            height="100%"
            language={selectedLang.monacoLang}
            value={code}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true,
              lineNumbers: 'on',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 12, bottom: 12 },
              tabSize: 4,
              insertSpaces: true,
              wordWrap: 'off',
              renderLineHighlight: 'line',
              lineNumbersMinChars: 3,
              glyphMargin: false,
              folding: true,
              automaticLayout: true,
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
              },
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted text-sm">
            Waiting for battle to start...
          </div>
        )}
      </div>
    </div>
  );
}
