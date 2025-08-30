/**
 * 予想計算エンジンの型定義
 */

import { Horse, Race, Prediction } from '@/types/core';

// 予想計算モジュールのインターフェース
export interface PredictionModule {
  calculateBaseScore(horse: Horse, race: Race): number;
  calculateExpectedValue(horse: Horse, odds: number): number;
  calculateConfidence(horse: Horse, race: Race): number;
}

// スコア計算の重み設定
export interface CalculationWeights {
  pastPerformance: number; // 過去成績の重み
  jockeyPerformance: number; // 騎手成績の重み
  distanceAptitude: number; // 距離適性の重み
  venueAptitude: number; // コース適性の重み
  classAptitude: number; // クラス適性の重み
}

// 計算過程のログ
export interface CalculationLog {
  horseId: string;
  horseName: string;
  steps: CalculationStep[];
  finalScore: number;
  expectedValue: number;
  confidence: number;
  timestamp: Date;
}

// 計算ステップの詳細
export interface CalculationStep {
  name: string;
  description: string;
  input: Record<string, unknown>;
  output: number;
  weight: number;
  weightedScore: number;
}

// 過去成績分析結果
export interface PerformanceAnalysis {
  recentFormScore: number; // 直近5走のスコア
  averageFinishPosition: number; // 平均着順
  winRate: number; // 勝率
  placeRate: number; // 連対率
  showRate: number; // 複勝率
  consistencyScore: number; // 安定性スコア
}

// 距離適性分析結果
export interface DistanceAptitudeAnalysis {
  sameDistanceWinRate: number; // 同距離勝率
  sameDistancePlaceRate: number; // 同距離連対率
  distanceCategoryScore: number; // 距離カテゴリスコア
  optimalDistance: number; // 最適距離
  distanceVariance: number; // 距離バリアンス
}

// コース適性分析結果
export interface VenueAptitudeAnalysis {
  sameVenueWinRate: number; // 同コース勝率
  sameVenuePlaceRate: number; // 同コース連対率
  surfaceAptitude: number; // 芝/ダート適性
  trackConditionAptitude: number; // 馬場状態適性
}

// 騎手成績分析結果
export interface JockeyAnalysis {
  overallWinRate: number; // 全体勝率
  overallPlaceRate: number; // 全体連対率
  recentFormScore: number; // 直近成績スコア
  venueSpecificScore: number; // コース別成績
  distanceSpecificScore: number; // 距離別成績
}

// 予想計算の設定
export interface PredictionConfig {
  weights: CalculationWeights;
  minimumExpectedValue: number; // 推奨閾値
  minimumConfidence: number; // 最小信頼度
  enableLogging: boolean; // ログ出力有効化
  maxRecentRaces: number; // 分析対象の最大レース数
}

// 予想計算結果
export interface PredictionCalculationResult {
  prediction: Prediction;
  log: CalculationLog;
  analysis: {
    performance: PerformanceAnalysis;
    distanceAptitude: DistanceAptitudeAnalysis;
    venueAptitude: VenueAptitudeAnalysis;
    jockeyAnalysis: JockeyAnalysis;
  };
}
