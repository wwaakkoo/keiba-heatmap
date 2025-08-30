/**
 * コース適性分析器
 */

import { Horse, Race, Performance } from '@/types/core';
import { FinishPosition, Surface, TrackCondition } from '@/types/enums';
import { VenueAptitudeAnalysis } from '../types';

export class VenueAnalyzer {
  /**
   * 馬のコース適性を分析
   */
  analyze(horse: Horse, race: Race): VenueAptitudeAnalysis {
    const pastRaces = horse.pastPerformances;

    if (pastRaces.length === 0) {
      return this.getDefaultAnalysis();
    }

    const sameVenueRaces = pastRaces.filter(p => p.venue === race.venue);
    const sameVenueWinRate = this.calculateWinRate(sameVenueRaces);
    const sameVenuePlaceRate = this.calculatePlaceRate(sameVenueRaces);
    const surfaceAptitude = this.calculateSurfaceAptitude(horse, race.surface);
    const trackConditionAptitude = this.calculateTrackConditionAptitude(
      horse,
      race.condition
    );

    return {
      sameVenueWinRate,
      sameVenuePlaceRate,
      surfaceAptitude,
      trackConditionAptitude,
    };
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
   * 芝/ダート適性を計算（0-100）
   */
  private calculateSurfaceAptitude(horse: Horse, raceSurface: Surface): number {
    const surfaceRaces = horse.pastPerformances.filter(
      p => p.surface === raceSurface
    );

    if (surfaceRaces.length === 0) {
      return this.getDefaultSurfaceScore(raceSurface);
    }

    // 同じ芝面での平均着順からスコアを算出
    const averagePosition =
      surfaceRaces.reduce(
        (sum, race) => sum + this.finishPositionToNumber(race.finishPosition),
        0
      ) / surfaceRaces.length;

    // 平均着順をスコアに変換
    return Math.max(0, 100 - (averagePosition - 1) * 6);
  }

  /**
   * 馬場状態適性を計算（0-100）
   */
  private calculateTrackConditionAptitude(
    horse: Horse,
    raceCondition: TrackCondition
  ): number {
    const conditionRaces = horse.pastPerformances.filter(
      p => p.condition === raceCondition
    );

    if (conditionRaces.length === 0) {
      return this.getDefaultConditionScore(raceCondition);
    }

    // 同じ馬場状態での平均着順からスコアを算出
    const averagePosition =
      conditionRaces.reduce(
        (sum, race) => sum + this.finishPositionToNumber(race.finishPosition),
        0
      ) / conditionRaces.length;

    // 平均着順をスコアに変換
    return Math.max(0, 100 - (averagePosition - 1) * 6);
  }

  /**
   * 芝面のデフォルトスコアを取得
   */
  private getDefaultSurfaceScore(surface: Surface): number {
    // 一般的に芝の方が適性の差が出やすいとされる
    switch (surface) {
      case Surface.TURF:
        return 45;
      case Surface.DIRT:
        return 50;
      default:
        return 45;
    }
  }

  /**
   * 馬場状態のデフォルトスコアを取得
   */
  private getDefaultConditionScore(condition: TrackCondition): number {
    // 良馬場が最も一般的で標準的な条件
    switch (condition) {
      case TrackCondition.FIRM:
        return 50; // 良
      case TrackCondition.GOOD:
        return 48; // 稍重
      case TrackCondition.YIELDING:
        return 45; // 重
      case TrackCondition.SOFT:
        return 42; // 不良
      default:
        return 50;
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
  private getDefaultAnalysis(): VenueAptitudeAnalysis {
    return {
      sameVenueWinRate: 0.05,
      sameVenuePlaceRate: 0.15,
      surfaceAptitude: 50,
      trackConditionAptitude: 50,
    };
  }
}
