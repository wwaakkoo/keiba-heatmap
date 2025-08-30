/**
 * 予想計算のログ出力機能
 */

import { CalculationLog } from './types';

export class Logger {
  private enabled: boolean;
  private logs: Map<string, CalculationLog> = new Map();

  constructor(enabled: boolean = false) {
    this.enabled = enabled;
  }

  /**
   * 計算開始時のログを初期化
   */
  startCalculation(horseId: string, horseName: string): CalculationLog {
    const log: CalculationLog = {
      horseId,
      horseName,
      steps: [],
      finalScore: 0,
      expectedValue: 0,
      confidence: 0,
      timestamp: new Date(),
    };

    this.logs.set(horseId, log);

    if (this.enabled) {
      console.log(`🐎 [${horseName}] 予想計算開始`);
    }

    return log;
  }

  /**
   * 計算終了時のログを出力
   */
  endCalculation(log: CalculationLog): void {
    if (this.enabled) {
      console.log(`🏁 [${log.horseName}] 予想計算完了`);
      console.log(`   基礎スコア: ${log.finalScore.toFixed(1)}点`);
      console.log(`   期待値: ${(log.expectedValue * 100).toFixed(1)}%`);
      console.log(`   信頼度: ${(log.confidence * 100).toFixed(1)}%`);
      console.log(`   計算ステップ数: ${log.steps.length}`);

      if (log.steps.length > 0) {
        console.log('   詳細:');
        log.steps.forEach((step, index) => {
          console.log(
            `     ${index + 1}. ${step.name}: ${step.output.toFixed(1)} (重み: ${step.weight}) → ${step.weightedScore.toFixed(1)}`
          );
        });
      }
    }
  }

  /**
   * 計算ステップのログを記録
   */
  logStep(_horseId: string, name: string, data: Record<string, unknown>): void {
    if (this.enabled) {
      console.log(`   📊 [${name}]`, data);
    }
  }

  /**
   * エラーログを出力
   */
  logError(horseId: string, message: string, error: unknown): void {
    const log = this.logs.get(horseId);
    const horseName = log?.horseName || 'Unknown';

    console.error(`❌ [${horseName}] ${message}:`, error);
  }

  /**
   * 警告ログを出力
   */
  logWarning(
    horseId: string,
    message: string,
    data?: Record<string, unknown>
  ): void {
    if (this.enabled) {
      const log = this.logs.get(horseId);
      const horseName = log?.horseName || 'Unknown';

      console.warn(`⚠️ [${horseName}] ${message}`, data || '');
    }
  }

  /**
   * 情報ログを出力
   */
  logInfo(
    horseId: string,
    message: string,
    data?: Record<string, unknown>
  ): void {
    if (this.enabled) {
      const log = this.logs.get(horseId);
      const horseName = log?.horseName || 'Unknown';

      console.info(`ℹ️ [${horseName}] ${message}`, data || '');
    }
  }

  /**
   * 指定された馬のログを取得
   */
  getLog(horseId: string): CalculationLog {
    const log = this.logs.get(horseId);
    if (!log) {
      throw new Error(`Log not found for horse ID: ${horseId}`);
    }
    return log;
  }

  /**
   * 全てのログを取得
   */
  getAllLogs(): CalculationLog[] {
    return Array.from(this.logs.values());
  }

  /**
   * ログをクリア
   */
  clearLogs(): void {
    this.logs.clear();

    if (this.enabled) {
      console.log('🧹 計算ログをクリアしました');
    }
  }

  /**
   * ログ出力の有効/無効を切り替え
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (enabled) {
      console.log('📝 予想計算ログを有効にしました');
    } else {
      console.log('🔇 予想計算ログを無効にしました');
    }
  }

  /**
   * ログをJSON形式で出力
   */
  exportLogs(): string {
    const logs = this.getAllLogs();
    return JSON.stringify(logs, null, 2);
  }

  /**
   * 計算サマリーを出力
   */
  logSummary(raceId: string, totalHorses: number): void {
    if (!this.enabled) return;

    const logs = this.getAllLogs();
    const recommendedCount = logs.filter(
      log => log.expectedValue >= 1.2 && log.confidence >= 0.6
    ).length;

    console.log(`\n🏇 レース ${raceId} 予想計算サマリー`);
    console.log(`   出走頭数: ${totalHorses}頭`);
    console.log(`   計算完了: ${logs.length}頭`);
    console.log(`   推奨馬: ${recommendedCount}頭`);

    if (recommendedCount > 0) {
      console.log('   推奨馬一覧:');
      logs
        .filter(log => log.expectedValue >= 1.2 && log.confidence >= 0.6)
        .sort((a, b) => b.expectedValue - a.expectedValue)
        .forEach((log, index) => {
          console.log(
            `     ${index + 1}. ${log.horseName} (期待値: ${(log.expectedValue * 100).toFixed(1)}%, 信頼度: ${(log.confidence * 100).toFixed(1)}%)`
          );
        });
    }

    console.log('');
  }
}
