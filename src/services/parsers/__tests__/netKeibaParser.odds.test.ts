/**
 * NetKeibaパーサーのオッズデータテスト
 * 実際のNetKeibaオッズデータでの抽出テスト
 */

import { describe, it, expect } from 'vitest';
import { NetKeibaParser } from '../netKeibaParser';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('NetKeibaParser - オッズデータテスト', () => {
  const parser = new NetKeibaParser({
    strictMode: false,
    skipInvalidHorses: true,
  });

  describe('実際のNetKeibaオッズデータパース', () => {
    it('odds.txtのオッズデータを正しくパースできる', () => {
      // odds.txtファイルを読み込み
      const oddsText = readFileSync(
        resolve(process.cwd(), 'odds.txt'),
        'utf-8'
      );

      const result = parser.parseOdds(oddsText);

      console.log('オッズパース結果:', JSON.stringify(result, null, 2));

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data) {
        expect(result.data.length).toBe(16); // 16頭のオッズデータ

        // 1番馬のオッズチェック
        const horse1 = result.data.find(h => h.horseNumber === 1);
        expect(horse1).toBeDefined();
        expect(horse1?.winOdds).toBe(176.3);
        expect(horse1?.placeOddsMin).toBe(27.4);
        expect(horse1?.placeOddsMax).toBe(38);

        // 3番馬のオッズチェック（人気馬）
        const horse3 = result.data.find(h => h.horseNumber === 3);
        expect(horse3).toBeDefined();
        expect(horse3?.winOdds).toBe(9.7);
        expect(horse3?.placeOddsMin).toBe(3.0);
        expect(horse3?.placeOddsMax).toBe(4.0);

        // 10番馬のオッズチェック（1番人気）
        const horse10 = result.data.find(h => h.horseNumber === 10);
        expect(horse10).toBeDefined();
        expect(horse10?.winOdds).toBe(5.4);
        expect(horse10?.placeOddsMin).toBe(1.6);
        expect(horse10?.placeOddsMax).toBe(1.9);

        // 全馬のオッズが正しく設定されていることを確認
        result.data.forEach(horse => {
          expect(horse.winOdds).toBeGreaterThan(0);
          expect(horse.placeOddsMin).toBeGreaterThan(0);
          expect(horse.placeOddsMax).toBeGreaterThan(0);
          expect(horse.placeOddsMax).toBeGreaterThanOrEqual(horse.placeOddsMin);
        });
      }
    });

    it('オッズデータが馬番号順にソートされている', () => {
      const oddsText = readFileSync(
        resolve(process.cwd(), 'odds.txt'),
        'utf-8'
      );
      const result = parser.parseOdds(oddsText);

      expect(result.success).toBe(true);

      if (result.data) {
        for (let i = 1; i < result.data.length; i++) {
          expect(result.data[i].horseNumber).toBeGreaterThan(
            result.data[i - 1].horseNumber
          );
        }
      }
    });

    it('エラーハンドリングが適切に動作する', () => {
      const invalidOddsText = 'invalid odds data';
      const result = parser.parseOdds(invalidOddsText);

      // データが見つからなくても成功とする（空のデータ配列）
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });
});
