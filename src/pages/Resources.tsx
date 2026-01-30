import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  RESOURCES, 
  RESOURCE_TYPES, 
  AUDIENCE_TYPES, 
  ResourceType, 
  AudienceType 
} from '@/data/resourcesData';
import { ArrowLeft, ExternalLink, Download, Play, FileText, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Resources() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [selectedTypes, setSelectedTypes] = useState<ResourceType[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<AudienceType[]>([]);

  // Redirect to home if not logged in
  if (!loading && !user) {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const toggleType = (type: ResourceType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  const toggleAudience = (audience: AudienceType) => {
    setSelectedAudiences(prev => 
      prev.includes(audience) 
        ? prev.filter(a => a !== audience) 
        : [...prev, audience]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedAudiences([]);
  };

  const filteredResources = RESOURCES.filter(resource => {
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(resource.type);
    const audienceMatch = selectedAudiences.length === 0 || 
      resource.audiences.some(a => selectedAudiences.includes(a));
    return typeMatch && audienceMatch;
  });

  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case 'document': return <Download className="w-4 h-4" />;
      case 'link': return <ExternalLink className="w-4 h-4" />;
      case 'video': return <Play className="w-4 h-4" />;
      case 'template': return <FileText className="w-4 h-4" />;
    }
  };

  const hasActiveFilters = selectedTypes.length > 0 || selectedAudiences.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 py-4 bg-background border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Planner
            </Button>
            <span className="text-xl font-bold tracking-tight text-foreground">
              EXPLR<span className="text-primary">_</span><span className="text-primary">WBL</span>
              <span className="text-muted-foreground font-normal ml-2">Resources</span>
            </span>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 max-w-6xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">📚 Resource Library</h1>
          <p className="text-muted-foreground">
            Curated resources for educators, guidance counselors, organizations, and industry partners.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <span className="font-semibold text-foreground">Filter Resources</span>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="ml-auto text-muted-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>

          {/* Resource Type Filters */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Resource Type</p>
            <div className="flex flex-wrap gap-2">
              {RESOURCE_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => toggleType(type.value)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all border-2",
                    selectedTypes.includes(type.value)
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-card text-foreground border-border hover:border-accent/50"
                  )}
                >
                  <span className="mr-2">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audience Filters */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Audience</p>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_TYPES.map(audience => (
                <button
                  key={audience.value}
                  onClick={() => toggleAudience(audience.value)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all border-2",
                    selectedAudiences.includes(audience.value)
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-card text-foreground border-border hover:border-accent/50"
                  )}
                >
                  <span className="mr-2">{audience.icon}</span>
                  {audience.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filteredResources.length} of {RESOURCES.length} resources
        </p>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map(resource => (
            <Card 
              key={resource.id} 
              className="group hover:border-accent/50 transition-all cursor-pointer"
              onClick={() => window.open(resource.url, '_blank')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{resource.icon}</span>
                  <div className="flex items-center gap-1 text-muted-foreground group-hover:text-accent transition-colors">
                    {getTypeIcon(resource.type)}
                  </div>
                </div>
                <CardTitle className="text-lg">{resource.title}</CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {resource.audiences.map(audience => {
                    const audienceData = AUDIENCE_TYPES.find(a => a.value === audience);
                    return (
                      <span 
                        key={audience} 
                        className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground"
                      >
                        {audienceData?.icon} {audienceData?.label}
                      </span>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No resources match your filters.</p>
            <Button variant="ghost" onClick={clearFilters} className="mt-2">
              Clear filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
