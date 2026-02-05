import { STEPS } from '@/data/wblData';
import { cn } from '@/lib/utils';

interface StepNavigationProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

export function StepNavigation({ currentStep, onStepChange }: StepNavigationProps) {
  return (
    <div className="bg-background border-b border-border px-6 py-4 overflow-x-auto flex-shrink-0">
      <div className="flex gap-2 min-w-max">
        {STEPS.map(step => (
          <button
            key={step.id}
            onClick={() => onStepChange(step.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-base font-semibold rounded-lg transition-all border-2",
              step.id === currentStep
                ? "bg-primary text-primary-foreground border-primary shadow-lg"
                : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            )}
          >
            <span className="text-xs font-bold opacity-60">{step.id}</span>
            <span className="uppercase tracking-wide">{step.short}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
