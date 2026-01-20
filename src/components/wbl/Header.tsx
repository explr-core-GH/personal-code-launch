import pathwaysLogo from '@/assets/pathways-explr-logo.png';
import wblLogo from '@/assets/wbl-program-planner-logo.png';

export function Header() {
  return (
    <header className="px-6 py-5 shadow-lg flex-shrink-0 bg-primary">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <img 
          src={wblLogo} 
          alt="WBL Program Planner" 
          className="h-16 w-auto"
        />
        <img 
          src={pathwaysLogo} 
          alt="Pathways Explr CSU" 
          className="h-20 w-auto"
        />
      </div>
    </header>
  );
}
