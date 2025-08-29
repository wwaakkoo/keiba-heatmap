/**
 * パースエラーの詳細レポート機能
 */

import { ParseError, ParseResult } from '@/types/parser';

export interface ErrorReport {
  summary: string;
  totalErrors: number;
  totalWarnings: number;
  errorsByType: Record<string, ParseError[]>;
  suggestions: string[];
  timestamp: Date;
}

export class ParseErrorReporter {
  /**
   * パース結果から詳細なエラーレポートを生成
   */
  generateReport<T>(results: ParseResult<T>[]): ErrorReport {
    const allErrors: ParseError[] = [];
    const allWarnings: string[] = [];

    // 全ての結果からエラーと警告を収集
    results.forEach(result => {
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    });

    // エラーをタイプ別に分類
    const errorsByType = this.groupErrorsByType(allErrors);

    // 改善提案を生成
    const suggestions = this.generateSuggestions(allErrors);

    // サマリーを生成
    const summary = this.generateSummary(allErrors, allWarnings);

    return {
      summary,
      totalErrors: allErrors.length,
      totalWarnings: allWarnings.length,
      errorsByType,
      suggestions,
      timestamp: new Date(),
    };
  }

  /**
   * エラーをタイプ別にグループ化
   */
  private groupErrorsByType(
    errors: ParseError[]
  ): Record<string, ParseError[]> {
    return errors.reduce(
      (groups, error) => {
        const type = error.type;
        if (!groups[type]) {
          groups[type] = [];
        }
        groups[type].push(error);
        return groups;
      },
      {} as Record<string, ParseError[]>
    );
  }

  /**
   * エラーに基づいて改善提案を生成
   */
  private generateSuggestions(errors: ParseError[]): string[] {
    const suggestions: string[] = [];
    const errorTypes = new Set(errors.map(e => e.type));
    const errorFields = new Set(errors.map(e => e.field));

    // レース情報エラーの提案
    if (errorTypes.has('RACE_INFO')) {
      if (errorFields.has('venue')) {
        suggestions.push(
          '競馬場名が正しく記載されているか確認してください（例：東京、中山、阪神など）'
        );
      }
      if (errorFields.has('distance')) {
        suggestions.push(
          '距離情報が「芝1600m」や「ダート1800m」の形式で記載されているか確認してください'
        );
      }
      if (errorFields.has('raceNumber')) {
        suggestions.push(
          'レース番号が「第11R」の形式で記載されているか確認してください'
        );
      }
      if (errorFields.has('date')) {
        suggestions.push(
          '開催日が「2024年5月26日」の形式で記載されているか確認してください'
        );
      }
    }

    // 馬データエラーの提案
    if (errorTypes.has('HORSE_DATA')) {
      suggestions.push(
        '馬データが「馬番 馬名 性別年齢 斤量 騎手名 調教師名」の形式で記載されているか確認してください'
      );
      suggestions.push('各項目がスペースで区切られているか確認してください');
      suggestions.push(
        '性別は「牡」「牝」「セ」のいずれかで記載されているか確認してください'
      );
    }

    // オッズデータエラーの提案
    if (errorTypes.has('ODDS_DATA')) {
      suggestions.push(
        'オッズデータが「馬番 単勝オッズ 複勝オッズ範囲」の形式で記載されているか確認してください'
      );
      suggestions.push(
        '複勝オッズは「1.1-1.3」の形式で記載されているか確認してください'
      );
    }

    // バリデーションエラーの提案
    if (errorTypes.has('VALIDATION')) {
      suggestions.push('入力データの値が適切な範囲内にあるか確認してください');
      suggestions.push('必須項目が全て入力されているか確認してください');
    }

    // 一般的な提案
    if (errors.length > 0) {
      suggestions.push(
        'NetKeibaから最新の形式でデータをコピーしているか確認してください'
      );
      suggestions.push(
        '不要な空行や特殊文字が含まれていないか確認してください'
      );
    }

    return suggestions;
  }

  /**
   * エラーサマリーを生成
   */
  private generateSummary(errors: ParseError[], warnings: string[]): string {
    if (errors.length === 0 && warnings.length === 0) {
      return 'パースが正常に完了しました。';
    }

    const parts: string[] = [];

    if (errors.length > 0) {
      parts.push(`${errors.length}件のエラーが発生しました`);
    }

    if (warnings.length > 0) {
      parts.push(`${warnings.length}件の警告があります`);
    }

    return parts.join('、') + '。';
  }

  /**
   * エラーレポートをテキスト形式で出力
   */
  formatReportAsText(report: ErrorReport): string {
    const lines: string[] = [];

    lines.push('=== パースエラーレポート ===');
    lines.push(`生成日時: ${report.timestamp.toLocaleString('ja-JP')}`);
    lines.push('');
    lines.push(`概要: ${report.summary}`);
    lines.push(`エラー数: ${report.totalErrors}`);
    lines.push(`警告数: ${report.totalWarnings}`);
    lines.push('');

    // エラー詳細
    if (report.totalErrors > 0) {
      lines.push('=== エラー詳細 ===');
      Object.entries(report.errorsByType).forEach(([type, errors]) => {
        lines.push(`\n[${type}] ${errors.length}件`);
        errors.forEach((error, index) => {
          lines.push(`  ${index + 1}. ${error.message}`);
          if (error.field) {
            lines.push(`     フィールド: ${error.field}`);
          }
          if (error.lineNumber) {
            lines.push(`     行番号: ${error.lineNumber}`);
          }
          if (error.rawData) {
            lines.push(
              `     生データ: ${error.rawData.substring(0, 50)}${error.rawData.length > 50 ? '...' : ''}`
            );
          }
        });
      });
    }

    // 改善提案
    if (report.suggestions.length > 0) {
      lines.push('\n=== 改善提案 ===');
      report.suggestions.forEach((suggestion, index) => {
        lines.push(`${index + 1}. ${suggestion}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * エラーレポートをJSON形式で出力
   */
  formatReportAsJson(report: ErrorReport): string {
    return JSON.stringify(report, null, 2);
  }
}
