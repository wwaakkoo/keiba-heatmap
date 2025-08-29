/**
 * NetKeibaパーサー用の型定義
 */

import { Surface, TrackCondition, RaceClass, Gender } from './enums';

// パース対象のデータ型
export interface RaceInfo {
  venue: string;
  raceNumber: number;
  title: string;
  distance: number;
  surface: Surface;
  condition: TrackCondition;
  raceClass: RaceClass;
  date: Date;
}

export interface HorseData {
  number: number;
  name: string;
  age: number;
  gender: Gender;
  weight: number;
  jockeyName: string;
  trainerName: string;
}

export interface OddsData {
  horseNumber: number;
  winOdds: number;
  placeOddsMin: number;
  placeOddsMax: number;
}

// パースエラー情報
export interface ParseError {
  type: 'RACE_INFO' | 'HORSE_DATA' | 'ODDS_DATA' | 'VALIDATION';
  field: string;
  message: string;
  rawData?: string;
  lineNumber?: number;
}

// パース結果
export interface ParseResult<T> {
  success: boolean;
  data?: T;
  errors: ParseError[];
  warnings: string[];
}

// NetKeibaの生データ形式
export interface NetKeibaRawData {
  raceInfo: string;
  horseTable: string;
  oddsTable: string;
}

// パーサー設定
export interface ParserConfig {
  strictMode: boolean; // 厳密モード（エラー時に処理を停止）
  skipInvalidHorses: boolean; // 無効な馬データをスキップ
  defaultOdds: number; // デフォルトオッズ値
  maxHorses: number; // 最大出走頭数
}
