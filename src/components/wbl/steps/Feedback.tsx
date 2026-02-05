import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Download, Mail, Users, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeedbackProps {
  onPrev: () => void;
}

const FEEDBACK_CATEGORIES = [
  { id: 'skills', label: 'Skill Options', icon: '🎯', description: 'Suggestions for skills to add or modify', placeholder: 'Suggest new skills to add, modifications to existing skills, or skills that should be removed...' },
  { id: 'tools', label: 'Tool Suggestions', icon: '🛠️', description: 'Tools that should be added to each skill', placeholder: 'Suggest tools or resources that should be available for each skill...' },
  { id: 'tasks', label: 'Task/Experience Ideas', icon: '📋', description: 'Work experiences to include', placeholder: 'Suggest work experiences, projects, or tasks that organizations could assign to students...' },
  { id: 'teaching', label: 'Teaching Strategies', icon: '📚', description: 'Learning approaches to add', placeholder: 'Suggest teaching methods, instructional approaches, or learning strategies to add...' },
  { id: 'monitoring', label: 'Progress Monitoring', icon: '📊', description: 'Assessment methods to include', placeholder: 'Suggest ways to track, assess, or monitor student progress...' },
  { id: 'resources', label: 'Resource Suggestions', icon: '📁', description: 'Resources for the library', placeholder: 'Suggest documents, links, videos, or templates for the resource library...' },
  { id: 'ui', label: 'User Interface', icon: '💻', description: 'Usability and design feedback', placeholder: 'Share feedback about the design, usability, or user experience...' },
  { id: 'other', label: 'Other', icon: '💡', description: 'Any other suggestions', placeholder: 'Any other feedback, suggestions, or comments...' },
];

export function Feedback({ onPrev }: FeedbackProps) {
  const { toast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryFeedback, setCategoryFeedback] = useState<Record<string, string>>({});
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    organization: '',
    role: '',
  });

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const removeCategory = (categoryId: string) => {
    setSelectedCategories(prev => prev.filter(id => id !== categoryId));
    setCategoryFeedback(prev => {
      const updated = { ...prev };
      delete updated[categoryId];
      return updated;
    });
  };

  const handleFeedbackChange = (categoryId: string, value: string) => {
    setCategoryFeedback(prev => ({ ...prev, [categoryId]: value }));
  };

  const handleContactChange = (field: string, value: string) => {
    setContactInfo(prev => ({ ...prev, [field]: value }));
  };

  const generateFeedbackContent = () => {
    const lines = [
      'WBL Program Planner - Feedback Submission',
      '==========================================',
      '',
      'Submitted: ' + new Date().toLocaleString(),
      '',
      '--- Contact Information ---',
      'Name: ' + (contactInfo.name || 'Not provided'),
      'Email: ' + (contactInfo.email || 'Not provided'),
      'Organization: ' + (contactInfo.organization || 'Not provided'),
      'Role: ' + (contactInfo.role || 'Not provided'),
      '',
    ];

    selectedCategories.forEach(categoryId => {
      const category = FEEDBACK_CATEGORIES.find(c => c.id === categoryId);
      if (category && categoryFeedback[categoryId]) {
        lines.push(`--- ${category.label} ---`);
        lines.push(categoryFeedback[categoryId]);
        lines.push('');
      }
    });

    return lines.join('\n');
  };

  const handleDownloadPDF = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
            h1 { color: #1a1a2e; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            h2 { color: #4a4a6a; margin-top: 24px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; color: #333; }
            .value { margin-left: 8px; }
            pre { white-space: pre-wrap; background: #f5f5f5; padding: 12px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>WBL Program Planner - Feedback</h1>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          
          <h2>Contact Information</h2>
          <div class="section">
            <p><span class="label">Name:</span><span class="value">${contactInfo.name || 'Not provided'}</span></p>
            <p><span class="label">Email:</span><span class="value">${contactInfo.email || 'Not provided'}</span></p>
            <p><span class="label">Organization:</span><span class="value">${contactInfo.organization || 'Not provided'}</span></p>
            <p><span class="label">Role:</span><span class="value">${contactInfo.role || 'Not provided'}</span></p>
          </div>
          
          ${selectedCategories.map(categoryId => {
            const category = FEEDBACK_CATEGORIES.find(c => c.id === categoryId);
            const feedback = categoryFeedback[categoryId];
            if (category && feedback) {
              return `<h2>${category.icon} ${category.label}</h2><pre>${feedback}</pre>`;
            }
            return '';
          }).join('')}
        </body>
      </html>
    `;

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.createElement('div');
      element.innerHTML = html;
      
      await html2pdf()
        .set({
          margin: 10,
          filename: `wbl-feedback-${new Date().toISOString().split('T')[0]}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(element)
        .save();
      
      toast({
        title: "PDF Downloaded",
        description: "Your feedback has been saved as a PDF.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEmailFeedback = () => {
    const content = generateFeedbackContent();
    const subject = encodeURIComponent('WBL Program Planner Feedback');
    const body = encodeURIComponent(content);
    
    window.open(`mailto:support@explr.cc?subject=${subject}&body=${body}`, '_blank');
    
    toast({
      title: "Email Client Opened",
      description: "Your default email client should open with the feedback ready to send.",
    });
  };

  const selectedCategoryData = selectedCategories.map(id => 
    FEEDBACK_CATEGORIES.find(c => c.id === id)!
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Share Your Feedback</h2>
        <p className="text-muted-foreground">
          Help us improve the WBL Program Planner! Click on a category below to add your suggestions.
        </p>
      </div>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" />
            Your Information (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Your name"
              value={contactInfo.name}
              onChange={(e) => handleContactChange('name', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={contactInfo.email}
              onChange={(e) => handleContactChange('email', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="organization">Organization</Label>
            <Input
              id="organization"
              placeholder="School, company, or organization"
              value={contactInfo.organization}
              onChange={(e) => handleContactChange('organization', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              placeholder="Educator, Counselor, Employer, etc."
              value={contactInfo.role}
              onChange={(e) => handleContactChange('role', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Feedback Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            What would you like to give feedback on?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FEEDBACK_CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedCategories.includes(category.id)
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50 bg-card'
                }`}
              >
                <span className="text-xl mb-1 block">{category.icon}</span>
                <span className="font-medium text-sm text-foreground block">{category.label}</span>
                <span className="text-xs text-muted-foreground">{category.description}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Feedback Boxes */}
      {selectedCategoryData.length > 0 && (
        <div className="space-y-4">
          {selectedCategoryData.map(category => (
            <Card key={category.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span>{category.icon}</span>
                    {category.label}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => removeCategory(category.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={category.placeholder}
                  value={categoryFeedback[category.id] || ''}
                  onChange={(e) => handleFeedbackChange(category.id, e.target.value)}
                  className="min-h-[120px]"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {selectedCategories.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleDownloadPDF} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download as PDF
              </Button>
              <Button onClick={handleEmailFeedback} variant="outline" className="flex-1">
                <Mail className="w-4 h-4 mr-2" />
                Email to support@explr.cc
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-start pt-4">
        <Button variant="ghost" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    </div>
  );
}
