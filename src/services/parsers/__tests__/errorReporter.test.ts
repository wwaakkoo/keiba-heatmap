/**
 * ParseErrorReporterの単体テスト
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { ParseErrorReporter } from '../errorReporter';
import { ParseResult, ParseError } from '@/types/parser';

describe('ParseErrorReporter', () => {
  let reporter: ParseErrorReporter;

  beforeEach(() => {
    reporter = new ParseErrorReporter();
  });

  describe('generateReport', () => {
    test('エラーなしの場合、正常なレポートを生成する', () => {
      const results: ParseResult<unknown>[] = [
        { success: true, data: {}, errors: [], warnings: [] },
        { success: true, data: {}, errors: [], warnings: [] },
      ];

      const report = reporter.generateReport(results);

      expect(report.totalErrors).toBe(0);
      expect(report.totalWarnings).toBe(0);
      expect(report.summary).toBe('パースが正常に完了しました。');
      expect(report.suggestions).toHaveLength(0);
    });

    test('複数のエラーがある場合、詳細なレポートを生成する', () => {
      const errors: ParseError[] = [
        {
          type: 'RACE_INFO',
          field: 'venue',
          message: '競馬場名が見つかりません',
          rawData: 'invalid data',
        },
        {
          type: 'HORSE_DATA',
          field: 'horseLine',
          message: '馬データの形式が正しくありません',
          lineNumber: 5,
        },
        {
          type: 'RACE_INFO',
          field: 'distance',
          message: '距離情報が見つかりません',
        },
      ];

      const results: ParseResult<unknown>[] = [
        { success: false, errors: errors.slice(0, 2), warnings: ['警告1'] },
        { success: false, errors: errors.slice(2), warnings: ['警告2'] },
      ];

      const report = reporter.generateReport(results);

      expect(report.totalErrors).toBe(3);
      expect(report.totalWarnings).toBe(2);
      expect(report.summary).toBe(
        '3件のエラーが発生しました、2件の警告があります。'
      );
      expect(report.errorsByType['RACE_INFO']).toHaveLength(2);
      expect(report.errorsByType['HORSE_DATA']).toHaveLength(1);
      expect(report.suggestions.length).toBeGreaterThan(0);
    });

    test('警告のみの場合、適切なレポートを生成する', () => {
      const results: ParseResult<unknown>[] = [
        { success: true, data: {}, errors: [], warnings: ['警告1', '警告2'] },
      ];

      const report = reporter.generateReport(results);

      expect(report.totalErrors).toBe(0);
      expect(report.totalWarnings).toBe(2);
      expect(report.summary).toBe('2件の警告があります。');
    });
  });

  describe('formatReportAsText', () => {
    test('テキスト形式のレポートを正しく生成する', () => {
      const errors: ParseError[] = [
        {
          type: 'RACE_INFO',
          field: 'venue',
          message: '競馬場名が見つかりません',
          rawData: 'invalid race data',
          lineNumber: 1,
        },
      ];

      const results: ParseResult<unknown>[] = [
        { success: false, errors, warnings: ['テスト警告'] },
      ];

      const report = reporter.generateReport(results);
      const textReport = reporter.formatReportAsText(report);

      expect(textReport).toContain('=== パースエラーレポート ===');
      expect(textReport).toContain('エラー数: 1');
      expect(textReport).toContain('警告数: 1');
      expect(textReport).toContain('=== エラー詳細 ===');
      expect(textReport).toContain('[RACE_INFO]');
      expect(textReport).toContain('競馬場名が見つかりません');
      expect(textReport).toContain('フィールド: venue');
      expect(textReport).toContain('行番号: 1');
      expect(textReport).toContain('生データ: invalid race data');
      expect(textReport).toContain('=== 改善提案 ===');
    });

    test('エラーなしの場合、シンプルなレポートを生成する', () => {
      const results: ParseResult<unknown>[] = [
        { success: true, data: {}, errors: [], warnings: [] },
      ];

      const report = reporter.generateReport(results);
      const textReport = reporter.formatReportAsText(report);

      expect(textReport).toContain('パースが正常に完了しました');
      expect(textReport).toContain('エラー数: 0');
      expect(textReport).toContain('警告数: 0');
      expect(textReport).not.toContain('=== エラー詳細 ===');
      expect(textReport).not.toContain('=== 改善提案 ===');
    });
  });

  describe('formatReportAsJson', () => {
    test('JSON形式のレポートを正しく生成する', () => {
      const results: ParseResult<unknown>[] = [
        { success: true, data: {}, errors: [], warnings: [] },
      ];

      const report = reporter.generateReport(results);
      const jsonReport = reporter.formatReportAsJson(report);

      expect(() => JSON.parse(jsonReport)).not.toThrow();

      const parsed = JSON.parse(jsonReport);
      expect(parsed.totalErrors).toBe(0);
      expect(parsed.totalWarnings).toBe(0);
      expect(parsed.summary).toBe('パースが正常に完了しました。');
      expect(parsed.timestamp).toBeDefined();
    });
  });

  describe('suggestions generation', () => {
    test('レース情報エラーに対する適切な提案を生成する', () => {
      const errors: ParseError[] = [
        { type: 'RACE_INFO', field: 'venue', message: 'venue error' },
        { type: 'RACE_INFO', field: 'distance', message: 'distance error' },
        {
          type: 'RACE_INFO',
          field: 'raceNumber',
          message: 'race number error',
        },
        { type: 'RACE_INFO', field: 'date', message: 'date error' },
      ];

      const results: ParseResult<unknown>[] = [
        { success: false, errors, warnings: [] },
      ];

      const report = reporter.generateReport(results);

      // デバッグ用：実際の提案内容を確認
      console.log('Generated suggestions:', report.suggestions);

      expect(report.suggestions.length).toBeGreaterThan(0);
      expect(report.suggestions.some(s => s.includes('競馬場名'))).toBe(true);
      expect(report.suggestions.some(s => s.includes('距離情報'))).toBe(true);
      expect(report.suggestions.some(s => s.includes('レース番号'))).toBe(true);
      expect(report.suggestions.some(s => s.includes('開催日'))).toBe(true);
    });

    test('馬データエラーに対する適切な提案を生成する', () => {
      const errors: ParseError[] = [
        { type: 'HORSE_DATA', field: 'horseLine', message: 'horse data error' },
      ];

      const results: ParseResult<unknown>[] = [
        { success: false, errors, warnings: [] },
      ];

      const report = reporter.generateReport(results);

      expect(report.suggestions.length).toBeGreaterThan(0);
      expect(report.suggestions.some(s => s.includes('馬データ'))).toBe(true);
      expect(report.suggestions.some(s => s.includes('性別'))).toBe(true);
    });

    test('オッズデータエラーに対する適切な提案を生成する', () => {
      const errors: ParseError[] = [
        { type: 'ODDS_DATA', field: 'oddsLine', message: 'odds data error' },
      ];

      const results: ParseResult<unknown>[] = [
        { success: false, errors, warnings: [] },
      ];

      const report = reporter.generateReport(results);

      expect(report.suggestions.length).toBeGreaterThan(0);
      expect(report.suggestions.some(s => s.includes('オッズデータ'))).toBe(
        true
      );
      expect(report.suggestions.some(s => s.includes('複勝オッズ'))).toBe(true);
    });

    test('一般的な提案を生成する', () => {
      const errors: ParseError[] = [
        { type: 'VALIDATION', field: 'general', message: 'validation error' },
      ];

      const results: ParseResult<unknown>[] = [
        { success: false, errors, warnings: [] },
      ];

      const report = reporter.generateReport(results);

      expect(report.suggestions.length).toBeGreaterThan(0);
      expect(report.suggestions.some(s => s.includes('NetKeiba'))).toBe(true);
      expect(
        report.suggestions.some(
          s => s.includes('空行') || s.includes('特殊文字')
        )
      ).toBe(true);
    });
  });
});
