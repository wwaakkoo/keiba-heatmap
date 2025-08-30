import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Investment, BankrollStatus, OperationResult } from '@/types/core';
import { InvestmentResult } from '@/types/enums';
import { investmentRepository } from '@/services/repositories/investmentRepository';

interface InvestmentState {
  // 状態
  investments: Investment[];
  bankrollStatus: BankrollStatus;
  loading: boolean;
  error: string | null;

  // アクション
  setInvestments: (investments: Investment[]) => void;
  setBankrollStatus: (status: BankrollStatus) => void;
  addInvestment: (
    investment: Investment
  ) => Promise<OperationResult<Investment>>;
  updateInvestment: (
    id: string,
    updates: Partial<Investment>
  ) => Promise<OperationResult<Investment>>;
  deleteInvestment: (id: string) => Promise<OperationResult>;
  getInvestmentsByDateRange: (start: Date, end: Date) => Promise<Investment[]>;
  calculateBankrollStatus: () => void;
  updateBankrollAfterResult: (investment: Investment) => void;
  getTodaysInvestments: () => Investment[];
  getTodaysLoss: () => number;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

const initialBankrollStatus: BankrollStatus = {
  currentBalance: 100000, // 初期残高10万円
  initialBalance: 100000,
  totalInvested: 0,
  totalReturned: 0,
  totalProfit: 0,
  roi: 0,
  maxDrawdown: 0,
  winRate: 0,
  averageOdds: 0,
  lastUpdated: new Date(),
};

export const useInvestmentStore = create<InvestmentState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初期状態
        investments: [],
        bankrollStatus: initialBankrollStatus,
        loading: false,
        error: null,

        // アクション実装
        setInvestments: investments => {
          set({ investments }, false, 'setInvestments');
          // 投資記録が更新されたらバンクロール状態も再計算
          get().calculateBankrollStatus();
        },

        setBankrollStatus: status => {
          set({ bankrollStatus: status }, false, 'setBankrollStatus');
        },

        addInvestment: async investment => {
          set({ loading: true, error: null }, false, 'addInvestment/start');

          try {
            const result = await investmentRepository.create(investment);

            if (result.success && result.data) {
              // 楽観的更新
              set(
                state => ({
                  investments: [...state.investments, result.data!],
                  loading: false,
                }),
                false,
                'addInvestment/success'
              );

              // バンクロール状態を更新
              get().updateBankrollAfterResult(result.data);

              return result;
            } else {
              set({
                loading: false,
                error: result.error || '投資記録の追加に失敗しました',
              });
              return result;
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'addInvestment/error'
            );
            return {
              success: false,
              error: errorMessage,
              timestamp: new Date(),
            };
          }
        },

        updateInvestment: async (id, updates) => {
          set({ loading: true, error: null }, false, 'updateInvestment/start');

          try {
            const result = await investmentRepository.update(id, updates);

            if (result.success && result.data) {
              // 楽観的更新
              set(
                state => ({
                  investments: state.investments.map(investment =>
                    investment.id === id
                      ? { ...investment, ...updates }
                      : investment
                  ),
                  loading: false,
                }),
                false,
                'updateInvestment/success'
              );

              // バンクロール状態を再計算
              get().calculateBankrollStatus();

              return result;
            } else {
              set({
                loading: false,
                error: result.error || '投資記録の更新に失敗しました',
              });
              return result;
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'updateInvestment/error'
            );
            return {
              success: false,
              error: errorMessage,
              timestamp: new Date(),
            };
          }
        },

        deleteInvestment: async id => {
          set({ loading: true, error: null }, false, 'deleteInvestment/start');

          try {
            const result = await investmentRepository.delete(id);

            if (result.success) {
              // 楽観的更新
              set(
                state => ({
                  investments: state.investments.filter(
                    investment => investment.id !== id
                  ),
                  loading: false,
                }),
                false,
                'deleteInvestment/success'
              );

              // バンクロール状態を再計算
              get().calculateBankrollStatus();

              return result;
            } else {
              set({
                loading: false,
                error: result.error || '投資記録の削除に失敗しました',
              });
              return result;
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'deleteInvestment/error'
            );
            return {
              success: false,
              error: errorMessage,
              timestamp: new Date(),
            };
          }
        },

