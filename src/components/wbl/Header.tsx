import { ClipboardCheck } from 'lucide-react';

interface HeaderProps {
  programTitle: string;
  organizationName: string;
}

export function Header({ programTitle, organizationName }: HeaderProps) {
  return (
    <header className="px-6 py-5 shadow-lg flex-shrink-0 bg-primary">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <ClipboardCheck className="w-8 h-8 text-primary-foreground" />
          <h1 className="text-2xl font-bold text-primary-foreground font-display">
            {programTitle}
          </h1>
        </div>
        <p className="text-primary-foreground/90 text-sm ml-11">
          {organizationName}
        </p>
      </div>
    </header>
  );
}
