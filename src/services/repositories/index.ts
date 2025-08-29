// Repository classes
export { BaseRepository } from './base';
export { RaceRepository } from './raceRepository';
export { HorseRepository } from './horseRepository';
export { PredictionRepository } from './predictionRepository';
export { InvestmentRepository } from './investmentRepository';
export { SettingsRepository } from './settingsRepository';

// Types
export type { OperationResult, ValidationResult } from './base';

// Repository instances (singletons)
export const raceRepository = new RaceRepository();
export const horseRepository = new HorseRepository();
export const predictionRepository = new PredictionRepository();
export const investmentRepository = new InvestmentRepository();
export const settingsRepository = new SettingsRepository();

/**
 * 全Repositoryの初期化
 */
export async function initializeRepositories(): Promise<void> {
  // データベースの初期化は database.ts で行われる
  console.log('Repositories initialized');
}

/**
 * 全Repositoryのクリーンアップ（テスト用）
 */
export async function clearAllRepositories(): Promise<void> {
  await Promise.all([
    raceRepository.executeTransaction(async () => {
      await raceRepository.table.clear();
    }),
    horseRepository.executeTransaction(async () => {
      await horseRepository.table.clear();
    }),
    predictionRepository.executeTransaction(async () => {
      await predictionRepository.table.clear();
    }),
    investmentRepository.executeTransaction(async () => {
      await investmentRepository.table.clear();
    }),
  ]);

  console.log('All repositories cleared');
}
