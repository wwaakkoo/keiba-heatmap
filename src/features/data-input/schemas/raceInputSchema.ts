import { z } from 'zod';

// Step 1: レース基本情報のスキーマ
export const raceBasicInfoSchema = z.object({
  date: z.string().min(1, 'レース日を入力してください'),
  venue: z.string().min(1, '競馬場を選択してください'),
  raceNumber: z
    .number()
    .min(1)
    .max(12, 'レース番号は1-12の範囲で入力してください'),
  title: z.string().min(1, 'レース名を入力してください'),
  distance: z
    .number()
    .min(800)
    .max(4000, '距離は800-4000mの範囲で入力してください'),
  surface: z.enum(['turf', 'dirt'], {
    errorMap: () => ({ message: '馬場種別を選択してください' }),
  }),
  trackCondition: z.enum(['firm', 'good', 'yielding', 'soft'], {
    errorMap: () => ({ message: '馬場状態を選択してください' }),
  }),
  raceClass: z.enum(
    [
      'G1',
      'G2',
      'G3',
      'Listed',
      'Open',
      '3勝クラス',
      '2勝クラス',
      '1勝クラス',
      '未勝利',
      '新馬',
    ],
    {
      errorMap: () => ({ message: 'レースクラスを選択してください' }),
    }
  ),
  prize: z.number().min(0, '賞金は0以上で入力してください').optional(),
});

// Step 2: 出馬表データのスキーマ
export const horseDataSchema = z.object({
  number: z.number().min(1).max(18, '馬番は1-18の範囲で入力してください'),
  name: z.string().min(1, '馬名を入力してください'),
  age: z.number().min(2).max(10, '馬齢は2-10歳の範囲で入力してください'),
  gender: z.enum(['male', 'female', 'gelding'], {
    errorMap: () => ({ message: '性別を選択してください' }),
  }),
  weight: z.number().min(45).max(65, '斤量は45-65kgの範囲で入力してください'),
  jockeyName: z.string().min(1, '騎手名を入力してください'),
  trainerName: z.string().min(1, '調教師名を入力してください'),
  ownerName: z.string().optional(),
  // 過去成績（オプション）
  recentPerformances: z
    .array(
      z.object({
        position: z.number().min(1).max(18),
        raceTitle: z.string(),
        date: z.string(),
      })
    )
    .optional(),
});

export const horsesDataSchema = z.object({
  horses: z.array(horseDataSchema).min(1, '最低1頭の馬情報を入力してください'),
  netKeibaRawData: z.string().optional(), // NetKeibaからの生データ
});

// Step 3: オッズ情報のスキーマ
export const oddsDataSchema = z.object({
  horses: z
    .array(
      z.object({
        number: z.number(),
        winOdds: z.number().min(1.0, '単勝オッズは1.0以上で入力してください'),
        placeOddsMin: z
          .number()
          .min(1.0, '複勝オッズ下限は1.0以上で入力してください'),
        placeOddsMax: z
          .number()
          .min(1.0, '複勝オッズ上限は1.0以上で入力してください'),
      })
    )
    .min(1, 'オッズ情報を入力してください'),
});

// Step 4: 確認・修正用の統合スキーマ
export const raceInputSchema = z.object({
  basicInfo: raceBasicInfoSchema,
  horsesData: horsesDataSchema,
  oddsData: oddsDataSchema,
});

// フォームデータの型定義
export type RaceBasicInfoForm = z.infer<typeof raceBasicInfoSchema>;
export type HorseDataForm = z.infer<typeof horseDataSchema>;
export type HorsesDataForm = z.infer<typeof horsesDataSchema>;
export type OddsDataForm = z.infer<typeof oddsDataSchema>;
export type RaceInputForm = z.infer<typeof raceInputSchema>;

// バリデーション結果の型
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// 入力補助用の型
export interface InputSuggestion {
  field: string;
  value: string;
  frequency: number;
  lastUsed: Date;
}

// オートセーブ用の型
export interface DraftData {
  id: string;
  step: number;
  data: Partial<RaceInputForm>;
  timestamp: Date;
  isComplete: boolean;
}
