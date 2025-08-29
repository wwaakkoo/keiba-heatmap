/**
 * NetKeibaパーサー - NetKeibaからコピーしたデータを解析してアプリで使用可能な形式に変換
 */

import {
  RaceInfo,
  HorseData,
  OddsData,
  ParseError,
  ParseResult,
  ParserConfig,
} from '@/types/parser';
import { ValidationResult, ValidationError } from '@/types/core';
import { Surface, TrackCondition, RaceClass, Gender } from '@/types/enums';

// フォーム用の型定義（循環参照を避けるため）
interface HorseDataForm {
  number: number;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'gelding';
  weight: number;
  jockeyName: string;
  trainerName: string;
  ownerName?: string;
}

export class NetKeibaParser {
  private config: ParserConfig;

  constructor(config: Partial<ParserConfig> = {}) {
    this.config = {
      strictMode: false,
      skipInvalidHorses: true,
      defaultOdds: 99.9,
      maxHorses: 18,
      ...config,
    };
  }

  /**
   * レース基本情報をパース
   */
  parseRaceInfo(text: string): ParseResult<RaceInfo> {
    const errors: ParseError[] = [];
    const warnings: string[] = [];

    try {
      // レース情報の正規表現パターン
      const patterns = {
        venue: /(東京|中山|阪神|京都|中京|新潟|福島|小倉|札幌|函館)/,
        raceNumber: /(\d+)R/,
        title: /(\d+R\s+)([^\s]+)/,
        distance: /(芝|ダート)(\d+)m/,
        condition: /(良|稍重|重|不良)/,
        class: /(G[123]|Listed|オープン|3勝クラス|2勝クラス|1勝クラス|未勝利)/,
        date: /(\d{4})年(\d{1,2})月(\d{1,2})日/,
      };

      // 会場の抽出
      const venueMatch = text.match(patterns.venue);
      if (!venueMatch) {
        errors.push({
          type: 'RACE_INFO',
          field: 'venue',
          message: '競馬場名が見つかりません',
          rawData: text,
        });
      }

      // レース番号の抽出
      const raceNumberMatch = text.match(patterns.raceNumber);
      if (!raceNumberMatch) {
        errors.push({
          type: 'RACE_INFO',
          field: 'raceNumber',
          message: 'レース番号が見つかりません',
          rawData: text,
        });
      }

      // レース名の抽出
      const titleMatch = text.match(patterns.title);
      if (!titleMatch) {
        errors.push({
          type: 'RACE_INFO',
          field: 'title',
          message: 'レース名が見つかりません',
          rawData: text,
        });
      }

      // 距離・コース種別の抽出
      const distanceMatch = text.match(patterns.distance);
      if (!distanceMatch) {
        errors.push({
          type: 'RACE_INFO',
          field: 'distance',
          message: '距離・コース情報が見つかりません',
          rawData: text,
        });
      }

      // 馬場状態の抽出
      const conditionMatch = text.match(patterns.condition);
      if (!conditionMatch) {
        warnings.push(
          '馬場状態が見つかりません。デフォルト値（良）を使用します。'
        );
      }

      // レースクラスの抽出
      const classMatch = text.match(patterns.class);
      if (!classMatch) {
        warnings.push(
          'レースクラスが見つかりません。デフォルト値（オープン）を使用します。'
        );
      }

      // 日付の抽出
      const dateMatch = text.match(patterns.date);
      if (!dateMatch) {
        errors.push({
          type: 'RACE_INFO',
          field: 'date',
          message: '開催日が見つかりません',
          rawData: text,
        });
      }

      if (errors.length > 0) {
        if (this.config.strictMode) {
          return { success: false, errors, warnings };
        }
        // 非厳密モードでも重要なエラーがある場合は失敗とする
        const criticalErrors = errors.filter(
          e =>
            e.field === 'venue' ||
            e.field === 'raceNumber' ||
            e.field === 'distance'
        );
        if (criticalErrors.length > 0) {
          return { success: false, errors, warnings };
        }
      }

      // データの構築
      const raceInfo: RaceInfo = {
        venue: venueMatch?.[1] || '不明',
        raceNumber: raceNumberMatch ? parseInt(raceNumberMatch[1]) : 0,
        title: titleMatch?.[2] || '不明',
        distance: distanceMatch ? parseInt(distanceMatch[2]) : 0,
        surface: this.parseSurface(distanceMatch?.[1] || '芝'),
        condition: this.parseTrackCondition(conditionMatch?.[1] || '良'),
        raceClass: this.parseRaceClass(classMatch?.[1] || 'オープン'),
        date: dateMatch
          ? new Date(
              parseInt(dateMatch[1]),
              parseInt(dateMatch[2]) - 1,
              parseInt(dateMatch[3])
            )
          : new Date(),
      };

      return { success: true, data: raceInfo, errors, warnings };
    } catch (error) {
      errors.push({
        type: 'RACE_INFO',
        field: 'general',
        message: `パース中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
        rawData: text,
      });

      return { success: false, errors, warnings };
    }
  }

  /**
   * 馬データをパース（フォーム用）
   */
  parseHorseData(text: string): HorseDataForm[] {
    const result = this.parseHorseDataInternal(text);
    if (!result.success || !result.data) {
      throw new Error(result.errors?.[0]?.message || 'パースに失敗しました');
    }

    // HorseDataFormの形式に変換
    return result.data.map(horse => ({
      number: horse.number,
      name: horse.name,
      age: horse.age,
      gender: this.convertGenderToString(horse.gender),
      weight: horse.weight,
      jockeyName: horse.jockeyName,
      trainerName: horse.trainerName,
      ownerName: '', // NetKeibaデータには含まれていない場合が多い
    }));
  }

  /**
   * 馬データをパース（内部用）
   */
  parseHorseDataInternal(text: string): ParseResult<HorseData[]> {
    const errors: ParseError[] = [];
    const warnings: string[] = [];
    const horses: HorseData[] = [];

    try {
      // 行ごとに分割
      const lines = text.split('\n').filter(line => line.trim());

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const horse = this.parseHorseLine(line, i + 1);
          if (horse) {
            horses.push(horse);
          }
        } catch (error) {
          const parseError: ParseError = {
            type: 'HORSE_DATA',
            field: 'horseLine',
            message: `${i + 1}行目の馬データパースに失敗: ${error instanceof Error ? error.message : 'Unknown error'}`,
            rawData: line,
            lineNumber: i + 1,
          };

          if (this.config.skipInvalidHorses) {
            warnings.push(parseError.message);
          } else {
            errors.push(parseError);
          }
        }
      }

      if (horses.length === 0) {
        errors.push({
          type: 'HORSE_DATA',
          field: 'general',
          message: '有効な馬データが見つかりませんでした',
          rawData: text,
        });
      }

      if (horses.length > this.config.maxHorses) {
        warnings.push(
          `出走頭数が上限（${this.config.maxHorses}頭）を超えています`
        );
      }

      return {
        success: errors.length === 0,
        data: horses,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push({
        type: 'HORSE_DATA',
        field: 'general',
        message: `馬データパース中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
        rawData: text,
      });

      return { success: false, errors, warnings };
    }
  }

