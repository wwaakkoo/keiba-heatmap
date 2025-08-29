# 競馬予想アプリ (Horse Racing Prediction App)

統計分析ベースの競馬予想アプリ。データドリブンな意思決定により感情に左右されない合理的な競馬投資を実現します。

## 技術スタック

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Database**: IndexedDB (Dexie.js)
- **Testing**: Vitest + Testing Library
- **PWA**: Service Worker + Web App Manifest

## 開発環境

- Node.js 20.x LTS
- pnpm (パッケージマネージャー)

## セットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# プレビュー
pnpm preview
```

## 開発コマンド

```bash
# リント実行
pnpm lint

# リント修正
pnpm lint:fix

# フォーマット実行
pnpm format

# フォーマットチェック
pnpm format:check

# テスト実行
pnpm test

# テストカバレッジ
pnpm test:coverage

# コミット（Conventional Commits）
pnpm commit
```

## プロジェクト構造

```
src/
├── components/   # UIコンポーネント
├── features/     # 機能別モジュール
├── hooks/        # カスタムフック
├── services/     # ビジネスロジック
├── stores/       # 状態管理
├── types/        # 型定義
├── utils/        # ユーティリティ
└── constants/    # 定数定義
```

## コミット規約

このプロジェクトでは [Conventional Commits](https://www.conventionalcommits.org/) を使用しています。

```bash
# コミット例
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードフォーマット
refactor: リファクタリング
test: テスト追加・修正
chore: その他の変更
```

## ライセンス

MIT License
