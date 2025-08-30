/**
 * NetKeibaパーサーの実データテスト
 * 修正後のパーサーが実際のNetKeibaデータで動作するかテスト
 */

import { describe, it, expect } from 'vitest';
import { NetKeibaParser } from '../netKeibaParser';
import {
  REAL_NETKEIBA_RACE_INFO,
  REAL_NETKEIBA_HORSE_DATA,
  REAL_NETKEIBA_ODDS_DATA,
} from '@/test/data/netKeibaRealData';
import { Surface, TrackCondition, RaceClass } from '@/types/enums';

describe('NetKeibaParser - 実データテスト', () => {
  const parser = new NetKeibaParser({
    strictMode: false,
    skipInvalidHorses: true,
  });

  describe('実際のNetKeibaレース情報パース', () => {
    it('キーンランドCのレース情報を正しくパースできる', () => {
      const result = parser.parseRaceInfo(REAL_NETKEIBA_RACE_INFO);

      console.log('パース結果:', result);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data) {
        expect(result.data.title).toBe('キーンランドC');
        expect(result.data.venue).toBe('札幌');
        expect(result.data.distance).toBe(1200);
        expect(result.data.surface).toBe(Surface.TURF);
        expect(result.data.condition).toBe(TrackCondition.FIRM);
        expect(result.data.raceClass).toBe(RaceClass.OPEN);
      }
    });
  });

  describe('実際のNetKeiba馬データパース', () => {
    it('キーンランドCの馬データを正しくパースできる', () => {
      const result = parser.parseHorseDataInternal(REAL_NETKEIBA_HORSE_DATA);

      console.log('馬データパース結果:', result);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data) {
        expect(result.data.length).toBeGreaterThan(0);

        // 1番馬のチェック
        const firstHorse = result.data.find(h => h.number === 1);
        expect(firstHorse).toBeDefined();
        expect(firstHorse?.name).toBe('マインドユアビスケッツ');
        expect(firstHorse?.jockeyName).toBe('古川吉');
        expect(firstHorse?.trainerName).toBe('牧');
        expect(firstHorse?.weight).toBe(55.0);
      }
    });

    it('馬データブロック分割が正常に動作する', () => {
      // 内部メソッドのテスト用にパブリックメソッドでテストできるよう確認
      const result = parser.parseHorseDataInternal(REAL_NETKEIBA_HORSE_DATA);

      console.log('分割結果エラー:', result.errors);
      console.log('分割結果警告:', result.warnings);

      // エラーが発生していないことを確認
      expect(result.errors.length).toBe(0);
    });
  });

  describe('フォーム用データ変換', () => {
    it('parseHorseData（フォーム用）が正常に動作する', () => {
      expect(() => {
        const horses = parser.parseHorseData(REAL_NETKEIBA_HORSE_DATA);
        console.log('フォーム用馬データ:', horses);
        expect(horses.length).toBeGreaterThan(0);
      }).not.toThrow();
    });
  });

  describe('実際のNetKeibaオッズデータパース', () => {
    it('キーンランドCのオッズデータを正しくパースできる', () => {
      const result = parser.parseOdds(REAL_NETKEIBA_ODDS_DATA);

      console.log('オッズパース結果:', result);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data) {
        expect(result.data.length).toBe(16);

        // 1番馬のオッズチェック（大穴）
        const firstHorse = result.data.find(h => h.horseNumber === 1);
        expect(firstHorse).toBeDefined();
        expect(firstHorse?.winOdds).toBe(176.3);
        expect(firstHorse?.placeOddsMin).toBe(27.4);
        expect(firstHorse?.placeOddsMax).toBe(38);

        // 10番馬のオッズチェック（1番人気）
        const popularHorse = result.data.find(h => h.horseNumber === 10);
        expect(popularHorse).toBeDefined();
        expect(popularHorse?.winOdds).toBe(5.4);
        expect(popularHorse?.placeOddsMin).toBe(1.6);
        expect(popularHorse?.placeOddsMax).toBe(1.9);
      }
    });

    it('オッズデータにエラーがないことを確認', () => {
      const result = parser.parseOdds(REAL_NETKEIBA_ODDS_DATA);

      expect(result.errors.length).toBe(0);
      expect(result.success).toBe(true);
    });
  });
});
