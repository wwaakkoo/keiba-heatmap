/**
 * 過去成績分析器のテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceAnalyzer } from '../performanceAnalyzer';
import { Horse, Jockey, Trainer } from '@/types/core';
import { Gender, Surface, TrackCondition, FinishPosition } from '@/types/enums';

describe('PerformanceAnalyzer', () => {
  let analyzer: PerformanceAnalyzer;
  let mockHorse: Horse;

  beforeEach(() => {
    analyzer = new PerformanceAnalyzer();

    const mockJockey: Jockey = {
      id: 'jockey1',
      name: 'テスト騎手',
      winRate: 0.15,
      placeRate: 0.3,
      showRate: 0.5,
      recentForm: [1, 2, 3, 1, 2],
    };

    const mockTrainer: Trainer = {
      id: 'trainer1',
      name: 'テスト調教師',
      winRate: 0.12,
      placeRate: 0.25,
      showRate: 0.45,
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
      odds: { win: 5.0, place: [2.0, 3.0] },
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
          finishPosition: FinishPosition.SECOND,
          margin: 0.2,
          time: '1:33.7',
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
          finishPosition: FinishPosition.THIRD,
          margin: 0.5,
          time: '1:47.8',
          weight: 57,
          jockeyId: 'jockey1',
        },
        {
          raceId: 'race4',
          date: new Date('2024-02-15'),
          venue: '東京',
          distance: 1400,
          surface: Surface.TURF,
          condition: TrackCondition.FIRM,
          finishPosition: FinishPosition.FIRST,
          margin: 0,
          time: '1:21.5',
          weight: 56,
          jockeyId: 'jockey1',
        },
        {
          raceId: 'race5',
          date: new Date('2024-03-01'),
          venue: '中山',
          distance: 2000,
          surface: Surface.TURF,
          condition: TrackCondition.GOOD,
          finishPosition: FinishPosition.FOURTH,
          margin: 1.0,
          time: '2:01.2',
          weight: 57,
          jockeyId: 'jockey1',
        },
      ],
    };
  });

  describe('analyze', () => {
    it('過去成績が正しく分析される', () => {
      const analysis = analyzer.analyze(mockHorse);

      expect(analysis.recentFormScore).toBeGreaterThan(0);
      expect(analysis.recentFormScore).toBeLessThanOrEqual(100);
      expect(analysis.averageFinishPosition).toBeGreaterThan(0);
      expect(analysis.winRate).toBeGreaterThanOrEqual(0);
      expect(analysis.winRate).toBeLessThanOrEqual(1);
      expect(analysis.placeRate).toBeGreaterThanOrEqual(0);
      expect(analysis.placeRate).toBeLessThanOrEqual(1);
      expect(analysis.showRate).toBeGreaterThanOrEqual(0);
      expect(analysis.showRate).toBeLessThanOrEqual(1);
      expect(analysis.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(analysis.consistencyScore).toBeLessThanOrEqual(100);
    });

    it('勝率が正しく計算される', () => {
      const analysis = analyzer.analyze(mockHorse);

      // 5戦中2勝なので勝率は0.4
      expect(analysis.winRate).toBeCloseTo(0.4, 2);
    });

    it('連対率が正しく計算される', () => {
      const analysis = analyzer.analyze(mockHorse);

      // 5戦中3回連対（1位、2位、3位、1位、4位）なので連対率は0.6
      expect(analysis.placeRate).toBeCloseTo(0.6, 2);
    });

    it('複勝率が正しく計算される', () => {
      const analysis = analyzer.analyze(mockHorse);

      // 5戦中4回複勝（1位、2位、3位、1位、4位）なので複勝率は0.8
      expect(analysis.showRate).toBeCloseTo(0.8, 2);
    });

    it('平均着順が正しく計算される', () => {
      const analysis = analyzer.analyze(mockHorse);

      // 直近5走の平均着順: (1+2+3+1+4)/5 = 2.2
      expect(analysis.averageFinishPosition).toBeCloseTo(2.2, 1);
    });

    it('好成績の馬は高いスコアを得る', () => {
      const analysis = analyzer.analyze(mockHorse);

      // 1位、2位、3位、1位、4位の成績なので高いスコアが期待される
      expect(analysis.recentFormScore).toBeGreaterThan(60);
    });

    it('過去成績がない馬はデフォルト値を返す', () => {
      const horseWithoutHistory = { ...mockHorse, pastPerformances: [] };
      const analysis = analyzer.analyze(horseWithoutHistory);

      expect(analysis.recentFormScore).toBe(30);
      expect(analysis.averageFinishPosition).toBe(8);
      expect(analysis.winRate).toBe(0.05);
      expect(analysis.placeRate).toBe(0.15);
      expect(analysis.showRate).toBe(0.25);
      expect(analysis.consistencyScore).toBe(50);
    });

    it('安定した成績の馬は高い安定性スコアを得る', () => {
      // 全て2位の安定した成績の馬を作成
      const stableHorse = {
        ...mockHorse,
        pastPerformances: mockHorse.pastPerformances.map(p => ({
          ...p,
          finishPosition: FinishPosition.SECOND,
        })),
      };

      const analysis = analyzer.analyze(stableHorse);

      expect(analysis.consistencyScore).toBeGreaterThan(80);
    });

    it('不安定な成績の馬は低い安定性スコアを得る', () => {
      // 1位と18位を繰り返す不安定な成績の馬を作成
      const unstableHorse = {
        ...mockHorse,
        pastPerformances: [
          {
            ...mockHorse.pastPerformances[0],
            finishPosition: FinishPosition.FIRST,
          },
          {
            ...mockHorse.pastPerformances[1],
            finishPosition: FinishPosition.EIGHTEENTH,
          },
          {
            ...mockHorse.pastPerformances[2],
            finishPosition: FinishPosition.FIRST,
          },
          {
            ...mockHorse.pastPerformances[3],
            finishPosition: FinishPosition.EIGHTEENTH,
          },
          {
            ...mockHorse.pastPerformances[4],
            finishPosition: FinishPosition.FIRST,
          },
        ],
      };

      const analysis = analyzer.analyze(unstableHorse);

      expect(analysis.consistencyScore).toBeLessThan(50);
    });
  });
});
