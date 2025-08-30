import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from '../useSettingsStore';
import type { UserSettings } from '@/types/core';
import { InvestmentStrategy } from '@/types/enums';

// リポジトリのモック
vi.mock('@/services/repositories/settingsRepository', () => ({
  settingsRepository: {
    set: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    clear: vi.fn(),
  },
}));

const defaultSettings = {
  investment: {
    strategy: InvestmentStrategy.PROPORTIONAL,
    initialBankroll: 100000,
    betSizePercentage: 2,
    dailyLossLimit: 5000,
    maxExposure: 20000,
  },
  prediction: {
    minimumExpectedValue: 1.2,
    minimumConfidence: 0.6,
    weights: {
      pastPerformance: 0.3,
      jockeyPerformance: 0.25,
      distanceAptitude: 0.2,
      venueAptitude: 0.15,
      classAptitude: 0.1,
    },
  },
  ui: {
    theme: 'system' as const,
    language: 'ja' as const,
    notifications: true,
    autoSave: true,
  },
  data: {
    autoBackup: true,
    backupFrequency: 'weekly' as const,
    retentionPeriod: 365,
  },
};

describe('useSettingsStore', () => {
  beforeEach(() => {
    // ストアをリセット（デフォルト設定に戻す）
    useSettingsStore.setState({
      settings: defaultSettings,
      loading: false,
      error: null,
    });

    // モックをリセット
    vi.clearAllMocks();
  });

  describe('初期状態', () => {
    it('デフォルト設定が正しく設定されている', () => {
      const state = useSettingsStore.getState();

      expect(state.settings.investment.strategy).toBe(
        InvestmentStrategy.PROPORTIONAL
      );
      expect(state.settings.investment.initialBankroll).toBe(100000);
      expect(state.settings.prediction.minimumExpectedValue).toBe(1.2);
      expect(state.settings.ui.theme).toBe('system');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setSettings', () => {
    it('設定を一括で設定できる', () => {
      const newSettings: UserSettings = {
        ...useSettingsStore.getState().settings,
        investment: {
          ...useSettingsStore.getState().settings.investment,
          initialBankroll: 200000,
        },
      };

      useSettingsStore.getState().setSettings(newSettings);

      expect(
        useSettingsStore.getState().settings.investment.initialBankroll
      ).toBe(200000);
    });
  });

  describe('updateInvestmentSettings', () => {
    it('投資設定を正常に更新できる', async () => {
      const { settingsRepository } = await import(
        '@/services/repositories/settingsRepository'
      );

      vi.mocked(settingsRepository.set).mockResolvedValue();

      const result = await useSettingsStore
        .getState()
        .updateInvestmentSettings({
          initialBankroll: 150000,
          betSizePercentage: 3,
        });

      expect(result.success).toBe(true);
      expect(
        useSettingsStore.getState().settings.investment.initialBankroll
      ).toBe(150000);
      expect(
        useSettingsStore.getState().settings.investment.betSizePercentage
      ).toBe(3);
      expect(useSettingsStore.getState().loading).toBe(false);
    });

    it('投資設定更新時にデータベースに保存される', async () => {
      const { settingsRepository } = await import(
        '@/services/repositories/settingsRepository'
      );

      vi.mocked(settingsRepository.set).mockResolvedValue();

      await useSettingsStore.getState().updateInvestmentSettings({
        initialBankroll: 150000,
        strategy: InvestmentStrategy.FIXED,
      });

      expect(settingsRepository.set).toHaveBeenCalledWith(
        'investment.initialBankroll',
        150000
      );
      expect(settingsRepository.set).toHaveBeenCalledWith(
        'investment.strategy',
        InvestmentStrategy.FIXED
      );
    });
  });

  describe('updatePredictionSettings', () => {
    it('予想設定を正常に更新できる', async () => {
      const { settingsRepository } = await import(
        '@/services/repositories/settingsRepository'
      );

      vi.mocked(settingsRepository.set).mockResolvedValue();

      const result = await useSettingsStore
        .getState()
        .updatePredictionSettings({
          minimumExpectedValue: 1.3,
          minimumConfidence: 0.7,
        });

      expect(result.success).toBe(true);
      expect(
        useSettingsStore.getState().settings.prediction.minimumExpectedValue
      ).toBe(1.3);
      expect(
        useSettingsStore.getState().settings.prediction.minimumConfidence
      ).toBe(0.7);
    });

    it('重み設定を更新できる', async () => {
      const { settingsRepository } = await import(
        '@/services/repositories/settingsRepository'
      );

      vi.mocked(settingsRepository.set).mockResolvedValue();

      const newWeights = {
        pastPerformance: 0.4,
        jockeyPerformance: 0.3,
        distanceAptitude: 0.15,
        venueAptitude: 0.1,
        classAptitude: 0.05,
      };

      await useSettingsStore.getState().updatePredictionSettings({
        weights: newWeights,
      });

      expect(useSettingsStore.getState().settings.prediction.weights).toEqual(
        newWeights
      );
    });
  });

  describe('updateUISettings', () => {
    it('UI設定を正常に更新できる', async () => {
      const { settingsRepository } = await import(
        '@/services/repositories/settingsRepository'
      );

      vi.mocked(settingsRepository.set).mockResolvedValue();

      const result = await useSettingsStore.getState().updateUISettings({
        theme: 'dark',
        notifications: false,
      });

      expect(result.success).toBe(true);
      expect(useSettingsStore.getState().settings.ui.theme).toBe('dark');
      expect(useSettingsStore.getState().settings.ui.notifications).toBe(false);
    });
  });

  describe('updateDataSettings', () => {
    it('データ設定を正常に更新できる', async () => {
      const { settingsRepository } = await import(
        '@/services/repositories/settingsRepository'
      );

      vi.mocked(settingsRepository.set).mockResolvedValue();

      const result = await useSettingsStore.getState().updateDataSettings({
        autoBackup: false,
        backupFrequency: 'monthly',
        retentionPeriod: 180,
      });

      expect(result.success).toBe(true);
      expect(useSettingsStore.getState().settings.data.autoBackup).toBe(false);
      expect(useSettingsStore.getState().settings.data.backupFrequency).toBe(
        'monthly'
      );
      expect(useSettingsStore.getState().settings.data.retentionPeriod).toBe(
        180
      );
    });
  });

  describe('resetToDefaults', () => {
    it('設定をデフォルトにリセットできる', async () => {
      const { settingsRepository } = await import(
        '@/services/repositories/settingsRepository'
      );

      vi.mocked(settingsRepository.clear).mockResolvedValue();

      // 設定を変更
      await useSettingsStore.getState().updateInvestmentSettings({
        initialBankroll: 200000,
      });

      // リセット実行
      const result = await useSettingsStore.getState().resetToDefaults();

      expect(result.success).toBe(true);
      expect(
        useSettingsStore.getState().settings.investment.initialBankroll
      ).toBe(100000);
      expect(settingsRepository.clear).toHaveBeenCalled();
    });
  });

  describe('loadSettings', () => {
    it('データベースから設定を読み込める', async () => {
      const { settingsRepository } = await import(
        '@/services/repositories/settingsRepository'
      );

      const mockSettingsEntries = [
        {
          key: 'investment.initialBankroll',
          value: 150000,
          updatedAt: new Date(),
        },
        { key: 'ui.theme', value: 'dark', updatedAt: new Date() },
        {
          key: 'prediction.minimumExpectedValue',
          value: 1.3,
          updatedAt: new Date(),
        },
      ];

      vi.mocked(settingsRepository.getAll).mockResolvedValue(
        mockSettingsEntries
      );

      await useSettingsStore.getState().loadSettings();

      expect(
        useSettingsStore.getState().settings.investment.initialBankroll
      ).toBe(150000);
      expect(useSettingsStore.getState().settings.ui.theme).toBe('dark');
      expect(
        useSettingsStore.getState().settings.prediction.minimumExpectedValue
      ).toBe(1.3);
    });

    it('設定が存在しない場合はデフォルト設定を使用', async () => {
      const { settingsRepository } = await import(
        '@/services/repositories/settingsRepository'
      );

      vi.mocked(settingsRepository.getAll).mockResolvedValue([]);

      await useSettingsStore.getState().loadSettings();

      expect(
        useSettingsStore.getState().settings.investment.initialBankroll
      ).toBe(100000);
      expect(useSettingsStore.getState().settings.ui.theme).toBe('system');
    });

    it('読み込みエラー時はデフォルト設定を使用', async () => {
      const { settingsRepository } = await import(
        '@/services/repositories/settingsRepository'
      );

      vi.mocked(settingsRepository.getAll).mockRejectedValue(
        new Error('Database error')
      );

      await useSettingsStore.getState().loadSettings();

      expect(
        useSettingsStore.getState().settings.investment.initialBankroll
      ).toBe(100000);
      expect(useSettingsStore.getState().error).toBe('Database error');
    });
  });

  describe('エラーハンドリング', () => {
    it('clearErrorでエラーをクリアできる', () => {
      useSettingsStore.setState({ error: 'Test error' });

      useSettingsStore.getState().clearError();

      expect(useSettingsStore.getState().error).toBeNull();
    });

    it('setLoadingでローディング状態を設定できる', () => {
      useSettingsStore.getState().setLoading(true);

      expect(useSettingsStore.getState().loading).toBe(true);
    });

    it('設定更新エラー時にエラーが設定される', async () => {
      const { settingsRepository } = await import(
        '@/services/repositories/settingsRepository'
      );

      vi.mocked(settingsRepository.set).mockRejectedValue(
        new Error('Save failed')
      );

      const result = await useSettingsStore
        .getState()
        .updateInvestmentSettings({
          initialBankroll: 150000,
        });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Save failed');
      expect(useSettingsStore.getState().error).toBe('Save failed');
    });
  });
});
