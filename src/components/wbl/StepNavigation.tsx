import { STEPS } from '@/data/wblData';
import { cn } from '@/lib/utils';

interface StepNavigationProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

export function StepNavigation({ currentStep, onStepChange }: StepNavigationProps) {
  return (
    <div className="bg-surface-dark border-b border-border px-6 py-3 overflow-x-auto flex-shrink-0">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-2 min-w-max">
          {STEPS.map(step => (
            <button
              key={step.id}
              onClick={() => onStepChange(step.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                step.id === currentStep
                  ? "bg-accent text-accent-foreground"
                  : "bg-card text-muted-foreground hover:bg-secondary"
              )}
            >
              <span className="mr-1">{step.id}.</span> {step.short}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
