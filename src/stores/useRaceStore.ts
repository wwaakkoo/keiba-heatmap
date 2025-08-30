import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Race, OperationResult } from '@/types/core';
import { raceRepository } from '@/services/repositories/raceRepository';

interface RaceState {
  // 状態
  races: Race[];
  currentRace: Race | null;
  loading: boolean;
  error: string | null;

  // アクション
  setRaces: (races: Race[]) => void;
  setCurrentRace: (race: Race | null) => void;
  addRace: (race: Race) => Promise<OperationResult<Race>>;
  updateRace: (
    id: string,
    updates: Partial<Race>
  ) => Promise<OperationResult<Race>>;
  deleteRace: (id: string) => Promise<OperationResult>;
  getRaceById: (id: string) => Promise<Race | null>;
  getRacesByDateRange: (start: Date, end: Date) => Promise<Race[]>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useRaceStore = create<RaceState>()(
  devtools(
    persist(
      set => ({
        // 初期状態
        races: [],
        currentRace: null,
        loading: false,
        error: null,

        // アクション実装
        setRaces: races => {
          set({ races }, false, 'setRaces');
        },

        setCurrentRace: race => {
          set({ currentRace: race }, false, 'setCurrentRace');
        },

        addRace: async race => {
          set({ loading: true, error: null }, false, 'addRace/start');

          try {
            const result = await raceRepository.create(race);

            if (result.success && result.data) {
              // 楽観的更新: 即座にストアを更新
              set(
                state => ({
                  races: [...state.races, result.data!],
                  loading: false,
                }),
                false,
                'addRace/success'
              );
              return result;
            } else {
              set({
                loading: false,
                error: result.error || 'レースの追加に失敗しました',
              });
              return result;
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'addRace/error'
            );
            return {
              success: false,
              error: errorMessage,
              timestamp: new Date(),
            };
          }
        },

        updateRace: async (id, updates) => {
          set({ loading: true, error: null }, false, 'updateRace/start');

          try {
            const result = await raceRepository.update(id, updates);

            if (result.success && result.data) {
              // 楽観的更新
              set(
                state => ({
                  races: state.races.map(race =>
                    race.id === id ? { ...race, ...updates } : race
                  ),
                  currentRace:
                    state.currentRace?.id === id
                      ? { ...state.currentRace, ...updates }
                      : state.currentRace,
                  loading: false,
                }),
                false,
                'updateRace/success'
              );
              return result;
            } else {
              set({
                loading: false,
                error: result.error || 'レースの更新に失敗しました',
              });
              return result;
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'updateRace/error'
            );
            return {
              success: false,
              error: errorMessage,
              timestamp: new Date(),
            };
          }
        },

        deleteRace: async id => {
          set({ loading: true, error: null }, false, 'deleteRace/start');

          try {
            const result = await raceRepository.delete(id);

            if (result.success) {
              // 楽観的更新
              set(
                state => ({
                  races: state.races.filter(race => race.id !== id),
                  currentRace:
                    state.currentRace?.id === id ? null : state.currentRace,
                  loading: false,
                }),
                false,
                'deleteRace/success'
              );
              return result;
            } else {
              set({
                loading: false,
                error: result.error || 'レースの削除に失敗しました',
              });
              return result;
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'deleteRace/error'
            );
            return {
              success: false,
              error: errorMessage,
              timestamp: new Date(),
            };
          }
        },

        getRaceById: async id => {
          set({ loading: true, error: null }, false, 'getRaceById/start');

          try {
            const race = await raceRepository.findById(id);
            set({ loading: false }, false, 'getRaceById/success');
            return race;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'getRaceById/error'
            );
            return null;
          }
        },

        getRacesByDateRange: async (start, end) => {
          set(
            { loading: true, error: null },
            false,
            'getRacesByDateRange/start'
          );

          try {
            const races = await raceRepository.findByDateRange(start, end);
            set(
              { races, loading: false },
              false,
              'getRacesByDateRange/success'
            );
            return races;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            set(
              { loading: false, error: errorMessage },
              false,
              'getRacesByDateRange/error'
            );
            return [];
          }
        },

        clearError: () => {
          set({ error: null }, false, 'clearError');
        },

        setLoading: loading => {
          set({ loading }, false, 'setLoading');
        },
      }),
      {
        name: 'race-store',
        partialize: state => ({
          races: state.races,
          currentRace: state.currentRace,
        }),
      }
    ),
    {
      name: 'race-store',
    }
  )
);
