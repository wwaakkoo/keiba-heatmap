import { renderHook, act } from '@testing-library/react';
import { useRaceInputWizard } from '../hooks/useRaceInputWizard';

// LocalStorageのモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useRaceInputWizard', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useRaceInputWizard());

    expect(result.current.currentStep).toBe(1);
    expect(result.current.steps).toHaveLength(4);
    expect(result.current.canGoNext).toBe(false);
    expect(result.current.canGoPrevious).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isDraftSaved).toBe(false);
  });

  it('ステップナビゲーションが正しく動作する', () => {
    const { result } = renderHook(() => useRaceInputWizard());

    // 最初は次に進めない（バリデーションエラーのため）
    expect(result.current.canGoNext).toBe(false);

    // ステップ2に直接移動
    act(() => {
      result.current.goToStep(2);
    });

    expect(result.current.currentStep).toBe(2);
    expect(result.current.canGoPrevious).toBe(true);

    // 前のステップに戻る
    act(() => {
      result.current.previousStep();
    });

    expect(result.current.currentStep).toBe(1);
  });

  it('フォームデータが正しく取得される', () => {
    const { result } = renderHook(() => useRaceInputWizard());

    const formData = result.current.getAllFormData();

    expect(formData).toHaveProperty('basicInfo');
    expect(formData).toHaveProperty('horsesData');
    expect(formData).toHaveProperty('oddsData');
  });

  it('フォームリセットが正しく動作する', () => {
    const { result } = renderHook(() => useRaceInputWizard());

    // ステップ2に移動
    act(() => {
      result.current.goToStep(2);
    });

    // リセット実行
    act(() => {
      result.current.resetAllForms();
    });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.isDraftSaved).toBe(false);
  });

  it('下書き保存が正しく動作する', () => {
    const { result } = renderHook(() => useRaceInputWizard());

    act(() => {
      result.current.saveDraft();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'race-input-draft',
      expect.any(String)
    );
  });

  it('ステップの完了状態が正しく計算される', () => {
    const { result } = renderHook(() => useRaceInputWizard());

    // 初期状態では全てのステップが未完了
    result.current.steps.forEach(step => {
      expect(step.isCompleted).toBe(false);
    });
  });

  it('無効なステップ番号では移動しない', () => {
    const { result } = renderHook(() => useRaceInputWizard());

    const initialStep = result.current.currentStep;

    act(() => {
      result.current.goToStep(0); // 無効なステップ
    });

    expect(result.current.currentStep).toBe(initialStep);

    act(() => {
      result.current.goToStep(5); // 無効なステップ
    });

    expect(result.current.currentStep).toBe(initialStep);
  });
});