  /**
   * オッズデータをパース
   */
  parseOdds(text: string): ParseResult<OddsData[]> {
    const errors: ParseError[] = [];
    const warnings: string[] = [];
    const oddsData: OddsData[] = [];

    try {
      // 行ごとに分割
      const lines = text.split('\n').filter(line => line.trim());

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const odds = this.parseOddsLine(line, i + 1);
          if (odds) {
            oddsData.push(odds);
          }
        } catch (error) {
          const parseError: ParseError = {
            type: 'ODDS_DATA',
            field: 'oddsLine',
            message: `${i + 1}行目のオッズデータパースに失敗: ${error instanceof Error ? error.message : 'Unknown error'}`,
            rawData: line,
            lineNumber: i + 1,
          };

          warnings.push(parseError.message);
        }
      }

      return {
        success: true,
        data: oddsData,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push({
        type: 'ODDS_DATA',
        field: 'general',
        message: `オッズデータパース中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
        rawData: text,
      });

      return { success: false, errors, warnings };
    }
  }

  /**
   * パースしたデータのバリデーション
   */
  validateParsedData(data: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data || typeof data !== 'object') {
      errors.push({
        field: 'data',
        message: 'データが無効です',
        value: data,
      });
      return { isValid: false, errors };
    }

    // レース情報のバリデーション
    if ('venue' in data && typeof data.venue === 'string') {
      if (!data.venue || data.venue.trim().length === 0) {
        errors.push({
          field: 'venue',
          message: '競馬場名は必須です',
          value: data.venue,
        });
      }
    }

    if ('distance' in data && typeof data.distance === 'number') {
      if (data.distance < 1000 || data.distance > 4000) {
        errors.push({
          field: 'distance',
          message: '距離は1000m-4000mの範囲で入力してください',
          value: data.distance,
        });
      }
    }

    if ('raceNumber' in data && typeof data.raceNumber === 'number') {
      if (data.raceNumber < 1 || data.raceNumber > 12) {
        errors.push({
          field: 'raceNumber',
          message: 'レース番号は1-12の範囲で入力してください',
          value: data.raceNumber,
        });
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // プライベートメソッド

  private parseHorseLine(line: string, _lineNumber: number): HorseData | null {
    // 馬データの正規表現パターン（NetKeibaの一般的な形式）
    // 例: "1 サンプル馬 牡3 56 武豊 藤沢和雄"
    const pattern =
      /^(\d+)\s+([^\s]+)\s+(牡|牝|セ)(\d+)\s+(\d+(?:\.\d+)?)\s+([^\s]+)\s+([^\s]+)/;
    const match = line.match(pattern);

    if (!match) {
      throw new Error(`馬データの形式が正しくありません: ${line}`);
    }

    const [
      ,
      numberStr,
      name,
      genderStr,
      ageStr,
      weightStr,
      jockeyName,
      trainerName,
    ] = match;

    return {
      number: parseInt(numberStr),
      name: name.trim(),
      age: parseInt(ageStr),
      gender: this.parseGender(genderStr),
      weight: parseFloat(weightStr),
      jockeyName: jockeyName.trim(),
      trainerName: trainerName.trim(),
    };
  }

  private parseOddsLine(line: string, _lineNumber: number): OddsData | null {
    // オッズデータの正規表現パターン
    // 例: "1 3.2 1.1-1.3"
    const pattern =
      /^(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/;
    const match = line.match(pattern);

    if (!match) {
      // 単勝オッズのみの場合
      const simplePattern = /^(\d+)\s+(\d+(?:\.\d+)?)/;
      const simpleMatch = line.match(simplePattern);

      if (simpleMatch) {
        const [, numberStr, winOddsStr] = simpleMatch;
        return {
          horseNumber: parseInt(numberStr),
          winOdds: parseFloat(winOddsStr),
          placeOddsMin: parseFloat(winOddsStr) / 3, // 概算値
          placeOddsMax: parseFloat(winOddsStr) / 2, // 概算値
        };
      }

      throw new Error(`オッズデータの形式が正しくありません: ${line}`);
    }

    const [, numberStr, winOddsStr, placeMinStr, placeMaxStr] = match;

    return {
      horseNumber: parseInt(numberStr),
      winOdds: parseFloat(winOddsStr),
      placeOddsMin: parseFloat(placeMinStr),
      placeOddsMax: parseFloat(placeMaxStr),
    };
  }

  private parseSurface(surfaceStr: string): Surface {
    switch (surfaceStr) {
      case '芝':
        return Surface.TURF;
      case 'ダート':
        return Surface.DIRT;
      default:
        return Surface.TURF;
    }
  }

  private parseTrackCondition(conditionStr: string): TrackCondition {
    switch (conditionStr) {
      case '良':
        return TrackCondition.FIRM;
      case '稍重':
        return TrackCondition.GOOD;
      case '重':
        return TrackCondition.YIELDING;
      case '不良':
        return TrackCondition.SOFT;
      default:
        return TrackCondition.FIRM;
    }
  }

  private parseRaceClass(classStr: string): RaceClass {
    switch (classStr) {
      case 'G1':
        return RaceClass.G1;
      case 'G2':
        return RaceClass.G2;
      case 'G3':
        return RaceClass.G3;
      case 'Listed':
        return RaceClass.LISTED;
      case 'オープン':
        return RaceClass.OPEN;
      case '3勝クラス':
        return RaceClass.CLASS_3;
      case '2勝クラス':
        return RaceClass.CLASS_2;
      case '1勝クラス':
        return RaceClass.CLASS_1;
      case '未勝利':
        return RaceClass.MAIDEN;
      default:
        return RaceClass.OPEN;
    }
  }

  private parseGender(genderStr: string): Gender {
    switch (genderStr) {
      case '牡':
        return Gender.MALE;
      case '牝':
        return Gender.FEMALE;
      case 'セ':
        return Gender.GELDING;
      default:
        return Gender.MALE;
    }
  }

  private convertGenderToString(gender: Gender): 'male' | 'female' | 'gelding' {
    switch (gender) {
      case Gender.MALE:
        return 'male';
      case Gender.FEMALE:
        return 'female';
      case Gender.GELDING:
        return 'gelding';
      default:
        return 'male';
    }
  }
}
