import pathwaysLogo from '@/assets/pathways-explr-logo.png';
import wblLogo from '@/assets/wbl-program-planner-logo.png';

export function Header() {
  return (
    <header className="px-6 py-4 flex-shrink-0 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight text-foreground">
            EXPLR<span className="text-primary">_</span><span className="text-primary">WBL</span>
          </span>
        </div>
        <img 
          src={pathwaysLogo} 
          alt="Pathways Explr CSU" 
          className="h-10 w-auto opacity-90"
        />
      </div>
    </header>
  );
}
