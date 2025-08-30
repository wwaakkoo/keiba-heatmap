# 状態管理システム (Zustand)

競馬予想アプリの状態管理は、Zustandを使用して実装されています。各機能領域ごとに独立したストアを持ち、必要に応じて組み合わせて使用します。

## ストア構成

### 1. Race Store (`useRaceStore`)

レースデータの管理を担当

**主な機能:**

- レース一覧の管理
- 現在選択中のレース
- レースの追加・更新・削除
- 日付範囲でのレース検索

**使用例:**

```typescript
import { useRaceStore } from '@/stores';

const MyComponent = () => {
  const {
    races,
    currentRace,
    loading,
    addRace,
    setCurrentRace
  } = useRaceStore();

  const handleAddRace = async (raceData: Race) => {
    const result = await addRace(raceData);
    if (result.success) {
      console.log('レースが追加されました');
    }
  };

  return (
    <div>
      <p>レース数: {races.length}</p>
      <p>現在のレース: {currentRace?.title}</p>
    </div>
  );
};
```

### 2. Prediction Store (`usePredictionStore`)

予想結果の管理を担当

**主な機能:**

- 予想結果の管理
- 推奨馬の抽出
- レース別予想の取得
- 予想の追加・更新・削除

**使用例:**

```typescript
import { usePredictionStore } from '@/stores';

const PredictionComponent = () => {
  const {
    currentPredictions,
    getRecommendedPredictions,
    addPredictions
  } = usePredictionStore();

  const recommended = getRecommendedPredictions();

  return (
    <div>
      <h3>推奨馬 ({recommended.length}頭)</h3>
      {recommended.map(prediction => (
        <div key={prediction.id}>
          期待値: {(prediction.expectedValue * 100).toFixed(1)}%
        </div>
      ))}
    </div>
  );
};
```

### 3. Investment Store (`useInvestmentStore`)

投資記録と資金管理を担当

**主な機能:**

- 投資記録の管理
- バンクロール状態の計算
- 収支分析
- 日次損失の追跡

**使用例:**

```typescript
import { useInvestmentStore } from '@/stores';

const PortfolioComponent = () => {
  const {
    bankrollStatus,
    investments,
    getTodaysLoss,
    addInvestment
  } = useInvestmentStore();

  const todaysLoss = getTodaysLoss();

  return (
    <div>
      <p>現在残高: ¥{bankrollStatus.currentBalance.toLocaleString()}</p>
      <p>ROI: {bankrollStatus.roi.toFixed(2)}%</p>
      <p>今日の損失: ¥{todaysLoss.toLocaleString()}</p>
    </div>
  );
};
```

### 4. Settings Store (`useSettingsStore`)

アプリケーション設定の管理を担当

**主な機能:**

- 投資設定の管理
- 予想設定の管理
- UI設定の管理
- データ設定の管理

**使用例:**

```typescript
import { useSettingsStore } from '@/stores';

const SettingsComponent = () => {
  const {
    settings,
    updateInvestmentSettings,
    updateUISettings
  } = useSettingsStore();

  const handleUpdateBetSize = async () => {
    await updateInvestmentSettings({
      betSizePercentage: 3, // 3%に変更
    });
  };

  return (
    <div>
      <p>投資比率: {settings.investment.betSizePercentage}%</p>
      <button onClick={handleUpdateBetSize}>
        投資比率を変更
      </button>
    </div>
  );
};
```

## 主要機能

### 楽観的更新

すべてのストアで楽観的更新を実装しており、UIの応答性を向上させています。

```typescript
// 例: レース追加時の楽観的更新
const addRace = async (race: Race) => {
  // 1. 即座にUIを更新
  set(state => ({ races: [...state.races, race] }));

  // 2. データベースに保存
  const result = await raceRepository.create(race);

  // 3. 失敗時はロールバック
  if (!result.success) {
    set(state => ({
      races: state.races.filter(r => r.id !== race.id),
      error: result.error,
    }));
  }
};
```

### データベース自動同期

状態の変更は自動的にIndexedDBに同期されます。

### 状態の永続化

重要な状態はブラウザのローカルストレージに永続化され、ページリロード後も保持されます。

### DevTools対応

開発環境では、Redux DevToolsを使用して状態の変化を追跡できます。

## ベストプラクティス

### 1. ストアの分離

機能ごとにストアを分離し、関心の分離を実現しています。

### 2. 型安全性

すべてのストアでTypeScriptの型定義を活用し、型安全性を確保しています。

### 3. エラーハンドリング

各ストアで統一されたエラーハンドリングを実装しています。

### 4. テスタビリティ

各ストアは独立してテスト可能な設計になっています。

## 使用上の注意

### 1. ストアの初期化

アプリケーション起動時に必要なストアの初期化を行ってください。

```typescript
// App.tsx
useEffect(() => {
  // 設定を読み込み
  useSettingsStore.getState().loadSettings();

  // 今日のレースを取得
  const today = new Date();
  useRaceStore.getState().getRacesByDateRange(today, tomorrow);
}, []);
```

### 2. メモリリーク対策

コンポーネントのアンマウント時に、必要に応じてストアの購読を解除してください。

### 3. パフォーマンス最適化

大量のデータを扱う場合は、セレクターを使用して必要な部分のみを購読してください。

```typescript
// 必要な部分のみを購読
const raceCount = useRaceStore(state => state.races.length);
const isLoading = useRaceStore(state => state.loading);
```

## トラブルシューティング

### 1. 状態が更新されない

- ストアのアクションが正しく呼び出されているか確認
- DevToolsで状態の変化を確認
- エラーログを確認

### 2. データが永続化されない

- ブラウザのローカルストレージ容量を確認
- IndexedDBの状態を確認
- persistミドルウェアの設定を確認

### 3. パフォーマンスの問題

- 不要な再レンダリングが発生していないか確認
- セレクターを使用して購読範囲を最適化
- 大量データの処理方法を見直し
