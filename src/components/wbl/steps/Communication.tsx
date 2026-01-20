import { STEPS, COMMUNICATION_ITEMS } from '@/data/wblData';
import { ChevronLeft, Info, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CommunicationProps {
  onViewSummary: () => void;
  onPrev: () => void;
}

export function Communication({ onViewSummary, onPrev }: CommunicationProps) {
  const step = STEPS[6];

  return (
    <div className="fade-in w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2 font-display">
          💼 {step.title}
        </h2>
        <p className="text-muted-foreground">{step.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COMMUNICATION_ITEMS.map(item => (
          <div key={item.title} className="bg-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{item.icon}</span>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
            </div>
            <p className="text-muted-foreground text-sm">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-accent/20 border border-accent/40 rounded-xl p-5 mt-6">
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-accent mt-0.5" />
          <div>
            <h4 className="font-semibold text-accent mb-1">Pro Tip</h4>
            <p className="text-accent/90 text-sm">
              Create an orientation packet or handbook that covers all these areas. This gives students a reference they can return to throughout their internship.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="secondary" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onViewSummary} className="bg-accent hover:bg-emerald-hover text-accent-foreground">
          <Zap className="w-5 h-5 mr-2" />
          View Summary
        </Button>
      </div>
    </div>
  );
}
