/**
 * 過去成績分析器
 */

import { Horse, Performance } from '@/types/core';
import { FinishPosition } from '@/types/enums';
import { PerformanceAnalysis } from '../types';

export class PerformanceAnalyzer {
  /**
   * 馬の過去成績を分析
   */
  analyze(horse: Horse): PerformanceAnalysis {
    const recentRaces = horse.pastPerformances.slice(0, 5); // 直近5走

    if (recentRaces.length === 0) {
      return this.getDefaultAnalysis();
    }

    const recentFormScore = this.calculateRecentFormScore(recentRaces);
    const averageFinishPosition =
      this.calculateAverageFinishPosition(recentRaces);
    const winRate = this.calculateWinRate(horse.pastPerformances);
    const placeRate = this.calculatePlaceRate(horse.pastPerformances);
    const showRate = this.calculateShowRate(horse.pastPerformances);
    const consistencyScore = this.calculateConsistencyScore(recentRaces);

    return {
      recentFormScore,
      averageFinishPosition,
      winRate,
      placeRate,
      showRate,
      consistencyScore,
    };
  }

  /**
   * 直近成績スコアを計算（0-100）
   */
  private calculateRecentFormScore(recentRaces: Performance[]): number {
    if (recentRaces.length === 0) return 30; // デフォルト値

    let totalScore = 0;
    let weightSum = 0;

    recentRaces.forEach((race, index) => {
      const weight = Math.pow(0.8, index); // 新しいレースほど重み大
      const positionScore = this.positionToScore(race.finishPosition);

      totalScore += positionScore * weight;
      weightSum += weight;
    });

    return totalScore / weightSum;
  }

  /**
   * 平均着順を計算
   */
  private calculateAverageFinishPosition(races: Performance[]): number {
    if (races.length === 0) return 8; // デフォルト値

    const positions = races.map(race =>
      this.finishPositionToNumber(race.finishPosition)
    );
    return positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
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
   * 複勝率を計算
   */
  private calculateShowRate(races: Performance[]): number {
    if (races.length === 0) return 0;

    const shows = races.filter(
      race =>
        race.finishPosition === FinishPosition.FIRST ||
        race.finishPosition === FinishPosition.SECOND ||
        race.finishPosition === FinishPosition.THIRD
    ).length;
    return shows / races.length;
  }

  /**
   * 安定性スコアを計算（0-100）
   */
  private calculateConsistencyScore(races: Performance[]): number {
    if (races.length < 2) return 50; // デフォルト値

    const positions = races.map(race =>
      this.finishPositionToNumber(race.finishPosition)
    );
    const mean =
      positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
    const variance =
      positions.reduce((sum, pos) => sum + Math.pow(pos - mean, 2), 0) /
      positions.length;
    const standardDeviation = Math.sqrt(variance);

    // 標準偏差が小さいほど安定性が高い（0-100スケール）
    const consistencyScore = Math.max(0, 100 - standardDeviation * 10);
    return Math.min(100, consistencyScore);
  }

  /**
   * 着順をスコアに変換（1位=100点、18位=0点）
   */
  private positionToScore(position: FinishPosition): number {
    const positionNumber = this.finishPositionToNumber(position);

    if (positionNumber === 99) return 0; // DNF

    // 1位=100点、2位=90点、3位=80点...のように線形減少
    return Math.max(0, 100 - (positionNumber - 1) * 6);
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
  private getDefaultAnalysis(): PerformanceAnalysis {
    return {
      recentFormScore: 30,
      averageFinishPosition: 8,
      winRate: 0.05,
      placeRate: 0.15,
      showRate: 0.25,
      consistencyScore: 50,
    };
  }
}
