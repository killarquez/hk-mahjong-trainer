/**
 * TypeScript Data Models for Mahjong Efficiency Trainer
 */

export interface FormattedTile {
  code: string;
  unicode: string;
  chinese: string;
  jyutping: string;
  english: string;
  suit: 'm' | 'p' | 's' | 'z';
  value: number;
  is_terminal: boolean;
  is_honor: boolean;
}

export interface AcceptedTileOut {
  tile: string;
  unicode: string;
  chinese: string;
  jyutping: string;
  english: string;
  suit: string;
  value: number;
  count: number;
  resulting_shanten: number;
  status_text: string;
}

export interface ViablePath {
  name: string;
  fan: number;
  shanten: number;
  code: string;
}

export interface DiscardEvaluation {
  tile: string;
  unicode: string;
  chinese: string;
  jyutping: string;
  english: string;
  suit: string;
  value: number;
  shanten: number;
  shanten_text: string;
  total_outs: number;
  outs_count: number;
  unique_acceptance_count: number;
  accepted_tiles: AcceptedTileOut[];
  viable_paths: ViablePath[];
  is_chicken_hand_trap: boolean;
  unconstrained_shanten: number;
  is_optimal: boolean;
}

export interface HandEvaluation {
  hand_tiles: string[];
  seat_wind: string;
  prevailing_wind: string;
  is_winning_hand: boolean;
  winning_fan?: FanCalculationResponse;
  best_shanten: number;
  max_outs: number;
  optimal_discard: string;
  optimal_discards: string[];
  summary_en: string;
  summary_zh: string;
  discards: DiscardEvaluation[];
  comparison?: UserComparison;
}

export interface UserComparison {
  is_correct: boolean;
  status: 'optimal' | 'suboptimal';
  title_en: string;
  title_zh: string;
  user_discard: string;
  user_discard_info: Record<string, any>;
  user_outs: number;
  user_shanten: number;
  user_accepted_tiles: AcceptedTileOut[];
  user_viable_paths: ViablePath[];
  optimal_discard: string;
  optimal_discard_info: Record<string, any>;
  optimal_discards: string[];
  best_outs: number;
  best_shanten: number;
  best_accepted_tiles: AcceptedTileOut[];
  best_viable_paths: ViablePath[];
  outs_delta: number;
  shanten_delta: number;
  delta_reasoning_en: string;
  delta_reasoning_zh: string;
  evaluation: HandEvaluation;
}

export interface NextTurnResponse {
  drawn_tile: string;
  drawn_tile_info: Record<string, any>;
  hand_tiles: string[];
  seat_wind: string;
  prevailing_wind: string;
  evaluation: HandEvaluation;
}

export interface FanCalculationBreakdown {
  code: string;
  name: string;
  jyutping: string;
  fan: number;
  desc: string;
}

export interface FanCalculationResponse {
  is_valid_win: boolean;
  total_fan: number;
  hand_name: string;
  breakdown: FanCalculationBreakdown[];
  is_limit: boolean;
  min_fan_rule_applied: boolean;
  payout?: any;
  error?: string;
}
