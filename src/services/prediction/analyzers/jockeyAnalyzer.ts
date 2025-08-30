/**
 * 騎手成績分析器
 */

import { Horse, Race, Performance } from '@/types/core';
import { FinishPosition } from '@/types/enums';
import { JockeyAnalysis } from '../types';

export class JockeyAnalyzer {
  /**
   * 騎手の成績を分析
   */
  analyze(horse: Horse, race: Race): JockeyAnalysis {
    const jockey = horse.jockey;
    const pastRaces = horse.pastPerformances;

    // 基本的な騎手データ
    const overallWinRate = jockey.winRate;
    const overallPlaceRate = jockey.placeRate;

    // 騎手の直近成績を分析
    const recentFormScore = this.calculateJockeyRecentForm(jockey);

    // コース別成績を分析
    const venueSpecificScore = this.calculateVenueSpecificScore(
      pastRaces,
      race.venue,
      jockey.id
    );

    // 距離別成績を分析
    const distanceSpecificScore = this.calculateDistanceSpecificScore(
      pastRaces,
      race.distance,
      jockey.id
    );

    return {
      overallWinRate,
      overallPlaceRate,
      recentFormScore,
      venueSpecificScore,
      distanceSpecificScore,
    };
  }

  /**
   * 騎手の直近成績スコアを計算（0-100）
   */
  private calculateJockeyRecentForm(jockey: Horse['jockey']): number {
    if (!jockey.recentForm || jockey.recentForm.length === 0) {
      // 全体勝率から推定
      return jockey.winRate * 100 * 5; // 勝率を5倍してスコア化
    }

    // 直近成績から重み付きスコアを計算
    let totalScore = 0;
    let weightSum = 0;

    jockey.recentForm.forEach((position: number, index: number) => {
      const weight = Math.pow(0.8, index); // 新しい成績ほど重み大
      const positionScore = Math.max(0, 100 - (position - 1) * 6);

      totalScore += positionScore * weight;
      weightSum += weight;
    });

    return weightSum > 0 ? totalScore / weightSum : jockey.winRate * 100 * 5;
  }

  /**
   * コース別騎手成績スコアを計算（0-100）
   */
  private calculateVenueSpecificScore(
    pastRaces: Performance[],
    venue: string,
    jockeyId: string
  ): number {
    // 同じ騎手が同じコースで騎乗したレースを抽出
    const sameJockeyVenueRaces = pastRaces.filter(
      race => race.venue === venue && this.isRiddenByJockey(race, jockeyId)
    );

    if (sameJockeyVenueRaces.length === 0) {
      return 50; // デフォルト値
    }

    // 同コースでの平均着順からスコアを算出
    const averagePosition =
      sameJockeyVenueRaces.reduce(
        (sum, race) => sum + this.finishPositionToNumber(race.finishPosition),
        0
      ) / sameJockeyVenueRaces.length;

    return Math.max(0, 100 - (averagePosition - 1) * 6);
  }

  /**
   * 距離別騎手成績スコアを計算（0-100）
   */
  private calculateDistanceSpecificScore(
    pastRaces: Performance[],
    distance: number,
    jockeyId: string
  ): number {
    // 同じ騎手が同じ距離帯（±200m）で騎乗したレースを抽出
    const sameJockeyDistanceRaces = pastRaces.filter(
      race =>
        Math.abs(race.distance - distance) <= 200 &&
        this.isRiddenByJockey(race, jockeyId)
    );

    if (sameJockeyDistanceRaces.length === 0) {
      return 50; // デフォルト値
    }

    // 同距離帯での平均着順からスコアを算出
    const averagePosition =
      sameJockeyDistanceRaces.reduce(
        (sum, race) => sum + this.finishPositionToNumber(race.finishPosition),
        0
      ) / sameJockeyDistanceRaces.length;

    return Math.max(0, 100 - (averagePosition - 1) * 6);
  }

  /**
   * 指定された騎手がそのレースで騎乗したかを判定
   */
  private isRiddenByJockey(race: Performance, jockeyId: string): boolean {
    // 過去成績データに騎手IDが含まれている場合
    return race.jockeyId === jockeyId;
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
