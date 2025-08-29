import { describe, it, expect } from 'vitest';
import {
  raceBasicInfoSchema,
  horseDataSchema,
  horsesDataSchema,
  oddsDataSchema,
  raceInputSchema,
} from '../schemas/raceInputSchema';

describe('raceInputSchema', () => {
  describe('raceBasicInfoSchema', () => {
    it('有効なレース基本情報を受け入れる', () => {
      const validData = {
        date: '2024-01-01',
        venue: '東京',
        raceNumber: 11,
        title: '東京大賞典',
        distance: 2000,
        surface: 'dirt' as const,
        trackCondition: 'firm' as const,
        raceClass: 'G1' as const,
        prize: 1000,
      };

      const result = raceBasicInfoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('必須フィールドが欠けている場合はエラーになる', () => {
      const invalidData = {
        venue: '東京',
        // dateが欠けている
        raceNumber: 11,
        title: '東京大賞典',
        distance: 2000,
        surface: 'dirt' as const,
        trackCondition: 'firm' as const,
        raceClass: 'G1' as const,
      };

      const result = raceBasicInfoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('レース番号の範囲チェックが動作する', () => {
      const invalidData = {
        date: '2024-01-01',
        venue: '東京',
        raceNumber: 13, // 範囲外
        title: '東京大賞典',
        distance: 2000,
        surface: 'dirt' as const,
        trackCondition: 'firm' as const,
        raceClass: 'G1' as const,
      };

      const result = raceBasicInfoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('距離の範囲チェックが動作する', () => {
      const invalidData = {
        date: '2024-01-01',
        venue: '東京',
        raceNumber: 11,
        title: '東京大賞典',
        distance: 500, // 範囲外
        surface: 'dirt' as const,
        trackCondition: 'firm' as const,
        raceClass: 'G1' as const,
      };

      const result = raceBasicInfoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('horseDataSchema', () => {
    it('有効な馬データを受け入れる', () => {
      const validData = {
        number: 1,
        name: 'サンプル馬',
        age: 4,
        gender: 'male' as const,
        weight: 56,
        jockeyName: '武豊',
        trainerName: '藤沢和雄',
        ownerName: 'サンプル馬主',
      };

      const result = horseDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('馬番の範囲チェックが動作する', () => {
      const invalidData = {
        number: 19, // 範囲外
        name: 'サンプル馬',
        age: 4,
        gender: 'male' as const,
        weight: 56,
        jockeyName: '武豊',
        trainerName: '藤沢和雄',
      };

      const result = horseDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('馬齢の範囲チェックが動作する', () => {
      const invalidData = {
        number: 1,
        name: 'サンプル馬',
        age: 1, // 範囲外
        gender: 'male' as const,
        weight: 56,
        jockeyName: '武豊',
        trainerName: '藤沢和雄',
      };

      const result = horseDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('斤量の範囲チェックが動作する', () => {
      const invalidData = {
        number: 1,
        name: 'サンプル馬',
        age: 4,
        gender: 'male' as const,
        weight: 70, // 範囲外
        jockeyName: '武豊',
        trainerName: '藤沢和雄',
      };

      const result = horseDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('horsesDataSchema', () => {
    it('有効な馬データ配列を受け入れる', () => {
      const validData = {
        horses: [
          {
            number: 1,
            name: 'サンプル馬1',
            age: 4,
            gender: 'male' as const,
            weight: 56,
            jockeyName: '武豊',
            trainerName: '藤沢和雄',
          },
          {
            number: 2,
            name: 'サンプル馬2',
            age: 3,
            gender: 'female' as const,
            weight: 54,
            jockeyName: '福永祐一',
            trainerName: '友道康夫',
          },
        ],
      };

      const result = horsesDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('空の馬配列はエラーになる', () => {
      const invalidData = {
        horses: [],
      };

      const result = horsesDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('oddsDataSchema', () => {
    it('有効なオッズデータを受け入れる', () => {
      const validData = {
        horses: [
          {
            number: 1,
            winOdds: 2.5,
            placeOddsMin: 1.2,
            placeOddsMax: 1.5,
          },
          {
            number: 2,
            winOdds: 5.0,
            placeOddsMin: 1.8,
            placeOddsMax: 2.2,
          },
        ],
      };

      const result = oddsDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('オッズが1.0未満の場合はエラーになる', () => {
      const invalidData = {
        horses: [
          {
            number: 1,
            winOdds: 0.5, // 範囲外
            placeOddsMin: 1.2,
            placeOddsMax: 1.5,
          },
        ],
      };

      const result = oddsDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('raceInputSchema', () => {
    it('完全なレースデータを受け入れる', () => {
      const validData = {
        basicInfo: {
          date: '2024-01-01',
          venue: '東京',
          raceNumber: 11,
          title: '東京大賞典',
          distance: 2000,
          surface: 'dirt' as const,
          trackCondition: 'firm' as const,
          raceClass: 'G1' as const,
        },
        horsesData: {
          horses: [
            {
              number: 1,
              name: 'サンプル馬',
              age: 4,
              gender: 'male' as const,
              weight: 56,
              jockeyName: '武豊',
              trainerName: '藤沢和雄',
            },
          ],
        },
        oddsData: {
          horses: [
            {
              number: 1,
              winOdds: 2.5,
              placeOddsMin: 1.2,
              placeOddsMax: 1.5,
            },
          ],
        },
      };

      const result = raceInputSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
