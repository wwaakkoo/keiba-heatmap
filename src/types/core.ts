/**
 * 競馬予想アプリのコアデータ型定義
 */

import {
  Gender,
  TrackCondition,
  Surface,
  RaceClass,
  DistanceCategory,
  InvestmentResult,
  InvestmentStrategy,
  FinishPosition,
} from './enums';

// 基本的な識別子型
export type ID = string;
export type Timestamp = Date;

// 騎手情報
export interface Jockey {
  id: ID;
  name: string;
  winRate: number; // 勝率
  placeRate: number; // 連対率
  showRate: number; // 複勝率
  recentForm: number[]; // 直近の成績
}

// 調教師情報
export interface Trainer {
  id: ID;
  name: string;
  winRate: number;
  placeRate: number;
  showRate: number;
}

// 過去成績
export interface Performance {
  raceId: ID;
  date: Timestamp;
  venue: string;
  distance: number;
  surface: Surface;
  condition: TrackCondition;
  finishPosition: FinishPosition;
  margin: number; // 着差
  time: string; // タイム
  weight: number; // 斤量
  jockeyId: ID;
}

// オッズ情報
export interface Odds {
  win: number; // 単勝オッズ
  place: [number, number]; // 複勝オッズ範囲 [最小, 最大]
}

// 馬情報
export interface Horse {
  id: ID;
  name: string;
  number: number; // 馬番
  age: number;
  gender: Gender;
  weight: number; // 斤量
  jockey: Jockey;
  trainer: Trainer;
  odds: Odds;
  pastPerformances: Performance[];
  // 計算用フィールド
  distanceAptitude?: number; // 距離適性スコア
  venueAptitude?: number; // コース適性スコア
  recentFormScore?: number; // 直近成績スコア
}

// レース情報
export interface Race {
  id: ID;
  date: Timestamp;
  venue: string; // 競馬場名
  raceNumber: number; // レース番号
  title: string; // レース名
  distance: number; // 距離
  surface: Surface; // コース種別
  condition: TrackCondition; // 馬場状態
  raceClass: RaceClass; // レースクラス
  distanceCategory: DistanceCategory; // 距離カテゴリ
  horses: Horse[];
  predictions?: Prediction[];
  result?: RaceResult;
  // メタデータ
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 予想結果
export interface Prediction {
  id: ID;
  raceId: ID;
  horseId: ID;
  baseScore: number; // 基礎スコア (0-100)
  expectedValue: number; // 期待値 (1.0 = 100%)
  confidence: number; // 信頼度 (0-1)
  isRecommended: boolean; // 推奨フラグ (期待値120%以上)
  reasoning: string[]; // 推奨理由
  calculatedAt: Timestamp;
}

// レース結果
export interface RaceResult {
  raceId: ID;
  results: HorseResult[];
  payouts: Payout[];
  recordedAt: Timestamp;
}

// 馬の結果
export interface HorseResult {
  horseId: ID;
  finishPosition: FinishPosition;
  time?: string;
  margin?: number; // 着差
}

// 払戻情報
export interface Payout {
  betType: string; // 券種 (単勝、複勝等)
  combination: number[]; // 組み合わせ (馬番)
  payout: number; // 払戻金
}

// 投資記録
export interface Investment {
  id: ID;
  raceId: ID;
  horseId: ID;
  amount: number; // 投資額
  odds: number; // 投資時オッズ
  result: InvestmentResult;
  payout: number; // 払戻金 (0 if lose)
  profit: number; // 利益 (payout - amount)
  date: Timestamp;
  // 投資判断の記録
  expectedValue: number;
  confidence: number;
  reasoning: string[];
}

// バンクロール状態
export interface BankrollStatus {
  currentBalance: number; // 現在残高
  initialBalance: number; // 初期残高
  totalInvested: number; // 総投資額
  totalReturned: number; // 総回収額
  totalProfit: number; // 総利益
  roi: number; // ROI (Return on Investment)
  maxDrawdown: number; // 最大ドローダウン
  winRate: number; // 勝率
  averageOdds: number; // 平均オッズ
  lastUpdated: Timestamp;
}

// パフォーマンス指標
export interface PerformanceMetrics {
  period: {
    start: Timestamp;
    end: Timestamp;
  };
  totalBets: number;
  winningBets: number;
  winRate: number;
  roi: number;
  profit: number;
  averageOdds: number;
  maxDrawdown: number;
  sharpeRatio?: number; // シャープレシオ
  // カテゴリ別分析
  byDistance: Record<DistanceCategory, PerformanceMetrics>;
  byVenue: Record<string, PerformanceMetrics>;
  byClass: Record<RaceClass, PerformanceMetrics>;
}

// ユーザー設定
export interface UserSettings {
  // 投資設定
  investment: {
    strategy: InvestmentStrategy;
    initialBankroll: number;
    betSizePercentage: number; // 1-5%
    dailyLossLimit: number; // 日次損失上限
    maxExposure: number; // 最大露出額
  };
  // 予想設定
  prediction: {
    minimumExpectedValue: number; // 最小期待値 (デフォルト: 1.2)
    minimumConfidence: number; // 最小信頼度 (デフォルト: 0.6)
    weights: {
      pastPerformance: number;
      jockeyPerformance: number;
      distanceAptitude: number;
      venueAptitude: number;
      classAptitude: number;
    };
  };
  // UI設定
  ui: {
    theme: 'light' | 'dark' | 'system';
    language: 'ja' | 'en';
    notifications: boolean;
    autoSave: boolean;
  };
  // データ設定
  data: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    retentionPeriod: number; // 日数
  };
}
// アプリケーション設定 (Key-Value形式でのストレージ用)
export interface AppSettings {
  key: string;
  value: unknown;
  updatedAt: Timestamp;
}

// バリデーション結果
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// バリデーションエラー
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// 操作結果
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Timestamp;
}
