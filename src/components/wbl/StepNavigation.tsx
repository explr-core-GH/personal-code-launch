import { STEPS } from '@/data/wblData';
import { cn } from '@/lib/utils';

interface StepNavigationProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

export function StepNavigation({ currentStep, onStepChange }: StepNavigationProps) {
  return (
    <div className="bg-secondary px-6 py-2 overflow-x-auto flex-shrink-0">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-1 min-w-max">
          {STEPS.map(step => (
            <button
              key={step.id}
              onClick={() => onStepChange(step.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap rounded-md",
                step.id === currentStep
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <span className="mr-1.5 opacity-60">{step.id}.</span>{step.short}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
