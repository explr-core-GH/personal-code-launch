import { X, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SKILLS, SkillData, TaskItem } from '@/data/wblData';
import { OrganizationData } from '@/hooks/useOrganizationData';
interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillData: Map<string, SkillData>;
  organizationData: OrganizationData;
  projectIdea?: string;
}

export function SummaryModal({ isOpen, onClose, skillData, organizationData, projectIdea }: SummaryModalProps) {
  const selectedSkills = SKILLS.filter(s => skillData.get(s.id)?.completed);

  const getTasks = (data: SkillData | undefined): TaskItem[] => {
    if (data?.tasks && data.tasks.length > 0) {
      return data.tasks.filter(t => t.description.trim());
    }
    // Fallback for legacy single task_mapping
    if (data?.task_mapping) {
      return [{ id: 'legacy', description: data.task_mapping }];
    }
    return [];
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const pdfHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>WBL Program Summary - ${organizationData.organizationName}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'DM Sans', Arial, sans-serif; color: #1e293b; padding: 20px; margin: 0; }
          .header { text-align: center; padding: 30px 0; border-bottom: 2px solid #bcef28; margin-bottom: 30px; }
          .header h1 { margin: 0 0 10px 0; font-size: 32px; color: #65a30d; }
          .header .org-name { margin: 0; color: #334155; font-size: 18px; font-weight: 600; }
          .header .date { margin: 10px 0 0 0; color: #64748b; font-size: 12px; }
          .section { margin-bottom: 30px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
          .section h2 { margin: 0 0 15px 0; font-size: 18px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .grid p { margin: 0; }
          .grid .full-width { grid-column: span 2; }
          .project-idea { background: #f0fdf4; border: 1px solid #bbf7d0; }
          .project-idea h2 { color: #166534; }
          .project-idea p { color: #15803d; line-height: 1.6; }
          .skill-card { margin-bottom: 25px; page-break-inside: avoid; }
          .skill-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
          .skill-header .icon { font-size: 28px; }
          .skill-header h3 { margin: 0; font-size: 20px; font-weight: 600; color: #1e293b; }
          .skill-content { background: #f1f5f9; border-left: 4px solid #bcef28; padding: 15px; border-radius: 4px; }
          .skill-content p { margin: 0 0 10px 0; }
          .skill-content p:last-child { margin-bottom: 0; }
          .label { color: #334155; font-weight: 600; }
          .value { color: #475569; }
          ul { margin: 5px 0 0 20px; padding: 0; color: #475569; }
          li { margin-bottom: 5px; }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .section, .skill-content { background: #f8fafc !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>WBL Program Summary</h1>
          <p class="org-name">${organizationData.organizationName}</p>
          <p class="date">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="section">
          <h2>Organization Information</h2>
          <div class="grid">
            <p><span class="label">Contact:</span> <span class="value">${organizationData.firstName} ${organizationData.lastName}</span></p>
            <p><span class="label">Email:</span> <span class="value">${organizationData.contactEmail}</span></p>
            ${organizationData.contactNumber ? `<p><span class="label">Phone:</span> <span class="value">${organizationData.contactNumber}</span></p>` : ''}
            ${organizationData.organizationWebsite ? `<p><span class="label">Website:</span> <span class="value">${organizationData.organizationWebsite}</span></p>` : ''}
            ${organizationData.internshipAddress ? `<p class="full-width"><span class="label">Address:</span> <span class="value">${organizationData.internshipAddress}</span></p>` : ''}
            ${organizationData.numberOfInterns ? `<p><span class="label">Number of Interns:</span> <span class="value">${organizationData.numberOfInterns}</span></p>` : ''}
          </div>
          ${organizationData.interestReason ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
              <p><span class="label">Why hosting WBL:</span></p>
              <p class="value" style="font-style: italic;">${organizationData.interestReason}</p>
            </div>
          ` : ''}
        </div>

        ${projectIdea ? `
        <div class="section project-idea">
          <h2>💡 Project Idea</h2>
          <p>${projectIdea}</p>
        </div>
        ` : ''}

        <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #1e293b;">Skills & Program Plan</h2>
        ${selectedSkills.map((skill, index) => {
          const data = skillData.get(skill.id);
          const tasks = getTasks(data);
          return `
            <div class="skill-card">
              <div class="skill-header">
                <span class="icon">${skill.icon}</span>
                <h3>${index + 1}. ${skill.name}</h3>
              </div>
              <div class="skill-content">
                ${data?.selected_tools ? `<p><span class="label">Tools:</span> <span class="value">${data.selected_tools.split(',').join(', ')}</span></p>` : ''}
                ${tasks.length === 1 ? `<p><span class="label">Task:</span> <span class="value">${tasks[0].description}</span></p>` : ''}
                ${tasks.length > 1 ? `
                  <div>
                    <span class="label">Tasks:</span>
                    <ul>
                      ${tasks.map(t => `<li>${t.description}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
                ${data?.teaching_strategy ? `<p><span class="label">Teaching Strategies:</span> <span class="value">${data.teaching_strategy.split(',').join(', ')}</span></p>` : ''}
                ${data?.monitoring_approach ? `<p><span class="label">Monitoring Approaches:</span> <span class="value">${data.monitoring_approach.split(',').join(', ')}</span></p>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </body>
      </html>
    `;

    printWindow.document.write(pdfHTML);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90%] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground font-display">Program Summary</h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handlePrint}
              title="Print / Save as PDF"
            >
              <Printer className="w-5 h-5 text-accent" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          <div className="text-center pb-5 border-b border-border mb-6">
            <h3 className="text-2xl font-bold text-primary mb-2">WBL Program Summary</h3>
            <p className="text-foreground font-medium">{organizationData.organizationName}</p>
            <p className="text-muted-foreground/70 text-sm mt-1">
              Generated on {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Organization Info Section */}
          <div className="bg-surface-dark rounded-lg p-5 mb-6 border border-border">
            <h4 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
              Organization Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <p>
                <span className="text-muted-foreground font-semibold">Contact:</span>{' '}
                <span className="text-foreground/80">{organizationData.firstName} {organizationData.lastName}</span>
              </p>
              <p>
                <span className="text-muted-foreground font-semibold">Email:</span>{' '}
                <span className="text-foreground/80">{organizationData.contactEmail}</span>
              </p>
              {organizationData.contactNumber && (
                <p>
                  <span className="text-muted-foreground font-semibold">Phone:</span>{' '}
                  <span className="text-foreground/80">{organizationData.contactNumber}</span>
                </p>
              )}
              {organizationData.organizationWebsite && (
                <p>
                  <span className="text-muted-foreground font-semibold">Website:</span>{' '}
                  <span className="text-foreground/80">{organizationData.organizationWebsite}</span>
                </p>
              )}
              {organizationData.internshipAddress && (
                <p className="md:col-span-2">
                  <span className="text-muted-foreground font-semibold">Address:</span>{' '}
                  <span className="text-foreground/80">{organizationData.internshipAddress}</span>
                </p>
              )}
              {organizationData.numberOfInterns && (
                <p>
                  <span className="text-muted-foreground font-semibold">Number of Interns:</span>{' '}
                  <span className="text-foreground/80">{organizationData.numberOfInterns}</span>
                </p>
              )}
            </div>
            {organizationData.interestReason && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-muted-foreground font-semibold text-sm mb-1">Why hosting WBL:</p>
                <p className="text-foreground/80 text-sm italic">{organizationData.interestReason}</p>
              </div>
            )}
          </div>

          {/* Project Idea Section */}
          {projectIdea && (
            <div className="bg-accent/10 rounded-lg p-5 mb-6 border border-accent/30">
              <h4 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                💡 Project Idea
              </h4>
              <p className="text-foreground/80 text-sm">{projectIdea}</p>
            </div>
          )}

          {/* Skills Section */}
          <h4 className="text-lg font-semibold text-foreground mb-4">Skills & Program Plan</h4>
          {selectedSkills.map(skill => {
            const data = skillData.get(skill.id);
            return (
              <div key={skill.id} className="bg-surface-dark rounded-lg p-5 mb-5 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{skill.icon}</span>
                  <h4 className="text-lg font-semibold text-foreground">{skill.name}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  {data?.selected_tools && (
                    <p>
                      <span className="text-muted-foreground font-semibold">Tools:</span>{' '}
                      <span className="text-foreground/80">{data.selected_tools.split(',').join(', ')}</span>
                    </p>
                  )}
                  {(() => {
                    const tasks = getTasks(data);
                    if (tasks.length === 0) return null;
                    if (tasks.length === 1) {
                      return (
                        <p>
                          <span className="text-muted-foreground font-semibold">Task:</span>{' '}
                          <span className="text-foreground/80">{tasks[0].description}</span>
                        </p>
                      );
                    }
                    return (
                      <div>
                        <span className="text-muted-foreground font-semibold">Tasks:</span>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {tasks.map((t, i) => (
                            <li key={t.id} className="text-foreground/80">{t.description}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                  {data?.teaching_strategy && (
                    <p>
                      <span className="text-muted-foreground font-semibold">Teaching:</span>{' '}
                      <span className="text-foreground/80">{data.teaching_strategy.split(',').join(', ')}</span>
                    </p>
                  )}
                  {data?.monitoring_approach && (
                    <p>
                      <span className="text-muted-foreground font-semibold">Monitoring:</span>{' '}
                      <span className="text-foreground/80">{data.monitoring_approach.split(',').join(', ')}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
