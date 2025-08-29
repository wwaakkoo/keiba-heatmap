import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { WizardStep } from '../hooks/useRaceInputWizard';

interface WizardStepsProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function WizardSteps({
  steps,
  currentStep,
  onStepClick,
}: WizardStepsProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.isCompleted;
          const isClickable = step.id <= currentStep || isCompleted;

          return (
            <li key={step.id} className="flex-1">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                    {
                      'bg-blue-600 border-blue-600 text-white': isActive,
                      'bg-green-600 border-green-600 text-white':
                        isCompleted && !isActive,
                      'border-gray-300 text-gray-500':
                        !isActive && !isCompleted,
                      'hover:border-blue-400 hover:text-blue-600':
                        isClickable && !isActive && !isCompleted,
                      'cursor-not-allowed opacity-50': !isClickable,
                    }
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted && !isActive ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </button>

                <div className="ml-4 min-w-0 flex-1">
                  <p
                    className={cn('text-sm font-medium', {
                      'text-blue-600': isActive,
                      'text-green-600': isCompleted && !isActive,
                      'text-gray-500': !isActive && !isCompleted,
                    })}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>

                {/* 接続線 */}
                {index < steps.length - 1 && (
                  <div
                    className={cn('hidden sm:block w-5 h-px ml-4', {
                      'bg-green-600': isCompleted,
                      'bg-gray-300': !isCompleted,
                    })}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
