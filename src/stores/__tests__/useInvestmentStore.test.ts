import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useInvestmentStore } from '../useInvestmentStore';
import type { Investment } from '@/types/core';
import { InvestmentResult } from '@/types/enums';

// モックデータ
const mockInvestment: Investment = {
  id: 'investment-1',
  raceId: 'race-1',
  horseId: 'horse-1',
  amount: 1000,
  odds: 2.5,
  result: InvestmentResult.WIN,
  payout: 2500,
  profit: 1500,
  date: new Date('2024-01-01'),
  expectedValue: 1.25,
  confidence: 0.8,
  reasoning: ['期待値が高い'],
};

const mockLossInvestment: Investment = {
  id: 'investment-2',
  raceId: 'race-2',
  horseId: 'horse-2',
  amount: 1000,
  odds: 3.0,
  result: InvestmentResult.LOSE,
  payout: 0,
  profit: -1000,
  date: new Date('2024-01-01'),
  expectedValue: 1.2,
  confidence: 0.7,
  reasoning: ['期待値が高い'],
};

// リポジトリのモック
vi.mock('@/services/repositories/investmentRepository', () => ({
  investmentRepository: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByDateRange: vi.fn(),
  },
}));

describe('useInvestmentStore', () => {
  beforeEach(() => {
    // ストアをリセット
    useInvestmentStore.setState({
      investments: [],
      bankrollStatus: {
        currentBalance: 100000,
        initialBalance: 100000,
        totalInvested: 0,
        totalReturned: 0,
        totalProfit: 0,
        roi: 0,
        maxDrawdown: 0,
        winRate: 0,
        averageOdds: 0,
        lastUpdated: new Date(),
      },
      loading: false,
      error: null,
    });

    // モックをリセット
    vi.clearAllMocks();
  });

  describe('初期状態', () => {
    it('初期状態が正しく設定されている', () => {
      const state = useInvestmentStore.getState();

      expect(state.investments).toEqual([]);
      expect(state.bankrollStatus.currentBalance).toBe(100000);
      expect(state.bankrollStatus.initialBalance).toBe(100000);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setInvestments', () => {
    it('投資記録一覧を設定できる', () => {
      const investments = [mockInvestment];

      useInvestmentStore.getState().setInvestments(investments);

      expect(useInvestmentStore.getState().investments).toEqual(investments);
    });

    it('投資記録設定時にバンクロール状態が再計算される', () => {
      const investments = [mockInvestment];

      useInvestmentStore.getState().setInvestments(investments);

      const bankrollStatus = useInvestmentStore.getState().bankrollStatus;
      expect(bankrollStatus.totalInvested).toBe(1000);
      expect(bankrollStatus.totalReturned).toBe(2500);
      expect(bankrollStatus.totalProfit).toBe(1500);
    });
  });

  describe('addInvestment', () => {
    it('投資記録を正常に追加できる', async () => {
      const { investmentRepository } = await import(
        '@/services/repositories/investmentRepository'
      );
      const mockResult = {
        success: true,
        data: mockInvestment,
        timestamp: new Date(),
      };

      vi.mocked(investmentRepository.create).mockResolvedValue(mockResult);

      const result = await useInvestmentStore
        .getState()
        .addInvestment(mockInvestment);

      expect(result.success).toBe(true);
      expect(useInvestmentStore.getState().investments).toContain(
        mockInvestment
      );
      expect(useInvestmentStore.getState().loading).toBe(false);
    });

    it('投資記録追加時にバンクロール状態が更新される', async () => {
      const { investmentRepository } = await import(
        '@/services/repositories/investmentRepository'
      );
      const mockResult = {
        success: true,
        data: mockInvestment,
        timestamp: new Date(),
      };

      vi.mocked(investmentRepository.create).mockResolvedValue(mockResult);

      await useInvestmentStore.getState().addInvestment(mockInvestment);

      const bankrollStatus = useInvestmentStore.getState().bankrollStatus;
      expect(bankrollStatus.currentBalance).toBe(101500); // 100000 + 1500 profit
      expect(bankrollStatus.totalInvested).toBe(1000);
      expect(bankrollStatus.totalReturned).toBe(2500);
    });
  });

  describe('calculateBankrollStatus', () => {
    it('バンクロール状態を正しく計算する', () => {
      const investments = [mockInvestment, mockLossInvestment];
      useInvestmentStore.getState().setInvestments(investments);

      const bankrollStatus = useInvestmentStore.getState().bankrollStatus;

      expect(bankrollStatus.totalInvested).toBe(2000);
      expect(bankrollStatus.totalReturned).toBe(2500);
      expect(bankrollStatus.totalProfit).toBe(500);
      expect(bankrollStatus.roi).toBe(25); // (500 / 2000) * 100
      expect(bankrollStatus.winRate).toBe(50); // 1 win out of 2 bets
    });

    it('勝率を正しく計算する', () => {
      const investments = [
        mockInvestment,
        mockLossInvestment,
        mockLossInvestment,
      ];
      useInvestmentStore.getState().setInvestments(investments);

      const bankrollStatus = useInvestmentStore.getState().bankrollStatus;

      expect(bankrollStatus.winRate).toBeCloseTo(33.33, 1); // 1 win out of 3 bets
    });

    it('平均オッズを正しく計算する', () => {
      const investments = [mockInvestment]; // odds: 2.5
      useInvestmentStore.getState().setInvestments(investments);

      const bankrollStatus = useInvestmentStore.getState().bankrollStatus;

      expect(bankrollStatus.averageOdds).toBe(2.5);
    });
  });

  describe('updateBankrollAfterResult', () => {
    it('勝利投資後にバンクロールが正しく更新される', () => {
      useInvestmentStore.getState().updateBankrollAfterResult(mockInvestment);

      const bankrollStatus = useInvestmentStore.getState().bankrollStatus;

      expect(bankrollStatus.currentBalance).toBe(101500);
      expect(bankrollStatus.totalInvested).toBe(1000);
      expect(bankrollStatus.totalReturned).toBe(2500);
      expect(bankrollStatus.totalProfit).toBe(1500);
    });

    it('敗北投資後にバンクロールが正しく更新される', () => {
      useInvestmentStore
        .getState()
        .updateBankrollAfterResult(mockLossInvestment);

      const bankrollStatus = useInvestmentStore.getState().bankrollStatus;

      expect(bankrollStatus.currentBalance).toBe(99000);
      expect(bankrollStatus.totalInvested).toBe(1000);
      expect(bankrollStatus.totalReturned).toBe(0);
      expect(bankrollStatus.totalProfit).toBe(-1000);
    });
  });

  describe('getTodaysInvestments', () => {
    it('今日の投資記録を取得できる', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayInvestment = { ...mockInvestment, date: today };
      const yesterdayInvestment = { ...mockLossInvestment, date: yesterday };

      useInvestmentStore
        .getState()
        .setInvestments([todayInvestment, yesterdayInvestment]);

      const todaysInvestments = useInvestmentStore
        .getState()
        .getTodaysInvestments();

      expect(todaysInvestments).toHaveLength(1);
      expect(todaysInvestments[0]).toEqual(todayInvestment);
    });
  });

  describe('getTodaysLoss', () => {
    it('今日の損失額を計算できる', () => {
      const today = new Date();
      const todayWin = { ...mockInvestment, date: today };
      const todayLoss = { ...mockLossInvestment, date: today };

      useInvestmentStore.getState().setInvestments([todayWin, todayLoss]);

      const todaysLoss = useInvestmentStore.getState().getTodaysLoss();

      expect(todaysLoss).toBe(1000); // mockLossInvestmentのamount
    });

    it('今日の損失がない場合は0を返す', () => {
      const today = new Date();
      const todayWin = { ...mockInvestment, date: today };

      useInvestmentStore.getState().setInvestments([todayWin]);

      const todaysLoss = useInvestmentStore.getState().getTodaysLoss();

      expect(todaysLoss).toBe(0);
    });
  });

  describe('getInvestmentsByDateRange', () => {
    it('日付範囲で投資記録を取得できる', async () => {
      const { investmentRepository } = await import(
        '@/services/repositories/investmentRepository'
      );
      const investments = [mockInvestment];
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      vi.mocked(investmentRepository.findByDateRange).mockResolvedValue(
        investments
      );

      const result = await useInvestmentStore
        .getState()
        .getInvestmentsByDateRange(startDate, endDate);

      expect(result).toEqual(investments);
      expect(useInvestmentStore.getState().loading).toBe(false);
    });
  });

  describe('エラーハンドリング', () => {
    it('clearErrorでエラーをクリアできる', () => {
      useInvestmentStore.setState({ error: 'Test error' });

      useInvestmentStore.getState().clearError();

      expect(useInvestmentStore.getState().error).toBeNull();
    });

    it('setLoadingでローディング状態を設定できる', () => {
      useInvestmentStore.getState().setLoading(true);

      expect(useInvestmentStore.getState().loading).toBe(true);
    });
  });
});
