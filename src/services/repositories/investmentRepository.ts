import { BaseRepository, ValidationResult, OperationResult } from './base';
import { db } from '../database';
import type { Investment } from '@/types/core';

/**
 * 投資データのRepository
 * 投資記録の永続化と収支分析機能を提供
 */
export class InvestmentRepository extends BaseRepository<Investment> {
  constructor() {
    super(db.investments);
  }

  /**
   * 投資データのバリデーション
   */
  protected validate(data: Partial<Investment>): ValidationResult {
    const errors: string[] = [];

    // 必須フィールドのチェック
    if (!data.raceId || data.raceId.trim().length === 0) {
      errors.push('レースIDは必須です');
    }

    if (!data.horseId || data.horseId.trim().length === 0) {
      errors.push('馬IDは必須です');
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('投資金額は正の数値で指定してください');
    }

    if (!data.odds || data.odds < 1.0) {
      errors.push('オッズは1.0以上で指定してください');
    }

    if (!data.result || !['win', 'lose', 'pending'].includes(data.result)) {
      errors.push('結果は勝利、敗北、未確定のいずれかを指定してください');
    }

    if (data.result !== 'pending' && typeof data.payout !== 'number') {
      errors.push('確定した投資には払戻金額が必要です');
    }

    if (data.payout !== undefined && data.payout < 0) {
      errors.push('払戻金額は0以上で指定してください');
    }

    if (!data.timestamp) {
      errors.push('タイムスタンプは必須です');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * レースIDで投資を検索
   */
  async findByRaceId(raceId: string): Promise<OperationResult<Investment[]>> {
    return this.executeWithErrorHandling(async () => {
      return await this.table
        .where('raceId')
        .equals(raceId)
        .sortBy('timestamp');
    }, 'findByRaceId');
  }

  /**
   * 日付範囲で投資を検索
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<OperationResult<Investment[]>> {
    return this.executeWithErrorHandling(async () => {
      return await this.table
        .where('timestamp')
        .between(startDate, endDate, true, true)
        .reverse()
        .sortBy('timestamp');
    }, 'findByDateRange');
  }

  /**
   * 結果別で投資を検索
   */
  async findByResult(
    result: 'win' | 'lose' | 'pending'
  ): Promise<OperationResult<Investment[]>> {
    return this.executeWithErrorHandling(async () => {
      return await this.table
        .where('result')
        .equals(result)
        .reverse()
        .sortBy('timestamp');
    }, 'findByResult');
  }

  /**
   * 今日の投資を取得
   */
  async findTodaysInvestments(): Promise<OperationResult<Investment[]>> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return this.findByDateRange(startOfDay, endOfDay);
  }

  /**
   * 未確定の投資を取得
   */
  async findPendingInvestments(): Promise<OperationResult<Investment[]>> {
    return this.findByResult('pending');
  }

  /**
   * 投資結果を更新
   */
  async updateResult(
    investmentId: string,
    result: 'win' | 'lose',
    payout: number
  ): Promise<OperationResult<void>> {
    return this.executeWithErrorHandling(async () => {
      await this.table.update(investmentId, {
        result,
        payout,
      });
    }, 'updateResult');
  }

  /**
   * 収支統計を取得
   */
  async getFinancialStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<
    OperationResult<{
      totalInvestments: number;
      totalAmount: number;
      totalPayout: number;
      netProfit: number;
      roi: number;
      winRate: number;
      averageOdds: number;
      largestWin: number;
      largestLoss: number;
      winningStreak: number;
      losingStreak: number;
    }>
  > {
    return this.executeWithErrorHandling(async () => {
      let investments: Investment[];

      if (startDate && endDate) {
        const result = await this.findByDateRange(startDate, endDate);
        if (!result.success) throw new Error(result.error);
        investments = result.data!;
      } else {
        const result = await this.findAll();
        if (!result.success) throw new Error(result.error);
        investments = result.data!;
      }

      // 確定した投資のみを対象
      const settledInvestments = investments.filter(
        inv => inv.result !== 'pending'
      );

      if (settledInvestments.length === 0) {
        return {
          totalInvestments: 0,
          totalAmount: 0,
          totalPayout: 0,
          netProfit: 0,
          roi: 0,
          winRate: 0,
          averageOdds: 0,
          largestWin: 0,
          largestLoss: 0,
          winningStreak: 0,
          losingStreak: 0,
        };
      }

      const totalAmount = settledInvestments.reduce(
        (sum, inv) => sum + inv.amount,
        0
      );
      const totalPayout = settledInvestments.reduce(
        (sum, inv) => sum + inv.payout,
        0
      );
      const netProfit = totalPayout - totalAmount;
      const roi = totalAmount > 0 ? (netProfit / totalAmount) * 100 : 0;

      const wins = settledInvestments.filter(inv => inv.result === 'win');
      const winRate =
        settledInvestments.length > 0
          ? wins.length / settledInvestments.length
          : 0;

      const averageOdds =
        settledInvestments.reduce((sum, inv) => sum + inv.odds, 0) /
        settledInvestments.length;

      // 最大勝利・損失
      const profits = settledInvestments.map(inv => inv.payout - inv.amount);
      const largestWin = Math.max(...profits, 0);
      const largestLoss = Math.abs(Math.min(...profits, 0));

      // 連勝・連敗の計算
      let currentWinStreak = 0;
      let currentLoseStreak = 0;
      let maxWinStreak = 0;
      let maxLoseStreak = 0;

      settledInvestments
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .forEach(inv => {
          if (inv.result === 'win') {
            currentWinStreak++;
            currentLoseStreak = 0;
            maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
          } else {
            currentLoseStreak++;
            currentWinStreak = 0;
            maxLoseStreak = Math.max(maxLoseStreak, currentLoseStreak);
          }
        });

      return {
        totalInvestments: settledInvestments.length,
        totalAmount: Math.round(totalAmount),
        totalPayout: Math.round(totalPayout),
        netProfit: Math.round(netProfit),
        roi: Math.round(roi * 100) / 100,
        winRate: Math.round(winRate * 1000) / 10, // パーセント表示
        averageOdds: Math.round(averageOdds * 10) / 10,
        largestWin: Math.round(largestWin),
        largestLoss: Math.round(largestLoss),
        winningStreak: maxWinStreak,
        losingStreak: maxLoseStreak,
      };
    }, 'getFinancialStatistics');
  }

  /**
   * 日次損失を計算
   */
  async getDailyLoss(
    date: Date = new Date()
  ): Promise<OperationResult<number>> {
    return this.executeWithErrorHandling(async () => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const todaysInvestments = await this.findByDateRange(
        startOfDay,
        endOfDay
      );
      if (!todaysInvestments.success) throw new Error(todaysInvestments.error);

      const settledInvestments = todaysInvestments.data!.filter(
        inv => inv.result !== 'pending'
      );
      const totalAmount = settledInvestments.reduce(
        (sum, inv) => sum + inv.amount,
        0
      );
      const totalPayout = settledInvestments.reduce(
        (sum, inv) => sum + inv.payout,
        0
      );

      return Math.max(0, totalAmount - totalPayout); // 損失のみ返す（利益の場合は0）
    }, 'getDailyLoss');
  }

