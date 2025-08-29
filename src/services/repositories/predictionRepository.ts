import { BaseRepository, ValidationResult, OperationResult } from './base';
import { db } from '../database';
import type { Prediction } from '@/types/core';

/**
 * 予想データのRepository
 * 予想結果の永続化と分析機能を提供
 */
export class PredictionRepository extends BaseRepository<Prediction> {
  constructor() {
    super(db.predictions);
  }

  /**
   * 予想データのバリデーション
   */
  protected validate(data: Partial<Prediction>): ValidationResult {
    const errors: string[] = [];

    // 必須フィールドのチェック
    if (!data.raceId || data.raceId.trim().length === 0) {
      errors.push('レースIDは必須です');
    }

    if (!data.timestamp) {
      errors.push('タイムスタンプは必須です');
    }

    if (!data.calculations || typeof data.calculations !== 'object') {
      errors.push('計算結果は必須です');
    }

    // 計算結果の詳細バリデーション
    if (data.calculations) {
      const calc = data.calculations;

      if (!calc.horsePredictions || !Array.isArray(calc.horsePredictions)) {
        errors.push('馬別予想結果は必須です');
      } else {
        calc.horsePredictions.forEach((prediction, index) => {
          if (!prediction.horseId) {
            errors.push(`馬別予想${index + 1}: 馬IDは必須です`);
          }

          if (
            typeof prediction.baseScore !== 'number' ||
            prediction.baseScore < 0 ||
            prediction.baseScore > 100
          ) {
            errors.push(
              `馬別予想${index + 1}: 基礎スコアは0-100の範囲で指定してください`
            );
          }

          if (
            typeof prediction.expectedValue !== 'number' ||
            prediction.expectedValue < 0
          ) {
            errors.push(
              `馬別予想${index + 1}: 期待値は0以上で指定してください`
            );
          }

          if (
            typeof prediction.confidence !== 'number' ||
            prediction.confidence < 0 ||
            prediction.confidence > 1
          ) {
            errors.push(
              `馬別予想${index + 1}: 信頼度は0-1の範囲で指定してください`
            );
          }
        });
      }

      if (
        typeof calc.recommendedCount !== 'number' ||
        calc.recommendedCount < 0
      ) {
        errors.push('推奨馬数は0以上で指定してください');
      }

      if (typeof calc.averageExpectedValue !== 'number') {
        errors.push('平均期待値は数値で指定してください');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * レースIDで予想を検索
   */
  async findByRaceId(raceId: string): Promise<OperationResult<Prediction[]>> {
    return this.executeWithErrorHandling(async () => {
      return await this.table
        .where('raceId')
        .equals(raceId)
        .reverse()
        .sortBy('timestamp');
    }, 'findByRaceId');
  }

  /**
   * 最新の予想を取得
   */
  async findLatestByRaceId(
    raceId: string
  ): Promise<OperationResult<Prediction | undefined>> {
    return this.executeWithErrorHandling(async () => {
      return await this.table
        .where('raceId')
        .equals(raceId)
        .reverse()
        .sortBy('timestamp')
        .then(predictions => predictions[0]);
    }, 'findLatestByRaceId');
  }

  /**
   * 日付範囲で予想を検索
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<OperationResult<Prediction[]>> {
    return this.executeWithErrorHandling(async () => {
      return await this.table
        .where('timestamp')
        .between(startDate, endDate, true, true)
        .reverse()
        .sortBy('timestamp');
    }, 'findByDateRange');
  }

  /**
   * 推奨馬がある予想を検索
   */
  async findWithRecommendations(): Promise<OperationResult<Prediction[]>> {
    return this.executeWithErrorHandling(async () => {
      return await this.table
        .filter(prediction => prediction.calculations.recommendedCount > 0)
        .reverse()
        .sortBy('timestamp');
    }, 'findWithRecommendations');
  }

  /**
   * 期待値の範囲で予想を検索
   */
  async findByExpectedValueRange(
    minExpectedValue: number,
    maxExpectedValue: number
  ): Promise<OperationResult<Prediction[]>> {
    return this.executeWithErrorHandling(async () => {
      return await this.table
        .filter(prediction => {
          const avgEV = prediction.calculations.averageExpectedValue;
          return avgEV >= minExpectedValue && avgEV <= maxExpectedValue;
        })
        .toArray();
    }, 'findByExpectedValueRange');
  }

  /**
   * 予想の統計情報を取得
   */
  async getStatistics(): Promise<
    OperationResult<{
      totalPredictions: number;
      averageRecommendedCount: number;
      averageExpectedValue: number;
      highConfidencePredictions: number;
      predictionsByMonth: Record<string, number>;
    }>
  > {
    return this.executeWithErrorHandling(async () => {
      const predictions = await this.table.toArray();

      let totalRecommended = 0;
      let totalExpectedValue = 0;
      let highConfidenceCount = 0;
      const predictionsByMonth: Record<string, number> = {};

      predictions.forEach(prediction => {
        totalRecommended += prediction.calculations.recommendedCount;
        totalExpectedValue += prediction.calculations.averageExpectedValue;

        // 高信頼度予想のカウント（平均信頼度0.7以上）
        const avgConfidence =
          prediction.calculations.horsePredictions.reduce(
            (sum, hp) => sum + hp.confidence,
            0
          ) / prediction.calculations.horsePredictions.length;

        if (avgConfidence >= 0.7) {
          highConfidenceCount++;
        }

        // 月別集計
        const monthKey = prediction.timestamp.toISOString().substring(0, 7); // YYYY-MM
        predictionsByMonth[monthKey] = (predictionsByMonth[monthKey] || 0) + 1;
      });

      return {
        totalPredictions: predictions.length,
        averageRecommendedCount:
          predictions.length > 0
            ? Math.round((totalRecommended / predictions.length) * 10) / 10
            : 0,
        averageExpectedValue:
          predictions.length > 0
            ? Math.round((totalExpectedValue / predictions.length) * 100) / 100
            : 0,
        highConfidencePredictions: highConfidenceCount,
        predictionsByMonth,
      };
    }, 'getStatistics');
  }

  /**
   * 予想精度の分析
   */
  async analyzePredictionAccuracy(
    raceResults: Array<{
      raceId: string;
      winnerHorseId: string;
      payouts: Record<string, number>;
    }>
  ): Promise<
    OperationResult<{
      totalAnalyzed: number;
      hitRate: number;
      averageReturn: number;
      bestPredictions: Array<{
        raceId: string;
        expectedValue: number;
        actualReturn: number;
      }>;
    }>
  > {
    return this.executeWithErrorHandling(async () => {
      const results = [];
      let totalHits = 0;
      let totalReturn = 0;

      for (const result of raceResults) {
        const prediction = await this.findLatestByRaceId(result.raceId);
        if (!prediction.success || !prediction.data) continue;

        const pred = prediction.data;
        const winnerPrediction = pred.calculations.horsePredictions.find(
          hp => hp.horseId === result.winnerHorseId
        );

        if (winnerPrediction && winnerPrediction.isRecommended) {
          totalHits++;
          const actualReturn = result.payouts[result.winnerHorseId] || 0;
          totalReturn += actualReturn;

          results.push({
            raceId: result.raceId,
            expectedValue: winnerPrediction.expectedValue,
            actualReturn,
          });
        }
      }

      // 成績の良い予想をソート
      const bestPredictions = results
        .sort((a, b) => b.actualReturn - a.actualReturn)
        .slice(0, 10);

      return {
        totalAnalyzed: raceResults.length,
        hitRate: raceResults.length > 0 ? totalHits / raceResults.length : 0,
        averageReturn: totalHits > 0 ? totalReturn / totalHits : 0,
        bestPredictions,
      };
    }, 'analyzePredictionAccuracy');
  }

  /**
   * 古い予想データのクリーンアップ
   */
  async cleanupOldPredictions(
    daysToKeep: number = 90
  ): Promise<OperationResult<number>> {
    return this.executeWithErrorHandling(async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const oldPredictions = await this.table
        .where('timestamp')
        .below(cutoffDate)
        .toArray();

      if (oldPredictions.length > 0) {
        await this.table.where('timestamp').below(cutoffDate).delete();
      }

      return oldPredictions.length;
    }, 'cleanupOldPredictions');
  }
}
