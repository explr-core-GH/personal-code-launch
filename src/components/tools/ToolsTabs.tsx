import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const comingSoonTools = [
  { id: 'pathways', label: 'Pathways Explorer', icon: GraduationCap },
  { id: 'mentorship', label: 'Mentorship', icon: Users },
  { id: 'analytics', label: 'Program Analytics', icon: BarChart3 },
];

export function ToolsTabs() {
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

  return (
    <Tabs defaultValue="wbl" className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 pt-4 border-b border-border bg-background flex-shrink-0">
        <TabsList className="h-auto p-1 bg-muted/50 rounded-lg">
          <TabsTrigger 
            value="wbl" 
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Wrench className="w-4 h-4" />
            <span>WBL Planner</span>
          </TabsTrigger>
          {comingSoonTools.map((tool) => (
            <TabsTrigger
              key={tool.id}
              value={tool.id}
              className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <tool.icon className="w-4 h-4" />
              <span>{tool.label}</span>
              <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                Soon
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="wbl" className="flex-1 flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden">
        <div className="flex-shrink-0">
          <WBLHeader />
          <ProgressOverview completedCount={getCompletedCount()} />
          <StepNavigation currentStep={currentStep} onStepChange={goToStep} />
        </div>
        
        <div className="flex-1 overflow-auto px-6 py-6">
          <div className="max-w-6xl mx-auto">
            {renderStep()}
          </div>
        </div>

        <SummaryModal
          isOpen={showSummary}
          onClose={() => setShowSummary(false)}
          skillData={skillData}
          organizationData={organizationData}
          projectIdea={projectIdea}
        />
      </TabsContent>

      {comingSoonTools.map((tool) => (
        <TabsContent 
          key={tool.id} 
          value={tool.id} 
          className="flex-1 flex items-center justify-center mt-0"
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <tool.icon className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{tool.label}</h2>
              <p className="text-muted-foreground mt-1">Coming Soon</p>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
