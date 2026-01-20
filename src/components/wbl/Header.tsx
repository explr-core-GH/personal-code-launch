import pathwaysLogo from '@/assets/pathways-explr-logo.png';

interface HeaderProps {
  programTitle: string;
  organizationName: string;
}

export function Header({ programTitle, organizationName }: HeaderProps) {
  return (
    <header className="px-6 py-5 shadow-lg flex-shrink-0 bg-primary">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-1">
          <img 
            src={pathwaysLogo} 
            alt="Pathways Explr CSU" 
            className="h-10 w-auto"
          />
          <h1 className="text-2xl font-bold text-primary-foreground font-display">
            {programTitle}
          </h1>
        </div>
        <p className="text-primary-foreground/90 text-sm ml-14">
          {organizationName}
        </p>
      </div>
    </header>
  );
}
