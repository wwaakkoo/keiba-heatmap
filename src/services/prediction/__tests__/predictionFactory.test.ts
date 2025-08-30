/**
 * 予想計算エンジンファクトリーのテスト
 */

import { describe, it, expect } from 'vitest';
import { PredictionFactory } from '../predictionFactory';
import { PredictionEngine } from '../predictionEngine';

describe('PredictionFactory', () => {
  describe('createDefault', () => {
    it('デフォルト設定でエンジンが作成される', () => {
      const engine = PredictionFactory.createDefault();

      expect(engine).toBeInstanceOf(PredictionEngine);
    });
  });

  describe('createConservative', () => {
    it('保守的な設定でエンジンが作成される', () => {
      const engine = PredictionFactory.createConservative();

      expect(engine).toBeInstanceOf(PredictionEngine);
    });
  });

  describe('createAggressive', () => {
    it('アグレッシブな設定でエンジンが作成される', () => {
      const engine = PredictionFactory.createAggressive();

      expect(engine).toBeInstanceOf(PredictionEngine);
    });
  });

  describe('createDebug', () => {
    it('デバッグ設定でエンジンが作成される', () => {
      const engine = PredictionFactory.createDebug();

      expect(engine).toBeInstanceOf(PredictionEngine);
    });
  });

  describe('createWithConfig', () => {
    it('カスタム設定でエンジンが作成される', () => {
      const customConfig = {
        minimumExpectedValue: 1.5,
        minimumConfidence: 0.8,
        enableLogging: true,
      };

      const engine = PredictionFactory.createWithConfig(customConfig);

      expect(engine).toBeInstanceOf(PredictionEngine);
    });
  });

  describe('validateConfig', () => {
    it('正しい設定は妥当と判定される', () => {
      const validConfig = {
        weights: {
          pastPerformance: 0.4,
          jockeyPerformance: 0.3,
          distanceAptitude: 0.2,
          venueAptitude: 0.1,
          classAptitude: 0.0,
        },
        minimumExpectedValue: 1.2,
        minimumConfidence: 0.6,
        enableLogging: false,
        maxRecentRaces: 5,
      };

      const result = PredictionFactory.validateConfig(validConfig);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('重みの合計が1.0でない場合はエラーになる', () => {
      const invalidConfig = {
        weights: {
          pastPerformance: 0.5,
          jockeyPerformance: 0.3,
          distanceAptitude: 0.2,
          venueAptitude: 0.2, // 合計1.2になる
          classAptitude: 0.0,
        },
        minimumExpectedValue: 1.2,
        minimumConfidence: 0.6,
        enableLogging: false,
        maxRecentRaces: 5,
      };

      const result = PredictionFactory.validateConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('重みの合計が1.0ではありません');
    });

    it('負の重みはエラーになる', () => {
      const invalidConfig = {
        weights: {
          pastPerformance: -0.1,
          jockeyPerformance: 0.5,
          distanceAptitude: 0.3,
          venueAptitude: 0.3,
          classAptitude: 0.0,
        },
        minimumExpectedValue: 1.2,
        minimumConfidence: 0.6,
        enableLogging: false,
        maxRecentRaces: 5,
      };

      const result = PredictionFactory.validateConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(error => error.includes('pastPerformance'))
      ).toBe(true);
    });

    it('期待値が1.0未満はエラーになる', () => {
      const invalidConfig = {
        weights: {
          pastPerformance: 0.4,
          jockeyPerformance: 0.3,
          distanceAptitude: 0.2,
          venueAptitude: 0.1,
          classAptitude: 0.0,
        },
        minimumExpectedValue: 0.8, // 1.0未満
        minimumConfidence: 0.6,
        enableLogging: false,
        maxRecentRaces: 5,
      };

      const result = PredictionFactory.validateConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(error => error.includes('最小期待値が1.0未満'))
      ).toBe(true);
    });

    it('信頼度が範囲外はエラーになる', () => {
      const invalidConfig = {
        weights: {
          pastPerformance: 0.4,
          jockeyPerformance: 0.3,
          distanceAptitude: 0.2,
          venueAptitude: 0.1,
          classAptitude: 0.0,
        },
        minimumExpectedValue: 1.2,
        minimumConfidence: 1.5, // 1.0を超える
        enableLogging: false,
        maxRecentRaces: 5,
      };

      const result = PredictionFactory.validateConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(error => error.includes('最小信頼度が範囲外'))
      ).toBe(true);
    });
  });
});
