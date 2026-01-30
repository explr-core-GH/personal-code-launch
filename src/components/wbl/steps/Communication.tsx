import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STEPS, COMMUNICATION_ITEMS } from '@/data/wblData';
import { ChevronLeft, Info, Zap, Save, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

interface CommunicationProps {
  onViewSummary: () => void;
  onPrev: () => void;
}

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export function Communication({ onViewSummary, onPrev }: CommunicationProps) {
  const step = STEPS[7];
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') fieldErrors.email = err.message;
          if (err.path[0] === 'password') fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account exists',
              description: 'This email is already registered. Please sign in instead.',
              variant: 'destructive',
            });
            setIsSignUp(false);
          } else {
            toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
          }
        } else {
          toast({ title: 'Account created!', description: 'You can now save your plan and access resources.' });
          setShowAuthModal(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Welcome back!', description: 'You can now access your resources.' });
          setShowAuthModal(false);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResourcesClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      navigate('/resources');
    }
  };

  return (
    <div className="fade-in w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2 font-display">
          💼 {step.title}
        </h2>
        <p className="text-muted-foreground">{step.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COMMUNICATION_ITEMS.map(item => (
          <div key={item.title} className="bg-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{item.icon}</span>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
            </div>
            <p className="text-muted-foreground text-sm">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-accent/20 border border-accent/40 rounded-xl p-5 mt-6">
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-accent mt-0.5" />
          <div>
            <h4 className="font-semibold text-accent mb-1">Pro Tip</h4>
            <p className="text-accent/90 text-sm">
              Create an orientation packet or handbook that covers all these areas. This gives students a reference they can return to throughout their internship.
            </p>
          </div>
        </div>
      </div>

      {/* Sign up / Resources prompt */}
      <div className="bg-card rounded-xl p-5 mt-6">
        {user ? (
          <>
            <h4 className="font-semibold text-foreground mb-3">📚 Explore Resources</h4>
            <p className="text-muted-foreground text-sm mb-4">
              Access curated resources for educators, counselors, organizations, and industry partners.
            </p>
            <Button variant="outline" onClick={handleResourcesClick}>
              <BookOpen className="w-4 h-4 mr-2" />
              View Resources
            </Button>
          </>
        ) : (
          <>
            <h4 className="font-semibold text-foreground mb-3">Want to save your plan?</h4>
            <p className="text-muted-foreground text-sm mb-4">
              Create a free account to save your plan, access resources, and edit it anytime.
            </p>
            <Button variant="outline" onClick={() => setShowAuthModal(true)}>
              <Save className="w-4 h-4 mr-2" />
              Sign Up to Save
            </Button>
          </>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="secondary" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onViewSummary} className="bg-accent hover:bg-emerald-hover text-accent-foreground">
          <Zap className="w-5 h-5 mr-2" />
          View Summary
        </Button>
      </div>

      {/* Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isSignUp ? 'Create an Account' : 'Welcome Back'}</DialogTitle>
            <DialogDescription>
              {isSignUp 
                ? 'Sign up to save your WBL plan and access resources.' 
                : 'Sign in to access your saved plans and resources.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAuth} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="modal-email">Email</Label>
              <Input
                id="modal-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-password">Password</Label>
              <Input
                id="modal-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>
          <div className="text-center text-sm mt-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
