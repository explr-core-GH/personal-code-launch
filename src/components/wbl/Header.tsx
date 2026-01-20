import pathwaysLogo from '@/assets/pathways-explr-logo.png';

interface HeaderProps {
  programTitle: string;
  organizationName: string;
}

export function Header({ programTitle, organizationName }: HeaderProps) {
  return (
    <header className="px-6 py-5 shadow-lg flex-shrink-0 bg-primary">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-foreground font-garet mb-1" style={{ fontWeight: 700 }}>
            {programTitle}
          </h1>
          <p className="text-primary-foreground/90 text-sm">
            {organizationName}
          </p>
        </div>
        <img 
          src={pathwaysLogo} 
          alt="Pathways Explr CSU" 
          className="h-14 w-auto"
        />
      </div>
    </header>
  );
}
