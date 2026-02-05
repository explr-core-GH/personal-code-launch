import { useState } from 'react';
import { Wrench, GraduationCap, Users, BarChart3 } from 'lucide-react';
import { WBLHeader } from '@/components/wbl/WBLHeader';
import { ProgressOverview } from '@/components/wbl/ProgressOverview';
import { StepNavigation } from '@/components/wbl/StepNavigation';
import { SummaryModal } from '@/components/wbl/SummaryModal';
import { OrganizationInfo } from '@/components/wbl/steps/OrganizationInfo';
import { SkillSelection } from '@/components/wbl/steps/SkillSelection';
import { ToolSelection } from '@/components/wbl/steps/ToolSelection';
import { TaskMapping } from '@/components/wbl/steps/TaskMapping';
import { TeachingMethods } from '@/components/wbl/steps/TeachingMethods';
import { MonitorProgress } from '@/components/wbl/steps/MonitorProgress';
import { Alignment } from '@/components/wbl/steps/Alignment';
import { Communication } from '@/components/wbl/steps/Communication';
import { Feedback } from '@/components/wbl/steps/Feedback';
import { useSkillData } from '@/hooks/useSkillData';
import { useOrganizationData } from '@/hooks/useOrganizationData';
import { cn } from '@/lib/utils';

type ToolId = 'wbl' | 'pathways' | 'mentorship' | 'analytics';

const tools = [
  { id: 'wbl' as ToolId, label: 'WBL Planner', icon: Wrench, comingSoon: false },
  { id: 'pathways' as ToolId, label: 'Pathways Explorer', icon: GraduationCap, comingSoon: true },
  { id: 'mentorship' as ToolId, label: 'Mentorship', icon: Users, comingSoon: true },
  { id: 'analytics' as ToolId, label: 'Program Analytics', icon: BarChart3, comingSoon: true },
];

export function ToolsTabs() {
  const [activeTool, setActiveTool] = useState<ToolId>('wbl');
  const [currentStep, setCurrentStep] = useState(1);
  const [showSummary, setShowSummary] = useState(false);
  const [projectIdea, setProjectIdea] = useState('');
  
  const {
    skillData,
    toggleSkill,
    toggleTool,
    saveTaskMapping,
    addTask,
    removeTask,
    updateTaskDescription,
    toggleStrategy,
    toggleMonitoring,
    getCompletedCount
  } = useSkillData();

  const { organizationData, updateField } = useOrganizationData();

  const goToStep = (step: number) => setCurrentStep(step);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <OrganizationInfo
            organizationData={organizationData}
            onUpdateField={updateField}
            onNext={() => goToStep(2)}
          />
        );
      case 2:
        return (
          <SkillSelection
            skillData={skillData}
            onToggleSkill={toggleSkill}
            onNext={() => goToStep(3)}
            onPrev={() => goToStep(1)}
          />
        );
      case 3:
        return (
          <ToolSelection
            skillData={skillData}
            onToggleTool={toggleTool}
            onNext={() => goToStep(4)}
            onPrev={() => goToStep(2)}
          />
        );
      case 4:
        return (
          <TaskMapping
            skillData={skillData}
            organizationData={organizationData}
            projectIdea={projectIdea}
            onProjectIdeaChange={setProjectIdea}
            onSaveTaskMapping={saveTaskMapping}
            onAddTask={addTask}
            onRemoveTask={removeTask}
            onUpdateTaskDescription={updateTaskDescription}
            onNext={() => goToStep(5)}
            onPrev={() => goToStep(3)}
          />
        );
      case 5:
        return (
          <TeachingMethods
            skillData={skillData}
            onToggleStrategy={toggleStrategy}
            onNext={() => goToStep(6)}
            onPrev={() => goToStep(4)}
          />
        );
      case 6:
        return (
          <MonitorProgress
            skillData={skillData}
            onToggleMonitoring={toggleMonitoring}
            onNext={() => goToStep(7)}
            onPrev={() => goToStep(5)}
          />
        );
      case 7:
        return (
          <Alignment
            skillData={skillData}
            onNext={() => goToStep(8)}
            onPrev={() => goToStep(6)}
          />
        );
      case 8:
        return (
          <Communication
            onViewSummary={() => setShowSummary(true)}
            onPrev={() => goToStep(7)}
          />
        );
      case 9:
        return (
          <Feedback
            onPrev={() => goToStep(8)}
          />
        );
      default:
        return null;
    }
  };

  const renderComingSoon = (tool: typeof tools[number]) => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
          <tool.icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{tool.label}</h2>
          <p className="text-muted-foreground mt-1">Coming Soon</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col">
      {/* Tool Tabs */}
      <div className="px-6 pt-6 pb-4 border-b border-border bg-background flex-shrink-0">
        <div className="flex gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={cn(
                "flex items-center gap-3 px-5 py-3 text-base font-semibold rounded-lg transition-all border-2",
                activeTool === tool.id
                  ? "bg-primary text-primary-foreground border-primary shadow-lg"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              )}
            >
              <tool.icon className="w-5 h-5" />
              <span>{tool.label}</span>
              {tool.comingSoon && (
                <span className="ml-1 text-xs bg-background/20 text-current px-2 py-0.5 rounded-full font-medium">
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tool Content */}
      {activeTool === 'wbl' ? (
        <div className="flex-1 flex flex-col">
          <WBLHeader />
          <ProgressOverview completedCount={getCompletedCount()} />
          <StepNavigation currentStep={currentStep} onStepChange={goToStep} />
          
          <main className="flex-1 px-6 py-6">
            <div>
              {renderStep()}
            </div>
          </main>

          <SummaryModal
            isOpen={showSummary}
            onClose={() => setShowSummary(false)}
            skillData={skillData}
            organizationData={organizationData}
            projectIdea={projectIdea}
          />
        </div>
      ) : (
        renderComingSoon(tools.find(t => t.id === activeTool)!)
      )}
    </div>
  );
}
