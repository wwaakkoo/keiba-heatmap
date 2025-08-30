/**
 * Zustand DevTools設定
 * 開発環境でのデバッグを支援する設定
 */

export const devtoolsConfig = {
  // DevToolsの有効化（本番環境では無効）
  enabled: process.env.NODE_ENV === 'development',

  // ストア名の設定
  names: {
    race: 'Race Store',
    prediction: 'Prediction Store',
    investment: 'Investment Store',
    settings: 'Settings Store',
  },

  // アクション名の整形
  formatActionName: (actionName: string, storeName: string) => {
    return `${storeName}: ${actionName}`;
  },

  // 状態のシリアライゼーション設定
  serialize: {
    // 日付オブジェクトを文字列に変換
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    replacer: (key: string, value: any) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    },

    // 大きなオブジェクトの制限
    options: {
      maxDepth: 10,
      map: true,
      set: true,
    },
  },

  // トレース設定
  trace: true,
  traceLimit: 25,
};

/**
 * DevTools用のアクション名フォーマッター
 */
export const formatDevtoolsAction = (
  actionName: string | boolean,
  storeName: string
): string => {
  if (typeof actionName === 'string') {
    return devtoolsConfig.formatActionName(actionName, storeName);
  }
  return storeName;
};

/**
 * 開発環境でのみ実行される関数
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const devOnly = <T extends (...args: any[]) => any>(
  fn: T
): T | (() => void) => {
  if (devtoolsConfig.enabled) {
    return fn;
  }
  return (() => {}) as T;
};

/**
 * ストアの状態をコンソールに出力（デバッグ用）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logStoreState = devOnly((storeName: string, state: any) => {
  console.group(`🏪 ${storeName} State`);
  console.log('Current State:', state);
  console.log('Timestamp:', new Date().toISOString());
  console.groupEnd();
});

/**
 * アクションの実行をコンソールに出力（デバッグ用）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logStoreAction = devOnly(
  (storeName: string, actionName: string, payload?: any) => {
    console.group(`🎬 ${storeName} Action: ${actionName}`);
    if (payload !== undefined) {
      console.log('Payload:', payload);
    }
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
);

/**
 * エラーをコンソールに出力（デバッグ用）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logStoreError = devOnly(
  (storeName: string, actionName: string, error: any) => {
    console.group(`❌ ${storeName} Error in ${actionName}`);
    console.error('Error:', error);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
);
