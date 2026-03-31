export type Language = 'python' | 'javascript' | 'java';
export type BattleStatus = 'waiting' | 'active' | 'finished';

export interface VisibleTestCase {
  id: number;
  input_display: string;
  expected_output: string;
}

export interface Problem {
  problem_id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  function_signature: Record<Language, string>;
  visible_test_cases: VisibleTestCase[];
  time_limit_ms: number;
  memory_limit_mb: number;
}

export interface PlayerState {
  player_id: string;
  name: string;
  submitted: boolean;
  passed_cases: number;
}

export interface TestResult {
  case_id: number;
  passed: boolean;
  actual_output: string;
  expected_output: string;
  execution_time_ms: number;
  error: string | null;
  visible: boolean;
}

export interface SubmissionResult {
  player_id: string;
  total_cases: number;
  passed_cases: number;
  test_results: TestResult[];
}

export type WsMessage =
  | {
      type: 'battle_state';
      status: BattleStatus;
      players: PlayerState[];
      your_player_id: string;
      started_at: string | null;
    }
  | { type: 'opponent_joined'; player: { player_id: string; name: string } }
  | { type: 'battle_start'; problem_id: number; started_at: string }
  | { type: 'submission_queued'; player_id: string; submitted_at: string }
  | {
      type: 'submission_result';
      player_id: string;
      total_cases: number;
      passed_cases: number;
      test_results: TestResult[];
    }
  | {
      type: 'battle_end';
      winner_player_id: string;
      winner_name: string;
      reason: string;
    };
