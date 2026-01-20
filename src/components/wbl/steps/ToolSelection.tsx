import { SKILLS, STEPS, SkillData } from '@/data/wblData';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ToolSelectionProps {
  skillData: Map<string, SkillData>;
  onToggleTool: (skillId: string, tool: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function ToolSelection({ skillData, onToggleTool, onNext, onPrev }: ToolSelectionProps) {
  const step = STEPS[1];
  const selectedSkills = SKILLS.filter(s => skillData.get(s.id)?.completed);

  return (
    <div className="fade-in w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2 font-display">
          🛠️ {step.title}
        </h2>
        <p className="text-muted-foreground">{step.description}</p>
      </div>

      {selectedSkills.length === 0 ? (
        <div className="bg-card rounded-xl p-8 text-center">
          <p className="text-muted-foreground mb-4">No skills selected yet. Go back to Step 1 to select skills.</p>
          <Button variant="secondary" onClick={onPrev}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Skills
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedSkills.map(skill => {
            const data = skillData.get(skill.id);
            const selectedTools = data?.selected_tools ? data.selected_tools.split(',').filter(t => t) : [];
            
            return (
              <div key={skill.id} className="bg-card rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{skill.icon}</span>
                  <h3 className="font-semibold text-foreground text-lg">{skill.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skill.suggestedTools.map(tool => (
                    <button
                      key={tool}
                      onClick={() => onToggleTool(skill.id, tool)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 shadow-sm",
                        selectedTools.includes(tool)
                          ? "bg-accent text-accent-foreground border-accent shadow-md"
                          : "bg-card text-foreground border-border hover:border-accent/50 hover:bg-muted"
                      )}
                    >
                      {tool}
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
          Next: Map Tasks
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