        getInvestmentsByDateRange: async (start, end) => {
          set(
            { loading: true, error: null },
            false,
            'getInvestmentsByDateRange/start'
          );

          try {
            const investments = await investmentRepository.findByDateRange(
              start,
              end
            );
            set({ loading: false }, false, 'getInvestmentsByDateRange/success');
            return investments;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'getInvestmentsByDateRange/error'
            );
            return [];
          }
        },

        calculateBankrollStatus: () => {
          const { investments, bankrollStatus } = get();

          if (investments.length === 0) {
            return;
          }

          const totalInvested = investments.reduce(
            (sum, inv) => sum + inv.amount,
            0
          );
          const totalReturned = investments.reduce(
            (sum, inv) => sum + inv.payout,
            0
          );
          const totalProfit = totalReturned - totalInvested;
          const roi =
            totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

          const winningInvestments = investments.filter(
            inv => inv.result === InvestmentResult.WIN
          );
          const winRate =
            investments.length > 0
              ? (winningInvestments.length / investments.length) * 100
              : 0;

          const averageOdds =
            winningInvestments.length > 0
              ? winningInvestments.reduce((sum, inv) => sum + inv.odds, 0) /
                winningInvestments.length
              : 0;

          // 最大ドローダウン計算
          let maxDrawdown = 0;
          let runningBalance = bankrollStatus.initialBalance;
          let peakBalance = runningBalance;

          for (const investment of investments.sort(
            (a, b) => a.date.getTime() - b.date.getTime()
          )) {
            runningBalance += investment.profit;
            if (runningBalance > peakBalance) {
              peakBalance = runningBalance;
            }
            const drawdown =
              ((peakBalance - runningBalance) / peakBalance) * 100;
            if (drawdown > maxDrawdown) {
              maxDrawdown = drawdown;
            }
          }

          const currentBalance = bankrollStatus.initialBalance + totalProfit;

          const updatedStatus: BankrollStatus = {
            currentBalance,
            initialBalance: bankrollStatus.initialBalance,
            totalInvested,
            totalReturned,
            totalProfit,
            roi,
            maxDrawdown,
            winRate,
            averageOdds,
            lastUpdated: new Date(),
          };

          set(
            { bankrollStatus: updatedStatus },
            false,
            'calculateBankrollStatus'
          );
        },

        updateBankrollAfterResult: investment => {
          const { bankrollStatus } = get();

          const updatedStatus: BankrollStatus = {
            ...bankrollStatus,
            currentBalance: bankrollStatus.currentBalance + investment.profit,
            totalInvested: bankrollStatus.totalInvested + investment.amount,
            totalReturned: bankrollStatus.totalReturned + investment.payout,
            totalProfit: bankrollStatus.totalProfit + investment.profit,
            lastUpdated: new Date(),
          };

          // ROI再計算
          updatedStatus.roi =
            updatedStatus.totalInvested > 0
              ? (updatedStatus.totalProfit / updatedStatus.totalInvested) * 100
              : 0;

          set(
            { bankrollStatus: updatedStatus },
            false,
            'updateBankrollAfterResult'
          );
        },

        getTodaysInvestments: () => {
          const { investments } = get();
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          return investments.filter(
            inv => inv.date >= today && inv.date < tomorrow
          );
        },

        getTodaysLoss: () => {
          const todaysInvestments = get().getTodaysInvestments();
          return todaysInvestments
            .filter(inv => inv.result === InvestmentResult.LOSE)
            .reduce((sum, inv) => sum + inv.amount, 0);
        },

        clearError: () => {
          set({ error: null }, false, 'clearError');
        },

        setLoading: loading => {
          set({ loading }, false, 'setLoading');
        },
      }),
      {
        name: 'investment-store',
        partialize: state => ({
          investments: state.investments,
          bankrollStatus: state.bankrollStatus,
        }),
      }
    ),
    {
      name: 'investment-store',
    }
  )
);
