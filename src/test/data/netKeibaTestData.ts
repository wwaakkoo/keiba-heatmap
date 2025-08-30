/**
 * NetKeibaパーサーのテスト用サンプルデータ
 */

// テストパターン1: 標準的な東京競馬場のG1レース
export const SAMPLE_RACE_INFO_1 = `
東京競馬場 第11R 日本ダービー(G1) 芝2400m 良 2024年5月26日
`;

export const SAMPLE_HORSE_DATA_1 = `
1 ドウデュース 牡3 57.0 福永祐一 友道康夫
2 ジオグリフ 牡3 57.0 ルメール 石坂正
3 アスクビクターモア 牡3 57.0 横山武史 藤原英昭
4 ベラジオオペラ 牡3 57.0 戸崎圭太 矢作芳人
5 タイトルホルダー 牡3 57.0 大野拓弥 栗田徹
6 イクイノックス 牡3 57.0 武豊 木村哲也
7 サリオス 牡3 57.0 川田将雅 堀宣行
8 エフフォーリア 牡3 57.0 横山典弘 手塚貴久
`;

export const SAMPLE_ODDS_DATA_1 = `
1 3.2 1.1-1.3
2 5.8 1.8-2.2
3 8.1 2.5-3.1
4 12.5 3.8-4.6
5 15.2 4.2-5.1
6 2.1 1.0-1.2
7 4.5 1.5-1.9
8 6.7 2.1-2.6
`;

// テストパターン2: 中山競馬場のダートレース
export const SAMPLE_RACE_INFO_2 = `
中山競馬場 第9R 3勝クラス ダート1800m 稍重 2024年3月15日
`;

export const SAMPLE_HORSE_DATA_2 = `
1 テストホース1 牡4 57.0 田辺裕信 国枝栄
2 テストホース2 牝4 55.0 石橋脩 藤沢和雄
3 テストホース3 セ5 57.0 内田博幸 角居勝彦
4 テストホース4 牡3 56.0 三浦皇成 清水久詞
5 テストホース5 牝3 54.0 柴田大知 武井亮
`;

export const SAMPLE_ODDS_DATA_2 = `
1 4.5 1.6-2.0
2 7.2 2.3-2.8
3 12.8 3.9-4.7
4 25.6 7.8-9.5
5 8.9 2.7-3.3
`;

// テストパターン3: 新潟競馬場の未勝利戦
export const SAMPLE_RACE_INFO_3 = `
新潟競馬場 第3R 未勝利 芝1200m 良 2024年7月7日
`;

export const SAMPLE_HORSE_DATA_3 = `
1 デビューホース1 牡2 54.0 松山弘平 安田隆行
2 デビューホース2 牝2 54.0 藤岡康太 西村真幸
3 デビューホース3 牡2 54.0 和田竜二 平田修
4 デビューホース4 牝2 54.0 幸英明 橋口慎介
5 デビューホース5 牡2 54.0 川又賢治 大久保龍志
6 デビューホース6 牝2 54.0 岩田望来 友道康夫
7 デビューホース7 牡2 54.0 坂井瑠星 清水久詞
8 デビューホース8 牝2 54.0 団野大成 西園正都
9 デビューホース9 牡2 54.0 富田暁 杉山晴紀
10 デビューホース10 牝2 54.0 菱田裕二 鈴木孝志
`;

export const SAMPLE_ODDS_DATA_3 = `
1 8.5
2 12.3
3 5.7
4 18.9
5 25.4
6 3.2
7 15.6
8 45.8
9 7.1
10 22.7
`;

// テストパターン4: 不正な形式のデータ（エラーテスト用）
export const INVALID_RACE_INFO = `
競馬場名なし レース番号なし 距離なし
`;

export const INVALID_HORSE_DATA = `
馬番なし 馬名なし
1 正常な馬 牡3 57.0 騎手名 調教師名
不正な行データ
`;

export const INVALID_ODDS_DATA = `
1 オッズなし
2 5.8 1.8-2.2
不正なオッズ行
`;

