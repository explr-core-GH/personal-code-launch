import { SKILLS, STEPS, SkillData, TaskItem } from '@/data/wblData';
import { ChevronLeft, ChevronRight, Sparkles, Loader2, Plus, Trash2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { OrganizationData } from '@/hooks/useOrganizationData';

interface TaskMappingProps {
  skillData: Map<string, SkillData>;
  organizationData: OrganizationData;
  projectIdea: string;
  onProjectIdeaChange: (value: string) => void;
  onSaveTaskMapping: (skillId: string, value: string) => void;
  onAddTask: (skillId: string) => void;
  onRemoveTask: (skillId: string, taskId: string) => void;
  onUpdateTaskDescription: (skillId: string, taskId: string, description: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function TaskMapping({ skillData, organizationData, projectIdea, onProjectIdeaChange, onSaveTaskMapping, onAddTask, onRemoveTask, onUpdateTaskDescription, onNext, onPrev }: TaskMappingProps) {
  const step = STEPS[3];
  const selectedSkills = SKILLS.filter(s => skillData.get(s.id)?.completed);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [textareaValues, setTextareaValues] = useState<Map<string, string>>(new Map());
  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);
  const [localProjectIdea, setLocalProjectIdea] = useState(projectIdea);

  const handleGenerateProjectIdea = async () => {
    setIsGeneratingIdea(true);

    try {
      const selectedSkillNames = selectedSkills.map(s => s.name);
      
      const { data: responseData, error } = await supabase.functions.invoke('generate-task-suggestion', {
        body: {
          type: 'project-idea',
          organizationName: organizationData.organizationName,
          interestReason: organizationData.interestReason,
          numberOfInterns: organizationData.numberOfInterns,
          selectedSkills: selectedSkillNames,
        },
      });

      if (error) {
        throw error;
      }

      if (responseData?.suggestion) {
        setLocalProjectIdea(responseData.suggestion);
        onProjectIdeaChange(responseData.suggestion);
        toast({
          title: "Project idea generated!",
          description: "AI has suggested a project idea based on your organization.",
        });
      }
    } catch (error) {
      console.error('Error generating project idea:', error);
      toast({
        title: "Error",
        description: "Failed to generate project idea. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingIdea(false);
    }
  };

  const handleGenerateSuggestion = async (skillId: string, taskId: string) => {
    const skill = SKILLS.find(s => s.id === skillId);
    if (!skill) return;

    const data = skillData.get(skillId);
    const selectedTools = data?.selected_tools ? data.selected_tools.split(',').filter(t => t) : [];

    setLoadingTaskId(taskId);

    try {
      const { data: responseData, error } = await supabase.functions.invoke('generate-task-suggestion', {
        body: {
          type: 'task',
          skillName: skill.name,
          skillDescription: skill.description || '',
          selectedTools,
          organizationName: organizationData.organizationName,
          interestReason: organizationData.interestReason,
          numberOfInterns: organizationData.numberOfInterns,
          projectIdea: localProjectIdea || projectIdea,
        },
      });

      if (error) {
        throw error;
      }

      if (responseData?.suggestion) {
        const key = `${skillId}-${taskId}`;
        setTextareaValues(prev => new Map(prev).set(key, responseData.suggestion));
        onUpdateTaskDescription(skillId, taskId, responseData.suggestion);
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
      setLoadingTaskId(null);
    }
  };

  const getTextareaValue = (skillId: string, taskId: string, defaultValue: string) => {
    const key = `${skillId}-${taskId}`;
    if (textareaValues.has(key)) {
      return textareaValues.get(key) || '';
    }
    return defaultValue;
  };

  const handleTextareaChange = (skillId: string, taskId: string, value: string) => {
    const key = `${skillId}-${taskId}`;
    setTextareaValues(prev => new Map(prev).set(key, value));
  };

  const getTasks = (skillId: string): TaskItem[] => {
    const data = skillData.get(skillId);
    if (data?.tasks && data.tasks.length > 0) {
      return data.tasks;
    }
    // Fallback for legacy single task_mapping
    return [{ id: 'legacy', description: data?.task_mapping || '' }];
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

      {/* Project Idea Section */}
      <div className="bg-card rounded-xl p-5 mb-6 border-2 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground text-lg">Project Idea (Optional)</h3>
              <p className="text-sm text-muted-foreground">
                Do you have a specific project or focus area for this internship? This helps generate more relevant task suggestions.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateProjectIdea}
            disabled={isGeneratingIdea}
            className="flex items-center gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
          >
            {isGeneratingIdea ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Help Me!
          </Button>
        </div>
        <Textarea
          placeholder="Example: Create a social media marketing campaign for our summer product launch, or organize and digitize our client filing system..."
          className="bg-surface-dark border-border text-foreground placeholder:text-muted-foreground/50 resize-none"
          rows={3}
          value={localProjectIdea}
          onChange={(e) => {
            setLocalProjectIdea(e.target.value);
            onProjectIdeaChange(e.target.value);
          }}
        />
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
            const tasks = getTasks(skill.id);
            
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
                    onClick={() => onAddTask(skill.id)}
                    className="flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {tasks.map((task, index) => {
                    const isLoading = loadingTaskId === task.id;
                    
                    return (
                      <div key={task.id} className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Task {index + 1}
                          </span>
                          <div className="flex-1" />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateSuggestion(skill.id, task.id)}
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
                          {tasks.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveTask(skill.id, task.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <Textarea
                          placeholder="Example: Student owns daily inventory check with a 3:00 PM deadline. Supervised by warehouse manager."
                          className="bg-surface-dark border-border text-foreground placeholder:text-muted-foreground/50 resize-none"
                          rows={3}
                          value={getTextareaValue(skill.id, task.id, task.description)}
                          onChange={(e) => handleTextareaChange(skill.id, task.id, e.target.value)}
                          onBlur={(e) => onUpdateTaskDescription(skill.id, task.id, e.target.value)}
                        />
                      </div>
                    );
                  })}
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
          Next: Teaching Methods
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
