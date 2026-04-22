import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PosterContent } from "@/types/poster";

export type SaveState = "idle" | "saving" | "saved" | "error";

interface Args {
  projectId: string | undefined;
  name: string;
  content: PosterContent | null;
  enabled: boolean;
  debounceMs?: number;
}

/**
 * Persists `name` + `content` to poster_projects.
 * Debounces writes; coalesces rapid edits into a single trailing save.
 * Always writes the full object — never mutates server state in place.
 */
export function usePosterAutosave({
  projectId,
  name,
  content,
  enabled,
  debounceMs = 800,
}: Args) {
  const [state, setState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef(0);
  // Skip the very first effect run (initial load) so we don't write back what we read.
  const hydrated = useRef(false);

  const save = useCallback(
    async (nextName: string, nextContent: PosterContent) => {
      if (!projectId) return;
      const seq = ++inflight.current;
      setState("saving");
      const { error } = await supabase
        .from("poster_projects")
        .update({
          name: nextName,
          content: nextContent as unknown as never,
        })
        .eq("id", projectId);
      // If a newer save started while this was in flight, ignore this result.
      if (seq !== inflight.current) return;
      if (error) {
        setState("error");
        return;
      }
      setState("saved");
      setLastSavedAt(Date.now());
    },
    [projectId]
  );

  useEffect(() => {
    if (!enabled || !content || !projectId) return;
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void save(name, content);
    }, debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // We intentionally key on stringified content so any nested change triggers save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, JSON.stringify(content), enabled, projectId, debounceMs, save]);

  // Force-save on unmount/page-leave so the last keystroke isn't lost.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (enabled && content && projectId) {
        void save(name, content);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { state, lastSavedAt };
}
