/**
 * レース関連の定数定義
 */

import { DistanceCategory, RaceClass } from '@/types/enums';

// 距離カテゴリの範囲定義
export const DISTANCE_RANGES: Record<DistanceCategory, [number, number]> = {
  [DistanceCategory.SPRINT]: [1000, 1400],
  [DistanceCategory.MILE]: [1401, 1800],
  [DistanceCategory.INTERMEDIATE]: [1801, 2200],
  [DistanceCategory.LONG]: [2201, 4000],
  [DistanceCategory.STEEPLECHASE]: [2800, 4250],
};

// レースクラスの重要度 (重み付け用)
export const RACE_CLASS_WEIGHTS: Record<RaceClass, number> = {
  [RaceClass.G1]: 1.0,
  [RaceClass.G2]: 0.9,
  [RaceClass.G3]: 0.8,
  [RaceClass.LISTED]: 0.7,
  [RaceClass.OPEN]: 0.6,
  [RaceClass.CLASS_3]: 0.5,
  [RaceClass.CLASS_2]: 0.4,
  [RaceClass.CLASS_1]: 0.3,
  [RaceClass.MAIDEN]: 0.2,
};

// 主要競馬場リスト
export const MAJOR_VENUES = [
  '東京',
  '中山',
  '京都',
  '阪神',
  '中京',
  '新潟',
  '小倉',
  '福島',
  '函館',
  '札幌',
] as const;

// 馬場状態による補正係数
export const TRACK_CONDITION_FACTORS = {
  firm: 1.0, // 良
  good: 0.95, // 稍重
  yielding: 0.9, // 重
  soft: 0.85, // 不良
} as const;

// 性別による補正係数
export const GENDER_FACTORS = {
  male: 1.0, // 牡馬
  female: 0.95, // 牝馬
  gelding: 0.98, // セン馬
} as const;