  /**
   * 月次パフォーマンスレポート
   */
  async getMonthlyPerformance(
    year: number,
    month: number
  ): Promise<
    OperationResult<{
      month: string;
      totalInvestments: number;
      totalAmount: number;
      totalPayout: number;
      netProfit: number;
      roi: number;
      winRate: number;
      dailyBreakdown: Array<{
        date: string;
        investments: number;
        profit: number;
      }>;
    }>
  > {
    return this.executeWithErrorHandling(async () => {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const monthlyInvestments = await this.findByDateRange(startDate, endDate);
      if (!monthlyInvestments.success)
        throw new Error(monthlyInvestments.error);

      const settledInvestments = monthlyInvestments.data!.filter(
        inv => inv.result !== 'pending'
      );

      // 月次統計
      const totalAmount = settledInvestments.reduce(
        (sum, inv) => sum + inv.amount,
        0
      );
      const totalPayout = settledInvestments.reduce(
        (sum, inv) => sum + inv.payout,
        0
      );
      const netProfit = totalPayout - totalAmount;
      const roi = totalAmount > 0 ? (netProfit / totalAmount) * 100 : 0;
      const winRate =
        settledInvestments.length > 0
          ? settledInvestments.filter(inv => inv.result === 'win').length /
            settledInvestments.length
          : 0;

      // 日次内訳
      const dailyBreakdown: Record<
        string,
        { investments: number; profit: number }
      > = {};

      settledInvestments.forEach(inv => {
        const dateKey = inv.timestamp.toISOString().split('T')[0];
        if (!dailyBreakdown[dateKey]) {
          dailyBreakdown[dateKey] = { investments: 0, profit: 0 };
        }
        dailyBreakdown[dateKey].investments++;
        dailyBreakdown[dateKey].profit += inv.payout - inv.amount;
      });

      const dailyBreakdownArray = Object.entries(dailyBreakdown)
        .map(([date, data]) => ({
          date,
          investments: data.investments,
          profit: Math.round(data.profit),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        month: `${year}-${month.toString().padStart(2, '0')}`,
        totalInvestments: settledInvestments.length,
        totalAmount: Math.round(totalAmount),
        totalPayout: Math.round(totalPayout),
        netProfit: Math.round(netProfit),
        roi: Math.round(roi * 100) / 100,
        winRate: Math.round(winRate * 1000) / 10,
        dailyBreakdown: dailyBreakdownArray,
      };
    }, 'getMonthlyPerformance');
  }
}
