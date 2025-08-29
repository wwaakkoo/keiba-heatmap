import { BaseRepository, ValidationResult, OperationResult } from './base';
import { db } from '../database';
import type { Race } from '@/types/core';

/**
 * レースデータのRepository
 * レース情報の永続化と検索機能を提供
 */
export class RaceRepository extends BaseRepository<Race> {
  constructor() {
    super(db.races);
  }

  /**
   * レースデータのバリデーション
   */
  protected validate(data: Partial<Race>): ValidationResult {
    const errors: string[] = [];

    // 必須フィールドのチェック
    if (!data.date) {
      errors.push('日付は必須です');
    }

    if (!data.courseName || data.courseName.trim().length === 0) {
      errors.push('競馬場名は必須です');
    }

    if (!data.raceNumber || data.raceNumber < 1 || data.raceNumber > 12) {
      errors.push('レース番号は1-12の範囲で指定してください');
    }

    if (!data.title || data.title.trim().length === 0) {
      errors.push('レース名は必須です');
    }

    if (!data.distance || data.distance < 1000 || data.distance > 4000) {
      errors.push('距離は1000-4000mの範囲で指定してください');
    }

    if (!data.surface || !['turf', 'dirt'].includes(data.surface)) {
      errors.push('馬場は芝またはダートを指定してください');
    }

    if (!data.horses || !Array.isArray(data.horses)) {
      errors.push('出走馬情報は必須です');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 日付範囲でレースを検索
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<OperationResult<Race[]>> {
    return this.executeWithErrorHandling(async () => {
      return await this.table
        .where('date')
        .between(startDate, endDate, true, true)
        .toArray();
    }, 'findByDateRange');
  }

  /**
   * 競馬場とレース番号でレースを検索
   */
  async findByVenueAndRaceNumber(
    courseName: string,
    raceNumber: number,
    date?: Date
  ): Promise<OperationResult<Race[]>> {
    return this.executeWithErrorHandling(async () => {
      let query = this.table
        .where('courseName')
        .equals(courseName)
        .and(race => race.raceNumber === raceNumber);

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query.and(
          race => race.date >= startOfDay && race.date <= endOfDay
        );
      }

      return await query.toArray();
    }, 'findByVenueAndRaceNumber');
  }

  /**
   * 今日のレースを取得
   */
  async findTodaysRaces(): Promise<OperationResult<Race[]>> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return this.findByDateRange(startOfDay, endOfDay);
  }

  /**
   * 距離カテゴリでレースを検索
   */
  async findByDistanceCategory(
    category: 'sprint' | 'mile' | 'intermediate' | 'long'
  ): Promise<OperationResult<Race[]>> {
    return this.executeWithErrorHandling(async () => {
      let minDistance: number, maxDistance: number;

      switch (category) {
        case 'sprint':
          minDistance = 1000;
          maxDistance = 1400;
          break;
        case 'mile':
          minDistance = 1401;
          maxDistance = 1800;
          break;
        case 'intermediate':
          minDistance = 1801;
          maxDistance = 2200;
          break;
        case 'long':
          minDistance = 2201;
          maxDistance = 4000;
          break;
        default:
          throw new Error('Invalid distance category');
      }

      return await this.table
        .where('distance')
        .between(minDistance, maxDistance, true, true)
        .toArray();
    }, 'findByDistanceCategory');
  }

  /**
   * レースの重複チェック
   */
  async checkDuplicate(
    date: Date,
    courseName: string,
    raceNumber: number
  ): Promise<OperationResult<boolean>> {
    return this.executeWithErrorHandling(async () => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const existing = await this.table
        .where('[date+courseName+raceNumber]')
        .between(
          [startOfDay, courseName, raceNumber],
          [endOfDay, courseName, raceNumber]
        )
        .first();

      return !!existing;
    }, 'checkDuplicate');
  }

  /**
   * レース統計情報の取得
   */
  async getStatistics(): Promise<
    OperationResult<{
      totalRaces: number;
      racesByVenue: Record<string, number>;
      racesBySurface: Record<string, number>;
      averageDistance: number;
    }>
  > {
    return this.executeWithErrorHandling(async () => {
      const races = await this.table.toArray();

      const racesByVenue: Record<string, number> = {};
      const racesBySurface: Record<string, number> = {};
      let totalDistance = 0;

      races.forEach(race => {
        // 競馬場別集計
        racesByVenue[race.courseName] =
          (racesByVenue[race.courseName] || 0) + 1;

        // 馬場別集計
        racesBySurface[race.surface] = (racesBySurface[race.surface] || 0) + 1;

        // 距離合計
        totalDistance += race.distance;
      });

      return {
        totalRaces: races.length,
        racesByVenue,
        racesBySurface,
        averageDistance:
          races.length > 0 ? Math.round(totalDistance / races.length) : 0,
      };
    }, 'getStatistics');
  }
}
