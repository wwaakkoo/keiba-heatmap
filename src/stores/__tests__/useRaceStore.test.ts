import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRaceStore } from '../useRaceStore';
import type { Race } from '@/types/core';
import {
  Surface,
  TrackCondition,
  RaceClass,
  DistanceCategory,
} from '@/types/enums';

// モックデータ
const mockRace: Race = {
  id: 'race-1',
  date: new Date('2024-01-01'),
  venue: '東京',
  raceNumber: 1,
  title: 'テストレース',
  distance: 1600,
  surface: Surface.TURF,
  condition: TrackCondition.GOOD,
  raceClass: RaceClass.G1,
  distanceCategory: DistanceCategory.MILE,
  horses: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// リポジトリのモック
vi.mock('@/services/repositories/raceRepository', () => ({
  raceRepository: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
    findByDateRange: vi.fn(),
  },
}));

describe('useRaceStore', () => {
  beforeEach(() => {
    // ストアをリセット
    useRaceStore.setState({
      races: [],
      currentRace: null,
      loading: false,
      error: null,
    });

    // モックをリセット
    vi.clearAllMocks();
  });

  describe('初期状態', () => {
    it('初期状態が正しく設定されている', () => {
      const state = useRaceStore.getState();

      expect(state.races).toEqual([]);
      expect(state.currentRace).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setRaces', () => {
    it('レース一覧を設定できる', () => {
      const races = [mockRace];

      useRaceStore.getState().setRaces(races);

      expect(useRaceStore.getState().races).toEqual(races);
    });
  });

  describe('setCurrentRace', () => {
    it('現在のレースを設定できる', () => {
      useRaceStore.getState().setCurrentRace(mockRace);

      expect(useRaceStore.getState().currentRace).toEqual(mockRace);
    });

    it('現在のレースをnullに設定できる', () => {
      useRaceStore.getState().setCurrentRace(mockRace);
      useRaceStore.getState().setCurrentRace(null);

      expect(useRaceStore.getState().currentRace).toBeNull();
    });
  });

  describe('addRace', () => {
    it('レースを正常に追加できる', async () => {
      const { raceRepository } = await import(
        '@/services/repositories/raceRepository'
      );
      const mockResult = {
        success: true,
        data: mockRace,
        timestamp: new Date(),
      };

      vi.mocked(raceRepository.create).mockResolvedValue(mockResult);

      const result = await useRaceStore.getState().addRace(mockRace);

      expect(result.success).toBe(true);
      expect(useRaceStore.getState().races).toContain(mockRace);
      expect(useRaceStore.getState().loading).toBe(false);
    });

    it('レース追加に失敗した場合エラーが設定される', async () => {
      const { raceRepository } = await import(
        '@/services/repositories/raceRepository'
      );
      const mockResult = {
        success: false,
        error: 'Database error',
        timestamp: new Date(),
      };

      vi.mocked(raceRepository.create).mockResolvedValue(mockResult);

      const result = await useRaceStore.getState().addRace(mockRace);

      expect(result.success).toBe(false);
      expect(useRaceStore.getState().error).toBe('Database error');
      expect(useRaceStore.getState().loading).toBe(false);
    });
  });

  describe('updateRace', () => {
    it('レースを正常に更新できる', async () => {
      const { raceRepository } = await import(
        '@/services/repositories/raceRepository'
      );
      const updatedRace = { ...mockRace, title: '更新されたレース' };
      const mockResult = {
        success: true,
        data: updatedRace,
        timestamp: new Date(),
      };

      // 初期状態を設定
      useRaceStore.getState().setRaces([mockRace]);

      vi.mocked(raceRepository.update).mockResolvedValue(mockResult);

      const result = await useRaceStore
        .getState()
        .updateRace(mockRace.id, { title: '更新されたレース' });

      expect(result.success).toBe(true);
      expect(useRaceStore.getState().races[0].title).toBe('更新されたレース');
    });
  });

  describe('deleteRace', () => {
    it('レースを正常に削除できる', async () => {
      const { raceRepository } = await import(
        '@/services/repositories/raceRepository'
      );
      const mockResult = { success: true, timestamp: new Date() };

      // 初期状態を設定
      useRaceStore.getState().setRaces([mockRace]);
      useRaceStore.getState().setCurrentRace(mockRace);

      vi.mocked(raceRepository.delete).mockResolvedValue(mockResult);

      const result = await useRaceStore.getState().deleteRace(mockRace.id);

      expect(result.success).toBe(true);
      expect(useRaceStore.getState().races).toHaveLength(0);
      expect(useRaceStore.getState().currentRace).toBeNull();
    });
  });

  describe('getRaceById', () => {
    it('IDでレースを取得できる', async () => {
      const { raceRepository } = await import(
        '@/services/repositories/raceRepository'
      );

      vi.mocked(raceRepository.findById).mockResolvedValue(mockRace);

      const result = await useRaceStore.getState().getRaceById(mockRace.id);

      expect(result).toEqual(mockRace);
      expect(useRaceStore.getState().loading).toBe(false);
    });

    it('レースが見つからない場合nullを返す', async () => {
      const { raceRepository } = await import(
        '@/services/repositories/raceRepository'
      );

      vi.mocked(raceRepository.findById).mockResolvedValue(null);

      const result = await useRaceStore.getState().getRaceById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getRacesByDateRange', () => {
    it('日付範囲でレースを取得できる', async () => {
      const { raceRepository } = await import(
        '@/services/repositories/raceRepository'
      );
      const races = [mockRace];
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      vi.mocked(raceRepository.findByDateRange).mockResolvedValue(races);

      const result = await useRaceStore
        .getState()
        .getRacesByDateRange(startDate, endDate);

      expect(result).toEqual(races);
      expect(useRaceStore.getState().races).toEqual(races);
    });
  });

  describe('エラーハンドリング', () => {
    it('clearErrorでエラーをクリアできる', () => {
      useRaceStore.setState({ error: 'Test error' });

      useRaceStore.getState().clearError();

      expect(useRaceStore.getState().error).toBeNull();
    });

    it('setLoadingでローディング状態を設定できる', () => {
      useRaceStore.getState().setLoading(true);

      expect(useRaceStore.getState().loading).toBe(true);
    });
  });
});
