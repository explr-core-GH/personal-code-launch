import { SKILLS, STEPS, SkillData } from '@/data/wblData';
import { Check, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AlignmentProps {
  skillData: Map<string, SkillData>;
  onNext: () => void;
  onPrev: () => void;
}

const checklistItems = [
  { id: 'task', label: 'Each skill is taught through a real task', check: (data: SkillData | undefined) => {
    // Check if any task in the tasks array has a description
    const hasTaskWithDescription = data?.tasks?.some(t => t.description?.trim().length > 0) || false;
    return hasTaskWithDescription;
  }},
  { id: 'tools', label: 'Tools support consistency', check: (data: SkillData | undefined) => (data?.selected_tools?.length || 0) > 0 },
  { id: 'teaching', label: 'Teaching strategies are defined', check: (data: SkillData | undefined) => (data?.teaching_strategy?.length || 0) > 0 },
  { id: 'monitoring', label: 'Monitoring approaches are selected', check: (data: SkillData | undefined) => (data?.monitoring_approach?.length || 0) > 0 }
];

export function Alignment({ skillData, onNext, onPrev }: AlignmentProps) {
  const step = STEPS[5];
  const selectedSkills = SKILLS.filter(s => skillData.get(s.id)?.completed);

  return (
    <div className="fade-in w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2 font-display">
          ⭐ {step.title}
        </h2>
        <p className="text-muted-foreground">{step.description}</p>
      </div>

      <div className="bg-card rounded-xl p-6">
        <h3 className="font-semibold text-foreground text-lg mb-4">OMJ Readiness Seal Checklist</h3>
        <div className="space-y-4">
          {selectedSkills.map(skill => {
            const data = skillData.get(skill.id);
            const allPassed = checklistItems.every(item => item.check(data));
            
            return (
              <div key={skill.id} className="bg-surface-dark rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{skill.icon}</span>
                    <span className="font-medium text-foreground">{skill.name}</span>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    allPassed ? "bg-accent text-accent-foreground" : "bg-yellow-600 text-white"
                  )}>
                    {allPassed ? '✓ Complete' : 'In Progress'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {checklistItems.map(item => {
                    const passed = item.check(data);
                    return (
                      <div 
                        key={item.id} 
                        className={cn(
                          "flex items-center gap-2 text-sm",
                          passed ? "text-accent" : "text-muted-foreground"
                        )}
                      >
                        {passed ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        {item.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="secondary" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext} className="bg-accent hover:bg-emerald-hover text-accent-foreground">
          Next: Communicate Plan
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
