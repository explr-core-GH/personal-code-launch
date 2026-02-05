import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Send, Users, X, Loader2, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  const handleDownloadPDF = () => {
    const hasFeedback = selectedCategories.some(id => categoryFeedback[id]?.trim());
    if (!hasFeedback) {
      toast({
        title: "No Feedback Entered",
        description: "Please enter feedback in at least one category to download.",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const feedbackHTML = selectedCategories
      .filter(id => categoryFeedback[id]?.trim())
      .map(id => {
        const category = FEEDBACK_CATEGORIES.find(c => c.id === id);
        return `
          <div style="margin-bottom: 20px; page-break-inside: avoid;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1e293b;">
              ${category?.icon} ${category?.label}
            </h3>
            <p style="margin: 0; padding: 12px; background: #f1f5f9; border-radius: 6px; color: #475569; white-space: pre-wrap;">
              ${categoryFeedback[id]}
            </p>
          </div>
        `;
      }).join('');

    const pdfHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>WBL Program Planner Feedback</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'DM Sans', Arial, sans-serif; color: #1e293b; padding: 30px; margin: 0; }
          .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #bcef28; margin-bottom: 30px; }
          .header h1 { margin: 0 0 5px 0; font-size: 24px; color: #65a30d; }
          .header .date { margin: 0; color: #64748b; font-size: 12px; }
          .contact-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
          .contact-section h2 { margin: 0 0 12px 0; font-size: 14px; color: #334155; }
          .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; }
          .contact-grid p { margin: 0; }
          .label { color: #64748b; }
          .value { color: #1e293b; }
          .feedback-section h2 { margin: 0 0 16px 0; font-size: 16px; color: #1e293b; }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>WBL Program Planner Feedback</h1>
          <p class="date">Submitted on ${new Date().toLocaleDateString()}</p>
        </div>
        
        ${(contactInfo.name || contactInfo.email || contactInfo.organization || contactInfo.role) ? `
        <div class="contact-section">
          <h2>Contact Information</h2>
          <div class="contact-grid">
            ${contactInfo.name ? `<p><span class="label">Name:</span> <span class="value">${contactInfo.name}</span></p>` : ''}
            ${contactInfo.email ? `<p><span class="label">Email:</span> <span class="value">${contactInfo.email}</span></p>` : ''}
            ${contactInfo.organization ? `<p><span class="label">Organization:</span> <span class="value">${contactInfo.organization}</span></p>` : ''}
            ${contactInfo.role ? `<p><span class="label">Role:</span> <span class="value">${contactInfo.role}</span></p>` : ''}
          </div>
        </div>
        ` : ''}

        <div class="feedback-section">
          <h2>Feedback</h2>
          ${feedbackHTML}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(pdfHTML);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleSubmitFeedback = async () => {
    // Check if any feedback has been entered
    const hasFeedback = selectedCategories.some(id => categoryFeedback[id]?.trim());
    if (!hasFeedback) {
      toast({
        title: "No Feedback Entered",
        description: "Please enter feedback in at least one category.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Build feedback data object
      const feedbackData: Record<string, string> = {};
      selectedCategories.forEach(categoryId => {
        const category = FEEDBACK_CATEGORIES.find(c => c.id === categoryId);
        if (category && categoryFeedback[categoryId]?.trim()) {
          feedbackData[category.label] = categoryFeedback[categoryId];
        }
      });

      const { error } = await supabase
        .from('feedback_submissions')
        .insert({
          name: contactInfo.name || null,
          email: contactInfo.email || null,
          organization: contactInfo.organization || null,
          role: contactInfo.role || null,
          feedback_data: feedbackData,
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Feedback Submitted!",
        description: "Thank you for helping us improve the WBL Program Planner.",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Submission Failed",
        description: "Could not submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategoryData = selectedCategories.map(id => 
    FEEDBACK_CATEGORIES.find(c => c.id === id)!
  );

  // Success state
  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-4">
              Your feedback has been submitted successfully. We appreciate you taking the time to help us improve the WBL Program Planner.
            </p>
            <Button variant="outline" onClick={onPrev}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Previous Step
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      {/* Submit Buttons */}
      {selectedCategories.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6 space-y-3">
            <Button 
              onClick={handleSubmitFeedback} 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
            <Button 
              onClick={handleDownloadPDF} 
              variant="outline"
              className="w-full"
              disabled={isSubmitting}
            >
              <Printer className="w-4 h-4 mr-2" />
              Download as PDF
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Your feedback will be sent directly to our team
            </p>
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
