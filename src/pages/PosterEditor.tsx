import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/wbl/Header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { makeDefaultContent, type PosterContent } from "@/types/poster";
import { usePosterAutosave } from "@/hooks/usePosterAutosave";
import { SaveIndicator } from "@/components/poster/SaveIndicator";
import { ProjectInfoTab } from "@/components/poster/ProjectInfoTab";
import { ContentTab } from "@/components/poster/ContentTab";
import designTokens from "@/data/poster/design-tokens.json";

type TabKey = "info" | "content" | "design" | "review";

export default function PosterEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Untitled Poster");
  const [content, setContent] = useState<PosterContent | null>(null);
  const [tab, setTab] = useState<TabKey>("info");
  const [mode, setMode] = useState<"full" | "cut-paste">("full");

  // Load project once.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("poster_projects")
        .select("name, content")
        .eq("id", id)
        .single();
      if (cancelled) return;
      if (error || !data) {
        toast({
          title: "Couldn't load poster",
          description: error?.message ?? "Not found",
          variant: "destructive",
        });
        navigate("/poster-builder");
        return;
      }
      setName(data.name ?? "Untitled Poster");
      // Merge stored content over defaults so older rows always have every field.
      const stored = (data.content ?? {}) as Partial<PosterContent>;
      const merged: PosterContent = {
        ...makeDefaultContent(),
        ...stored,
        sections: { ...makeDefaultContent().sections, ...(stored.sections ?? {}) },
        design: { ...makeDefaultContent().design, ...(stored.design ?? {}) },
      };
      setContent(merged);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const { state: saveState } = usePosterAutosave({
    projectId: id,
    name,
    content,
    enabled: !loading && !!content,
  });

  const updateContent = (patch: Partial<PosterContent>) => {
    setContent((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  // Summary chip data for the sub-header.
  const summary = useMemo(() => {
    if (!content) return null;
    const formats = designTokens.formats as Array<{ key: string; label: string }>;
    const palettes = designTokens.palettes as Array<{ key: string; name: string }>;
    const templates = designTokens.templates as Array<{ key: string; name: string }>;
    return {
      format:
        formats.find((f) => f.key === content.format)?.label ?? content.format,
      palette:
        palettes.find((p) => p.key === content.design.palette)?.name ??
        content.design.palette,
      template:
        templates.find((t) => t.key === content.design.template)?.name ??
        content.design.template,
    };
  }, [content]);

  if (loading || !content) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading poster…</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      <Header />

      {/* Sub-header */}
      <div className="border-b border-border bg-card">
        <div className="px-6 py-3 flex items-center gap-4 flex-wrap">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/poster-builder">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              All posters
            </Link>
          </Button>

          <div className="h-5 w-px bg-border" />

          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Untitled Poster"
            aria-label="Poster name"
            className="h-9 text-sm font-medium max-w-xs border-transparent hover:border-input focus-visible:border-input bg-transparent"
          />

          {summary && (
            <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
              <span>{summary.format}</span>
              <span className="opacity-40">·</span>
              <span>{summary.template}</span>
              <span className="opacity-40">·</span>
              <span>{summary.palette}</span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            <SaveIndicator state={saveState} />
            <div className="hidden sm:flex items-center bg-muted rounded-md p-0.5 border border-border">
              <button
                type="button"
                onClick={() => setMode("full")}
                className={
                  "px-3 py-1 text-xs rounded-sm transition-colors " +
                  (mode === "full"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                Full Poster
              </button>
              <button
                type="button"
                onClick={() => setMode("cut-paste")}
                className={
                  "px-3 py-1 text-xs rounded-sm transition-colors " +
                  (mode === "cut-paste"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                Cut &amp; Paste
              </button>
            </div>
            <Button size="sm" disabled>
              <Download className="w-4 h-4 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main grid: 45 / 55 */}
      <div
        className="flex-1 grid min-h-0"
        style={{ gridTemplateColumns: "minmax(0, 45fr) minmax(0, 55fr)" }}
      >
        {/* Left: editor */}
        <div className="flex flex-col min-h-0 border-r border-border">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as TabKey)}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="border-b border-border bg-card">
              <TabsList className="h-11 bg-transparent rounded-none px-4 gap-1">
                <TabsTrigger value="info" className="data-[state=active]:bg-accent">
                  1 · Project Info
                </TabsTrigger>
                <TabsTrigger value="content" className="data-[state=active]:bg-accent">
                  2 · Content
                </TabsTrigger>
                <TabsTrigger value="design" className="data-[state=active]:bg-accent">
                  3 · Design
                </TabsTrigger>
                <TabsTrigger value="review" className="data-[state=active]:bg-accent">
                  4 · Review
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto">
              <TabsContent value="info" className="m-0 p-8">
                <ProjectInfoTab content={content} onChange={updateContent} />
              </TabsContent>
              <TabsContent value="content" className="m-0 p-8">
                <ContentTab content={content} onChange={updateContent} />
              </TabsContent>
              <TabsContent value="design" className="m-0 p-8">
                <TabPlaceholder
                  title="Design"
                  body="Format, template, palette, and typography pickers arrive in step 5."
                />
              </TabsContent>
              <TabsContent value="review" className="m-0 p-8">
                <TabPlaceholder
                  title="Review"
                  body="Pre-flight checklist and the 'so what?' prompt arrive in step 9."
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right: preview */}
        <div className="flex flex-col min-h-0 bg-muted/40">
          <div className="flex items-center justify-between px-5 h-11 border-b border-border bg-card">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {mode === "cut-paste" ? "Cut & Paste preview" : "Live preview"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Renders here in step 5
            </span>
          </div>
          <div className="flex-1 overflow-auto p-8 flex items-start justify-center">
            <div className="w-full max-w-md aspect-[3/4] bg-card border border-dashed border-border rounded-md flex items-center justify-center text-xs text-muted-foreground text-center px-6">
              Live poster preview will render here once the Design tab and templates
              land in step 5.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabPlaceholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground mt-2">{body}</p>
    </div>
  );
}
