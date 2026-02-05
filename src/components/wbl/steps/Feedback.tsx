import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Download, Mail, MessageSquare, Lightbulb, BookOpen, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeedbackProps {
  onPrev: () => void;
}

const FEEDBACK_CATEGORIES = [
  { id: 'skills', label: 'Skill Options', icon: '🎯', description: 'Suggestions for skills to add or modify' },
  { id: 'tools', label: 'Tool Suggestions', icon: '🛠️', description: 'Tools that should be added to each skill' },
  { id: 'tasks', label: 'Task/Experience Ideas', icon: '📋', description: 'Work experiences to include' },
  { id: 'teaching', label: 'Teaching Strategies', icon: '📚', description: 'Learning approaches to add' },
  { id: 'monitoring', label: 'Progress Monitoring', icon: '📊', description: 'Assessment methods to include' },
  { id: 'resources', label: 'Resource Suggestions', icon: '📁', description: 'Resources for the library' },
  { id: 'ui', label: 'User Interface', icon: '💻', description: 'Usability and design feedback' },
  { id: 'other', label: 'Other', icon: '💡', description: 'Any other suggestions' },
];

export function Feedback({ onPrev }: FeedbackProps) {
  const { toast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [feedbackData, setFeedbackData] = useState({
    name: '',
    email: '',
    organization: '',
    role: '',
    skillSuggestions: '',
    toolSuggestions: '',
    resourceSuggestions: '',
    generalComments: '',
  });

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleInputChange = (field: string, value: string) => {
    setFeedbackData(prev => ({ ...prev, [field]: value }));
  };

  const generateFeedbackContent = () => {
    const lines = [
      'WBL Program Planner - Feedback Submission',
      '==========================================',
      '',
      'Submitted: ' + new Date().toLocaleString(),
      '',
      '--- Contact Information ---',
      'Name: ' + (feedbackData.name || 'Not provided'),
      'Email: ' + (feedbackData.email || 'Not provided'),
      'Organization: ' + (feedbackData.organization || 'Not provided'),
      'Role: ' + (feedbackData.role || 'Not provided'),
      '',
      '--- Feedback Categories ---',
      selectedCategories.length > 0 
        ? selectedCategories.map(id => FEEDBACK_CATEGORIES.find(c => c.id === id)?.label).join(', ')
        : 'None selected',
      '',
    ];

    if (feedbackData.skillSuggestions) {
      lines.push('--- Skill & Tool Suggestions ---');
      lines.push(feedbackData.skillSuggestions);
      lines.push('');
    }

    if (feedbackData.toolSuggestions) {
      lines.push('--- Task & Teaching Suggestions ---');
      lines.push(feedbackData.toolSuggestions);
      lines.push('');
    }

    if (feedbackData.resourceSuggestions) {
      lines.push('--- Resource Suggestions ---');
      lines.push(feedbackData.resourceSuggestions);
      lines.push('');
    }

    if (feedbackData.generalComments) {
      lines.push('--- General Comments ---');
      lines.push(feedbackData.generalComments);
      lines.push('');
    }

    return lines.join('\n');
  };

  const handleDownloadPDF = async () => {
    const content = generateFeedbackContent();
    
    // Create a simple HTML structure for pdf generation
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
            <p><span class="label">Name:</span><span class="value">${feedbackData.name || 'Not provided'}</span></p>
            <p><span class="label">Email:</span><span class="value">${feedbackData.email || 'Not provided'}</span></p>
            <p><span class="label">Organization:</span><span class="value">${feedbackData.organization || 'Not provided'}</span></p>
            <p><span class="label">Role:</span><span class="value">${feedbackData.role || 'Not provided'}</span></p>
          </div>
          
          <h2>Feedback Categories</h2>
          <p>${selectedCategories.length > 0 
            ? selectedCategories.map(id => FEEDBACK_CATEGORIES.find(c => c.id === id)?.label).join(', ')
            : 'None selected'}</p>
          
          ${feedbackData.skillSuggestions ? `<h2>Skill & Tool Suggestions</h2><pre>${feedbackData.skillSuggestions}</pre>` : ''}
          ${feedbackData.toolSuggestions ? `<h2>Task & Teaching Suggestions</h2><pre>${feedbackData.toolSuggestions}</pre>` : ''}
          ${feedbackData.resourceSuggestions ? `<h2>Resource Suggestions</h2><pre>${feedbackData.resourceSuggestions}</pre>` : ''}
          ${feedbackData.generalComments ? `<h2>General Comments</h2><pre>${feedbackData.generalComments}</pre>` : ''}
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Share Your Feedback</h2>
        <p className="text-muted-foreground">
          Help us improve the WBL Program Planner! Share suggestions for new skills, tools, resources, 
          or any improvements you'd like to see.
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
              value={feedbackData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={feedbackData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="organization">Organization</Label>
            <Input
              id="organization"
              placeholder="School, company, or organization"
              value={feedbackData.organization}
              onChange={(e) => handleInputChange('organization', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              placeholder="Educator, Counselor, Employer, etc."
              value={feedbackData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Feedback Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5" />
            What would you like to give feedback on?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FEEDBACK_CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
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

      {/* Suggestion Boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skill & Tool Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Suggest new skills to add, tools for existing skills, or modifications to current options..."
              value={feedbackData.skillSuggestions}
              onChange={(e) => handleInputChange('skillSuggestions', e.target.value)}
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Task & Teaching Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Suggest work experiences, teaching strategies, or assessment methods to add..."
              value={feedbackData.toolSuggestions}
              onChange={(e) => handleInputChange('toolSuggestions', e.target.value)}
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-4 h-4" />
            Resource Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Suggest documents, links, videos, or templates that should be added to the resource library..."
            value={feedbackData.resourceSuggestions}
            onChange={(e) => handleInputChange('resourceSuggestions', e.target.value)}
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="w-4 h-4" />
            General Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any other feedback, suggestions, or comments about the WBL Program Planner..."
            value={feedbackData.generalComments}
            onChange={(e) => handleInputChange('generalComments', e.target.value)}
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
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

      <div className="flex justify-start pt-4">
        <Button variant="ghost" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    </div>
  );
}
