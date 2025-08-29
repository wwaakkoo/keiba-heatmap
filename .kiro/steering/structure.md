# プロジェクト構造

## ディレクトリ構成

```
src/
├── components/     # 再利用可能なUIコンポーネント
│   ├── ui/        # shadcn/uiベースコンポーネント
│   └── common/    # 共通コンポーネント
├── features/      # 機能別モジュール
│   ├── prediction/    # 予想機能
│   ├── investment/    # 投資・収支管理
│   ├── data-input/    # データ入力
│   └── portfolio/     # ポートフォリオ分析
├── hooks/         # カスタムReactフック
├── services/      # ビジネスロジック・API
├── stores/        # Zustand状態管理
├── types/         # TypeScript型定義
├── utils/         # ユーティリティ関数
├── constants/     # 定数定義
└── test/          # テストユーティリティ
```

## パス設定

TypeScriptパスマッピングが設定済み：

- `@/*` → `src/*`
- `@/components/*` → `src/components/*`
- `@/types/*` → `src/types/*`
- `@/utils/*` → `src/utils/*`
- `@/hooks/*` → `src/hooks/*`
- `@/services/*` → `src/services/*`
- `@/stores/*` → `src/stores/*`

## ファイル命名規則

### コンポーネント

- **PascalCase**: `HorseCard.tsx`, `PredictionList.tsx`
- **index.ts**: 各ディレクトリにエクスポート用index.tsを配置

### フック

- **camelCase**: `useRaceData.ts`, `usePrediction.ts`
- **use**プレフィックス必須

### ユーティリティ・サービス

- **camelCase**: `calculateExpectedValue.ts`, `databaseService.ts`

### 型定義

- **PascalCase**: `Race.ts`, `Horse.ts`, `Prediction.ts`
- **interface**または**type**で定義

### テストファイル

- **同名 + .test.tsx/.test.ts**: `HorseCard.test.tsx`

## 機能別モジュール構成

各featureディレクトリは以下の構造：

```
features/prediction/
├── components/     # 機能固有コンポーネント
├── hooks/         # 機能固有フック
├── services/      # 機能固有ビジネスロジック
├── types/         # 機能固有型定義
└── index.ts       # 公開API
```

## インポート順序

1. React・外部ライブラリ
2. 内部モジュール（@/から始まる）
3. 相対パス（./から始まる）

```typescript
import React from 'react';
import { Button } from '@/components/ui/button';
import { useRaceData } from '@/hooks/useRaceData';
import { calculateExpectedValue } from './utils';
```

## 設定ファイル配置

- **ルート**: package.json, tsconfig.json, vite.config.ts
- **.kiro/**: Kiro固有設定（specs, steering）
- **.vscode/**: VSCode設定
- **.husky/**: Git hooks設定
