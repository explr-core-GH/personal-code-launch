import { useEffect } from "react";
import designTokens from "@/data/poster/design-tokens.json";

const LOADED = new Set<string>();

/**
 * Inject Google Fonts <link> tags for every font pair defined in design-tokens.
 * Cheap, idempotent, runs once per page load.
 */
export function usePosterFonts() {
  useEffect(() => {
    const pairs = designTokens.fontPairs as Array<{ key: string; googleFontsUrl: string }>;
    pairs.forEach((p) => {
      if (LOADED.has(p.key)) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = p.googleFontsUrl;
      link.dataset.posterFont = p.key;
      document.head.appendChild(link);
      LOADED.add(p.key);
    });
  }, []);
}
