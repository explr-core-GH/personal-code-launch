import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Header } from "@/components/wbl/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { makeDefaultContent, type PosterContent, type PosterProjectRow } from "@/types/poster";

interface PosterRow {
  id: string;
  name: string;
  content: PosterContent;
  updated_at: string;
}

export default function PosterBuilderList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<PosterRow[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<PosterRow | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("poster_projects")
        .select("id, name, content, updated_at")
        .order("updated_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        toast({
          title: "Couldn't load your posters",
          description: error.message,
          variant: "destructive",
        });
        setProjects([]);
        return;
      }
      setProjects(
        (data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          content: (row.content ?? {}) as unknown as PosterContent,
          updated_at: row.updated_at,
        }))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleCreate = async () => {
    if (!user || creating) return;
    setCreating(true);
    const content = makeDefaultContent();
    const { data, error } = await supabase
      .from("poster_projects")
      .insert({
        user_id: user.id,
        name: "Untitled Poster",
        content: content as unknown as never,
      })
      .select("id")
      .single();
    setCreating(false);
    if (error || !data) {
      toast({
        title: "Couldn't create poster",
        description: error?.message ?? "Unknown error",
        variant: "destructive",
      });
      return;
    }
    navigate(`/poster-builder/${data.id}`);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    const { error } = await supabase.from("poster_projects").delete().eq("id", id);
    if (error) {
      toast({
        title: "Couldn't delete poster",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setProjects((prev) => (prev ?? []).filter((p) => p.id !== id));
    setConfirmDelete(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      <Header />
      <main className="flex-1 px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10 gap-6 flex-wrap">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Poster Builder
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                Turn your internship project into a print-ready research poster or tri-fold
                board. Guided scaffolding for the writing, curated typography and color for
                the design.
              </p>
            </div>
            <Button onClick={handleCreate} disabled={!user || creating} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              New Poster
            </Button>
          </div>

          {projects === null ? (
            <ListSkeleton />
          ) : projects.length === 0 ? (
            <EmptyState onCreate={handleCreate} disabled={creating} />
          ) : (
            <ProjectGrid
              projects={projects}
              onOpen={(id) => navigate(`/poster-builder/${id}`)}
              onDelete={(p) => setConfirmDelete(p)}
            />
          )}
        </div>
      </main>

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this poster?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.name || "Untitled Poster"}" and all of its content,
              including uploaded images, will be permanently removed. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-56 rounded-lg border border-border bg-card animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState({ onCreate, disabled }: { onCreate: () => void; disabled: boolean }) {
  return (
    <div className="border border-dashed border-border rounded-lg bg-card py-20 px-6 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-5">
        <FileText className="w-5 h-5 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        Start your first poster
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Each poster walks you through writing your project up section by section, then
        lets you choose a layout, typography, and color palette before exporting.
      </p>
      <Button onClick={onCreate} disabled={disabled} size="lg">
        <Plus className="w-4 h-4 mr-2" />
        New Poster
      </Button>
    </div>
  );
}

function ProjectGrid({
  projects,
  onOpen,
  onDelete,
}: {
  projects: PosterRow[];
  onOpen: (id: string) => void;
  onDelete: (p: PosterRow) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {projects.map((p) => (
        <ProjectCard
          key={p.id}
          project={p}
          onOpen={() => onOpen(p.id)}
          onDelete={() => onDelete(p)}
        />
      ))}
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
  onDelete,
}: {
  project: PosterRow;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { content } = project;
  const title = content?.title?.trim() || project.name || "Untitled Poster";
  const formatLabel = useMemo(() => {
    const f = content?.format ?? "poster-portrait";
    if (f.startsWith("trifold")) return "Tri-fold";
    if (f === "poster-landscape") return "Poster · Landscape";
    return "Poster · Portrait";
  }, [content?.format]);

  const updated = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(project.updated_at), { addSuffix: true });
    } catch {
      return "";
    }
  }, [project.updated_at]);

  return (
    <Card className="group relative overflow-hidden hover:shadow-md transition-shadow">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left"
      >
        {/* Placeholder thumbnail — real miniature renders in a later step */}
        <div className="aspect-[4/3] w-full bg-accent border-b border-border relative">
          <div className="absolute inset-4 rounded-sm bg-card border border-border flex items-center justify-center">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {formatLabel}
            </span>
          </div>
        </div>
        <div className="p-4">
          <div className="text-sm font-medium text-foreground line-clamp-2">{title}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Edited {updated || "just now"}
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label="Delete poster"
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-card border border-border text-muted-foreground hover:text-destructive hover:border-destructive"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </Card>
  );
}
