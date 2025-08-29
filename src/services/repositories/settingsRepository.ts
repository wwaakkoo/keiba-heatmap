import { BaseRepository, ValidationResult, OperationResult } from './base';
import { db } from '../database';
import type { AppSettings } from '@/types/core';

/**
 * 設定データのRepository
 * アプリケーション設定の永続化と管理機能を提供
 */
export class SettingsRepository extends BaseRepository<AppSettings> {
  constructor() {
    super(db.settings);
  }

  /**
   * 設定データのバリデーション
   */
  protected validate(data: Partial<AppSettings>): ValidationResult {
    const errors: string[] = [];

    // 必須フィールドのチェック
    if (!data.key || data.key.trim().length === 0) {
      errors.push('設定キーは必須です');
    }

    if (data.value === undefined || data.value === null) {
      errors.push('設定値は必須です');
    }

    // 特定の設定キーに対する詳細バリデーション
    if (data.key && data.value) {
      switch (data.key) {
        case 'bankroll':
          if (
            typeof data.value !== 'object' ||
            !data.value.initialAmount ||
            !data.value.currentAmount
          ) {
            errors.push('バンクロール設定には初期金額と現在金額が必要です');
          } else {
            if (data.value.initialAmount <= 0 || data.value.currentAmount < 0) {
              errors.push('バンクロール金額は正の数値で指定してください');
            }
          }
          break;

        case 'betStrategy':
          if (typeof data.value !== 'object' || !data.value.type) {
            errors.push('投資戦略設定にはタイプが必要です');
          } else {
            if (!['fixed', 'proportional', 'kelly'].includes(data.value.type)) {
              errors.push(
                '投資戦略タイプは fixed, proportional, kelly のいずれかを指定してください'
              );
            }
            if (
              data.value.type === 'proportional' &&
              (!data.value.percentage ||
                data.value.percentage <= 0 ||
                data.value.percentage > 10)
            ) {
              errors.push(
                '比例投資の場合、パーセンテージは1-10%の範囲で指定してください'
              );
            }
          }
          break;

        case 'riskManagement':
          if (typeof data.value !== 'object') {
            errors.push('リスク管理設定はオブジェクト形式で指定してください');
          } else {
            if (data.value.dailyLossLimit && data.value.dailyLossLimit <= 0) {
              errors.push('日次損失限度額は正の数値で指定してください');
            }
            if (data.value.maxExposure && data.value.maxExposure <= 0) {
              errors.push('最大露出額は正の数値で指定してください');
            }
          }
          break;

        case 'ui':
          if (typeof data.value !== 'object') {
            errors.push('UI設定はオブジェクト形式で指定してください');
          } else {
            if (
              data.value.theme &&
              !['light', 'dark', 'system'].includes(data.value.theme)
            ) {
              errors.push(
                'テーマは light, dark, system のいずれかを指定してください'
              );
            }
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 設定値を取得
   */
  async getSetting<T = any>(
    key: string
  ): Promise<OperationResult<T | undefined>> {
    return this.executeWithErrorHandling(async () => {
      const setting = await this.table.get(key);
      return setting?.value as T;
    }, 'getSetting');
  }

  /**
   * 設定値を保存
   */
  async setSetting<T = any>(
    key: string,
    value: T
  ): Promise<OperationResult<void>> {
    return this.executeWithErrorHandling(async () => {
      const setting: AppSettings = { key, value };

      // バリデーション
      const validation = this.validate(setting);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      await this.table.put(setting);
    }, 'setSetting');
  }

  /**
   * 複数の設定を一括取得
   */
  async getMultipleSettings(
    keys: string[]
  ): Promise<OperationResult<Record<string, any>>> {
    return this.executeWithErrorHandling(async () => {
      const settings = await this.table.where('key').anyOf(keys).toArray();
      const result: Record<string, any> = {};

      settings.forEach(setting => {
        result[setting.key] = setting.value;
      });

      return result;
    }, 'getMultipleSettings');
  }

  /**
   * 全設定を取得
   */
  async getAllSettings(): Promise<OperationResult<Record<string, any>>> {
    return this.executeWithErrorHandling(async () => {
      const settings = await this.table.toArray();
      const result: Record<string, any> = {};

      settings.forEach(setting => {
        result[setting.key] = setting.value;
      });

      return result;
    }, 'getAllSettings');
  }

  /**
   * バンクロール設定の取得
   */
  async getBankrollSettings(): Promise<
    OperationResult<
      | {
          initialAmount: number;
          currentAmount: number;
        }
      | undefined
    >
  > {
    return this.getSetting('bankroll');
  }

  /**
   * バンクロール設定の更新
   */
  async updateBankroll(
    initialAmount?: number,
    currentAmount?: number
  ): Promise<OperationResult<void>> {
    return this.executeWithErrorHandling(async () => {
      const current = await this.getSetting('bankroll');
      if (!current.success) throw new Error(current.error);

      const currentSettings = current.data || {
        initialAmount: 100000,
        currentAmount: 100000,
      };

      const newSettings = {
        initialAmount: initialAmount ?? currentSettings.initialAmount,
        currentAmount: currentAmount ?? currentSettings.currentAmount,
      };

      return await this.setSetting('bankroll', newSettings);
    }, 'updateBankroll');
  }

  /**
   * 投資戦略設定の取得
   */
  async getBetStrategySettings(): Promise<
    OperationResult<
      | {
          type: 'fixed' | 'proportional' | 'kelly';
          fixedAmount?: number;
          percentage?: number;
          kellyFraction?: number;
        }
      | undefined
    >
  > {
    return this.getSetting('betStrategy');
  }

  /**
   * 投資戦略設定の更新
   */
  async updateBetStrategy(strategy: {
    type: 'fixed' | 'proportional' | 'kelly';
    fixedAmount?: number;
    percentage?: number;
    kellyFraction?: number;
  }): Promise<OperationResult<void>> {
    return this.setSetting('betStrategy', strategy);
  }

  /**
   * リスク管理設定の取得
   */
  async getRiskManagementSettings(): Promise<
    OperationResult<
      | {
          dailyLossLimit: number;
          maxExposure: number;
          stopLossPercentage?: number;
        }
      | undefined
    >
  > {
    return this.getSetting('riskManagement');
  }

  /**
   * リスク管理設定の更新
   */
  async updateRiskManagement(settings: {
    dailyLossLimit?: number;
    maxExposure?: number;
    stopLossPercentage?: number;
  }): Promise<OperationResult<void>> {
    return this.executeWithErrorHandling(async () => {
      const current = await this.getSetting('riskManagement');
      if (!current.success) throw new Error(current.error);

      const currentSettings = current.data || {
        dailyLossLimit: 10000,
        maxExposure: 20000,
      };

      const newSettings = {
        ...currentSettings,
        ...settings,
      };

      return await this.setSetting('riskManagement', newSettings);
    }, 'updateRiskManagement');
  }

  /**
   * UI設定の取得
   */
  async getUISettings(): Promise<
    OperationResult<
      | {
          theme: 'light' | 'dark' | 'system';
          language: string;
          notifications: boolean;
        }
      | undefined
    >
  > {
    return this.getSetting('ui');
  }

  /**
   * UI設定の更新
   */
  async updateUISettings(settings: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    notifications?: boolean;
  }): Promise<OperationResult<void>> {
    return this.executeWithErrorHandling(async () => {
      const current = await this.getSetting('ui');
      if (!current.success) throw new Error(current.error);

      const currentSettings = current.data || {
        theme: 'system',
        language: 'ja',
        notifications: true,
      };

      const newSettings = {
        ...currentSettings,
        ...settings,
      };

      return await this.setSetting('ui', newSettings);
    }, 'updateUISettings');
  }

  /**
   * 設定のリセット（デフォルト値に戻す）
   */
  async resetToDefaults(): Promise<OperationResult<void>> {
    return this.executeWithErrorHandling(async () => {
      await this.table.clear();

      const defaultSettings: AppSettings[] = [
        {
          key: 'bankroll',
          value: { initialAmount: 100000, currentAmount: 100000 },
        },
        {
          key: 'betStrategy',
          value: { type: 'proportional', percentage: 2 },
        },
        {
          key: 'riskManagement',
          value: { dailyLossLimit: 10000, maxExposure: 20000 },
        },
        {
          key: 'ui',
          value: { theme: 'system', language: 'ja', notifications: true },
        },
      ];

      for (const setting of defaultSettings) {
        await this.table.put(setting);
      }
    }, 'resetToDefaults');
  }

  /**
   * 設定のエクスポート
   */
  async exportSettings(): Promise<OperationResult<Record<string, any>>> {
    return this.getAllSettings();
  }

  /**
   * 設定のインポート
   */
  async importSettings(
    settings: Record<string, any>
  ): Promise<OperationResult<void>> {
    return this.executeWithErrorHandling(async () => {
      for (const [key, value] of Object.entries(settings)) {
        const result = await this.setSetting(key, value);
        if (!result.success) {
          throw new Error(`Failed to import setting ${key}: ${result.error}`);
        }
      }
    }, 'importSettings');
  }
}
