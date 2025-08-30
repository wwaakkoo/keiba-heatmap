/**
 * 予想計算エンジンのメインクラス
 */

import { Horse, Race, Prediction } from '@/types/core';
import { FinishPosition } from '@/types/enums';
import {
  PredictionModule,
  CalculationLog,
  CalculationStep,
  PredictionConfig,
  PredictionCalculationResult,
} from './types';
import { PerformanceAnalyzer } from './analyzers/performanceAnalyzer';
import { DistanceAnalyzer } from './analyzers/distanceAnalyzer';
import { VenueAnalyzer } from './analyzers/venueAnalyzer';
import { JockeyAnalyzer } from './analyzers/jockeyAnalyzer';
import { Logger } from './logger';

export class PredictionEngine implements PredictionModule {
  private config: PredictionConfig;
  private performanceAnalyzer: PerformanceAnalyzer;
  private distanceAnalyzer: DistanceAnalyzer;
  private venueAnalyzer: VenueAnalyzer;
  private jockeyAnalyzer: JockeyAnalyzer;
  private logger: Logger;

  constructor(config: PredictionConfig) {
    this.config = config;
    this.performanceAnalyzer = new PerformanceAnalyzer();
    this.distanceAnalyzer = new DistanceAnalyzer();
    this.venueAnalyzer = new VenueAnalyzer();
    this.jockeyAnalyzer = new JockeyAnalyzer();
    this.logger = new Logger(config.enableLogging);
  }

  /**
   * 馬の基礎スコアを計算
   */
  calculateBaseScore(horse: Horse, race: Race): number {
    const log = this.logger.startCalculation(horse.id, horse.name);

    try {
      // 各要素のスコアを計算
      const performanceScore = this.calculatePerformanceScore(horse, race, log);
      const jockeyScore = this.calculateJockeyScore(horse, race, log);
      const distanceScore = this.calculateDistanceScore(horse, race, log);
      const venueScore = this.calculateVenueScore(horse, race, log);

      // 重み付き合計を計算
      const weights = this.config.weights;
      const baseScore =
        performanceScore * weights.pastPerformance +
        jockeyScore * weights.jockeyPerformance +
        distanceScore * weights.distanceAptitude +
        venueScore * weights.venueAptitude;

      // 0-100の範囲に正規化
      const normalizedScore = Math.max(0, Math.min(100, baseScore));

      log.finalScore = normalizedScore;
      this.logger.endCalculation(log);

      return normalizedScore;
    } catch (error) {
      this.logger.logError(horse.id, 'Base score calculation failed', error);
      return 0;
    }
  }

  /**
   * 期待値を計算
   */
  calculateExpectedValue(horse: Horse, odds: number): number {
    try {
      // 推定勝率を計算（基礎スコアから）
      const baseScore = horse.recentFormScore || 0;
      const estimatedWinProbability = this.scoreToWinProbability(baseScore);

      // 期待値 = 推定勝率 × オッズ
      const expectedValue = estimatedWinProbability * odds;

      this.logger.logStep(horse.id, 'Expected Value Calculation', {
        baseScore,
        estimatedWinProbability,
        odds,
        expectedValue,
      });

      return expectedValue;
    } catch (error) {
      this.logger.logError(
        horse.id,
        'Expected value calculation failed',
        error
      );
      return 0;
    }
  }

  /**
   * 信頼度を計算
   */
  calculateConfidence(horse: Horse, race: Race): number {
    try {
      // データの充実度を評価
      const dataQuality = this.assessDataQuality(horse);

      // 成績の安定性を評価
      const consistency = this.assessConsistency(horse);

      // レース条件との適合度を評価
      const raceMatch = this.assessRaceMatch(horse, race);

      // 信頼度を計算（0-1の範囲）
      const confidence = (dataQuality + consistency + raceMatch) / 3;

      this.logger.logStep(horse.id, 'Confidence Calculation', {
        dataQuality,
        consistency,
        raceMatch,
        confidence,
      });

      return Math.max(0, Math.min(1, confidence));
    } catch (error) {
      this.logger.logError(horse.id, 'Confidence calculation failed', error);
      return 0;
    }
  }

