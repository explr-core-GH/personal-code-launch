import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePlus, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { PosterContent, PosterVisual } from "@/types/poster";
import { cn } from "@/lib/utils";

interface VisualsEditorProps {
  projectId: string;
  sectionKey: string;
  content: PosterContent;
  onChange: (patch: Partial<PosterContent>) => void;
}

const LOW_RES = 800;

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

export function VisualsEditor({
  projectId,
  sectionKey,
  content,
  onChange,
}: VisualsEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const sectionVisuals = content.visuals.filter((v) => v.section === sectionKey);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (arr.length === 0) return;
      setBusy(true);

      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) {
        toast({ title: "Sign in required", description: "Log in to upload visuals.", variant: "destructive" });
        setBusy(false);
        return;
      }

      const newVisuals: PosterVisual[] = [];
      for (const file of arr) {
        try {
          const { width, height } = await readImageDimensions(file);
          const id = crypto.randomUUID();
          const ext = (file.name.split(".").pop() || "png").toLowerCase();
          const path = `${uid}/${projectId}/${id}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("poster-images")
            .upload(path, file, { cacheControl: "3600", upsert: false });
          if (upErr) throw upErr;
          // Generate a long-lived signed URL (bucket is private).
          const { data: signed, error: signErr } = await supabase.storage
            .from("poster-images")
            .createSignedUrl(path, 60 * 60 * 24 * 365);
          if (signErr) throw signErr;
          newVisuals.push({
            id,
            section: sectionKey,
            src: signed.signedUrl,
            caption: "",
            credit: "",
            filename: file.name,
            width,
            height,
            storagePath: path,
          });
        } catch (err: any) {
          toast({
            title: "Upload failed",
            description: err.message ?? "Could not upload image.",
            variant: "destructive",
          });
        }
      }
      if (newVisuals.length > 0) {
        onChange({ visuals: [...content.visuals, ...newVisuals] });
      }
      setBusy(false);
    },
    [projectId, sectionKey, content.visuals, onChange],
  );

  const updateVisual = (id: string, patch: Partial<PosterVisual>) => {
    onChange({
      visuals: content.visuals.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    });
  };

  const removeVisual = async (id: string) => {
    const v = content.visuals.find((x) => x.id === id);
    if (v?.storagePath) {
      await supabase.storage.from("poster-images").remove([v.storagePath]);
    }
    onChange({ visuals: content.visuals.filter((x) => x.id !== id) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Visuals
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <ImagePlus className="w-3.5 h-3.5 mr-1.5" />
          {busy ? "Uploading…" : "Add image"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files) upload(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "rounded-md border-2 border-dashed p-4 text-center text-xs cursor-pointer transition-colors",
          dragOver
            ? "border-foreground bg-accent/50 text-foreground"
            : "border-border text-muted-foreground hover:border-foreground/40",
        )}
      >
        Drop images here or click to upload · PNG / JPG / WebP
      </div>

      {sectionVisuals.length > 0 && (
        <ul className="space-y-3">
          {sectionVisuals.map((v) => {
            const lowRes = v.width > 0 && v.width < LOW_RES;
            return (
              <li
                key={v.id}
                className="flex gap-3 rounded-md border border-border bg-card p-3"
              >
                <img
                  src={v.src}
                  alt={v.caption || v.filename}
                  className="w-24 h-24 object-cover rounded-sm border border-border shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Caption
                    </Label>
                    <Input
                      value={v.caption}
                      onChange={(e) => updateVisual(v.id, { caption: e.target.value })}
                      placeholder="Tell the reader what to notice"
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Credit
                      </Label>
                      <Input
                        value={v.credit}
                        onChange={(e) => updateVisual(v.id, { credit: e.target.value })}
                        placeholder="Photo by…"
                        className="h-8 text-sm mt-1"
                      />
                    </div>
                    <div className="text-[11px] text-muted-foreground self-end pb-1.5 truncate">
                      {v.width}×{v.height}px · {v.filename}
                    </div>
                  </div>
                  {lowRes && (
                    <div className="flex items-center gap-1.5 text-[11px] text-foreground/80">
                      <AlertTriangle className="w-3 h-3" />
                      Low resolution for print (under {LOW_RES}px wide)
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeVisual(v.id)}
                  aria-label="Remove image"
                  className="self-start text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
