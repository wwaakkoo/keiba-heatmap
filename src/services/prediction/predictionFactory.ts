/**
 * 予想計算エンジンのファクトリークラス
 */

import { PredictionEngine } from './predictionEngine';
import { PredictionConfig, CalculationWeights } from './types';

export class PredictionFactory {
  /**
   * デフォルト設定で予想エンジンを作成
   */
  static createDefault(): PredictionEngine {
    const config = this.getDefaultConfig();
    return new PredictionEngine(config);
  }

  /**
   * カスタム設定で予想エンジンを作成
   */
  static createWithConfig(config: Partial<PredictionConfig>): PredictionEngine {
    const defaultConfig = this.getDefaultConfig();
    const mergedConfig = { ...defaultConfig, ...config };
    return new PredictionEngine(mergedConfig);
  }

  /**
   * 保守的な設定で予想エンジンを作成（高い信頼度を要求）
   */
  static createConservative(): PredictionEngine {
    const config: PredictionConfig = {
      weights: this.getConservativeWeights(),
      minimumExpectedValue: 1.3, // より高い期待値を要求
      minimumConfidence: 0.7, // より高い信頼度を要求
      enableLogging: false,
      maxRecentRaces: 5,
    };
    return new PredictionEngine(config);
  }

  /**
   * アグレッシブな設定で予想エンジンを作成（低い閾値）
   */
  static createAggressive(): PredictionEngine {
    const config: PredictionConfig = {
      weights: this.getAggressiveWeights(),
      minimumExpectedValue: 1.1, // より低い期待値で推奨
      minimumConfidence: 0.5, // より低い信頼度で推奨
      enableLogging: false,
      maxRecentRaces: 8, // より多くのレースを分析
    };
    return new PredictionEngine(config);
  }

  /**
   * デバッグ用設定で予想エンジンを作成（ログ有効）
   */
  static createDebug(): PredictionEngine {
    const config = this.getDefaultConfig();
    config.enableLogging = true;
    return new PredictionEngine(config);
  }

  /**
   * デフォルト設定を取得
   */
  private static getDefaultConfig(): PredictionConfig {
    return {
      weights: this.getDefaultWeights(),
      minimumExpectedValue: 1.2, // 120%以上で推奨
      minimumConfidence: 0.6, // 60%以上の信頼度で推奨
      enableLogging: false,
      maxRecentRaces: 5,
    };
  }

  /**
   * デフォルトの重み設定を取得
   */
  private static getDefaultWeights(): CalculationWeights {
    return {
      pastPerformance: 0.4, // 過去成績を最重視
      jockeyPerformance: 0.25, // 騎手成績
      distanceAptitude: 0.2, // 距離適性
      venueAptitude: 0.15, // コース適性
      classAptitude: 0.0, // クラス適性（未実装のため0）
    };
  }

  /**
   * 保守的な重み設定を取得
   */
  private static getConservativeWeights(): CalculationWeights {
    return {
      pastPerformance: 0.5, // 過去成績をより重視
      jockeyPerformance: 0.2,
      distanceAptitude: 0.15,
      venueAptitude: 0.15,
      classAptitude: 0.0,
    };
  }

  /**
   * アグレッシブな重み設定を取得
   */
  private static getAggressiveWeights(): CalculationWeights {
    return {
      pastPerformance: 0.3, // 過去成績の重みを下げる
      jockeyPerformance: 0.3, // 騎手成績を重視
      distanceAptitude: 0.25, // 距離適性を重視
      venueAptitude: 0.15,
      classAptitude: 0.0,
    };
  }

  /**
   * 設定の妥当性をチェック
   */
  static validateConfig(config: PredictionConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 重みの合計チェック
    const totalWeight = Object.values(config.weights).reduce(
      (sum, weight) => sum + weight,
      0
    );
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      errors.push(`重みの合計が1.0ではありません: ${totalWeight.toFixed(3)}`);
    }

    // 各重みの範囲チェック
    Object.entries(config.weights).forEach(([key, weight]) => {
      if (weight < 0 || weight > 1) {
        errors.push(`${key}の重みが範囲外です: ${weight}`);
      }
    });

    // 期待値閾値チェック
    if (config.minimumExpectedValue < 1.0) {
      errors.push(`最小期待値が1.0未満です: ${config.minimumExpectedValue}`);
    }

    // 信頼度閾値チェック
    if (config.minimumConfidence < 0 || config.minimumConfidence > 1) {
      errors.push(`最小信頼度が範囲外です: ${config.minimumConfidence}`);
    }

    // 最大レース数チェック
    if (config.maxRecentRaces < 1 || config.maxRecentRaces > 20) {
      errors.push(`最大レース数が範囲外です: ${config.maxRecentRaces}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
