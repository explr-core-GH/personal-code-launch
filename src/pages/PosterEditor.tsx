import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/wbl/Header";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

// Placeholder editor shell — full editor is built in step 3.
export default function PosterEditor() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("poster_projects")
        .select("name")
        .eq("id", id)
        .single();
      if (cancelled) return;
      if (error) {
        toast({
          title: "Couldn't load poster",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      setName(data?.name ?? "Untitled Poster");
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      <Header />
      <main className="flex-1 px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
            <Link to="/poster-builder">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              All posters
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {name ?? "Loading…"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            The editor is being assembled. Project Info, Content, Design, and Review
            tabs will appear here in the next steps.
          </p>
        </div>
      </main>
    </div>
  );
}
