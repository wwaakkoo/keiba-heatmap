/**
 * NetKeibaパーサーの単体テスト
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { NetKeibaParser } from '../netKeibaParser';
import { Surface, TrackCondition, RaceClass, Gender } from '@/types/enums';
import {
  SAMPLE_RACE_INFO_1,
  SAMPLE_HORSE_DATA_1,
  SAMPLE_ODDS_DATA_1,
  SAMPLE_RACE_INFO_2,
  SAMPLE_HORSE_DATA_2,
  SAMPLE_RACE_INFO_3,
  SAMPLE_HORSE_DATA_3,
  SAMPLE_ODDS_DATA_3,
  SAMPLE_RACE_INFO_5,
  SAMPLE_RACE_INFO_6,
  SAMPLE_RACE_INFO_7,
  SAMPLE_RACE_INFO_8,
  SAMPLE_RACE_INFO_9,
  SAMPLE_RACE_INFO_10,
  INVALID_RACE_INFO,
  INVALID_HORSE_DATA,
  INVALID_ODDS_DATA,
  COMPLETE_TEST_DATA_1,
  COMPLETE_TEST_DATA_2,
  COMPLETE_TEST_DATA_3,
  ERROR_TEST_DATA,
} from '@/test/data/netKeibaTestData';

describe('NetKeibaParser', () => {
  let parser: NetKeibaParser;

  beforeEach(() => {
    parser = new NetKeibaParser();
  });

  describe('parseRaceInfo', () => {
    test('パターン1: 東京競馬場のG1レース情報を正しくパースできる', () => {
      const result = parser.parseRaceInfo(SAMPLE_RACE_INFO_1);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.venue).toBe('東京');
      expect(result.data?.raceNumber).toBe(11);
      expect(result.data?.title).toBe('日本ダービー(G1)');
      expect(result.data?.distance).toBe(2400);
      expect(result.data?.surface).toBe(Surface.TURF);
      expect(result.data?.condition).toBe(TrackCondition.FIRM);
      expect(result.data?.raceClass).toBe(RaceClass.G1);
      expect(result.data?.date).toEqual(new Date(2024, 4, 26)); // 5月は4（0ベース）
    });

    test('パターン2: 中山競馬場のダートレース情報を正しくパースできる', () => {
      const result = parser.parseRaceInfo(SAMPLE_RACE_INFO_2);

      expect(result.success).toBe(true);
      expect(result.data?.venue).toBe('中山');
      expect(result.data?.raceNumber).toBe(9);
      expect(result.data?.distance).toBe(1800);
      expect(result.data?.surface).toBe(Surface.DIRT);
      expect(result.data?.condition).toBe(TrackCondition.GOOD);
      expect(result.data?.raceClass).toBe(RaceClass.CLASS_3);
    });

    test('パターン3: 新潟競馬場の未勝利戦情報を正しくパースできる', () => {
      const result = parser.parseRaceInfo(SAMPLE_RACE_INFO_3);

      expect(result.success).toBe(true);
      expect(result.data?.venue).toBe('新潟');
      expect(result.data?.raceNumber).toBe(3);
      expect(result.data?.distance).toBe(1200);
      expect(result.data?.surface).toBe(Surface.TURF);
      expect(result.data?.raceClass).toBe(RaceClass.MAIDEN);
    });

    test('パターン4: 阪神競馬場のG2レース情報を正しくパースできる', () => {
      const result = parser.parseRaceInfo(SAMPLE_RACE_INFO_5);

      expect(result.success).toBe(true);
      expect(result.data?.venue).toBe('阪神');
      expect(result.data?.raceClass).toBe(RaceClass.G2);
      expect(result.data?.condition).toBe(TrackCondition.YIELDING);
    });

    test('パターン5: 京都競馬場のListedレース情報を正しくパースできる', () => {
      const result = parser.parseRaceInfo(SAMPLE_RACE_INFO_6);

      expect(result.success).toBe(true);
      expect(result.data?.venue).toBe('京都');
      expect(result.data?.raceClass).toBe(RaceClass.LISTED);
    });

    test('パターン6: 小倉競馬場の1勝クラス情報を正しくパースできる', () => {
      const result = parser.parseRaceInfo(SAMPLE_RACE_INFO_7);

      expect(result.success).toBe(true);
      expect(result.data?.venue).toBe('小倉');
      expect(result.data?.raceClass).toBe(RaceClass.CLASS_1);
      expect(result.data?.condition).toBe(TrackCondition.SOFT);
    });

    test('パターン7: 札幌競馬場の2勝クラス情報を正しくパースできる', () => {
      const result = parser.parseRaceInfo(SAMPLE_RACE_INFO_8);

      expect(result.success).toBe(true);
      expect(result.data?.venue).toBe('札幌');
      expect(result.data?.raceClass).toBe(RaceClass.CLASS_2);
    });

    test('パターン8: 函館競馬場のオープン特別情報を正しくパースできる', () => {
      const result = parser.parseRaceInfo(SAMPLE_RACE_INFO_9);

      expect(result.success).toBe(true);
      expect(result.data?.venue).toBe('函館');
      expect(result.data?.raceClass).toBe(RaceClass.OPEN);
    });

    test('パターン9: 福島競馬場のG3レース情報を正しくパースできる', () => {
      const result = parser.parseRaceInfo(SAMPLE_RACE_INFO_10);

      expect(result.success).toBe(true);
      expect(result.data?.venue).toBe('福島');
      expect(result.data?.raceClass).toBe(RaceClass.G3);
    });

    test('パターン10: 不正な形式のレース情報でエラーを返す', () => {
      const result = parser.parseRaceInfo(INVALID_RACE_INFO);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'venue')).toBe(true);
      expect(result.errors.some(e => e.field === 'raceNumber')).toBe(true);
    });
  });

  describe('parseHorseData', () => {
    test('パターン1: 標準的な馬データを正しくパースできる', () => {
      const result = parser.parseHorseData(SAMPLE_HORSE_DATA_1);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(8);

      const firstHorse = result.data?.[0];
      expect(firstHorse?.number).toBe(1);
      expect(firstHorse?.name).toBe('ドウデュース');
      expect(firstHorse?.age).toBe(3);
      expect(firstHorse?.gender).toBe(Gender.MALE);
      expect(firstHorse?.weight).toBe(57.0);
      expect(firstHorse?.jockeyName).toBe('福永祐一');
      expect(firstHorse?.trainerName).toBe('友道康夫');
    });

    test('パターン2: 牝馬とセン馬を含む馬データを正しくパースできる', () => {
      const result = parser.parseHorseData(SAMPLE_HORSE_DATA_2);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(5);

      const femaleHorse = result.data?.find(h => h.gender === Gender.FEMALE);
      expect(femaleHorse).toBeDefined();
      expect(femaleHorse?.weight).toBe(55.0);

      const geldingHorse = result.data?.find(h => h.gender === Gender.GELDING);
      expect(geldingHorse).toBeDefined();
      expect(geldingHorse?.age).toBe(5);
    });

    test('パターン3: 大量の馬データを正しくパースできる', () => {
      const result = parser.parseHorseData(SAMPLE_HORSE_DATA_3);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(10);

      // 全ての馬が2歳であることを確認
      result.data?.forEach(horse => {
        expect(horse.age).toBe(2);
        expect(horse.weight).toBe(54.0);
      });
    });

    test('パターン4: 不正な形式の馬データでスキップ処理が動作する', () => {
      const result = parser.parseHorseData(INVALID_HORSE_DATA);

      expect(result.success).toBe(true); // skipInvalidHorses = true
      expect(result.data?.length).toBe(1); // 正常な1行のみ
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('パターン5: 厳密モードで不正データがエラーになる', () => {
      const strictParser = new NetKeibaParser({
        strictMode: true,
        skipInvalidHorses: false,
      });
      const result = strictParser.parseHorseData(INVALID_HORSE_DATA);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('parseOdds', () => {
    test('パターン1: 完全なオッズデータを正しくパースできる', () => {
      const result = parser.parseOdds(SAMPLE_ODDS_DATA_1);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(8);

      const firstOdds = result.data?.[0];
      expect(firstOdds?.horseNumber).toBe(1);
      expect(firstOdds?.winOdds).toBe(3.2);
      expect(firstOdds?.placeOddsMin).toBe(1.1);
      expect(firstOdds?.placeOddsMax).toBe(1.3);
    });

    test('パターン2: 単勝オッズのみのデータを正しくパースできる', () => {
      const result = parser.parseOdds(SAMPLE_ODDS_DATA_3);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(10);

      const firstOdds = result.data?.[0];
      expect(firstOdds?.horseNumber).toBe(1);
      expect(firstOdds?.winOdds).toBe(8.5);
      expect(firstOdds?.placeOddsMin).toBeCloseTo(8.5 / 3, 1); // 概算値
      expect(firstOdds?.placeOddsMax).toBeCloseTo(8.5 / 2, 1); // 概算値
    });

    test('パターン3: 不正な形式のオッズデータで警告を出す', () => {
      const result = parser.parseOdds(INVALID_ODDS_DATA);

      expect(result.success).toBe(true); // 警告のみでエラーにはならない
      expect(result.data?.length).toBe(1); // 正常な1行のみ
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateParsedData', () => {
    test('有効なレースデータのバリデーションが成功する', () => {
      const validData = {
        venue: '東京',
        raceNumber: 11,
        distance: 2400,
        title: 'テストレース',
      };

      const result = parser.validateParsedData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('無効なデータでバリデーションエラーが発生する', () => {
      const invalidData = {
        venue: '', // 空文字
        raceNumber: 15, // 範囲外
        distance: 500, // 範囲外
      };

      const result = parser.validateParsedData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'venue')).toBe(true);
      expect(result.errors.some(e => e.field === 'raceNumber')).toBe(true);
      expect(result.errors.some(e => e.field === 'distance')).toBe(true);
    });

    test('nullまたはundefinedデータでバリデーションエラーが発生する', () => {
      const result1 = parser.validateParsedData(null);
      const result2 = parser.validateParsedData(undefined);

      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
    });
  });

  describe('統合テスト', () => {
    test('完全なデータセット1の統合パース', () => {
      const raceResult = parser.parseRaceInfo(COMPLETE_TEST_DATA_1.raceInfo);
      const horseResult = parser.parseHorseData(COMPLETE_TEST_DATA_1.horseData);
      const oddsResult = parser.parseOdds(COMPLETE_TEST_DATA_1.oddsData);

      expect(raceResult.success).toBe(true);
      expect(horseResult.success).toBe(true);
      expect(oddsResult.success).toBe(true);

      expect(raceResult.data?.venue).toBe('東京');
      expect(horseResult.data?.length).toBe(8);
      expect(oddsResult.data?.length).toBe(8);

      // 馬番とオッズの対応確認
      horseResult.data?.forEach(horse => {
        const correspondingOdds = oddsResult.data?.find(
          o => o.horseNumber === horse.number
        );
        expect(correspondingOdds).toBeDefined();
      });
    });

    test('完全なデータセット2の統合パース', () => {
      const raceResult = parser.parseRaceInfo(COMPLETE_TEST_DATA_2.raceInfo);
      const horseResult = parser.parseHorseData(COMPLETE_TEST_DATA_2.horseData);
      const oddsResult = parser.parseOdds(COMPLETE_TEST_DATA_2.oddsData);

      expect(raceResult.success).toBe(true);
      expect(horseResult.success).toBe(true);
      expect(oddsResult.success).toBe(true);

      expect(raceResult.data?.surface).toBe(Surface.DIRT);
      expect(raceResult.data?.condition).toBe(TrackCondition.GOOD);
      expect(horseResult.data?.length).toBe(5);
      expect(oddsResult.data?.length).toBe(5);
    });

    test('完全なデータセット3の統合パース', () => {
      const raceResult = parser.parseRaceInfo(COMPLETE_TEST_DATA_3.raceInfo);
      const horseResult = parser.parseHorseData(COMPLETE_TEST_DATA_3.horseData);
      const oddsResult = parser.parseOdds(COMPLETE_TEST_DATA_3.oddsData);

      expect(raceResult.success).toBe(true);
      expect(horseResult.success).toBe(true);
      expect(oddsResult.success).toBe(true);

      expect(raceResult.data?.raceClass).toBe(RaceClass.MAIDEN);
      expect(horseResult.data?.length).toBe(10);
      expect(oddsResult.data?.length).toBe(10);
    });

    test('エラーデータセットの統合パース', () => {
      const raceResult = parser.parseRaceInfo(ERROR_TEST_DATA.raceInfo);
      const horseResult = parser.parseHorseData(ERROR_TEST_DATA.horseData);
      const oddsResult = parser.parseOdds(ERROR_TEST_DATA.oddsData);

      expect(raceResult.success).toBe(false);
      expect(raceResult.errors.length).toBeGreaterThan(0);

      expect(horseResult.success).toBe(true); // skipInvalidHorses = true
      expect(horseResult.warnings.length).toBeGreaterThan(0);

      expect(oddsResult.success).toBe(true); // 警告のみ
      expect(oddsResult.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('設定テスト', () => {
    test('厳密モードでの動作確認', () => {
      const strictParser = new NetKeibaParser({ strictMode: true });
      const result = strictParser.parseRaceInfo(INVALID_RACE_INFO);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('カスタム設定での動作確認', () => {
      const customParser = new NetKeibaParser({
        skipInvalidHorses: false,
        defaultOdds: 50.0,
        maxHorses: 16,
      });

      const result = customParser.parseHorseData(INVALID_HORSE_DATA);
      expect(result.success).toBe(false); // skipInvalidHorses = false
    });
  });
});
