/**
 * 競馬アプリで使用するEnum定義
 */

// 馬の性別
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  GELDING = 'gelding',
}

// 馬場状態
export enum TrackCondition {
  FIRM = 'firm', // 良
  GOOD = 'good', // 稍重
  YIELDING = 'yielding', // 重
  SOFT = 'soft', // 不良
}

// コース種別
export enum Surface {
  TURF = 'turf', // 芝
  DIRT = 'dirt', // ダート
}

// レースクラス
export enum RaceClass {
  G1 = 'G1',
  G2 = 'G2',
  G3 = 'G3',
  LISTED = 'Listed',
  OPEN = 'Open',
  CLASS_3 = '3勝クラス',
  CLASS_2 = '2勝クラス',
  CLASS_1 = '1勝クラス',
  MAIDEN = '未勝利',
}

// 距離カテゴリ
export enum DistanceCategory {
  SPRINT = 'sprint', // 短距離 (1000-1400m)
  MILE = 'mile', // マイル (1401-1800m)
  INTERMEDIATE = 'intermediate', // 中距離 (1801-2200m)
  LONG = 'long', // 長距離 (2201m以上)
  STEEPLECHASE = 'steeplechase', // 障害
}

// 投資結果
export enum InvestmentResult {
  WIN = 'win',
  LOSE = 'lose',
  PENDING = 'pending',
}

// 投資戦略
export enum InvestmentStrategy {
  FIXED = 'fixed', // 固定額
  PROPORTIONAL = 'proportional', // 比例
  KELLY = 'kelly', // Kelly基準
}

// 着順
export enum FinishPosition {
  FIRST = 1,
  SECOND = 2,
  THIRD = 3,
  FOURTH = 4,
  FIFTH = 5,
  SIXTH = 6,
  SEVENTH = 7,
  EIGHTH = 8,
  NINTH = 9,
  TENTH = 10,
  ELEVENTH = 11,
  TWELFTH = 12,
  THIRTEENTH = 13,
  FOURTEENTH = 14,
  FIFTEENTH = 15,
  SIXTEENTH = 16,
  SEVENTEENTH = 17,
  EIGHTEENTH = 18,
  DNF = 99, // Did Not Finish
}
