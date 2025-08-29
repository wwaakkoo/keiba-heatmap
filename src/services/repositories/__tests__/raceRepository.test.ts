import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RaceRepository } from '../raceRepository';
import { HorseRacingDB } from '../../database';
import type { Race } from '@/types/core';

describe('RaceRepository', () => {
  let repository: RaceRepository;
  let db: HorseRacingDB;

  beforeEach(async () => {
    db = new HorseRacingDB();
    await db.open();
    repository = new RaceRepository();
  });

  afterEach(async () => {
    await db.clearAll();
    await db.close();
  });

  const createMockRace = (overrides: Partial<Race> = {}): Omit<Race, 'id'> => ({
    date: new Date('2024-01-01'),
    courseName: '東京',
    raceNumber: 1,
    title: 'テストレース',
    distance: 1600,
    surface: 'turf',
    horses: [], // 空配列でも有効とする
    ...overrides,
  });

  describe('バリデーション', () => {
    it('有効なレースデータが通る', async () => {
      const raceData = createMockRace();
      const result = await repository.create(raceData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('必須フィールドが不足している場合エラーになる', async () => {
      const raceData = createMockRace({ courseName: '' });
      const result = await repository.create(raceData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('競馬場名は必須です');
    });

    it('レース番号が範囲外の場合エラーになる', async () => {
      const raceData = createMockRace({ raceNumber: 15 });
      const result = await repository.create(raceData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'レース番号は1-12の範囲で指定してください'
      );
    });

    it('距離が範囲外の場合エラーになる', async () => {
      const raceData = createMockRace({ distance: 500 });
      const result = await repository.create(raceData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        '距離は1000-4000mの範囲で指定してください'
      );
    });

    it('馬場が不正な場合エラーになる', async () => {
      const raceData = createMockRace({ surface: 'sand' as any });
      const result = await repository.create(raceData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('馬場は芝またはダートを指定してください');
    });
  });

  describe('CRUD操作', () => {
    it('レースの作成と取得ができる', async () => {
      const raceData = createMockRace();
      const createResult = await repository.create(raceData);

      expect(createResult.success).toBe(true);

      const findResult = await repository.findById(createResult.data!);
      expect(findResult.success).toBe(true);
      expect(findResult.data?.courseName).toBe('東京');
    });

    it('レースの更新ができる', async () => {
      const raceData = createMockRace();
      const createResult = await repository.create(raceData);

      const updateResult = await repository.update(createResult.data!, {
        title: '更新されたレース',
      });

      expect(updateResult.success).toBe(true);

      const findResult = await repository.findById(createResult.data!);
      expect(findResult.data?.title).toBe('更新されたレース');
    });

    it('レースの削除ができる', async () => {
      const raceData = createMockRace();
      const createResult = await repository.create(raceData);

      const deleteResult = await repository.delete(createResult.data!);
      expect(deleteResult.success).toBe(true);

      const findResult = await repository.findById(createResult.data!);
      expect(findResult.data).toBeUndefined();
    });
  });

  describe('検索機能', () => {
    beforeEach(async () => {
      // テストデータの準備
      const races = [
        createMockRace({
          date: new Date('2024-01-01'),
          courseName: '東京',
          raceNumber: 1,
          distance: 1200,
        }),
        createMockRace({
          date: new Date('2024-01-01'),
          courseName: '京都',
          raceNumber: 2,
          distance: 1600,
        }),
        createMockRace({
          date: new Date('2024-01-02'),
          courseName: '東京',
          raceNumber: 1,
          distance: 2000,
        }),
      ];

      for (const race of races) {
        await repository.create(race);
      }
    });

    it('日付範囲でレースを検索できる', async () => {
      const result = await repository.findByDateRange(
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('競馬場とレース番号でレースを検索できる', async () => {
      const result = await repository.findByVenueAndRaceNumber('東京', 1);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('今日のレースを取得できる', async () => {
      // 今日の日付でレースを作成
      const todayRace = createMockRace({
        date: new Date(),
        courseName: '中山',
        raceNumber: 5,
      });
      await repository.create(todayRace);

      const result = await repository.findTodaysRaces();

      expect(result.success).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
      expect(result.data!.some(race => race.courseName === '中山')).toBe(true);
    });

    it('距離カテゴリでレースを検索できる', async () => {
      const sprintResult = await repository.findByDistanceCategory('sprint');
      expect(sprintResult.success).toBe(true);
      expect(sprintResult.data!.some(race => race.distance === 1200)).toBe(
        true
      );

      const mileResult = await repository.findByDistanceCategory('mile');
      expect(mileResult.success).toBe(true);
      expect(mileResult.data!.some(race => race.distance === 1600)).toBe(true);

      const intermediateResult =
        await repository.findByDistanceCategory('intermediate');
      expect(intermediateResult.success).toBe(true);
      expect(
        intermediateResult.data!.some(race => race.distance === 2000)
      ).toBe(true);
    });
  });

  describe('重複チェック', () => {
    it('重複するレースを検出できる', async () => {
      const raceData = createMockRace();
      await repository.create(raceData);

      const duplicateCheck = await repository.checkDuplicate(
        raceData.date,
        raceData.courseName,
        raceData.raceNumber
      );

      expect(duplicateCheck.success).toBe(true);
      expect(duplicateCheck.data).toBe(true);
    });

    it('重複しないレースは検出されない', async () => {
      const raceData = createMockRace();
      await repository.create(raceData);

      const duplicateCheck = await repository.checkDuplicate(
        new Date('2024-01-02'),
        raceData.courseName,
        raceData.raceNumber
      );

      expect(duplicateCheck.success).toBe(true);
      expect(duplicateCheck.data).toBe(false);
    });
  });

  describe('統計情報', () => {
    beforeEach(async () => {
      const races = [
        createMockRace({ courseName: '東京', surface: 'turf', distance: 1600 }),
        createMockRace({ courseName: '東京', surface: 'dirt', distance: 1200 }),
        createMockRace({ courseName: '京都', surface: 'turf', distance: 2000 }),
      ];

      for (const race of races) {
        await repository.create(race);
      }
    });

    it('統計情報を正しく計算できる', async () => {
      const result = await repository.getStatistics();

      expect(result.success).toBe(true);
      expect(result.data!.totalRaces).toBe(3);
      expect(result.data!.racesByVenue['東京']).toBe(2);
      expect(result.data!.racesByVenue['京都']).toBe(1);
      expect(result.data!.racesBySurface['turf']).toBe(2);
      expect(result.data!.racesBySurface['dirt']).toBe(1);
      expect(result.data!.averageDistance).toBe(1600); // (1600 + 1200 + 2000) / 3
    });
  });
});