  /**
   * レース全体の予想を生成
   */
  generatePredictions(race: Race): PredictionCalculationResult[] {
    const results: PredictionCalculationResult[] = [];

    for (const horse of race.horses) {
      try {
        const baseScore = this.calculateBaseScore(horse, race);
        const expectedValue = this.calculateExpectedValue(
          horse,
          horse.odds.win
        );
        const confidence = this.calculateConfidence(horse, race);

        const prediction: Prediction = {
          id: `pred_${race.id}_${horse.id}_${Date.now()}`,
          raceId: race.id,
          horseId: horse.id,
          baseScore,
          expectedValue,
          confidence,
          isRecommended:
            expectedValue >= this.config.minimumExpectedValue &&
            confidence >= this.config.minimumConfidence,
          reasoning: this.generateReasoning(
            horse,
            race,
            baseScore,
            expectedValue,
            confidence
          ),
          calculatedAt: new Date(),
        };

        const result: PredictionCalculationResult = {
          prediction,
          log: this.logger.getLog(horse.id),
          analysis: {
            performance: this.performanceAnalyzer.analyze(horse),
            distanceAptitude: this.distanceAnalyzer.analyze(horse, race),
            venueAptitude: this.venueAnalyzer.analyze(horse, race),
            jockeyAnalysis: this.jockeyAnalyzer.analyze(horse, race),
          },
        };

        results.push(result);
      } catch (error) {
        this.logger.logError(horse.id, 'Prediction generation failed', error);
      }
    }

    return results;
  }

  /**
   * 過去成績スコアを計算
   */
  private calculatePerformanceScore(
    horse: Horse,
    _race: Race,
    log: CalculationLog
  ): number {
    const analysis = this.performanceAnalyzer.analyze(horse);
    const score = analysis.recentFormScore;

    const step: CalculationStep = {
      name: 'Performance Score',
      description: '直近5走の成績から算出',
      input: {
        recentRaces: horse.pastPerformances.slice(0, 5).length,
        averagePosition: analysis.averageFinishPosition,
        winRate: analysis.winRate,
      },
      output: score,
      weight: this.config.weights.pastPerformance,
      weightedScore: score * this.config.weights.pastPerformance,
    };

    log.steps.push(step);
    return score;
  }

  /**
   * 騎手成績スコアを計算
   */
  private calculateJockeyScore(
    horse: Horse,
    race: Race,
    log: CalculationLog
  ): number {
    const analysis = this.jockeyAnalyzer.analyze(horse, race);
    const score = analysis.overallWinRate * 100; // 0-100スケールに変換

    const step: CalculationStep = {
      name: 'Jockey Score',
      description: '騎手の勝率・連対率から算出',
      input: {
        jockeyName: horse.jockey.name,
        winRate: horse.jockey.winRate,
        placeRate: horse.jockey.placeRate,
      },
      output: score,
      weight: this.config.weights.jockeyPerformance,
      weightedScore: score * this.config.weights.jockeyPerformance,
    };

    log.steps.push(step);
    return score;
  }

  /**
   * 距離適性スコアを計算
   */
  private calculateDistanceScore(
    horse: Horse,
    race: Race,
    log: CalculationLog
  ): number {
    const analysis = this.distanceAnalyzer.analyze(horse, race);
    const score = analysis.distanceCategoryScore;

    const step: CalculationStep = {
      name: 'Distance Score',
      description: '距離適性から算出',
      input: {
        raceDistance: race.distance,
        sameDistanceWinRate: analysis.sameDistanceWinRate,
        optimalDistance: analysis.optimalDistance,
      },
      output: score,
      weight: this.config.weights.distanceAptitude,
      weightedScore: score * this.config.weights.distanceAptitude,
    };

    log.steps.push(step);
    return score;
  }

  /**
   * コース適性スコアを計算
   */
  private calculateVenueScore(
    horse: Horse,
    race: Race,
    log: CalculationLog
  ): number {
    const analysis = this.venueAnalyzer.analyze(horse, race);
    const score = analysis.sameVenueWinRate * 100; // 0-100スケールに変換

    const step: CalculationStep = {
      name: 'Venue Score',
      description: 'コース適性から算出',
      input: {
        venue: race.venue,
        surface: race.surface,
        sameVenueWinRate: analysis.sameVenueWinRate,
        surfaceAptitude: analysis.surfaceAptitude,
      },
      output: score,
      weight: this.config.weights.venueAptitude,
      weightedScore: score * this.config.weights.venueAptitude,
    };

    log.steps.push(step);
    return score;
  }

  /**
   * スコアを勝率に変換
   */
  private scoreToWinProbability(score: number): number {
    // シグモイド関数を使用してスコアを勝率に変換
    // score 50 → 約10%の勝率、score 80 → 約20%の勝率
    const normalized = (score - 50) / 25; // -2 to 2 の範囲に正規化
    return (1 / (1 + Math.exp(-normalized))) * 0.3; // 最大30%の勝率
  }

