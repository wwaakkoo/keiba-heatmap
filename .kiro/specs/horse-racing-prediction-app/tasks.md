# 競馬予想アプリ実装タスクリスト（改訂版）

## Phase 0: 開発環境準備（1-2日）

- [x] **0.1 開発環境とツールチェーンのセットアップ**
  - Node.js 20.x LTS、pnpm のインストール
  - VSCode拡張機能の設定（ESLint, Prettier, TypeScript）
  - Git リポジトリの初期化と .gitignore 設定
  - コミット規約（Conventional Commits）の設定

- [x] **0.2 プロジェクト初期設定**
  - Vite + React + TypeScript プロジェクトの作成
  - ESLint, Prettier の設定ファイル作成
  - Vitest の設定（単体テスト用）
  - GitHub Actions の基本CI設定

## Phase 1: 基盤構築（1週間）

- [x] **1.1 プロジェクト構造とコア型定義**
  - ディレクトリ構造の作成
    ```
    src/
    ├── types/        # 型定義
    ├── components/   # UIコンポーネント
    ├── features/     # 機能別モジュール
    ├── services/     # ビジネスロジック
    ├── stores/       # 状態管理
    ├── hooks/        # カスタムフック
    ├── utils/        # ユーティリティ
    └── constants/    # 定数定義
    ```
  - コアデータ型の定義
    - `Horse`, `Race`, `RaceResult`, `Prediction`
    - `Investment`, `BankrollStatus`, `PerformanceMetrics`
    - `UserSettings`, `ValidationError`
  - 定数とEnumの定義（レースタイプ、距離カテゴリ、馬場状態等）
  - _要件: 1.1, 2.2, 3.1_

- [x] **1.2 データベース層の実装**
  - Dexie.js のインストールと設定
  - スキーマ定義とマイグレーション戦略
    ```typescript
    // テーブル設計
    races: (++id, date, courseName, raceNumber);
    horses: (++id, name, age, sex, [raceId + horseNumber]);
    predictions: (++id, raceId, calculations, timestamp);
    investments: (++id, raceId, amount, result, timestamp);
    settings: (key, value);
    ```
  - Repository パターンによるデータアクセス層の実装
  - トランザクション処理とエラーハンドリング
  - インデックス最適化の設定
  - _要件: 4.1, 4.2_

- [x] **1.3 基本UIフレームワークの構築**
  - Tailwind CSS + shadcn/ui のセットアップ
  - デザイントークンの定義（カラー、スペーシング、フォント）
  - 共通レイアウトコンポーネント
    - `AppShell`, `Header`, `Navigation`, `Footer`
    - `PageContainer`, `Card`, `Section`
  - エラーバウンダリーコンポーネント
  - ローディング・スケルトンコンポーネント
  - _要件: 6.1, 6.2_

## Phase 2: コア機能実装（2週間）

- [x] **2.1 NetKeibaパーサーの実装**
  - パーサークラスの基本構造
    ```typescript
    class NetKeibaParser {
      parseRaceInfo(text: string): RaceInfo;
      parseHorseData(text: string): Horse[];
      parseOdds(text: string): OddsData;
      validateParsedData(data: unknown): ValidationResult;
    }
    ```
  - 段階的パース戦略（基本情報 → オッズ → 詳細情報）
  - パースエラーの詳細レポート機能
  - サンプルデータによる単体テスト（10パターン以上）
  - _要件: 2.1, 2.5_

- [x] **2.2 データ入力インターフェースの実装**
  - 多段階入力フォーム（ウィザード形式）
    - Step 1: レース基本情報
    - Step 2: 出馬表データ貼り付け
    - Step 3: オッズ情報
    - Step 4: 確認・修正
  - リアルタイムバリデーション（Zodスキーマ使用）
  - 入力補助機能
    - オートセーブ（下書き保存）
    - 入力履歴からのサジェスト
    - ショートカットキー対応
  - _要件: 2.1-2.5_

