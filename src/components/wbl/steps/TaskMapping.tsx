import { SKILLS, STEPS, SkillData } from '@/data/wblData';
import { ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TaskMappingProps {
  skillData: Map<string, SkillData>;
  onSaveTaskMapping: (skillId: string, value: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function TaskMapping({ skillData, onSaveTaskMapping, onNext, onPrev }: TaskMappingProps) {
  const step = STEPS[2];
  const selectedSkills = SKILLS.filter(s => skillData.get(s.id)?.completed);
  const [loadingSkillId, setLoadingSkillId] = useState<string | null>(null);
  const [textareaValues, setTextareaValues] = useState<Map<string, string>>(new Map());

  const handleGenerateSuggestion = async (skillId: string) => {
    const skill = SKILLS.find(s => s.id === skillId);
    if (!skill) return;

    const data = skillData.get(skillId);
    const selectedTools = data?.selected_tools ? data.selected_tools.split(',').filter(t => t) : [];

    setLoadingSkillId(skillId);

    try {
      const { data: responseData, error } = await supabase.functions.invoke('generate-task-suggestion', {
        body: {
          skillName: skill.name,
          skillDescription: skill.description || '',
          selectedTools,
        },
      });

      if (error) {
        throw error;
      }

      if (responseData?.suggestion) {
        setTextareaValues(prev => new Map(prev).set(skillId, responseData.suggestion));
        onSaveTaskMapping(skillId, responseData.suggestion);
        toast({
          title: "Suggestion generated!",
          description: "AI has suggested a task for this skill.",
        });
      }
    } catch (error) {
      console.error('Error generating suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to generate suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingSkillId(null);
    }
  };

  const getTextareaValue = (skillId: string) => {
    if (textareaValues.has(skillId)) {
      return textareaValues.get(skillId) || '';
    }
    return skillData.get(skillId)?.task_mapping || '';
  };

  const handleTextareaChange = (skillId: string, value: string) => {
    setTextareaValues(prev => new Map(prev).set(skillId, value));
  };

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
            const isLoading = loadingSkillId === skill.id;
            
            return (
              <div key={skill.id} className="bg-card rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{skill.icon}</span>
                    <h3 className="font-semibold text-foreground text-lg">{skill.name}</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateSuggestion(skill.id)}
                    disabled={isLoading}
                    className="flex items-center gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Help Me!
                  </Button>
                </div>
                <Textarea
                  placeholder="Example: Student owns daily inventory check with a 3:00 PM deadline. Supervised by warehouse manager."
                  className="bg-surface-dark border-border text-foreground placeholder:text-muted-foreground/50 resize-none"
                  rows={3}
                  value={getTextareaValue(skill.id)}
                  onChange={(e) => handleTextareaChange(skill.id, e.target.value)}
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
