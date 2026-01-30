import { SKILLS } from '@/data/wblData';

interface ProgressOverviewProps {
  completedCount: number;
}

export function ProgressOverview({ completedCount }: ProgressOverviewProps) {
  const total = SKILLS.length;
  const percent = Math.round((completedCount / total) * 100);
  const circumference = 175.93;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="bg-card border-b border-border px-6 py-4 flex-shrink-0">
      <div className="max-w-6xl mx-auto flex items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle 
                cx="28" 
                cy="28" 
                r="24" 
                stroke="hsl(var(--border))" 
                strokeWidth="3" 
                fill="none" 
              />
              <circle 
                cx="28" 
                cy="28" 
                r="24" 
                stroke="hsl(var(--primary))" 
                strokeWidth="3" 
                fill="none" 
                strokeLinecap="round" 
                strokeDasharray={150.8}
                strokeDashoffset={150.8 - (percent / 100) * 150.8}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
              {percent}%
            </span>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-medium">
              Progress
            </p>
            <p className="text-base font-semibold text-foreground">
              {completedCount}/{total} skills
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