- [ ] **2.3 予想計算エンジンの実装**
  - 計算モジュールの分離設計
    ```typescript
    interface PredictionModule {
      calculateBaseScore(horse: Horse): number;
      calculateExpectedValue(horse: Horse, odds: number): number;
      calculateConfidence(horse: Horse, race: Race): number;
    }
    ```
  - スコア計算要素
    - 過去成績スコア（直近5走の着順）
    - 騎手成績スコア（勝率・連対率）
    - 距離適性スコア（同距離での成績）
    - コース適性スコア
  - 期待値計算と閾値判定
  - 計算過程のログ出力機能（デバッグ用）
  - _要件: 1.1-1.4_

- [ ] **2.4 状態管理システムの実装**
  - Zustand ストアの設計
    ```typescript
    // ストア分割
    useRaceStore; // レースデータ管理
    usePredictionStore; // 予想結果管理
    useInvestmentStore; // 投資記録管理
    useSettingsStore; // 設定管理
    ```
  - 楽観的更新の実装
  - データベースとの自動同期
  - 状態の永続化（persist middleware）
  - DevTools 対応
  - _要件: 1.4, 3.3, 4.1_

## Phase 3: 投資管理機能（1週間）

- [ ] **3.1 資金管理システムの実装**
  - バンクロール管理クラス
    ```typescript
    class BankrollManager {
      calculateKellyBet(probability: number, odds: number): number;
      calculateFixedPercentage(bankroll: number, percentage: number): number;
      checkDailyLimit(currentLoss: number): boolean;
      updateBankroll(result: InvestmentResult): void;
    }
    ```
  - 投資戦略の実装（固定額、比例、Kelly基準）
  - リスク管理機能
    - ストップロス判定
    - 最大露出額制限
    - 連敗アラート
  - _要件: 3.1-3.4_

- [ ] **3.2 投資実行インターフェース**
  - 投資計画表示画面
    - 推奨投資額の表示
    - リスク指標の可視化
    - 複数レースでの資金配分表示
  - 投資実行確認ダイアログ
  - 実行後の即時フィードバック
  - 投資キャンセル・修正機能
  - _要件: 3.1, 3.2_

- [ ] **3.3 結果記録システム**
  - レース結果入力インターフェース
  - 自動収支計算
  - 予想と実績の比較記録
  - 結果データの整合性チェック
  - _要件: 3.3, 3.4_

## Phase 4: 分析・可視化機能（1週間）

- [ ] **4.1 統計分析エンジン**
  - 分析指標の計算
    ```typescript
    interface PerformanceAnalyzer {
      calculateROI(investments: Investment[]): number;
      calculateWinRate(predictions: Prediction[]): number;
      calculateMaxDrawdown(investments: Investment[]): number;
      identifyWeakPoints(results: RaceResult[]): WeakPoint[];
    }
    ```
  - 時系列分析（日/週/月/年）
  - カテゴリ別分析（距離/クラス/競馬場）
  - _要件: 5.1-5.4_

- [ ] **4.2 ダッシュボード画面**
  - メインダッシュボード
    - 本日の予想サマリー
    - 収支速報
    - 重要指標のカード表示
  - グラフコンポーネント（Recharts使用）
    - 収支推移チャート
    - 的中率トレンド
    - 投資分布ヒートマップ
  - フィルター・期間選択機能
  - _要件: 5.1, 5.2_

- [ ] **4.3 詳細レポート機能**
  - パフォーマンスレポート生成
  - 改善提案の自動生成
  - CSV/PDFエクスポート機能
  - レポートテンプレートのカスタマイズ
  - _要件: 5.3, 5.4_

## Phase 5: データ管理・同期（3日）

- [ ] **5.1 バックアップ・リストア機能**
  - 自動バックアップスケジューラー
  - 手動バックアップ実行
  - バックアップファイルの暗号化
  - リストア時のデータ検証
  - バージョン管理機能
  - _要件: 4.3, 4.4_

