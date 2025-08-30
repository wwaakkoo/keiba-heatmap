import React, { useEffect } from 'react';
import {
  useRaceStore,
  usePredictionStore,
  useInvestmentStore,
  useSettingsStore,
} from '../index';
import type { Race, Prediction, Investment } from '@/types/core';
import {
  Surface,
  TrackCondition,
  RaceClass,
  DistanceCategory,
  Gender,
  InvestmentResult,
} from '@/types/enums';

/**
 * ストア使用例コンポーネント
 * 各ストアの基本的な使用方法を示すサンプル
 */
export const StoreUsageExample: React.FC = () => {
  // ストアフックの使用
  const {
    races,
    currentRace,
    loading: raceLoading,
    error: raceError,
    addRace,
    setCurrentRace,
    getRacesByDateRange,
  } = useRaceStore();

  const {
    currentPredictions,
    loading: predictionLoading,
    addPredictions,
    getRecommendedPredictions,
  } = usePredictionStore();

  const {
    bankrollStatus,
    investments,
    loading: investmentLoading,
    addInvestment,
    getTodaysLoss,
  } = useInvestmentStore();

  const {
    settings,
    loading: settingsLoading,
    updateInvestmentSettings,
    loadSettings,
  } = useSettingsStore();

  // 初期化処理
  useEffect(() => {
    // 設定を読み込み
    loadSettings();

    // 今日のレースを取得
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    getRacesByDateRange(today, tomorrow);
  }, [loadSettings, getRacesByDateRange]);

  // サンプルレースデータ
  const createSampleRace = (): Race => ({
    id: `race-${Date.now()}`,
    date: new Date(),
    venue: '東京',
    raceNumber: 1,
    title: 'サンプルレース',
    distance: 1600,
    surface: Surface.TURF,
    condition: TrackCondition.GOOD,
    raceClass: RaceClass.G1,
    distanceCategory: DistanceCategory.MILE,
    horses: [
      {
        id: 'horse-1',
        name: 'サンプルホース',
        number: 1,
        age: 4,
        gender: Gender.MALE,
        weight: 57,
        jockey: {
          id: 'jockey-1',
          name: 'サンプル騎手',
          winRate: 0.15,
          placeRate: 0.35,
          showRate: 0.55,
          recentForm: [1, 3, 2, 1, 4],
        },
        trainer: {
          id: 'trainer-1',
          name: 'サンプル調教師',
          winRate: 0.12,
          placeRate: 0.3,
          showRate: 0.5,
        },
        odds: {
          win: 2.5,
          place: [1.2, 1.8],
        },
        pastPerformances: [],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // サンプル予想データ
  const createSamplePredictions = (raceId: string): Prediction[] => [
    {
      id: `prediction-${Date.now()}`,
      raceId,
      horseId: 'horse-1',
      baseScore: 75,
      expectedValue: 1.25,
      confidence: 0.8,
      isRecommended: true,
      reasoning: ['過去成績が良好', '騎手の相性が良い'],
      calculatedAt: new Date(),
    },
  ];

  // サンプル投資データ
  const createSampleInvestment = (
    raceId: string,
    horseId: string
  ): Investment => ({
    id: `investment-${Date.now()}`,
    raceId,
    horseId,
    amount:
      settings.investment.initialBankroll *
      (settings.investment.betSizePercentage / 100),
    odds: 2.5,
    result: InvestmentResult.WIN,
    payout: 5000,
    profit: 3000,
    date: new Date(),
    expectedValue: 1.25,
    confidence: 0.8,
    reasoning: ['期待値が高い'],
  });

  // イベントハンドラー
  const handleAddSampleRace = async () => {
    const sampleRace = createSampleRace();
    const result = await addRace(sampleRace);

    if (result.success) {
      setCurrentRace(sampleRace);

      // 予想を追加
      const predictions = createSamplePredictions(sampleRace.id);
      await addPredictions(predictions);
    }
  };

  const handleAddSampleInvestment = async () => {
    if (!currentRace) return;

    const sampleInvestment = createSampleInvestment(currentRace.id, 'horse-1');
    await addInvestment(sampleInvestment);
  };

  const handleUpdateBetSize = async () => {
    await updateInvestmentSettings({
      betSizePercentage: 3, // 3%に変更
    });
  };

  // 推奨予想を取得
  const recommendedPredictions = getRecommendedPredictions();
  const todaysLoss = getTodaysLoss();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">ストア使用例</h1>

      {/* レースストア */}
      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">レースストア</h2>
        <div className="space-y-2">
          <p>レース数: {races.length}</p>
          <p>現在のレース: {currentRace?.title || 'なし'}</p>
          <p>読み込み中: {raceLoading ? 'はい' : 'いいえ'}</p>
          {raceError && <p className="text-red-500">エラー: {raceError}</p>}
          <button
            onClick={handleAddSampleRace}
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={raceLoading}
          >
            サンプルレースを追加
          </button>
        </div>
      </section>

      {/* 予想ストア */}
      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">予想ストア</h2>
        <div className="space-y-2">
          <p>現在の予想数: {currentPredictions.length}</p>
          <p>推奨予想数: {recommendedPredictions.length}</p>
          <p>読み込み中: {predictionLoading ? 'はい' : 'いいえ'}</p>
          {recommendedPredictions.map(prediction => (
            <div key={prediction.id} className="bg-green-100 p-2 rounded">
              <p>期待値: {(prediction.expectedValue * 100).toFixed(1)}%</p>
              <p>信頼度: {(prediction.confidence * 100).toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </section>

      {/* 投資ストア */}
      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">投資ストア</h2>
        <div className="space-y-2">
          <p>現在残高: ¥{bankrollStatus.currentBalance.toLocaleString()}</p>
          <p>総利益: ¥{bankrollStatus.totalProfit.toLocaleString()}</p>
          <p>ROI: {bankrollStatus.roi.toFixed(2)}%</p>
          <p>勝率: {bankrollStatus.winRate.toFixed(1)}%</p>
          <p>今日の損失: ¥{todaysLoss.toLocaleString()}</p>
          <p>投資記録数: {investments.length}</p>
          <p>読み込み中: {investmentLoading ? 'はい' : 'いいえ'}</p>
          <button
            onClick={handleAddSampleInvestment}
            className="bg-green-500 text-white px-4 py-2 rounded"
            disabled={investmentLoading || !currentRace}
          >
            サンプル投資を追加
          </button>
        </div>
      </section>

      {/* 設定ストア */}
      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">設定ストア</h2>
        <div className="space-y-2">
          <p>
            初期資金: ¥{settings.investment.initialBankroll.toLocaleString()}
          </p>
          <p>投資比率: {settings.investment.betSizePercentage}%</p>
          <p>
            最小期待値:{' '}
            {(settings.prediction.minimumExpectedValue * 100).toFixed(0)}%
          </p>
          <p>テーマ: {settings.ui.theme}</p>
          <p>読み込み中: {settingsLoading ? 'はい' : 'いいえ'}</p>
          <button
            onClick={handleUpdateBetSize}
            className="bg-purple-500 text-white px-4 py-2 rounded"
            disabled={settingsLoading}
          >
            投資比率を3%に変更
          </button>
        </div>
      </section>

      {/* 統合例 */}
      <section className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">統合使用例</h2>
        <div className="space-y-2">
          <p>
            推奨投資額: ¥
            {recommendedPredictions.length > 0
              ? Math.round(
                  bankrollStatus.currentBalance *
                    (settings.investment.betSizePercentage / 100)
                ).toLocaleString()
              : 0}
          </p>
          <p>
            日次損失限度まで: ¥
            {Math.max(
              0,
              settings.investment.dailyLossLimit - todaysLoss
            ).toLocaleString()}
          </p>
        </div>
      </section>
    </div>
  );
};
