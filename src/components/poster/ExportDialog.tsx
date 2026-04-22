import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import designTokens from "@/data/poster/design-tokens.json";
import type { PosterContent } from "@/types/poster";
import { totalPages, getFormat, getPaper } from "@/lib/poster/cutPaste";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  content: PosterContent;
  mode: "full" | "cut-paste";
}

export function ExportDialog({
  open,
  onOpenChange,
  projectId,
  content,
  mode,
}: ExportDialogProps) {
  const [paperSize, setPaperSize] = useState<"letter" | "tabloid">("letter");
  const [busy, setBusy] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const palettes = designTokens.palettes as Array<{ key: string; name: string }>;
  const fonts = designTokens.fontPairs as Array<{ key: string; name: string }>;
  const templates = designTokens.templates as Array<{ key: string; name: string }>;
  const formats = designTokens.formats as Array<{ key: string; name: string; label: string }>;

  const fmt = formats.find((f) => f.key === content.format);
  const palette = palettes.find((p) => p.key === content.design.palette);
  const fontPair = fonts.find((f) => f.key === content.design.fontPair);
  const template = templates.find((t) => t.key === content.design.template);

  const cutPasteFormat = getFormat(content.format);
  const cutPastePaper = getPaper(paperSize);
  const pageCount =
    mode === "cut-paste" ? totalPages(content, cutPasteFormat, cutPastePaper) : 1;

  const handleGenerate = async () => {
    setBusy(true);
    setResultUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("render-poster", {
        body: {
          projectId,
          mode,
          paperSize: mode === "cut-paste" ? paperSize : undefined,
        },
      });
      if (error) throw error;
      const url = (data as any)?.url ?? null;
      if (!url) throw new Error("No URL returned");
      setResultUrl(url);
      toast({
        title: "Export ready",
        description: "Your file is queued for download.",
      });
    } catch (err: any) {
      toast({
        title: "Export failed",
        description: err.message ?? "Could not generate file.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "cut-paste" ? "Generate Assembly Packet" : "Generate Poster PDF"}
          </DialogTitle>
          <DialogDescription>
            {mode === "cut-paste"
              ? "A multi-page packet that prints true-to-scale on a classroom printer."
              : "A single full-size PDF ready for a print shop."}
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-2 text-sm border-y border-border py-4">
          <dt className="text-muted-foreground">Format</dt>
          <dd className="text-foreground">{fmt?.name} <span className="text-muted-foreground">· {fmt?.label}</span></dd>
          <dt className="text-muted-foreground">Template</dt>
          <dd className="text-foreground">{template?.name}</dd>
          <dt className="text-muted-foreground">Palette</dt>
          <dd className="text-foreground">{palette?.name}</dd>
          <dt className="text-muted-foreground">Typography</dt>
          <dd className="text-foreground">{fontPair?.name}</dd>
          <dt className="text-muted-foreground">Mode</dt>
          <dd className="text-foreground">
            {mode === "cut-paste" ? "Cut & Paste" : "Full Poster"}
          </dd>
          {mode === "cut-paste" && (
            <>
              <dt className="text-muted-foreground">Pages</dt>
              <dd className="text-foreground">
                {pageCount} on {cutPastePaper.name}
              </dd>
            </>
          )}
        </dl>

        {mode === "cut-paste" && (
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Paper size
            </Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["letter", "tabloid"] as const).map((s) => {
                const sizes = designTokens.paperSizes as unknown as Record<
                  string,
                  { name: string }
                >;
                const selected = paperSize === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPaperSize(s)}
                    className={cn(
                      "px-3 py-2 rounded-md border text-sm text-left transition-colors",
                      selected
                        ? "border-foreground bg-accent text-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {sizes[s].name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {resultUrl && (
          <div className="rounded-md border border-border bg-card p-3 text-sm flex items-center justify-between">
            <span className="text-muted-foreground">File ready</span>
            <a
              href={resultUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-foreground hover:underline"
            >
              Open <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleGenerate} disabled={busy}>
            <Download className="w-4 h-4 mr-1.5" />
            {busy
              ? "Generating…"
              : mode === "cut-paste"
                ? "Generate Assembly Packet"
                : "Generate Poster PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
