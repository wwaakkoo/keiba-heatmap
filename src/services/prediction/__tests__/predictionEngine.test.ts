/**
 * 予想計算エンジンのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PredictionEngine } from '../predictionEngine';
import { PredictionFactory } from '../predictionFactory';
import { Horse, Race, Jockey, Trainer } from '@/types/core';
import {
  Gender,
  Surface,
  TrackCondition,
  RaceClass,
  DistanceCategory,
  FinishPosition,
} from '@/types/enums';

describe('PredictionEngine', () => {
  let engine: PredictionEngine;
  let mockHorse: Horse;
  let mockRace: Race;

  beforeEach(() => {
    engine = PredictionFactory.createDefault();

    const mockJockey: Jockey = {
      id: 'jockey1',
      name: '武豊',
      winRate: 0.18,
      placeRate: 0.35,
      showRate: 0.55,
      recentForm: [1, 3, 2, 5, 1],
    };

    const mockTrainer: Trainer = {
      id: 'trainer1',
      name: '藤沢和雄',
      winRate: 0.15,
      placeRate: 0.3,
      showRate: 0.5,
    };

    mockHorse = {
      id: 'horse1',
      name: 'テストホース',
      number: 1,
      age: 4,
      gender: Gender.MALE,
      weight: 56,
      jockey: mockJockey,
      trainer: mockTrainer,
      odds: {
        win: 5.5,
        place: [2.1, 3.2],
      },
      pastPerformances: [
        {
          raceId: 'race1',
          date: new Date('2024-01-01'),
          venue: '東京',
          distance: 1600,
          surface: Surface.TURF,
          condition: TrackCondition.FIRM,
          finishPosition: FinishPosition.FIRST,
          margin: 0,
          time: '1:33.5',
          weight: 56,
          jockeyId: 'jockey1',
        },
        {
          raceId: 'race2',
          date: new Date('2024-01-15'),
          venue: '東京',
          distance: 1600,
          surface: Surface.TURF,
          condition: TrackCondition.FIRM,
          finishPosition: FinishPosition.THIRD,
          margin: 0.5,
          time: '1:34.0',
          weight: 56,
          jockeyId: 'jockey1',
        },
        {
          raceId: 'race3',
          date: new Date('2024-02-01'),
          venue: '中山',
          distance: 1800,
          surface: Surface.TURF,
          condition: TrackCondition.GOOD,
          finishPosition: FinishPosition.SECOND,
          margin: 0.2,
          time: '1:47.8',
          weight: 57,
          jockeyId: 'jockey1',
        },
      ],
    };

    mockRace = {
      id: 'race_test',
      date: new Date('2024-03-01'),
      venue: '東京',
      raceNumber: 11,
      title: 'テストステークス',
      distance: 1600,
      surface: Surface.TURF,
      condition: TrackCondition.FIRM,
      raceClass: RaceClass.G3,
      distanceCategory: DistanceCategory.MILE,
      horses: [mockHorse],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('calculateBaseScore', () => {
    it('基礎スコアが0-100の範囲内で計算される', () => {
      const score = engine.calculateBaseScore(mockHorse, mockRace);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('過去成績が良い馬は高いスコアを得る', () => {
      const score = engine.calculateBaseScore(mockHorse, mockRace);

      // 1位、3位、2位の成績なので、平均的な馬より高いスコアが期待される
      expect(score).toBeGreaterThan(50);
    });

    it('過去成績がない馬でもスコアが計算される', () => {
      const horseWithoutHistory = { ...mockHorse, pastPerformances: [] };
      const score = engine.calculateBaseScore(horseWithoutHistory, mockRace);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateExpectedValue', () => {
    it('期待値が正しく計算される', () => {
      // まず基礎スコアを計算してhorseに設定
      const baseScore = engine.calculateBaseScore(mockHorse, mockRace);
      mockHorse.recentFormScore = baseScore;

      const expectedValue = engine.calculateExpectedValue(
        mockHorse,
        mockHorse.odds.win
      );

      expect(expectedValue).toBeGreaterThan(0);
      expect(typeof expectedValue).toBe('number');
    });

    it('オッズが高いほど期待値が高くなる', () => {
      const baseScore = engine.calculateBaseScore(mockHorse, mockRace);
      mockHorse.recentFormScore = baseScore;

      const lowOddsEV = engine.calculateExpectedValue(mockHorse, 2.0);
      const highOddsEV = engine.calculateExpectedValue(mockHorse, 10.0);

      expect(highOddsEV).toBeGreaterThan(lowOddsEV);
    });
  });

  describe('calculateConfidence', () => {
    it('信頼度が0-1の範囲内で計算される', () => {
      const confidence = engine.calculateConfidence(mockHorse, mockRace);

      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });

    it('データが充実している馬は高い信頼度を得る', () => {
      const confidence = engine.calculateConfidence(mockHorse, mockRace);

      // 過去成績、騎手データ、調教師データが揃っているので、ある程度の信頼度が期待される
      expect(confidence).toBeGreaterThan(0.3);
    });

    it('データが不足している馬は低い信頼度になる', () => {
      const horseWithLimitedData = {
        ...mockHorse,
        pastPerformances: [],
        jockey: { ...mockHorse.jockey, winRate: 0, placeRate: 0 },
      };

      const confidence = engine.calculateConfidence(
        horseWithLimitedData,
        mockRace
      );

      expect(confidence).toBeLessThan(0.5);
    });
  });

  describe('generatePredictions', () => {
    it('レース全体の予想が生成される', () => {
      const results = engine.generatePredictions(mockRace);

      expect(results).toHaveLength(1);
      expect(results[0].prediction.raceId).toBe(mockRace.id);
      expect(results[0].prediction.horseId).toBe(mockHorse.id);
    });

    it('推奨馬の判定が正しく行われる', () => {
      const results = engine.generatePredictions(mockRace);
      const prediction = results[0].prediction;

      // 期待値120%以上かつ信頼度60%以上で推奨
      const shouldBeRecommended =
        prediction.expectedValue >= 1.2 && prediction.confidence >= 0.6;
      expect(prediction.isRecommended).toBe(shouldBeRecommended);
    });

    it('推奨理由が生成される', () => {
      const results = engine.generatePredictions(mockRace);
      const prediction = results[0].prediction;

      expect(prediction.reasoning).toBeInstanceOf(Array);
      expect(prediction.reasoning.length).toBeGreaterThan(0);
    });

    it('分析結果が含まれる', () => {
      const results = engine.generatePredictions(mockRace);
      const result = results[0];

      expect(result.analysis.performance).toBeDefined();
      expect(result.analysis.distanceAptitude).toBeDefined();
      expect(result.analysis.venueAptitude).toBeDefined();
      expect(result.analysis.jockeyAnalysis).toBeDefined();
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なデータでもエラーを起こさない', () => {
      const invalidHorse = {
        ...mockHorse,
        odds: { win: -1, place: [0, 0] as [number, number] },
      };

      expect(() => {
        engine.calculateBaseScore(invalidHorse, mockRace);
        engine.calculateExpectedValue(invalidHorse, invalidHorse.odds.win);
        engine.calculateConfidence(invalidHorse, mockRace);
      }).not.toThrow();
    });

    it('空のレースでも処理できる', () => {
      const emptyRace = { ...mockRace, horses: [] };

      expect(() => {
        engine.generatePredictions(emptyRace);
      }).not.toThrow();
    });
  });
});
