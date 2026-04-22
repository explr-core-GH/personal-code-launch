import { Check, Loader2, AlertTriangle } from "lucide-react";
import type { SaveState } from "@/hooks/usePosterAutosave";
import { cn } from "@/lib/utils";

export function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") {
    return <span className="text-xs text-muted-foreground">Up to date</span>;
  }
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="w-3 h-3 text-primary" />
        Saved
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-destructive")}>
      <AlertTriangle className="w-3 h-3" />
      Save failed
    </span>
  );
}
