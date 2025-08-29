/**
 * コア型定義のテスト
 */

import { describe, it, expect } from 'vitest';
import { Horse, Race, Prediction, Investment, UserSettings } from '../core';
import {
  Gender,
  Surface,
  TrackCondition,
  RaceClass,
  DistanceCategory,
  InvestmentResult,
  InvestmentStrategy,
} from '../enums';

describe('Core Types', () => {
  it('Horse型が正しく定義されている', () => {
    const horse: Horse = {
      id: 'horse-1',
      name: 'テストホース',
      number: 1,
      age: 4,
      gender: Gender.MALE,
      weight: 56,
      jockey: {
        id: 'jockey-1',
        name: 'テスト騎手',
        winRate: 0.15,
        placeRate: 0.35,
        showRate: 0.55,
        recentForm: [1, 3, 2, 1, 4],
      },
      trainer: {
        id: 'trainer-1',
        name: 'テスト調教師',
        winRate: 0.12,
        placeRate: 0.3,
        showRate: 0.5,
      },
      odds: {
        win: 3.5,
        place: [1.2, 1.8],
      },
      pastPerformances: [],
    };

    expect(horse.name).toBe('テストホース');
    expect(horse.gender).toBe(Gender.MALE);
    expect(horse.odds.win).toBe(3.5);
  });

  it('Race型が正しく定義されている', () => {
    const race: Race = {
      id: 'race-1',
      date: new Date('2024-01-01'),
      venue: '東京',
      raceNumber: 11,
      title: 'テストステークス',
      distance: 2000,
      surface: Surface.TURF,
      condition: TrackCondition.FIRM,
      raceClass: RaceClass.G1,
      distanceCategory: DistanceCategory.INTERMEDIATE,
      horses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(race.venue).toBe('東京');
    expect(race.surface).toBe(Surface.TURF);
    expect(race.raceClass).toBe(RaceClass.G1);
  });

  it('Prediction型が正しく定義されている', () => {
    const prediction: Prediction = {
      id: 'prediction-1',
      raceId: 'race-1',
      horseId: 'horse-1',
      baseScore: 75,
      expectedValue: 1.25,
      confidence: 0.8,
      isRecommended: true,
      reasoning: ['過去成績良好', '距離適性あり'],
      calculatedAt: new Date(),
    };

    expect(prediction.expectedValue).toBe(1.25);
    expect(prediction.isRecommended).toBe(true);
    expect(prediction.reasoning).toHaveLength(2);
  });

  it('Investment型が正しく定義されている', () => {
    const investment: Investment = {
      id: 'investment-1',
      raceId: 'race-1',
      horseId: 'horse-1',
      amount: 1000,
      odds: 3.5,
      result: InvestmentResult.WIN,
      payout: 3500,
      profit: 2500,
      date: new Date(),
      expectedValue: 1.25,
      confidence: 0.8,
      reasoning: ['期待値120%以上'],
    };

    expect(investment.result).toBe(InvestmentResult.WIN);
    expect(investment.profit).toBe(2500);
  });

  it('UserSettings型が正しく定義されている', () => {
    const settings: UserSettings = {
      investment: {
        strategy: InvestmentStrategy.PROPORTIONAL,
        initialBankroll: 100000,
        betSizePercentage: 0.02,
        dailyLossLimit: 10000,
        maxExposure: 20000,
      },
      prediction: {
        minimumExpectedValue: 1.2,
        minimumConfidence: 0.6,
        weights: {
          pastPerformance: 0.4,
          jockeyPerformance: 0.2,
          distanceAptitude: 0.2,
          venueAptitude: 0.1,
          classAptitude: 0.1,
        },
      },
      ui: {
        theme: 'dark',
        language: 'ja',
        notifications: true,
        autoSave: true,
      },
      data: {
        autoBackup: true,
        backupFrequency: 'weekly',
        retentionPeriod: 365,
      },
    };

    expect(settings.investment.strategy).toBe(InvestmentStrategy.PROPORTIONAL);
    expect(settings.ui.theme).toBe('dark');
    expect(settings.data.backupFrequency).toBe('weekly');
  });
});
