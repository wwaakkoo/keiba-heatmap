# 技術スタック

## フロントエンド

- **React 18** + **TypeScript** - メインフレームワーク
- **Vite** - ビルドツール・開発サーバー
- **Tailwind CSS** + **shadcn/ui** - スタイリング・UIコンポーネント
- **Zustand** - 状態管理
- **Recharts** - グラフ・チャート表示

## データ永続化

- **IndexedDB** (Dexie.js) - ローカルデータベース
- **Cache API** - Service Workerによるキャッシュ

## PWA機能

- **Service Worker** - オフライン対応
- **Web App Manifest** - アプリインストール対応

## 開発ツール

- **ESLint** + **Prettier** - コード品質・フォーマット
- **Vitest** + **Testing Library** - テスト
- **Husky** + **lint-staged** - Git hooks
- **Commitizen** - Conventional Commits

## 共通コマンド

### 開発

```bash
# 開発サーバー起動 (ポート3000)
pnpm dev

# ビルド (TypeScript → Vite)
pnpm build

# プレビュー
pnpm preview
```

### コード品質

```bash
# リント実行・修正
pnpm lint
pnpm lint:fix

# フォーマット実行・チェック
pnpm format
pnpm format:check
```

### テスト

```bash
# テスト実行
pnpm test

# UIモードでテスト
pnpm test:ui

# カバレッジ付きテスト
pnpm test:coverage
```

### コミット

```bash
# Conventional Commitsでコミット
pnpm commit
```

## パッケージマネージャー

- **pnpm** を使用（package-lock.jsonではなくpnpm-lock.yaml）

## TypeScript設定

- **strict mode** 有効
- **Path mapping** 設定済み (`@/*` → `src/*`)
- **ES2020** ターゲット
- **React JSX** 変換
