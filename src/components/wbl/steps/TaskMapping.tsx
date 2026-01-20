import { SKILLS, STEPS, SkillData } from '@/data/wblData';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface TaskMappingProps {
  skillData: Map<string, SkillData>;
  onSaveTaskMapping: (skillId: string, value: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function TaskMapping({ skillData, onSaveTaskMapping, onNext, onPrev }: TaskMappingProps) {
  const step = STEPS[2];
  const selectedSkills = SKILLS.filter(s => skillData.get(s.id)?.completed);

  return (
    <div className="fade-in w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2 font-display">
          📝 {step.title}
        </h2>
        <p className="text-muted-foreground">{step.description}</p>
        <p className="text-sm text-muted-foreground/70 mt-2">
          For each skill, describe what task will allow the student to practice it, when it will occur, and who will supervise.
        </p>
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
            
            return (
              <div key={skill.id} className="bg-card rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{skill.icon}</span>
                  <h3 className="font-semibold text-foreground text-lg">{skill.name}</h3>
                </div>
                <Textarea
                  placeholder="Example: Student owns daily inventory check with a 3:00 PM deadline. Supervised by warehouse manager."
                  className="bg-surface-dark border-border text-foreground placeholder:text-muted-foreground/50 resize-none"
                  rows={3}
                  defaultValue={data?.task_mapping || ''}
                  onBlur={(e) => onSaveTaskMapping(skill.id, e.target.value)}
                />
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
          Next: Teaching Methods
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
