import type { StateCreator } from 'zustand';

/**
 * データベース同期ミドルウェア
 * ストアの変更を自動的にデータベースに同期する
 */

interface SyncConfig {
  // 同期対象のキー（指定されたキーのみ同期）
  syncKeys?: string[];
  // 同期を無効化するキー
  excludeKeys?: string[];
  // 同期の遅延時間（ミリ秒）
  debounceMs?: number;
  // 同期失敗時のリトライ回数
  maxRetries?: number;
}

interface SyncableState {
  // 同期状態
  _syncStatus?: {
    syncing: boolean;
    lastSyncAt?: Date;
    syncError?: string;
  };
}

export const syncMiddleware = <T extends SyncableState>(
  config: SyncConfig = {}
) => {
  const {
    syncKeys,
    excludeKeys = ['loading', 'error', '_syncStatus'],
    debounceMs = 1000,
    maxRetries = 3,
  } = config;

  return (stateCreator: StateCreator<T>): StateCreator<T> => {
    return (set, get, api) => {
      const originalSet = set;
      let syncTimeout: NodeJS.Timeout | null = null;
      let retryCount = 0;

      // デバウンス付きの同期関数
      const debouncedSync = async (state: T, actionName?: string) => {
        if (syncTimeout) {
          clearTimeout(syncTimeout);
        }

        syncTimeout = setTimeout(async () => {
          try {
            // 同期状態を更新
            originalSet(
              prevState => ({
                ...prevState,
                _syncStatus: {
                  ...prevState._syncStatus,
                  syncing: true,
                  syncError: undefined,
                },
              }),
              false,
              'sync/start'
            );

            // 同期対象のデータを抽出
            const syncData = extractSyncData(state, syncKeys, excludeKeys);

            // ここで実際のデータベース同期を実行
            // 注意: 実際の実装では各ストア固有の同期ロジックを呼び出す
            await performSync(syncData, actionName);

            // 同期成功
            originalSet(
              prevState => ({
                ...prevState,
                _syncStatus: {
                  syncing: false,
                  lastSyncAt: new Date(),
                  syncError: undefined,
                },
              }),
              false,
              'sync/success'
            );

            retryCount = 0;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Sync failed';

            // リトライ処理
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(
                () => debouncedSync(state, actionName),
                1000 * retryCount
              );
            } else {
              // 同期失敗
              originalSet(
                prevState => ({
                  ...prevState,
                  _syncStatus: {
                    syncing: false,
                    lastSyncAt: prevState._syncStatus?.lastSyncAt,
                    syncError: errorMessage,
                  },
                }),
                false,
                'sync/error'
              );
              retryCount = 0;
            }
          }
        }, debounceMs);
      };

      // setをラップして同期を追加
      const wrappedSet: typeof set = (partial, replace, actionName) => {
        originalSet(partial, replace, actionName);

        // 同期が必要なアクションかチェック
        if (shouldSync(actionName)) {
          const newState = get();
          debouncedSync(newState, actionName);
        }
      };

      return stateCreator(wrappedSet, get, api);
    };
  };
};

/**
 * 同期対象のデータを抽出
 */
function extractSyncData<T>(
  state: T,
  syncKeys?: string[],
  excludeKeys: string[] = []
): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(state as Record<string, unknown>)) {
    // 除外キーをチェック
    if (excludeKeys.includes(key)) {
      continue;
    }

    // 同期キーが指定されている場合はそれに含まれるかチェック
    if (syncKeys && !syncKeys.includes(key)) {
      continue;
    }

    (result as Record<string, unknown>)[key] = value;
  }

  return result;
}

/**
 * 実際の同期処理（各ストアで実装される）
 */
async function performSync(data: unknown, actionName?: string): Promise<void> {
  // この関数は各ストアで具体的な同期ロジックに置き換えられる
  console.log('Syncing data:', { data, actionName });

  // 実際の実装では、データベースへの保存処理を行う
  // 例: await repository.bulkUpdate(data);
}

/**
 * 同期が必要なアクションかどうかを判定
 */
function shouldSync(actionName?: string | boolean): boolean {
  if (typeof actionName !== 'string') {
    return false;
  }

  // 同期をスキップするアクション
  const skipSyncActions = [
    'setLoading',
    'clearError',
    'sync/start',
    'sync/success',
    'sync/error',
  ];

  return !skipSyncActions.some(skipAction => actionName.includes(skipAction));
}

/**
 * 手動同期トリガー用のヘルパー
 */
export const createSyncTrigger = <T extends SyncableState>(
  getState: () => T,
  setState: (partial: Partial<T>) => void
) => {
  return async () => {
    const state = getState();
    setState({
      _syncStatus: {
        ...state._syncStatus,
        syncing: true,
        syncError: undefined,
      },
    } as Partial<T>);

    try {
      // 手動同期処理
      await performSync(state);

      setState({
        _syncStatus: {
          syncing: false,
          lastSyncAt: new Date(),
          syncError: undefined,
        },
      } as Partial<T>);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Manual sync failed';
      setState({
        _syncStatus: {
          syncing: false,
          lastSyncAt: state._syncStatus?.lastSyncAt,
          syncError: errorMessage,
        },
      } as Partial<T>);
    }
  };
};
