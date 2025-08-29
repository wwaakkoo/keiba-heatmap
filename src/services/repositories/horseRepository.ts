import { BaseRepository, ValidationResult, OperationResult } from './base';
import { db } from '../database';
import type { Horse } from '@/types/core';

/**
 * 馬データのRepository
 * 馬情報の永続化と検索機能を提供
 */
export class HorseRepository extends BaseRepository<Horse> {
  constructor() {
    super(db.horses);
  }

  /**
   * 馬データのバリデーション
   */
  protected validate(data: Partial<Horse>): ValidationResult {
    const errors: string[] = [];

    // 必須フィールドのチェック
    if (!data.name || data.name.trim().length === 0) {
      errors.push('馬名は必須です');
    }

    if (!data.raceId || data.raceId.trim().length === 0) {
      errors.push('レースIDは必須です');
    }

    if (!data.horseNumber || data.horseNumber < 1 || data.horseNumber > 18) {
      errors.push('馬番は1-18の範囲で指定してください');
    }

    if (!data.age || data.age < 2 || data.age > 10) {
      errors.push('年齢は2-10歳の範囲で指定してください');
    }

    if (!data.gender || !['male', 'female', 'gelding'].includes(data.gender)) {
      errors.push('性別は牡馬、牝馬、騸馬のいずれかを指定してください');
    }

    if (!data.weight || data.weight < 45 || data.weight > 65) {
      errors.push('斤量は45-65kgの範囲で指定してください');
    }

    // オッズのバリデーション
    if (data.odds) {
      if (data.odds.win && (data.odds.win < 1.0 || data.odds.win > 999.9)) {
        errors.push('単勝オッズは1.0-999.9の範囲で指定してください');
      }

      if (data.odds.place) {
        const [min, max] = data.odds.place;
        if (min < 1.0 || max > 999.9 || min > max) {
          errors.push('複勝オッズの範囲が不正です');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * レースIDで馬を検索
   */
  async findByRaceId(raceId: string): Promise<OperationResult<Horse[]>> {
    return this.executeWithErrorHandling(async () => {
      return await this.table
        .where('raceId')
        .equals(raceId)
        .sortBy('horseNumber');
    }, 'findByRaceId');
  }

  /**
   * 馬名で検索（部分一致）
   */
  async findByName(name: string): Promise<OperationResult<Horse[]>> {
    return this.executeWithErrorHandling(async () => {
      const searchName = name.toLowerCase();
      return await this.table
        .filter(horse => horse.name.toLowerCase().includes(searchName))
        .toArray();
    }, 'findByName');
  }

  /**
   * レースIDと馬番で馬を検索
   */
  async findByRaceIdAndNumber(
    raceId: string,
    horseNumber: number
  ): Promise<OperationResult<Horse | undefined>> {
    return this.executeWithErrorHandling(async () => {
      return await this.table
        .where('[raceId+horseNumber]')
        .equals([raceId, horseNumber])
        .first();
    }, 'findByRaceIdAndNumber');
  }

  /**
   * 騎手名で馬を検索
   */
  async findByJockey(jockeyName: string): Promise<OperationResult<Horse[]>> {
    return this.executeWithErrorHandling(async () => {
      return await this.table
        .filter(horse => horse.jockey.name === jockeyName)
        .toArray();
    }, 'findByJockey');
  }

  /**
   * 調教師名で馬を検索
   */
  async findByTrainer(trainerName: string): Promise<OperationResult<Horse[]>> {
    return this.executeWithErrorHandling(async () => {
      return await this.table
        .filter(horse => horse.trainer.name === trainerName)
        .toArray();
    }, 'findByTrainer');
  }

  /**
   * 年齢範囲で馬を検索
   */
  async findByAgeRange(
    minAge: number,
    maxAge: number
  ): Promise<OperationResult<Horse[]>> {
    return this.executeWithErrorHandling(async () => {
      return await this.table
        .where('age')
        .between(minAge, maxAge, true, true)
        .toArray();
    }, 'findByAgeRange');
  }

  /**
   * 性別で馬を検索
   */
  async findByGender(
    gender: 'male' | 'female' | 'gelding'
  ): Promise<OperationResult<Horse[]>> {
    return this.executeWithErrorHandling(async () => {
      return await this.table.where('gender').equals(gender).toArray();
    }, 'findByGender');
  }

  /**
   * 馬の重複チェック（同一レース内）
   */
  async checkDuplicateInRace(
    raceId: string,
    horseNumber: number
  ): Promise<OperationResult<boolean>> {
    return this.executeWithErrorHandling(async () => {
      const existing = await this.table
        .where('[raceId+horseNumber]')
        .equals([raceId, horseNumber])
        .first();

      return !!existing;
    }, 'checkDuplicateInRace');
  }

  /**
   * 馬の統計情報を取得
   */
  async getStatistics(): Promise<
    OperationResult<{
      totalHorses: number;
      averageAge: number;
      genderDistribution: Record<string, number>;
      averageWeight: number;
      topJockeys: Array<{ name: string; count: number }>;
      topTrainers: Array<{ name: string; count: number }>;
    }>
  > {
    return this.executeWithErrorHandling(async () => {
      const horses = await this.table.toArray();

      const genderDistribution: Record<string, number> = {};
      const jockeyCount: Record<string, number> = {};
      const trainerCount: Record<string, number> = {};
      let totalAge = 0;
      let totalWeight = 0;

      horses.forEach(horse => {
        // 性別分布
        genderDistribution[horse.gender] =
          (genderDistribution[horse.gender] || 0) + 1;

        // 騎手集計
        jockeyCount[horse.jockey.name] =
          (jockeyCount[horse.jockey.name] || 0) + 1;

        // 調教師集計
        trainerCount[horse.trainer.name] =
          (trainerCount[horse.trainer.name] || 0) + 1;

        // 年齢・斤量合計
        totalAge += horse.age;
        totalWeight += horse.weight;
      });

      // トップ騎手・調教師の抽出
      const topJockeys = Object.entries(jockeyCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      const topTrainers = Object.entries(trainerCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      return {
        totalHorses: horses.length,
        averageAge:
          horses.length > 0
            ? Math.round((totalAge / horses.length) * 10) / 10
            : 0,
        genderDistribution,
        averageWeight:
          horses.length > 0
            ? Math.round((totalWeight / horses.length) * 10) / 10
            : 0,
        topJockeys,
        topTrainers,
      };
    }, 'getStatistics');
  }

  /**
   * 馬の過去成績を更新
   */
  async updatePastPerformances(
    horseId: string,
    performances: Horse['pastPerformances']
  ): Promise<OperationResult<void>> {
    return this.executeWithErrorHandling(async () => {
      await this.table.update(horseId, { pastPerformances: performances });
    }, 'updatePastPerformances');
  }
}