- [ ] **5.2 データエクスポート・インポート**
  - JSON形式でのエクスポート
  - CSV形式での部分エクスポート
  - インポート時のマージ戦略
  - データ変換・マッピング機能
  - _要件: 4.3, 4.4_

## Phase 6: PWA化とパフォーマンス最適化（1週間）

- [ ] **6.1 PWA基本実装**
  - Web App Manifest の作成
  - アイコンセット（各サイズ）の用意
  - Service Worker の実装
    - キャッシュ戦略（Cache First, Network First）
    - バックグラウンド同期
  - インストールプロンプトの実装
  - _要件: 7.1, 7.2_

- [ ] **6.2 オフライン対応**
  - オフライン時のUI表示
  - ローカルデータでの予想計算維持
  - オンライン復帰時の同期処理
  - オフラインキューの実装
  - _要件: 7.1, 7.2_

- [ ] **6.3 パフォーマンス最適化**
  - コード分割（React.lazy）
  - 画像最適化（WebP対応）
  - データベースクエリの最適化
  - Web Worker での重い計算処理
  - Virtual Scrolling の実装（大量データ表示時）
  - _要件: 6.4, 1.1_

## Phase 7: 品質保証とテスト（1週間）

- [ ] **7.1 単体テスト強化**
  - ビジネスロジックのテストカバレッジ80%以上
  - Vitestでのテスト実行環境整備
  - モックデータの整備
  - スナップショットテスト
  - _要件: 全般_

- [ ] **7.2 統合テスト**
  - データフロー全体のテスト
  - 状態管理とDBの同期テスト
  - エラーケースの網羅的テスト
  - _要件: 全般_

- [ ] **7.3 E2Eテスト**
  - Playwright でのE2Eテスト環境構築
  - 主要ユーザーフローのテスト
    - データ入力 → 予想 → 投資 → 結果記録
  - クロスブラウザテスト
  - モバイルデバイステスト
  - _要件: 全般_

- [ ] **7.4 パフォーマンステスト**
  - Lighthouse によるパフォーマンス測定
  - 予想計算の処理時間測定（目標: 3秒以内）
  - データベース操作のベンチマーク
  - メモリリークの検出
  - _要件: 6.4_

## Phase 8: デプロイとリリース（3日）

- [ ] **8.1 ビルド最適化**
  - 本番ビルド設定の最適化
  - 環境変数の管理
  - ソースマップの設定
  - バンドルサイズの最適化
  - _要件: 7.1_

- [ ] **8.2 デプロイ設定**
  - Vercel/Netlify へのデプロイ設定
  - カスタムドメインの設定（必要に応じて）
  - HTTPS設定の確認
  - CDN設定
  - _要件: 7.1_

- [ ] **8.3 モニタリング設定**
  - エラー監視（Sentry等）の設定
  - パフォーマンス監視
  - 使用状況分析
  - _要件: 6.4_

- [ ] **8.4 ドキュメント整備**
  - README.md の作成
  - 操作マニュアルの作成
  - トラブルシューティングガイド
  - 開発者向けドキュメント
  - _要件: 全般_

## 追加考慮事項

### セキュリティ対策

- [ ] Content Security Policy (CSP) の設定
- [ ] XSS対策の実装
- [ ] 機密データの暗号化

### アクセシビリティ

- [ ] ARIA属性の適切な設定
- [ ] キーボードナビゲーション対応
- [ ] スクリーンリーダー対応

### 保守性向上

- [ ] コンポーネントのStorybook作成
- [ ] デザインシステムのドキュメント化
- [ ] コードレビューチェックリスト作成

## 見積もり工数

- **Phase 0-1**: 1週間（基盤構築）
- **Phase 2-3**: 3週間（コア機能）
- **Phase 4-5**: 1.5週間（分析・データ管理）
- **Phase 6-8**: 2.5週間（PWA化・品質保証・リリース）

**合計**: 約8週間（2ヶ月）

※ 1日3-4時間の作業時間を想定
※ 各フェーズは並行作業可能な部分あり