// テストパターン5: 阪神競馬場のG2レース
export const SAMPLE_RACE_INFO_5 = `
阪神競馬場 第11R 大阪杯(G2) 芝2000m 重 2024年4月14日
`;

export const SAMPLE_HORSE_DATA_5 = `
1 テストG2ホース1 牡5 58.0 武豊 友道康夫
2 テストG2ホース2 牝4 56.0 福永祐一 石坂正
3 テストG2ホース3 牡4 58.0 ルメール 藤原英昭
4 テストG2ホース4 牝5 56.0 川田将雅 矢作芳人
5 テストG2ホース5 牡6 58.0 戸崎圭太 栗田徹
6 テストG2ホース6 牝4 56.0 横山武史 木村哲也
`;

export const SAMPLE_ODDS_DATA_5 = `
1 2.8 1.2-1.4
2 4.1 1.6-1.9
3 6.5 2.1-2.5
4 9.8 3.0-3.6
5 15.7 4.8-5.8
6 22.3 6.9-8.4
`;

// テストパターン6: 京都競馬場のListedレース
export const SAMPLE_RACE_INFO_6 = `
京都競馬場 第10R 京都新聞杯(Listed) 芝2200m 良 2024年5月12日
`;

// テストパターン7: 小倉競馬場の1勝クラス
export const SAMPLE_RACE_INFO_7 = `
小倉競馬場 第8R 1勝クラス ダート1700m 不良 2024年8月25日
`;

// テストパターン8: 札幌競馬場の2勝クラス
export const SAMPLE_RACE_INFO_8 = `
札幌競馬場 第7R 2勝クラス 芝1500m 稍重 2024年6月30日
`;

// テストパターン9: 函館競馬場のオープン特別
export const SAMPLE_RACE_INFO_9 = `
函館競馬場 第9R 函館記念(オープン) 芝2000m 良 2024年7月21日
`;

// テストパターン10: 福島競馬場のG3レース
export const SAMPLE_RACE_INFO_10 = `
福島競馬場 第11R 福島記念(G3) 芝2000m 良 2024年11月10日
`;

// 複合テストデータ
export const COMPLETE_TEST_DATA_1 = {
  raceInfo: SAMPLE_RACE_INFO_1,
  horseData: SAMPLE_HORSE_DATA_1,
  oddsData: SAMPLE_ODDS_DATA_1,
};

export const COMPLETE_TEST_DATA_2 = {
  raceInfo: SAMPLE_RACE_INFO_2,
  horseData: SAMPLE_HORSE_DATA_2,
  oddsData: SAMPLE_ODDS_DATA_2,
};

export const COMPLETE_TEST_DATA_3 = {
  raceInfo: SAMPLE_RACE_INFO_3,
  horseData: SAMPLE_HORSE_DATA_3,
  oddsData: SAMPLE_ODDS_DATA_3,
};

// 実際のNetKeibaデータ（キーンランドC）
export const REAL_NETKEIBA_DATA = `1	1	
--
マインドユアビスケッツ
ツインクルトーズB
ツインクルスター
(サクラバクシンオー)
美浦・牧  
差中1週
514kg(0)
176.3 (16人気)
牝5栗

古川吉
55.0

2	3	
☆
タワーオブロンドン
レイピア
アンナトルテ
(エンパイアメーカー)
栗東・中竹  
差中5週
510kg(+8)
9.7 (6人気)
牡3鹿

北村友
55.0

3	5	
✓
タワーオブロンドン
パンジャタワー
クラークスデール
(ヴィクトワールピサ)
栗東・橋口  
差中14週
488kg(+8)
5.5 (2人気)
牡3鹿

松山
57.0`;

// エラーテスト用データ
export const ERROR_TEST_DATA = {
  raceInfo: INVALID_RACE_INFO,
  horseData: INVALID_HORSE_DATA,
  oddsData: INVALID_ODDS_DATA,
};
