import Dexie, { Table } from 'dexie';
import type {
  Race,
  Horse,
  Prediction,
  Investment,
  AppSettings,
} from '@/types/core';

/**
 * 競馬予想アプリのメインデータベースクラス
 * IndexedDBを使用してローカルデータを永続化
 */
export class HorseRacingDB extends Dexie {
  // テーブル定義
  races!: Table<Race>;
  horses!: Table<Horse>;
  predictions!: Table<Prediction>;
  investments!: Table<Investment>;
  settings!: Table<AppSettings>;

  constructor() {
    super('HorseRacingDB');

    // バージョン1: 初期スキーマ
    this.version(1).stores({
      // レーステーブル: 日付、競馬場名、レース番号、距離でインデックス
      races:
        '++id, date, courseName, raceNumber, distance, [date+courseName+raceNumber]',

      // 馬テーブル: 名前、年齢、性別、レースIDと馬番の複合インデックス
      horses: '++id, name, age, sex, raceId, horseNumber, [raceId+horseNumber]',

      // 予想テーブル: レースID、計算結果、タイムスタンプ
      predictions: '++id, raceId, calculations, timestamp, [raceId+timestamp]',

      // 投資テーブル: レースID、金額、結果、タイムスタンプ
      investments:
        '++id, raceId, amount, result, timestamp, [raceId+timestamp]',

      // 設定テーブル: キーバリュー形式
      settings: 'key, value',
    });

    // データベースオープン時のフック
    this.open().catch(error => {
      console.error('Database failed to open:', error);
    });
  }

  /**
   * データベースの初期化
   * 必要な初期設定を行う
   */
  async initialize(): Promise<void> {
    try {
      await this.open();

      // デフォルト設定の挿入
      const defaultSettings: AppSettings[] = [
        {
          key: 'bankroll',
          value: { initialAmount: 100000, currentAmount: 100000 },
        },
        { key: 'betStrategy', value: { type: 'proportional', percentage: 2 } },
        {
          key: 'riskManagement',
          value: { dailyLossLimit: 10000, maxExposure: 20000 },
        },
      ];

      for (const setting of defaultSettings) {
        const existing = await this.settings.get(setting.key);
        if (!existing) {
          await this.settings.put(setting);
        }
      }

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * データベースのクリア（開発・テスト用）
   */
  async clearAll(): Promise<void> {
    await this.transaction(
      'rw',
      this.races,
      this.horses,
      this.predictions,
      this.investments,
      async () => {
        await this.races.clear();
        await this.horses.clear();
        await this.predictions.clear();
        await this.investments.clear();
      }
    );
  }

  /**
   * データベースの統計情報を取得
   */
  async getStats(): Promise<{
    races: number;
    horses: number;
    predictions: number;
    investments: number;
  }> {
    const [races, horses, predictions, investments] = await Promise.all([
      this.races.count(),
      this.horses.count(),
      this.predictions.count(),
      this.investments.count(),
    ]);

    return { races, horses, predictions, investments };
  }
}

// シングルトンインスタンス
export const db = new HorseRacingDB();

/**
 * データベースサービスの初期化
 * アプリケーション起動時に呼び出す
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await db.initialize();
    console.log('Database service initialized successfully');
  } catch (error) {
    console.error('Database service initialization failed:', error);
    throw error;
  }
}
