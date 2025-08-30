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
      // 実際のNetKeibaデータの形式に合わせたパターン
      const patterns = {
        // レース名は最初の行にある
        title: /^([^\n]+?)\s*$/m,
        // 発走時刻、距離、天候、馬場状態（例: "15:35発走 / 芝1200m (右 B) / 天候:晴 / 馬場:良"）
        raceDetails:
          /(\d+):(\d+)発走.*(芝|ダート)(\d+)m.*馬場:(良|稍重|重|不良)/,
        // 開催情報（例: "2回 札幌 2日目 サラ系３歳以上 オープン"）
        meetingInfo:
          /(\d+)回\s*(東京|中山|阪神|京都|中京|新潟|福島|小倉|札幌|函館)\s*(\d+)日目.*?(G[123]|リステッド|Listed|オープン|3勝クラス|2勝クラス|1勝クラス|未勝利|新馬)/,
        // 賞金情報（例: "本賞金:4300,1700,1100,650,430万円"）
        prize: /本賞金:(\d+(?:,\d+)*)/,
      };

      // レース名の抽出（最初の行）
      const lines = text.split('\n');
      const titleMatch = lines[0] ? lines[0].trim() : '';
      if (!titleMatch) {
        errors.push({
          type: 'RACE_INFO',
          field: 'title',
          message: 'レース名が見つかりません',
          rawData: text,
        });
      }

      // 発走時刻、距離、馬場状態の抽出
      const raceDetailsMatch = text.match(patterns.raceDetails);
      if (!raceDetailsMatch) {
        errors.push({
          type: 'RACE_INFO',
          field: 'raceDetails',
          message: 'レース詳細情報が見つかりません',
          rawData: text,
        });
      }

      // 開催情報から競馬場とレースクラスを抽出
      const meetingMatch = text.match(patterns.meetingInfo);
      if (!meetingMatch) {
        errors.push({
          type: 'RACE_INFO',
          field: 'meetingInfo',
          message: '開催情報が見つかりません',
          rawData: text,
        });
      }

      // レース番号を推定（URLや文脈から）
      let raceNumber = 0;
      const raceNumberGuess = text.match(/(\d+)R/);
      if (raceNumberGuess) {
        raceNumber = parseInt(raceNumberGuess[1]);
      } else {
        // 他のパターンで推定（例: キーンランドCなどの重賞は通常9-11Rが多い）
        raceNumber = 11; // デフォルト値
        warnings.push(
          'レース番号が特定できないため、デフォルト値を使用します。'
        );
      }

      if (errors.length > 0) {
        if (this.config.strictMode) {
          return { success: false, errors, warnings };
        }
        // 非厳密モードでも重要なエラーがある場合は失敗とする
        const criticalErrors = errors.filter(
          e =>
            e.field === 'title' ||
            e.field === 'raceDetails' ||
            e.field === 'meetingInfo'
        );
        if (criticalErrors.length > 0) {
          return { success: false, errors, warnings };
        }
      }

      // データの構築
      const raceInfo: RaceInfo = {
        venue: meetingMatch?.[2] || '不明',
        raceNumber: raceNumber,
        title: titleMatch || '不明',
        distance: raceDetailsMatch ? parseInt(raceDetailsMatch[4]) : 0,
        surface: this.parseSurface(raceDetailsMatch?.[3] || '芝'),
        condition: this.parseTrackCondition(raceDetailsMatch?.[5] || '良'),
        raceClass: this.parseRaceClass(meetingMatch?.[4] || 'オープン'),
        date: new Date(), // 実際の日付は別途設定が必要
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
      // NetKeibaの出馬表データを馬ごとのブロックに分割
      const horseBlocks = this.splitIntoHorseBlocks(text);

      for (let i = 0; i < horseBlocks.length; i++) {
        const block = horseBlocks[i];

        try {
          const horse = this.parseHorseBlock(block, i + 1);
          if (horse) {
            horses.push(horse);
          }
        } catch (error) {
          const parseError: ParseError = {
            type: 'HORSE_DATA',
            field: 'horseBlock',
            message: `${i + 1}番目の馬データパースに失敗: ${error instanceof Error ? error.message : 'Unknown error'}`,
            rawData: block,
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
   * NetKeibaのテキストを馬ごとのブロックに分割
   */
  private splitIntoHorseBlocks(text: string): string[] {
    const blocks: string[] = [];

    // 枠番と馬番のパターンで分割（実際のNetKeibaの形式に対応）
    const lines = text.split('\n');
    let currentBlock = '';
    let inHorseData = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 枠番・馬番の行を検出（例: "1\t1" "2\t3" など）
      const frameHorseMatch = line.match(/^(\d+)\s+(\d+)\s*$/);

      if (frameHorseMatch) {
        // 前のブロックを保存
        if (currentBlock.trim() && inHorseData) {
          blocks.push(currentBlock.trim());
        }
        // 新しいブロックを開始（次の行の印記号も含める）
        currentBlock = line;
        if (i + 1 < lines.length) {
          currentBlock += '\n' + lines[i + 1]; // 印記号行を追加
        }
        inHorseData = true;
      } else if (inHorseData && !frameHorseMatch) {
        // 馬データの続きを追加
        currentBlock += '\n' + line;
      }
    }

    // 最後のブロックを保存
    if (currentBlock.trim() && inHorseData) {
      blocks.push(currentBlock.trim());
    }

    return blocks;
  }

  /**
   * 馬データブロックをパース
   */
  private parseHorseBlock(
    block: string,
    blockNumber: number
  ): HorseData | null {
    const lines = block.split('\n');

    // 最初の行から枠番・馬番を抽出
    const firstLine = lines[0];
    const frameHorseMatch = firstLine.match(/^(\d+)\s+(\d+)/);
    if (!frameHorseMatch) {
      throw new Error(`枠番・馬番が見つかりません: ${firstLine}`);
    }

    const horseNumber = parseInt(frameHorseMatch[2]);

    // 印記号を抽出（2行目）
    // const markLine = lines[1] ? lines[1].trim() : ''; // 将来の実装用

    // 馬名を抽出（NetKeibaの特殊な構造に対応）
    let horseName = '';
    const horseNameStartIndex = 2;

    // NetKeibaでは以下の順序で馬情報が配置されている:
    // 1. 印記号の次の行: 血統上の馬名（登録名）
    // 2. その次の行: 実際に使用される競走馬名（レース出走名）
    // 3. その次の行以降: さらに詳細な血統情報

    const candidateNames = [];
    for (
      let i = horseNameStartIndex;
      i < Math.min(lines.length, horseNameStartIndex + 4);
      i++
    ) {
      const line = lines[i].trim();
      // 馬名候補を検出（血統情報の括弧を除く）
      if (
        line &&
        /[ァ-ヶー\u3040-\u309F\u30A0-\u30FFa-zA-Z]/.test(line) &&
        !line.includes('(') &&
        !line.includes(')') &&
        !line.includes('kg') &&
        !line.includes('人気') &&
        !line.includes('美浦') &&
        !line.includes('栗東') &&
        !line.includes('差') &&
        !line.includes('逃') &&
        !line.includes('先') &&
        !line.includes('牡') &&
        !line.includes('牝') &&
        !line.includes('セ') &&
        !line.includes('週') &&
        !line.includes('休養')
      ) {
        candidateNames.push(line);
      }
    }

    // NetKeibaでは通常2番目の馬名候補が実際の競走馬名
    // （1番目は血統登録名、2番目がレース出走名）
    if (candidateNames.length >= 2) {
      horseName = candidateNames[1]; // 2番目を使用
    } else if (candidateNames.length >= 1) {
      horseName = candidateNames[0]; // フォールバック
    }

    if (!horseName) {
      throw new Error(`馬名が見つかりません: ブロック${blockNumber}`);
    }

    // オッズ・人気を抽出
    // let odds = this.config.defaultOdds; // 将来の実装用
    const oddsPattern = /(\d+\.\d+)\s*\((\d+)人気\)/;
    for (const line of lines) {
      const match = line.match(oddsPattern);
      if (match) {
        odds = parseFloat(match[1]);
        break;
      }
    }

    // 性別・年齢・毛色を抽出
    let gender = 'male';
    let age = 4;

    const genderAgeColorPattern = /(牡|牝|セ)(\d+)(黒鹿|栗|鹿|青鹿|芦|白)/;
    for (const line of lines) {
      const match = line.match(genderAgeColorPattern);
      if (match) {
        gender = match[1];
        age = parseInt(match[2]);
        break;
      }
    }

    // 体重を抽出
    // let bodyWeight = 500; // デフォルト値 - 将来の実装用
    const weightPattern = /(\d+)kg\(([+-]?\d+)\)/;
    for (const line of lines) {
      const match = line.match(weightPattern);
      if (match) {
        bodyWeight = parseInt(match[1]);
        break;
      }
    }

    // 騎手名と斤量を抽出（NetKeibaの配置に従って）
    let jockeyName = '';
    let weight = 55.0;

    // 騎手名は性別・年齢・毛色の行の後にある（空行を挟む場合もある）
    let foundGenderAge = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 性別・年齢・毛色の行を検出
      if (genderAgeColorPattern.test(line)) {
        foundGenderAge = true;
        continue;
      }

      // 空行はスキップ
      if (line === '' && foundGenderAge) {
        continue;
      }

      // 性別・年齢行の後で、短い日本語名（騎手名）を探す
      // 日本語文字のパターンをより幅広く設定し、一般的な騎手名をカバー（々記号も含む）
      if (
        foundGenderAge &&
        line &&
        line.length >= 2 &&
        line.length <= 8 &&
        // 日本語文字とアルファベットを含むパターンに変更（々記号U+3005を追加）
        /^[\u3040-\u309F\u30A0-\u30FF\u4e00-\u9faf\u3041-\u3096\u30a1-\u30fa\uff41-\uff5a\uff21-\uff3a\u30fcア-ンa-zA-Z\u30fbー、。、。・·\u3005]+$/.test(
          line
        ) &&
        !line.includes('美浦') &&
        !line.includes('栗東') &&
        !/[差逃先大][中大週]/.test(line) && // パターンマッチングに変更（差中、大中、差週など）
        !line.includes('kg') &&
        !line.includes('人気') &&
        !line.includes('休養') &&
        !line.includes('鉄砲') &&
        !line.includes('ヵ月') &&
        !line.includes('走目') &&
        line !== '映像を見る' &&
        !/^\d+\.\d+/.test(line) && // 数字で始まらない
        !/^\d{4}/.test(line)
      ) {
        // 日付で始まらない
        jockeyName = line;

        // 次の行で斤量をチェック
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const weightMatch = nextLine.match(/^(\d+\.\d+)/);
          if (weightMatch) {
            weight = parseFloat(weightMatch[1]);
          }
        }
        break;
      }
    }

    // 調教師名を抽出
    let trainerName = '';
    const trainerPattern = /(美浦|栗東)・([^\s]+)/;
    for (const line of lines) {
      const match = line.match(trainerPattern);
      if (match) {
        trainerName = match[2].trim();
        break;
      }
    }

    return {
      number: horseNumber,
      name: horseName,
      age: age,
      gender: this.parseGender(gender),
      weight: weight,
      jockeyName: jockeyName,
      trainerName: trainerName,
    };
  }

  /**
   * オッズデータをパース（NetKeibaの新しいフォーマット対応）
   */
  parseOdds(text: string): ParseResult<OddsData[]> {
    const errors: ParseError[] = [];
    const warnings: string[] = [];
    const oddsData: OddsData[] = [];

    try {
      const lines = text.split('\n').filter(line => line.trim());
      let currentSection = '';
      const winOddsData: Map<number, number> = new Map();
      const placeOddsData: Map<number, { min: number; max: number }> =
        new Map();

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // セクションの検出
        if (line === '単勝') {
          currentSection = 'win';
          continue;
        }
        if (line === '複勝') {
          currentSection = 'place';
          continue;
        }

        // ヘッダー行をスキップ
        if (
          (line.includes('枠') && line.includes('馬')) ||
          (line.includes('番') && line.includes('印')) ||
          (line.includes('選択') && line.includes('馬名'))
        ) {
          continue;
        }

        // 枠・馬番号行を検出（例: "1\t1"）
        const frameHorseMatch = line.match(/^(\d+)\s+(\d+)\s*$/);
        if (frameHorseMatch && i + 1 < lines.length) {
          const horseNumber = parseInt(frameHorseMatch[2]);
          const nextLine = lines[i + 1].trim();

          if (currentSection === 'win') {
            // 単勝オッズの抽出（例: "ツインクルトーズ\t176.3"）
            const winMatch = nextLine.match(/^(.+?)\s+(\d+(?:\.\d+)?)$/);
            if (winMatch) {
              const odds = parseFloat(winMatch[2]);
              winOddsData.set(horseNumber, odds);
              i++; // 次の行をスキップ
            }
          } else if (currentSection === 'place') {
            // 複勝オッズの抽出（例: "ツインクルトーズ\t27.4 - 38"）
            const placeMatch = nextLine.match(
              /^(.+?)\s+(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/
            );
            if (placeMatch) {
              const minOdds = parseFloat(placeMatch[2]);
              const maxOdds = parseFloat(placeMatch[3]);
              placeOddsData.set(horseNumber, { min: minOdds, max: maxOdds });
              i++; // 次の行をスキップ
            }
          }
        }
      }

      // データを結合
      const allHorseNumbers = new Set([
        ...winOddsData.keys(),
        ...placeOddsData.keys(),
      ]);
      for (const horseNumber of allHorseNumbers) {
        const winOdds = winOddsData.get(horseNumber) || this.config.defaultOdds;
        const placeOdds = placeOddsData.get(horseNumber);

        oddsData.push({
          horseNumber: horseNumber,
          winOdds: winOdds,
          placeOddsMin: placeOdds?.min || winOdds / 3, // フォールバック
          placeOddsMax: placeOdds?.max || winOdds / 2, // フォールバック
        });
      }

      // 馬番号順にソート
      oddsData.sort((a, b) => a.horseNumber - b.horseNumber);

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
