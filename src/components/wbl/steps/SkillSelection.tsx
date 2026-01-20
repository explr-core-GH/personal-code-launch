import { SKILLS, STEPS, SkillData } from '@/data/wblData';
import { cn } from '@/lib/utils';
import { Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SkillSelectionProps {
  skillData: Map<string, SkillData>;
  onToggleSkill: (skillId: string) => void;
  onNext: () => void;
  onPrev?: () => void;
}

export function SkillSelection({ skillData, onToggleSkill, onNext, onPrev }: SkillSelectionProps) {
  const step = STEPS[1];

  return (
    <div className="fade-in w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2 font-display">
          ⭐ {step.title}
        </h2>
        <p className="text-muted-foreground">{step.description}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SKILLS.map(skill => {
          const data = skillData.get(skill.id);
          const isSelected = data?.completed || false;
          
          return (
            <div
              key={skill.id}
              onClick={() => onToggleSkill(skill.id)}
              className={cn(
                "skill-card bg-card rounded-xl p-4 border-2 cursor-pointer transition-all relative",
                isSelected 
                  ? "border-accent bg-accent/10" 
                  : "border-border hover:border-accent/50"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{skill.icon}</span>
                <div 
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                    isSelected 
                      ? "bg-accent" 
                      : "bg-card border-2 border-muted-foreground"
                  )}
                >
                  {isSelected && <Check className="w-5 h-5 text-accent-foreground" />}
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{skill.name}</h3>
              <p className="text-sm text-muted-foreground">{skill.description}</p>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 flex justify-between">
        {onPrev && (
          <Button onClick={onPrev} variant="outline">
            <ChevronRight className="w-5 h-5 mr-2 rotate-180" />
            Back: Organization Info
          </Button>
        )}
        <div className="flex-1" />
        <Button onClick={onNext} className="bg-accent hover:bg-emerald-hover text-accent-foreground">
          Next: Choose Tools
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
