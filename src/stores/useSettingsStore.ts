import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { UserSettings, OperationResult } from '@/types/core';
import { InvestmentStrategy } from '@/types/enums';
import { settingsRepository } from '@/services/repositories/settingsRepository';

interface SettingsState {
  // 状態
  settings: UserSettings;
  loading: boolean;
  error: string | null;

  // アクション
  setSettings: (settings: UserSettings) => void;
  updateInvestmentSettings: (
    settings: Partial<UserSettings['investment']>
  ) => Promise<OperationResult>;
  updatePredictionSettings: (
    settings: Partial<UserSettings['prediction']>
  ) => Promise<OperationResult>;
  updateUISettings: (
    settings: Partial<UserSettings['ui']>
  ) => Promise<OperationResult>;
  updateDataSettings: (
    settings: Partial<UserSettings['data']>
  ) => Promise<OperationResult>;
  resetToDefaults: () => Promise<OperationResult>;
  loadSettings: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

const defaultSettings: UserSettings = {
  investment: {
    strategy: InvestmentStrategy.PROPORTIONAL,
    initialBankroll: 100000,
    betSizePercentage: 2, // 2%
    dailyLossLimit: 5000, // 5,000円
    maxExposure: 20000, // 20,000円
  },
  prediction: {
    minimumExpectedValue: 1.2, // 120%
    minimumConfidence: 0.6, // 60%
    weights: {
      pastPerformance: 0.3,
      jockeyPerformance: 0.25,
      distanceAptitude: 0.2,
      venueAptitude: 0.15,
      classAptitude: 0.1,
    },
  },
  ui: {
    theme: 'system',
    language: 'ja',
    notifications: true,
    autoSave: true,
  },
  data: {
    autoBackup: true,
    backupFrequency: 'weekly',
    retentionPeriod: 365, // 1年
  },
};

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初期状態
        settings: defaultSettings,
        loading: false,
        error: null,

        // アクション実装
        setSettings: settings => {
          set({ settings }, false, 'setSettings');
        },

        updateInvestmentSettings: async investmentSettings => {
          set(
            { loading: true, error: null },
            false,
            'updateInvestmentSettings/start'
          );

          try {
            const { settings } = get();
            const updatedSettings = {
              ...settings,
              investment: { ...settings.investment, ...investmentSettings },
            };

            // データベースに保存
            const savePromises = Object.entries(investmentSettings).map(
              ([key, value]) =>
                settingsRepository.set(`investment.${key}`, value)
            );

            await Promise.all(savePromises);

            // 楽観的更新
            set(
              {
                settings: updatedSettings,
                loading: false,
              },
              false,
              'updateInvestmentSettings/success'
            );

            return { success: true, timestamp: new Date() };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'updateInvestmentSettings/error'
            );
            return {
              success: false,
              error: errorMessage,
              timestamp: new Date(),
            };
          }
        },

        updatePredictionSettings: async predictionSettings => {
          set(
            { loading: true, error: null },
            false,
            'updatePredictionSettings/start'
          );

          try {
            const { settings } = get();
            const updatedSettings = {
              ...settings,
              prediction: { ...settings.prediction, ...predictionSettings },
            };

            // データベースに保存
            const savePromises = Object.entries(predictionSettings).map(
              ([key, value]) =>
                settingsRepository.set(`prediction.${key}`, value)
            );

            await Promise.all(savePromises);

            // 楽観的更新
            set(
              {
                settings: updatedSettings,
                loading: false,
              },
              false,
              'updatePredictionSettings/success'
            );

            return { success: true, timestamp: new Date() };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'updatePredictionSettings/error'
            );
            return {
              success: false,
              error: errorMessage,
              timestamp: new Date(),
            };
          }
        },

        updateUISettings: async uiSettings => {
          set({ loading: true, error: null }, false, 'updateUISettings/start');

          try {
            const { settings } = get();
            const updatedSettings = {
              ...settings,
              ui: { ...settings.ui, ...uiSettings },
            };

            // データベースに保存
            const savePromises = Object.entries(uiSettings).map(
              ([key, value]) => settingsRepository.set(`ui.${key}`, value)
            );

            await Promise.all(savePromises);

            // 楽観的更新
            set(
              {
                settings: updatedSettings,
                loading: false,
              },
              false,
              'updateUISettings/success'
            );

            return { success: true, timestamp: new Date() };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'updateUISettings/error'
            );
            return {
              success: false,
              error: errorMessage,
              timestamp: new Date(),
            };
          }
        },

        updateDataSettings: async dataSettings => {
          set(
            { loading: true, error: null },
            false,
            'updateDataSettings/start'
          );

          try {
            const { settings } = get();
            const updatedSettings = {
              ...settings,
              data: { ...settings.data, ...dataSettings },
            };

            // データベースに保存
            const savePromises = Object.entries(dataSettings).map(
              ([key, value]) => settingsRepository.set(`data.${key}`, value)
            );

            await Promise.all(savePromises);

            // 楽観的更新
            set(
              {
                settings: updatedSettings,
                loading: false,
              },
              false,
              'updateDataSettings/success'
            );

            return { success: true, timestamp: new Date() };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'updateDataSettings/error'
            );
            return {
              success: false,
              error: errorMessage,
              timestamp: new Date(),
            };
          }
        },

        resetToDefaults: async () => {
          set({ loading: true, error: null }, false, 'resetToDefaults/start');

          try {
            // データベースから設定を削除
            await settingsRepository.clear();

            // デフォルト設定に戻す
            set(
              {
                settings: defaultSettings,
                loading: false,
              },
              false,
              'resetToDefaults/success'
            );

            return { success: true, timestamp: new Date() };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'resetToDefaults/error'
            );
            return {
              success: false,
              error: errorMessage,
              timestamp: new Date(),
            };
          }
        },

        loadSettings: async () => {
          set({ loading: true, error: null }, false, 'loadSettings/start');

          try {
            // データベースから設定を読み込み
            const settingsEntries = await settingsRepository.getAll();

            if (settingsEntries.length === 0) {
              // 設定が存在しない場合はデフォルト設定を使用
              set(
                {
                  settings: { ...defaultSettings },
                  loading: false,
                },
                false,
                'loadSettings/default'
              );
              return;
            }

            // 設定を再構築（デフォルト設定をベースにする）
            const loadedSettings = JSON.parse(JSON.stringify(defaultSettings)); // Deep copy

            for (const entry of settingsEntries) {
              const keys = entry.key.split('.');
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              let current: any = loadedSettings;

              // ネストされたオブジェクトを辿る
              for (let i = 0; i < keys.length - 1; i++) {
                if (!(keys[i] in current)) {
                  current[keys[i]] = {};
                }
                current = current[keys[i]];
              }

              // 最終的な値を設定
              current[keys[keys.length - 1]] = entry.value;
            }

            set(
              {
                settings: loadedSettings,
                loading: false,
              },
              false,
              'loadSettings/success'
            );
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              {
                loading: false,
                error: errorMessage,
                settings: { ...defaultSettings }, // エラー時はデフォルト設定を使用
              },
              false,
              'loadSettings/error'
            );
          }
        },

        clearError: () => {
          set({ error: null }, false, 'clearError');
        },

        setLoading: loading => {
          set({ loading }, false, 'setLoading');
        },
      }),
      {
        name: 'settings-store',
        partialize: state => ({
          settings: state.settings,
        }),
      }
    ),
    {
      name: 'settings-store',
    }
  )
);
