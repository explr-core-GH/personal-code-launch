import { SKILLS, STEPS, MONITORING_APPROACHES, SkillData } from '@/data/wblData';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonitorProgressProps {
  skillData: Map<string, SkillData>;
  onToggleMonitoring: (skillId: string, approach: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function MonitorProgress({ skillData, onToggleMonitoring, onNext, onPrev }: MonitorProgressProps) {
  const step = STEPS[4];
  const selectedSkills = SKILLS.filter(s => skillData.get(s.id)?.completed);

  return (
    <div className="fade-in w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2 font-display">
          📊 {step.title}
        </h2>
        <p className="text-muted-foreground">{step.description}</p>
      </div>

      {selectedSkills.length === 0 ? (
        <div className="bg-card rounded-xl p-8 text-center">
          <p className="text-muted-foreground mb-4">No skills selected yet.</p>
          <Button variant="secondary" onClick={onPrev}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Skills
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedSkills.map(skill => {
            const data = skillData.get(skill.id);
            const selectedApproaches = data?.monitoring_approach ? data.monitoring_approach.split(',').filter(a => a) : [];
            
            return (
              <div key={skill.id} className="bg-card rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{skill.icon}</span>
                  <h3 className="font-semibold text-foreground text-lg">{skill.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {MONITORING_APPROACHES.map(approach => (
                    <button
                      key={approach}
                      onClick={() => onToggleMonitoring(skill.id, approach)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm transition-colors",
                        selectedApproaches.includes(approach)
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {approach}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <Button variant="secondary" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext} className="bg-accent hover:bg-emerald-hover text-accent-foreground">
          Next: OMJ Alignment
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