  /**
   * データ品質を評価
   */
  private assessDataQuality(horse: Horse): number {
    const recentRaces = horse.pastPerformances.length;
    const hasJockeyData = horse.jockey.winRate > 0;
    const hasTrainerData = horse.trainer.winRate > 0;

    let quality = 0;
    quality += Math.min(recentRaces / 10, 1) * 0.6; // 過去成績の充実度
    quality += hasJockeyData ? 0.2 : 0; // 騎手データの有無
    quality += hasTrainerData ? 0.2 : 0; // 調教師データの有無

    return quality;
  }

  /**
   * 成績の安定性を評価
   */
  private assessConsistency(horse: Horse): number {
    if (horse.pastPerformances.length < 3) return 0.3;

    const positions = horse.pastPerformances
      .slice(0, 5)
      .map(p => this.finishPositionToNumber(p.finishPosition));

    const mean =
      positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
    const variance =
      positions.reduce((sum, pos) => sum + Math.pow(pos - mean, 2), 0) /
      positions.length;
    const standardDeviation = Math.sqrt(variance);

    // 標準偏差が小さいほど安定性が高い
    return Math.max(0, 1 - standardDeviation / 10);
  }

  /**
   * レース条件との適合度を評価
   */
  private assessRaceMatch(horse: Horse, race: Race): number {
    let match = 0.5; // ベースライン

    // 距離適性
    const distanceMatches = horse.pastPerformances.some(
      p => Math.abs(p.distance - race.distance) <= 200
    );
    if (distanceMatches) match += 0.2;

    // コース適性
    const venueMatches = horse.pastPerformances.some(
      p => p.venue === race.venue
    );
    if (venueMatches) match += 0.2;

    // 芝/ダート適性
    const surfaceMatches = horse.pastPerformances.some(
      p => p.surface === race.surface
    );
    if (surfaceMatches) match += 0.1;

    return Math.min(1, match);
  }

  /**
   * 推奨理由を生成
   */
  private generateReasoning(
    horse: Horse,
    race: Race,
    baseScore: number,
    expectedValue: number,
    confidence: number
  ): string[] {
    const reasons: string[] = [];

    if (expectedValue >= this.config.minimumExpectedValue) {
      reasons.push(
        `期待値${(expectedValue * 100).toFixed(1)}%で推奨閾値を上回る`
      );
    }

    if (baseScore >= 70) {
      reasons.push('基礎スコアが高水準');
    }

    if (horse.jockey.winRate >= 0.15) {
      reasons.push(
        `騎手勝率${(horse.jockey.winRate * 100).toFixed(1)}%と好成績`
      );
    }

    const sameDistanceRaces = horse.pastPerformances.filter(
      p => Math.abs(p.distance - race.distance) <= 200
    );
    if (sameDistanceRaces.length >= 2) {
      const sameDistanceWins = sameDistanceRaces.filter(
        p => p.finishPosition === FinishPosition.FIRST
      ).length;
      if (sameDistanceWins > 0) {
        reasons.push(`同距離での勝利経験あり`);
      }
    }

    const sameVenueRaces = horse.pastPerformances.filter(
      p => p.venue === race.venue
    );
    if (sameVenueRaces.length >= 2) {
      const sameVenueWins = sameVenueRaces.filter(
        p => p.finishPosition === FinishPosition.FIRST
      ).length;
      if (sameVenueWins > 0) {
        reasons.push(`同コースでの勝利経験あり`);
      }
    }

    if (confidence >= 0.8) {
      reasons.push('データの信頼性が高い');
    }

    return reasons.length > 0 ? reasons : ['統計的分析による推奨'];
  }

  /**
   * 着順を数値に変換
   */
  private finishPositionToNumber(position: FinishPosition): number {
    switch (position) {
      case FinishPosition.FIRST:
        return 1;
      case FinishPosition.SECOND:
        return 2;
      case FinishPosition.THIRD:
        return 3;
      case FinishPosition.FOURTH:
        return 4;
      case FinishPosition.FIFTH:
        return 5;
      case FinishPosition.SIXTH:
        return 6;
      case FinishPosition.SEVENTH:
        return 7;
      case FinishPosition.EIGHTH:
        return 8;
      case FinishPosition.NINTH:
        return 9;
      case FinishPosition.TENTH:
        return 10;
      case FinishPosition.ELEVENTH:
        return 11;
      case FinishPosition.TWELFTH:
        return 12;
      case FinishPosition.THIRTEENTH:
        return 13;
      case FinishPosition.FOURTEENTH:
        return 14;
      case FinishPosition.FIFTEENTH:
        return 15;
      case FinishPosition.SIXTEENTH:
        return 16;
      case FinishPosition.SEVENTEENTH:
        return 17;
      case FinishPosition.EIGHTEENTH:
        return 18;
      case FinishPosition.DNF:
        return 99;
      default:
        return 10;
    }
  }
}
