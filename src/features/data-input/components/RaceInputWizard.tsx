import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useRaceInputWizard } from '../hooks/useRaceInputWizard';
import { WizardSteps } from './WizardSteps';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2HorsesData } from './Step2HorsesData';
import { Step3OddsData } from './Step3OddsData';
import { Step4Confirmation } from './Step4Confirmation';

interface RaceInputWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function RaceInputWizard({
  onComplete,
  onCancel,
}: RaceInputWizardProps) {
  const wizard = useRaceInputWizard();

  // ショートカットキーの設定
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + S でオートセーブ
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        wizard.saveDraft();
      }

      // Ctrl/Cmd + 右矢印で次のステップ
      if ((event.ctrlKey || event.metaKey) && event.key === 'ArrowRight') {
        event.preventDefault();
        if (wizard.canGoNext) {
          wizard.nextStep();
        }
      }

      // Ctrl/Cmd + 左矢印で前のステップ
      if ((event.ctrlKey || event.metaKey) && event.key === 'ArrowLeft') {
        event.preventDefault();
        if (wizard.canGoPrevious) {
          wizard.previousStep();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [wizard]);

  const handleSubmit = async () => {
    try {
      await wizard.submitRace();
      onComplete?.();
    } catch (error) {
      console.error('Failed to submit race:', error);
      // TODO: エラー通知を表示
    }
  };

  const renderCurrentStep = () => {
    switch (wizard.currentStep) {
      case 1:
        return <Step1BasicInfo form={wizard.basicInfoForm} />;
      case 2:
        return <Step2HorsesData form={wizard.horsesDataForm} />;
      case 3: {
        const horseNames =
          wizard.horsesDataForm.getValues('horses')?.map(horse => ({
            number: horse.number,
            name: horse.name,
          })) || [];
        return (
          <Step3OddsData form={wizard.oddsDataForm} horseNames={horseNames} />
        );
      }
      case 4:
        return (
          <Step4Confirmation
            data={wizard.getAllFormData()}
            onEditStep={wizard.goToStep}
            onSubmit={handleSubmit}
            isSubmitting={wizard.isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">レースデータ入力</h1>
          <div className="flex items-center space-x-2">
            {wizard.isDraftSaved && (
              <span className="text-sm text-green-600 flex items-center">
                <Save className="w-4 h-4 mr-1" />
                下書き保存済み
              </span>
            )}
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                キャンセル
              </Button>
            )}
          </div>
        </div>

        {/* ステップ表示 */}
        <WizardSteps
          steps={wizard.steps}
          currentStep={wizard.currentStep}
          onStepClick={wizard.goToStep}
        />
      </div>

      {/* メインコンテンツ */}
      <Card>
        <CardContent className="p-8">{renderCurrentStep()}</CardContent>
      </Card>

      {/* ナビゲーションボタン */}
      {wizard.currentStep < 4 && (
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={wizard.previousStep}
            disabled={!wizard.canGoPrevious}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            前のステップ
          </Button>

          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={wizard.saveDraft} size="sm">
              <Save className="w-4 h-4 mr-2" />
              下書き保存
            </Button>

            <Button onClick={wizard.nextStep} disabled={!wizard.canGoNext}>
              次のステップ
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ショートカットキーのヒント */}
      <div className="mt-6 p-3 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-600">
          <strong>ショートカットキー:</strong>
          Ctrl+S (下書き保存) | Ctrl+← (前のステップ) | Ctrl+→ (次のステップ)
        </p>
      </div>
    </div>
  );
}
