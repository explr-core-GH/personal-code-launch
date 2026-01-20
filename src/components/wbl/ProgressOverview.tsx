import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SKILLS } from '@/data/wblData';

interface ProgressOverviewProps {
  completedCount: number;
  onViewSummary: () => void;
}

export function ProgressOverview({ completedCount, onViewSummary }: ProgressOverviewProps) {
  const total = SKILLS.length;
  const percent = Math.round((completedCount / total) * 100);
  const circumference = 175.93;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="bg-card border-b border-border px-6 py-4 flex-shrink-0">
      <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle 
                cx="32" 
                cy="32" 
                r="28" 
                stroke="hsl(var(--border))" 
                strokeWidth="4" 
                fill="none" 
              />
              <circle 
                cx="32" 
                cy="32" 
                r="28" 
                stroke="hsl(var(--accent))" 
                strokeWidth="4" 
                fill="none" 
                strokeLinecap="round" 
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-accent">
              {percent}%
            </span>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              Program Progress
            </p>
            <p className="text-lg font-semibold text-foreground">
              {completedCount} of {total} skills planned
            </p>
          </div>
        </div>
        <Button 
          variant="secondary" 
          onClick={onViewSummary}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          View Summary
        </Button>
      </div>
    </div>
  );
}
