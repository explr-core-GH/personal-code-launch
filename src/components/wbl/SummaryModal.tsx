import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SKILLS, SkillData } from '@/data/wblData';
import html2pdf from 'html2pdf.js';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillData: Map<string, SkillData>;
  organizationName: string;
}

export function SummaryModal({ isOpen, onClose, skillData, organizationName }: SummaryModalProps) {
  const selectedSkills = SKILLS.filter(s => skillData.get(s.id)?.completed);

  const handleDownloadPDF = () => {
    const pdfHTML = `
      <div style="font-family: 'DM Sans', Arial, sans-serif; color: #1e293b; padding: 20px;">
        <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #bcef28; margin-bottom: 30px;">
          <h1 style="margin: 0 0 10px 0; font-size: 32px; color: #bcef28;">WBL Program Summary</h1>
          <p style="margin: 0; color: #334155; font-size: 18px; font-weight: 600;">${organizationName}</p>
          <p style="margin: 10px 0 0 0; color: #64748b; font-size: 12px;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        ${selectedSkills.map((skill, index) => {
          const data = skillData.get(skill.id);
          return `
            <div style="margin-bottom: 25px; page-break-inside: avoid;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                <span style="font-size: 28px;">${skill.icon}</span>
                <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1e293b;">${index + 1}. ${skill.name}</h2>
              </div>
              <div style="background: #f1f5f9; border-left: 4px solid #bcef28; padding: 15px; border-radius: 4px;">
                ${data?.selected_tools ? `<p style="margin: 0 0 10px 0;"><strong style="color: #334155;">Tools:</strong> <span style="color: #475569;">${data.selected_tools.split(',').join(', ')}</span></p>` : ''}
                ${data?.task_mapping ? `<p style="margin: 0 0 10px 0;"><strong style="color: #334155;">Task Mapping:</strong> <span style="color: #475569;">${data.task_mapping}</span></p>` : ''}
                ${data?.teaching_strategy ? `<p style="margin: 0 0 10px 0;"><strong style="color: #334155;">Teaching Strategies:</strong> <span style="color: #475569;">${data.teaching_strategy.split(',').join(', ')}</span></p>` : ''}
                ${data?.monitoring_approach ? `<p style="margin: 0;"><strong style="color: #334155;">Monitoring Approaches:</strong> <span style="color: #475569;">${data.monitoring_approach.split(',').join(', ')}</span></p>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = pdfHTML;

    const opt = {
      margin: 10,
      filename: `WBL-Program-Summary-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' as const }
    };

    html2pdf().set(opt).from(element).save();
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
              onClick={handleDownloadPDF}
              title="Download as PDF"
            >
              <Download className="w-5 h-5 text-accent" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          <div className="text-center pb-5 border-b border-border mb-8">
            <h3 className="text-2xl font-bold text-primary mb-2">WBL Program Summary</h3>
            <p className="text-muted-foreground">{organizationName}</p>
            <p className="text-muted-foreground/70 text-sm mt-1">
              Generated on {new Date().toLocaleDateString()}
            </p>
          </div>

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
                  {data?.task_mapping && (
                    <p>
                      <span className="text-muted-foreground font-semibold">Task:</span>{' '}
                      <span className="text-foreground/80">{data.task_mapping}</span>
                    </p>
                  )}
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
