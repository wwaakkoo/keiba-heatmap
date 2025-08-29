import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  RaceInputForm,
  RaceBasicInfoForm,
  HorsesDataForm,
  OddsDataForm,
  raceBasicInfoSchema,
  horsesDataSchema,
  oddsDataSchema,
  DraftData,
} from '../schemas/raceInputSchema';

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isValid: boolean;
}

export interface UseRaceInputWizardReturn {
  // ステップ管理
  currentStep: number;
  steps: WizardStep[];
  canGoNext: boolean;
  canGoPrevious: boolean;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;

  // フォーム管理
  basicInfoForm: ReturnType<typeof useForm<RaceBasicInfoForm>>;
  horsesDataForm: ReturnType<typeof useForm<HorsesDataForm>>;
  oddsDataForm: ReturnType<typeof useForm<OddsDataForm>>;

  // データ管理
  getAllFormData: () => Partial<RaceInputForm>;
  resetAllForms: () => void;

  // オートセーブ
  isDraftSaved: boolean;
  saveDraft: () => void;
  loadDraft: (draftId: string) => void;
  deleteDraft: (draftId: string) => void;

  // 送信
  isSubmitting: boolean;
  submitRace: () => Promise<void>;
}

const WIZARD_STEPS: Omit<WizardStep, 'isCompleted' | 'isValid'>[] = [
  {
    id: 1,
    title: 'レース基本情報',
    description: 'レースの基本情報を入力してください',
  },
  {
    id: 2,
    title: '出馬表データ',
    description: '出走馬の情報を入力してください',
  },
  {
    id: 3,
    title: 'オッズ情報',
    description: '各馬のオッズ情報を入力してください',
  },
  {
    id: 4,
    title: '確認・修正',
    description: '入力内容を確認し、必要に応じて修正してください',
  },
];

const DRAFT_STORAGE_KEY = 'race-input-draft';
const AUTO_SAVE_INTERVAL = 30000; // 30秒

export function useRaceInputWizard(): UseRaceInputWizardReturn {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // フォームの初期化
  const basicInfoForm = useForm<RaceBasicInfoForm>({
    resolver: zodResolver(raceBasicInfoSchema),
    mode: 'onChange',
  });

  const horsesDataForm = useForm<HorsesDataForm>({
    resolver: zodResolver(horsesDataSchema),
    mode: 'onChange',
  });

  const oddsDataForm = useForm<OddsDataForm>({
    resolver: zodResolver(oddsDataSchema),
    mode: 'onChange',
  });

  // ステップの状態を計算
  const steps: WizardStep[] = WIZARD_STEPS.map(step => {
    let isValid = false;
    let isCompleted = false;

    switch (step.id) {
      case 1:
        isValid = basicInfoForm.formState.isValid;
        isCompleted =
          isValid &&
          Object.keys(basicInfoForm.formState.touchedFields).length > 0;
        break;
      case 2:
        isValid = horsesDataForm.formState.isValid;
        isCompleted =
          isValid &&
          Object.keys(horsesDataForm.formState.touchedFields).length > 0;
        break;
      case 3:
        isValid = oddsDataForm.formState.isValid;
        isCompleted =
          isValid &&
          Object.keys(oddsDataForm.formState.touchedFields).length > 0;
        break;
      case 4:
        isValid =
          basicInfoForm.formState.isValid &&
          horsesDataForm.formState.isValid &&
          oddsDataForm.formState.isValid;
        isCompleted = isValid;
        break;
    }

    return {
      ...step,
      isValid,
      isCompleted,
    };
  });

  // ナビゲーション制御
  const canGoNext = currentStep < 4 && steps[currentStep - 1].isValid;
  const canGoPrevious = currentStep > 1;

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (canGoNext) {
      setCurrentStep(prev => prev + 1);
    }
  }, [canGoNext]);

  const previousStep = useCallback(() => {
    if (canGoPrevious) {
      setCurrentStep(prev => prev - 1);
    }
  }, [canGoPrevious]);

  // データ管理
  const getAllFormData = useCallback((): Partial<RaceInputForm> => {
    return {
      basicInfo: basicInfoForm.getValues(),
      horsesData: horsesDataForm.getValues(),
      oddsData: oddsDataForm.getValues(),
    };
  }, [basicInfoForm, horsesDataForm, oddsDataForm]);

  const resetAllForms = useCallback(() => {
    basicInfoForm.reset();
    horsesDataForm.reset();
    oddsDataForm.reset();
    setCurrentStep(1);
    setIsDraftSaved(false);
  }, [basicInfoForm, horsesDataForm, oddsDataForm]);

  // オートセーブ機能
  const saveDraft = useCallback(() => {
    const draftData: DraftData = {
      id: `draft-${Date.now()}`,
      step: currentStep,
      data: getAllFormData(),
      timestamp: new Date(),
      isComplete: steps.every(step => step.isCompleted),
    };

    const existingDrafts = JSON.parse(
      localStorage.getItem(DRAFT_STORAGE_KEY) || '[]'
    );
    const updatedDrafts = [draftData, ...existingDrafts.slice(0, 4)]; // 最新5件まで保持

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updatedDrafts));
    setIsDraftSaved(true);

    // 3秒後にフラグをリセット
    setTimeout(() => setIsDraftSaved(false), 3000);
  }, [currentStep, getAllFormData, steps]);

  const loadDraft = useCallback(
    (draftId: string) => {
      const drafts: DraftData[] = JSON.parse(
        localStorage.getItem(DRAFT_STORAGE_KEY) || '[]'
      );
      const draft = drafts.find(d => d.id === draftId);

      if (draft) {
        if (draft.data.basicInfo) {
          basicInfoForm.reset(draft.data.basicInfo);
        }
        if (draft.data.horsesData) {
          horsesDataForm.reset(draft.data.horsesData);
        }
        if (draft.data.oddsData) {
          oddsDataForm.reset(draft.data.oddsData);
        }
        setCurrentStep(draft.step);
      }
    },
    [basicInfoForm, horsesDataForm, oddsDataForm]
  );

  const deleteDraft = useCallback((draftId: string) => {
    const drafts: DraftData[] = JSON.parse(
      localStorage.getItem(DRAFT_STORAGE_KEY) || '[]'
    );
    const updatedDrafts = drafts.filter(d => d.id !== draftId);
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updatedDrafts));
  }, []);

  // 送信処理
  const submitRace = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const formData = getAllFormData();

      // TODO: レースデータをデータベースに保存
      console.log('Submitting race data:', formData);

      // 成功後にフォームをリセット
      resetAllForms();

      // ドラフトを削除
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to submit race data:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [getAllFormData, resetAllForms]);

  // オートセーブの設定
  useEffect(() => {
    const interval = setInterval(() => {
      const hasData =
        Object.keys(basicInfoForm.formState.touchedFields).length > 0 ||
        Object.keys(horsesDataForm.formState.touchedFields).length > 0 ||
        Object.keys(oddsDataForm.formState.touchedFields).length > 0;

      if (hasData) {
        saveDraft();
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [
    basicInfoForm.formState.touchedFields,
    horsesDataForm.formState.touchedFields,
    oddsDataForm.formState.touchedFields,
    saveDraft,
  ]);

  return {
    currentStep,
    steps,
    canGoNext,
    canGoPrevious,
    goToStep,
    nextStep,
    previousStep,
    basicInfoForm,
    horsesDataForm,
    oddsDataForm,
    getAllFormData,
    resetAllForms,
    isDraftSaved,
    saveDraft,
    loadDraft,
    deleteDraft,
    isSubmitting,
    submitRace,
  };
}
