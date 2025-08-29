import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HorseRacingDB } from '../database';
import type {
  Race,
  Horse,
  Prediction,
  Investment,
  AppSettings,
} from '@/types/core';

describe('HorseRacingDB', () => {
  let db: HorseRacingDB;

  beforeEach(async () => {
    // テスト用のデータベースインスタンスを作成
    db = new HorseRacingDB();
    await db.open();
  });

  afterEach(async () => {
    // テスト後のクリーンアップ
    await db.clearAll();
    await db.close();
  });

  describe('データベース初期化', () => {
    it('データベースが正常に初期化される', async () => {
      await db.initialize();

      // デフォルト設定が挿入されているかチェック
      const bankrollSetting = await db.settings.get('bankroll');
      expect(bankrollSetting).toBeDefined();
      expect(bankrollSetting?.value).toHaveProperty('initialAmount');
      expect(bankrollSetting?.value).toHaveProperty('currentAmount');
    });

    it('統計情報が正しく取得される', async () => {
      const stats = await db.getStats();

      expect(stats).toHaveProperty('races');
      expect(stats).toHaveProperty('horses');
      expect(stats).toHaveProperty('predictions');
      expect(stats).toHaveProperty('investments');
      expect(typeof stats.races).toBe('number');
      expect(typeof stats.horses).toBe('number');
      expect(typeof stats.predictions).toBe('number');
      expect(typeof stats.investments).toBe('number');
    });
  });

  describe('レーステーブル', () => {
    it('レースデータが正常に保存・取得される', async () => {
      const raceData: Race = {
        id: '1',
        date: new Date('2024-01-01'),
        courseName: '東京',
        raceNumber: 1,
        title: 'テストレース',
        distance: 1600,
        surface: 'turf',
        horses: [],
      };

      await db.races.add(raceData);
      const retrieved = await db.races.get('1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.courseName).toBe('東京');
      expect(retrieved?.title).toBe('テストレース');
    });

    it('複合インデックスが正常に動作する', async () => {
      const raceData: Race = {
        id: '1',
        date: new Date('2024-01-01'),
        courseName: '東京',
        raceNumber: 1,
        title: 'テストレース',
        distance: 1600,
        surface: 'turf',
        horses: [],
      };

      await db.races.add(raceData);

      // 複合インデックスでの検索
      const found = await db.races
        .where('[date+courseName+raceNumber]')
        .equals([new Date('2024-01-01'), '東京', 1])
        .first();

      expect(found).toBeDefined();
      expect(found?.id).toBe('1');
    });
  });

  describe('馬テーブル', () => {
    it('馬データが正常に保存・取得される', async () => {
      const horseData: Horse = {
        id: '1',
        name: 'テスト馬',
        raceId: 'race1',
        horseNumber: 1,
        age: 4,
        gender: 'male',
        weight: 56,
        jockey: { id: 'j1', name: 'テスト騎手', winRate: 0.15 },
        trainer: { id: 't1', name: 'テスト調教師', winRate: 0.12 },
        odds: { win: 3.5, place: [1.2, 1.8] },
        pastPerformances: [],
      };

      await db.horses.add(horseData);
      const retrieved = await db.horses.get('1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('テスト馬');
      expect(retrieved?.jockey.name).toBe('テスト騎手');
    });

    it('レースIDと馬番の複合インデックスが動作する', async () => {
      const horseData: Horse = {
        id: '1',
        name: 'テスト馬',
        raceId: 'race1',
        horseNumber: 5,
        age: 4,
        gender: 'male',
        weight: 56,
        jockey: { id: 'j1', name: 'テスト騎手', winRate: 0.15 },
        trainer: { id: 't1', name: 'テスト調教師', winRate: 0.12 },
        odds: { win: 3.5, place: [1.2, 1.8] },
        pastPerformances: [],
      };

      await db.horses.add(horseData);

      const found = await db.horses
        .where('[raceId+horseNumber]')
        .equals(['race1', 5])
        .first();

      expect(found).toBeDefined();
      expect(found?.id).toBe('1');
    });
  });

  describe('予想テーブル', () => {
    it('予想データが正常に保存・取得される', async () => {
      const predictionData: Prediction = {
        id: '1',
        raceId: 'race1',
        timestamp: new Date(),
        calculations: {
          horsePredictions: [
            {
              horseId: 'horse1',
              baseScore: 75,
              expectedValue: 1.25,
              confidence: 0.8,
              isRecommended: true,
              reasoning: ['高い基礎スコア', '適正距離'],
            },
          ],
          recommendedCount: 1,
          averageExpectedValue: 1.25,
          totalConfidence: 0.8,
        },
      };

      await db.predictions.add(predictionData);
      const retrieved = await db.predictions.get('1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.calculations.recommendedCount).toBe(1);
      expect(retrieved?.calculations.horsePredictions).toHaveLength(1);
    });
  });

  describe('投資テーブル', () => {
    it('投資データが正常に保存・取得される', async () => {
      const investmentData: Investment = {
        id: '1',
        raceId: 'race1',
        horseId: 'horse1',
        amount: 1000,
        odds: 3.5,
        result: 'pending',
        payout: 0,
        timestamp: new Date(),
      };

      await db.investments.add(investmentData);
      const retrieved = await db.investments.get('1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.amount).toBe(1000);
      expect(retrieved?.result).toBe('pending');
    });
  });

  describe('設定テーブル', () => {
    it('設定データが正常に保存・取得される', async () => {
      const settingData: AppSettings = {
        key: 'testSetting',
        value: { test: true, number: 42 },
      };

      await db.settings.put(settingData);
      const retrieved = await db.settings.get('testSetting');

      expect(retrieved).toBeDefined();
      expect(retrieved?.value.test).toBe(true);
      expect(retrieved?.value.number).toBe(42);
    });
  });

  describe('トランザクション', () => {
    it('トランザクション内での複数操作が正常に動作する', async () => {
      const raceData: Race = {
        id: '1',
        date: new Date('2024-01-01'),
        courseName: '東京',
        raceNumber: 1,
        title: 'テストレース',
        distance: 1600,
        surface: 'turf',
        horses: [],
      };

      const horseData: Horse = {
        id: '1',
        name: 'テスト馬',
        raceId: '1',
        horseNumber: 1,
        age: 4,
        gender: 'male',
        weight: 56,
        jockey: { id: 'j1', name: 'テスト騎手', winRate: 0.15 },
        trainer: { id: 't1', name: 'テスト調教師', winRate: 0.12 },
        odds: { win: 3.5, place: [1.2, 1.8] },
        pastPerformances: [],
      };

      // トランザクション内で複数のテーブルに同時書き込み
      await db.transaction('rw', db.races, db.horses, async () => {
        await db.races.add(raceData);
        await db.horses.add(horseData);
      });

      const race = await db.races.get('1');
      const horse = await db.horses.get('1');

      expect(race).toBeDefined();
      expect(horse).toBeDefined();
      expect(horse?.raceId).toBe(race?.id);
    });
  });
});
