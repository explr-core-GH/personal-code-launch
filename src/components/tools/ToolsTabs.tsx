import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wrench, GraduationCap, Users, BarChart3 } from 'lucide-react';

interface ToolsTabsProps {
  children: React.ReactNode;
}

const comingSoonTools = [
  { id: 'pathways', label: 'Pathways Explorer', icon: GraduationCap },
  { id: 'mentorship', label: 'Mentorship Tracker', icon: Users },
  { id: 'analytics', label: 'Program Analytics', icon: BarChart3 },
];

export function ToolsTabs({ children }: ToolsTabsProps) {
  return (
    <Tabs defaultValue="wbl" className="w-full h-full flex flex-col">
      <div className="px-6 pt-4 border-b border-border bg-background">
        <TabsList className="h-auto p-1 bg-muted/50 rounded-lg">
          <TabsTrigger 
            value="wbl" 
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Wrench className="w-4 h-4" />
            <span>WBL Planner</span>
          </TabsTrigger>
          {comingSoonTools.map((tool) => (
            <TabsTrigger
              key={tool.id}
              value={tool.id}
              className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <tool.icon className="w-4 h-4" />
              <span>{tool.label}</span>
              <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                Soon
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="wbl" className="flex-1 flex flex-col m-0 overflow-hidden">
        {children}
      </TabsContent>

      {comingSoonTools.map((tool) => (
        <TabsContent 
          key={tool.id} 
          value={tool.id} 
          className="flex-1 flex items-center justify-center m-0"
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <tool.icon className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{tool.label}</h2>
              <p className="text-muted-foreground mt-1">Coming Soon</p>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
