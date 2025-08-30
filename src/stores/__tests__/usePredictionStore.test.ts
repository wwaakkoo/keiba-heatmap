import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePredictionStore } from '../usePredictionStore';
import type { Prediction } from '@/types/core';

// モックデータ
const mockPrediction: Prediction = {
  id: 'prediction-1',
  raceId: 'race-1',
  horseId: 'horse-1',
  baseScore: 75,
  expectedValue: 1.25,
  confidence: 0.8,
  isRecommended: true,
  reasoning: ['過去成績が良好', '騎手の相性が良い'],
  calculatedAt: new Date(),
};

const mockPrediction2: Prediction = {
  id: 'prediction-2',
  raceId: 'race-1',
  horseId: 'horse-2',
  baseScore: 60,
  expectedValue: 1.1,
  confidence: 0.6,
  isRecommended: false,
  reasoning: ['平均的な成績'],
  calculatedAt: new Date(),
};

// リポジトリのモック
vi.mock('@/services/repositories/predictionRepository', () => ({
  predictionRepository: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByRaceId: vi.fn(),
  },
}));

describe('usePredictionStore', () => {
  beforeEach(() => {
    // ストアをリセット
    usePredictionStore.setState({
      predictions: [],
      currentPredictions: [],
      loading: false,
      error: null,
    });

    // モックをリセット
    vi.clearAllMocks();
  });

  describe('初期状態', () => {
    it('初期状態が正しく設定されている', () => {
      const state = usePredictionStore.getState();

      expect(state.predictions).toEqual([]);
      expect(state.currentPredictions).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setPredictions', () => {
    it('予想一覧を設定できる', () => {
      const predictions = [mockPrediction, mockPrediction2];

      usePredictionStore.getState().setPredictions(predictions);

      expect(usePredictionStore.getState().predictions).toEqual(predictions);
    });
  });

  describe('setCurrentPredictions', () => {
    it('現在の予想を設定できる', () => {
      const predictions = [mockPrediction];

      usePredictionStore.getState().setCurrentPredictions(predictions);

      expect(usePredictionStore.getState().currentPredictions).toEqual(
        predictions
      );
    });
  });

  describe('addPrediction', () => {
    it('予想を正常に追加できる', async () => {
      const { predictionRepository } = await import(
        '@/services/repositories/predictionRepository'
      );
      const mockResult = {
        success: true,
        data: mockPrediction,
        timestamp: new Date(),
      };

      vi.mocked(predictionRepository.create).mockResolvedValue(mockResult);

      const result = await usePredictionStore
        .getState()
        .addPrediction(mockPrediction);

      expect(result.success).toBe(true);
      expect(usePredictionStore.getState().predictions).toContain(
        mockPrediction
      );
      expect(usePredictionStore.getState().loading).toBe(false);
    });

    it('同じレースの予想の場合、currentPredictionsも更新される', async () => {
      const { predictionRepository } = await import(
        '@/services/repositories/predictionRepository'
      );
      const mockResult = {
        success: true,
        data: mockPrediction,
        timestamp: new Date(),
      };

      // 現在の予想を設定（同じレースID）
      usePredictionStore.getState().setCurrentPredictions([mockPrediction2]);

      vi.mocked(predictionRepository.create).mockResolvedValue(mockResult);

      await usePredictionStore.getState().addPrediction(mockPrediction);

      expect(usePredictionStore.getState().currentPredictions).toContain(
        mockPrediction
      );
    });
  });

  describe('addPredictions', () => {
    it('複数の予想を一括追加できる', async () => {
      const { predictionRepository } = await import(
        '@/services/repositories/predictionRepository'
      );
      const predictions = [mockPrediction, mockPrediction2];
      const mockResults = predictions.map(p => ({
        success: true,
        data: p,
        timestamp: new Date(),
      }));

      vi.mocked(predictionRepository.create)
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1]);

      const result = await usePredictionStore
        .getState()
        .addPredictions(predictions);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(predictions);
      expect(usePredictionStore.getState().predictions).toEqual(predictions);
    });
  });

  describe('updatePrediction', () => {
    it('予想を正常に更新できる', async () => {
      const { predictionRepository } = await import(
        '@/services/repositories/predictionRepository'
      );
      const updatedPrediction = { ...mockPrediction, baseScore: 80 };
      const mockResult = {
        success: true,
        data: updatedPrediction,
        timestamp: new Date(),
      };

      // 初期状態を設定
      usePredictionStore.getState().setPredictions([mockPrediction]);
      usePredictionStore.getState().setCurrentPredictions([mockPrediction]);

      vi.mocked(predictionRepository.update).mockResolvedValue(mockResult);

      const result = await usePredictionStore
        .getState()
        .updatePrediction(mockPrediction.id, { baseScore: 80 });

      expect(result.success).toBe(true);
      expect(usePredictionStore.getState().predictions[0].baseScore).toBe(80);
      expect(
        usePredictionStore.getState().currentPredictions[0].baseScore
      ).toBe(80);
    });
  });

  describe('deletePrediction', () => {
    it('予想を正常に削除できる', async () => {
      const { predictionRepository } = await import(
        '@/services/repositories/predictionRepository'
      );
      const mockResult = { success: true, timestamp: new Date() };

      // 初期状態を設定
      usePredictionStore.getState().setPredictions([mockPrediction]);
      usePredictionStore.getState().setCurrentPredictions([mockPrediction]);

      vi.mocked(predictionRepository.delete).mockResolvedValue(mockResult);

      const result = await usePredictionStore
        .getState()
        .deletePrediction(mockPrediction.id);

      expect(result.success).toBe(true);
      expect(usePredictionStore.getState().predictions).toHaveLength(0);
      expect(usePredictionStore.getState().currentPredictions).toHaveLength(0);
    });
  });

  describe('getPredictionsByRaceId', () => {
    it('レースIDで予想を取得できる', async () => {
      const { predictionRepository } = await import(
        '@/services/repositories/predictionRepository'
      );
      const predictions = [mockPrediction, mockPrediction2];

      vi.mocked(predictionRepository.findByRaceId).mockResolvedValue(
        predictions
      );

      const result = await usePredictionStore
        .getState()
        .getPredictionsByRaceId('race-1');

      expect(result).toEqual(predictions);
      expect(usePredictionStore.getState().currentPredictions).toEqual(
        predictions
      );
    });
  });

  describe('getRecommendedPredictions', () => {
    it('推奨予想を取得できる（レースID指定なし）', () => {
      const predictions = [mockPrediction, mockPrediction2];
      usePredictionStore.getState().setCurrentPredictions(predictions);

      const recommended = usePredictionStore
        .getState()
        .getRecommendedPredictions();

      expect(recommended).toEqual([mockPrediction]); // isRecommended: trueのもののみ
    });

    it('推奨予想を取得できる（レースID指定あり）', () => {
      const predictions = [mockPrediction, mockPrediction2];
      usePredictionStore.getState().setPredictions(predictions);

      const recommended = usePredictionStore
        .getState()
        .getRecommendedPredictions('race-1');

      expect(recommended).toEqual([mockPrediction]);
    });

    it('期待値の高い順にソートされる', () => {
      const highValuePrediction = {
        ...mockPrediction2,
        expectedValue: 1.5,
        isRecommended: true,
      };
      const predictions = [mockPrediction, highValuePrediction];

      usePredictionStore.getState().setCurrentPredictions(predictions);

      const recommended = usePredictionStore
        .getState()
        .getRecommendedPredictions();

      expect(recommended[0]).toEqual(highValuePrediction);
      expect(recommended[1]).toEqual(mockPrediction);
    });
  });

  describe('clearPredictions', () => {
    it('すべての予想をクリアできる', () => {
      usePredictionStore.getState().setPredictions([mockPrediction]);
      usePredictionStore.getState().setCurrentPredictions([mockPrediction]);

      usePredictionStore.getState().clearPredictions();

      expect(usePredictionStore.getState().predictions).toEqual([]);
      expect(usePredictionStore.getState().currentPredictions).toEqual([]);
    });
  });

  describe('エラーハンドリング', () => {
    it('clearErrorでエラーをクリアできる', () => {
      usePredictionStore.setState({ error: 'Test error' });

      usePredictionStore.getState().clearError();

      expect(usePredictionStore.getState().error).toBeNull();
    });

    it('setLoadingでローディング状態を設定できる', () => {
      usePredictionStore.getState().setLoading(true);

      expect(usePredictionStore.getState().loading).toBe(true);
    });
  });
});
