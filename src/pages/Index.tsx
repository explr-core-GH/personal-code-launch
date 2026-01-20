import { useState } from 'react';
import { Header } from '@/components/wbl/Header';
import { ProgressOverview } from '@/components/wbl/ProgressOverview';
import { StepNavigation } from '@/components/wbl/StepNavigation';
import { SummaryModal } from '@/components/wbl/SummaryModal';
import { SkillSelection } from '@/components/wbl/steps/SkillSelection';
import { ToolSelection } from '@/components/wbl/steps/ToolSelection';
import { TaskMapping } from '@/components/wbl/steps/TaskMapping';
import { TeachingMethods } from '@/components/wbl/steps/TeachingMethods';
import { MonitorProgress } from '@/components/wbl/steps/MonitorProgress';
import { Alignment } from '@/components/wbl/steps/Alignment';
import { Communication } from '@/components/wbl/steps/Communication';
import { useSkillData } from '@/hooks/useSkillData';

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showSummary, setShowSummary] = useState(false);
  
  const {
    skillData,
    toggleSkill,
    toggleTool,
    saveTaskMapping,
    toggleStrategy,
    toggleMonitoring,
    getCompletedCount
  } = useSkillData();

  const programTitle = 'WBL Program Planner';
  const organizationName = 'Developed by Explr_CSU';

  const goToStep = (step: number) => setCurrentStep(step);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SkillSelection
            skillData={skillData}
            onToggleSkill={toggleSkill}
            onNext={() => goToStep(2)}
          />
        );
      case 2:
        return (
          <ToolSelection
            skillData={skillData}
            onToggleTool={toggleTool}
            onNext={() => goToStep(3)}
            onPrev={() => goToStep(1)}
          />
        );
      case 3:
        return (
          <TaskMapping
            skillData={skillData}
            onSaveTaskMapping={saveTaskMapping}
            onNext={() => goToStep(4)}
            onPrev={() => goToStep(2)}
          />
        );
      case 4:
        return (
          <TeachingMethods
            skillData={skillData}
            onToggleStrategy={toggleStrategy}
            onNext={() => goToStep(5)}
            onPrev={() => goToStep(3)}
          />
        );
      case 5:
        return (
          <MonitorProgress
            skillData={skillData}
            onToggleMonitoring={toggleMonitoring}
            onNext={() => goToStep(6)}
            onPrev={() => goToStep(4)}
          />
        );
      case 6:
        return (
          <Alignment
            skillData={skillData}
            onNext={() => goToStep(7)}
            onPrev={() => goToStep(5)}
          />
        );
      case 7:
        return (
          <Communication
            onViewSummary={() => setShowSummary(true)}
            onPrev={() => goToStep(6)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <Header programTitle={programTitle} organizationName={organizationName} />
      
      <ProgressOverview 
        completedCount={getCompletedCount()} 
        onViewSummary={() => setShowSummary(true)} 
      />
      
      <StepNavigation 
        currentStep={currentStep} 
        onStepChange={goToStep} 
      />
      
      <main className="flex-1 overflow-auto px-6 py-6 w-full">
        <div className="max-w-6xl mx-auto w-full">
          {renderStep()}
        </div>
      </main>

      <SummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        skillData={skillData}
        organizationName={organizationName}
      />
    </div>
  );
};

export default Index;
