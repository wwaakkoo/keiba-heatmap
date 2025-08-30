/**
 * 距離適性分析器
 */

import { Horse, Race, Performance } from '@/types/core';
import { FinishPosition, DistanceCategory } from '@/types/enums';
import { DistanceAptitudeAnalysis } from '../types';

export class DistanceAnalyzer {
  /**
   * 馬の距離適性を分析
   */
  analyze(horse: Horse, race: Race): DistanceAptitudeAnalysis {
    const raceDistance = race.distance;
    const pastRaces = horse.pastPerformances;

    if (pastRaces.length === 0) {
      return this.getDefaultAnalysis(raceDistance);
    }

    const sameDistanceRaces = this.getSameDistanceRaces(
      pastRaces,
      raceDistance
    );
    const sameDistanceWinRate = this.calculateWinRate(sameDistanceRaces);
    const sameDistancePlaceRate = this.calculatePlaceRate(sameDistanceRaces);
    const distanceCategoryScore = this.calculateDistanceCategoryScore(
      horse,
      race
    );
    const optimalDistance = this.findOptimalDistance(pastRaces);
    const distanceVariance = this.calculateDistanceVariance(pastRaces);

    return {
      sameDistanceWinRate,
      sameDistancePlaceRate,
      distanceCategoryScore,
      optimalDistance,
      distanceVariance,
    };
  }

  /**
   * 同距離のレースを取得（±200m以内）
   */
  private getSameDistanceRaces(
    pastRaces: Performance[],
    targetDistance: number
  ): Performance[] {
    return pastRaces.filter(
      race => Math.abs(race.distance - targetDistance) <= 200
    );
  }

  /**
   * 勝率を計算
   */
  private calculateWinRate(races: Performance[]): number {
    if (races.length === 0) return 0;

    const wins = races.filter(
      race => race.finishPosition === FinishPosition.FIRST
    ).length;
    return wins / races.length;
  }

  /**
   * 連対率を計算
   */
  private calculatePlaceRate(races: Performance[]): number {
    if (races.length === 0) return 0;

    const places = races.filter(
      race =>
        race.finishPosition === FinishPosition.FIRST ||
        race.finishPosition === FinishPosition.SECOND
    ).length;
    return places / races.length;
  }

  /**
   * 距離カテゴリスコアを計算（0-100）
   */
  private calculateDistanceCategoryScore(horse: Horse, race: Race): number {
    const raceCategory = this.getDistanceCategory(race.distance);
    const categoryRaces = horse.pastPerformances.filter(
      p => this.getDistanceCategory(p.distance) === raceCategory
    );

    if (categoryRaces.length === 0) {
      return this.getDefaultCategoryScore(raceCategory);
    }

    // カテゴリ内での平均着順からスコアを算出
    const averagePosition =
      categoryRaces.reduce(
        (sum, race) => sum + this.finishPositionToNumber(race.finishPosition),
        0
      ) / categoryRaces.length;

    // 平均着順をスコアに変換（1位=100点、18位=0点）
    return Math.max(0, 100 - (averagePosition - 1) * 6);
  }

  /**
   * 最適距離を見つける
   */
  private findOptimalDistance(pastRaces: Performance[]): number {
    if (pastRaces.length === 0) return 1600; // デフォルト値

    // 各距離での平均着順を計算
    const distancePerformance = new Map<
      number,
      { totalPosition: number; count: number }
    >();

    pastRaces.forEach(race => {
      const distance = race.distance;
      const position = this.finishPositionToNumber(race.finishPosition);

      if (!distancePerformance.has(distance)) {
        distancePerformance.set(distance, { totalPosition: 0, count: 0 });
      }

      const data = distancePerformance.get(distance)!;
      data.totalPosition += position;
      data.count += 1;
    });

    // 最も平均着順が良い距離を見つける
    let bestDistance = 1600;
    let bestAveragePosition = 18;

    distancePerformance.forEach((data, distance) => {
      const averagePosition = data.totalPosition / data.count;
      if (averagePosition < bestAveragePosition && data.count >= 2) {
        bestAveragePosition = averagePosition;
        bestDistance = distance;
      }
    });

    return bestDistance;
  }

  /**
   * 距離バリアンスを計算
   */
  private calculateDistanceVariance(pastRaces: Performance[]): number {
    if (pastRaces.length < 2) return 0;

    const distances = pastRaces.map(race => race.distance);
    const mean = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const variance =
      distances.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) /
      distances.length;

    return Math.sqrt(variance);
  }

  /**
   * 距離カテゴリを取得
   */
  private getDistanceCategory(distance: number): DistanceCategory {
    if (distance < 1400) return DistanceCategory.SPRINT;
    if (distance < 1800) return DistanceCategory.MILE;
    if (distance < 2200) return DistanceCategory.INTERMEDIATE;
    return DistanceCategory.LONG;
  }

  /**
   * 距離カテゴリのデフォルトスコアを取得
   */
  private getDefaultCategoryScore(category: DistanceCategory): number {
    // 各カテゴリの一般的な適性を考慮したデフォルト値
    switch (category) {
      case DistanceCategory.SPRINT:
        return 45;
      case DistanceCategory.MILE:
        return 50;
      case DistanceCategory.INTERMEDIATE:
        return 50;
      case DistanceCategory.LONG:
        return 45;
      default:
        return 45;
    }
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

  /**
   * デフォルト分析結果を返す
   */
  private getDefaultAnalysis(raceDistance: number): DistanceAptitudeAnalysis {
    return {
      sameDistanceWinRate: 0.05,
      sameDistancePlaceRate: 0.15,
      distanceCategoryScore: this.getDefaultCategoryScore(
        this.getDistanceCategory(raceDistance)
      ),
      optimalDistance: raceDistance,
      distanceVariance: 0,
    };
  }
}
