import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Prediction, OperationResult } from '@/types/core';
import { predictionRepository } from '@/services/repositories/predictionRepository';

interface PredictionState {
  // 状態
  predictions: Prediction[];
  currentPredictions: Prediction[]; // 現在のレースの予想
  loading: boolean;
  error: string | null;

  // アクション
  setPredictions: (predictions: Prediction[]) => void;
  setCurrentPredictions: (predictions: Prediction[]) => void;
  addPrediction: (
    prediction: Prediction
  ) => Promise<OperationResult<Prediction>>;
  addPredictions: (
    predictions: Prediction[]
  ) => Promise<OperationResult<Prediction[]>>;
  updatePrediction: (
    id: string,
    updates: Partial<Prediction>
  ) => Promise<OperationResult<Prediction>>;
  deletePrediction: (id: string) => Promise<OperationResult>;
  getPredictionsByRaceId: (raceId: string) => Promise<Prediction[]>;
  getRecommendedPredictions: (raceId?: string) => Prediction[];
  clearPredictions: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const usePredictionStore = create<PredictionState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初期状態
        predictions: [],
        currentPredictions: [],
        loading: false,
        error: null,

        // アクション実装
        setPredictions: predictions => {
          set({ predictions }, false, 'setPredictions');
        },

        setCurrentPredictions: predictions => {
          set(
            { currentPredictions: predictions },
            false,
            'setCurrentPredictions'
          );
        },

        addPrediction: async prediction => {
          set({ loading: true, error: null }, false, 'addPrediction/start');

          try {
            const result = await predictionRepository.create(prediction);

            if (result.success && result.data) {
              // 楽観的更新
              set(
                state => ({
                  predictions: [...state.predictions, result.data!],
                  currentPredictions:
                    prediction.raceId === state.currentPredictions[0]?.raceId
                      ? [...state.currentPredictions, result.data!]
                      : state.currentPredictions,
                  loading: false,
                }),
                false,
                'addPrediction/success'
              );
              return result;
            } else {
              set({
                loading: false,
                error: result.error || '予想の追加に失敗しました',
              });
              return result;
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'addPrediction/error'
            );
            return {
              success: false,
              error: errorMessage,
              timestamp: new Date(),
            };
          }
        },

        addPredictions: async predictions => {
          set({ loading: true, error: null }, false, 'addPredictions/start');

          try {
            const results = await Promise.all(
              predictions.map(prediction =>
                predictionRepository.create(prediction)
              )
            );

            const successfulPredictions = results
              .filter(result => result.success && result.data)
              .map(result => result.data!);

            if (successfulPredictions.length > 0) {
              // 楽観的更新
              set(
                state => ({
                  predictions: [...state.predictions, ...successfulPredictions],
                  currentPredictions:
                    predictions[0]?.raceId ===
                    state.currentPredictions[0]?.raceId
                      ? successfulPredictions
                      : state.currentPredictions,
                  loading: false,
                }),
                false,
                'addPredictions/success'
              );

              return {
                success: true,
                data: successfulPredictions,
                timestamp: new Date(),
              };
            } else {
              const errorMessage = '予想の一括追加に失敗しました';
              set({ loading: false, error: errorMessage });
              return {
                success: false,
                error: errorMessage,
                timestamp: new Date(),
              };
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'addPredictions/error'
            );
            return {
              success: false,
              error: errorMessage,
              timestamp: new Date(),
            };
          }
        },

        updatePrediction: async (id, updates) => {
          set({ loading: true, error: null }, false, 'updatePrediction/start');

          try {
            const result = await predictionRepository.update(id, updates);

            if (result.success && result.data) {
              // 楽観的更新
              set(
                state => ({
                  predictions: state.predictions.map(prediction =>
                    prediction.id === id
                      ? { ...prediction, ...updates }
                      : prediction
                  ),
                  currentPredictions: state.currentPredictions.map(
                    prediction =>
                      prediction.id === id
                        ? { ...prediction, ...updates }
                        : prediction
                  ),
                  loading: false,
                }),
                false,
                'updatePrediction/success'
              );
              return result;
            } else {
              set({
                loading: false,
                error: result.error || '予想の更新に失敗しました',
              });
              return result;
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'updatePrediction/error'
            );
            return {
              success: false,
              error: errorMessage,
              timestamp: new Date(),
            };
          }
        },

        deletePrediction: async id => {
          set({ loading: true, error: null }, false, 'deletePrediction/start');

          try {
            const result = await predictionRepository.delete(id);

            if (result.success) {
              // 楽観的更新
              set(
                state => ({
                  predictions: state.predictions.filter(
                    prediction => prediction.id !== id
                  ),
                  currentPredictions: state.currentPredictions.filter(
                    prediction => prediction.id !== id
                  ),
                  loading: false,
                }),
                false,
                'deletePrediction/success'
              );
              return result;
            } else {
              set({
                loading: false,
                error: result.error || '予想の削除に失敗しました',
              });
              return result;
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'deletePrediction/error'
            );
            return {
              success: false,
              error: errorMessage,
              timestamp: new Date(),
            };
          }
        },

        getPredictionsByRaceId: async raceId => {
          set(
            { loading: true, error: null },
            false,
            'getPredictionsByRaceId/start'
          );

          try {
            const predictions = await predictionRepository.findByRaceId(raceId);

            // 現在の予想として設定
            set(
              {
                currentPredictions: predictions,
                loading: false,
              },
              false,
              'getPredictionsByRaceId/success'
            );

            return predictions;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'getPredictionsByRaceId/error'
            );
            return [];
          }
        },

        getRecommendedPredictions: raceId => {
          const { predictions, currentPredictions } = get();

          if (raceId) {
            return predictions
              .filter(p => p.raceId === raceId && p.isRecommended)
              .sort((a, b) => b.expectedValue - a.expectedValue);
          }

          return currentPredictions
            .filter(p => p.isRecommended)
            .sort((a, b) => b.expectedValue - a.expectedValue);
        },

        clearPredictions: () => {
          set(
            {
              predictions: [],
              currentPredictions: [],
            },
            false,
            'clearPredictions'
          );
        },

        clearError: () => {
          set({ error: null }, false, 'clearError');
        },

        setLoading: loading => {
          set({ loading }, false, 'setLoading');
        },
      }),
      {
        name: 'prediction-store',
        partialize: state => ({
          predictions: state.predictions,
          currentPredictions: state.currentPredictions,
        }),
      }
    ),
    {
      name: 'prediction-store',
    }
  )
);
