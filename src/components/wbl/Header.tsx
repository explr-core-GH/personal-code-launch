import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogIn, LogOut, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinkClass = (path: string) =>
    cn(
      'text-sm font-medium transition-colors hover:text-primary',
      location.pathname === path ? 'text-primary' : 'text-muted-foreground'
    );

  return (
    <header className="px-6 py-4 flex-shrink-0 bg-background border-b border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-foreground">
              EXPLR<span className="text-primary">_</span><span className="text-primary">TOOLS</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-5">
            <Link to="/" className={navLinkClass('/')}>WBL Planner</Link>
            <Link to="/program-profiles" className={navLinkClass('/program-profiles')}>
              Program Profiles
            </Link>
            <Link to="/program-riasec" className={navLinkClass('/program-riasec')}>
              Program RIASEC
            </Link>
            <Link
              to="/poster-builder"
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                location.pathname.startsWith('/poster-builder')
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              Poster Builder
            </Link>
            <Link to="/pathway-analyzer" className={navLinkClass('/pathway-analyzer')}>
              Pathway Analyzer
            </Link>
            <Link to="/resources" className={navLinkClass('/resources')}>Resources</Link>
          </nav>
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{user.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Sign Out</span>
            </Button>
          </div>
        ) : (
          <Button variant="default" size="sm" onClick={() => navigate('/auth')}>
            <LogIn className="w-4 h-4" />
            <span className="ml-2">Sign In</span>
          </Button>
        )}
      </div>
    </header>
  );
}
