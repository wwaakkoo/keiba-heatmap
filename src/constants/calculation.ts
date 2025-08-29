/**
 * 計算関連の定数定義
 */

// 予想計算の重み設定
export const DEFAULT_CALCULATION_WEIGHTS = {
  pastPerformance: 0.4, // 過去成績の重み
  jockeyPerformance: 0.2, // 騎手成績の重み
  distanceAptitude: 0.2, // 距離適性の重み
  venueAptitude: 0.1, // コース適性の重み
  classAptitude: 0.1, // クラス適性の重み
} as const;

// 期待値計算の閾値
export const EXPECTED_VALUE_THRESHOLDS = {
  MINIMUM: 1.0, // 最小期待値 (100%)
  RECOMMENDED: 1.2, // 推奨閾値 (120%)
  HIGH_CONFIDENCE: 1.5, // 高信頼度閾値 (150%)
} as const;

// 信頼度計算の閾値
export const CONFIDENCE_THRESHOLDS = {
  MINIMUM: 0.3, // 最小信頼度
  RECOMMENDED: 0.6, // 推奨信頼度
  HIGH: 0.8, // 高信頼度
} as const;

// 投資戦略の設定
export const INVESTMENT_SETTINGS = {
  MIN_BET_PERCENTAGE: 0.01, // 最小投資比率 (1%)
  MAX_BET_PERCENTAGE: 0.05, // 最大投資比率 (5%)
  DEFAULT_BET_PERCENTAGE: 0.02, // デフォルト投資比率 (2%)
  DAILY_LOSS_LIMIT: 0.1, // 日次損失上限 (10%)
  MAX_EXPOSURE: 0.2, // 最大露出額 (20%)
} as const;

// スコア計算の範囲
export const SCORE_RANGES = {
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  AVERAGE_SCORE: 50,
} as const;

// 過去成績の評価期間
export const PERFORMANCE_PERIODS = {
  RECENT_RACES: 5, // 直近レース数
  SEASON_RACES: 20, // シーズン内レース数
  CAREER_RACES: 50, // キャリア通算レース数
} as const;
