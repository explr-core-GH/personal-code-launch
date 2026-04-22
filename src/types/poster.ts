// Shared types for the EXPLR Poster Builder.
// The `content` JSONB column on poster_projects holds a PosterContent value.

import scaffolding from "@/data/poster/scaffolding.json";

export type ProjectType = "build" | "data" | "research" | "design" | "other";

export interface PosterVisual {
  id: string;
  section: string;
  src: string;       // public URL or signed URL into the poster-images bucket
  caption: string;
  credit: string;
  filename: string;
  width: number;
  height: number;
  storagePath?: string; // {auth.uid()}/{projectId}/{visualId}.{ext}
}

export interface PosterDesign {
  palette: string;
  fontPair: string;
  template: string;
}

export interface PosterContent {
  title: string;
  subtitle: string;
  authors: string;
  mentor: string;
  organization: string;
  school: string;
  dateRange: string;
  projectType: ProjectType;
  sections: Record<string, string>;
  enabledSections: string[];
  visuals: PosterVisual[];
  design: PosterDesign;
  format: string;
  soWhat: string;
}

export interface PosterProjectRow {
  id: string;
  user_id: string;
  name: string;
  content: PosterContent;
  created_at: string;
  updated_at: string;
}

// Default content for a brand-new poster project.
export function makeDefaultContent(): PosterContent {
  const allKeys = (scaffolding.sections as Array<{ key: string }>).map((s) => s.key);
  const sections: Record<string, string> = {};
  allKeys.forEach((k) => (sections[k] = ""));

  // "build" is the default project type — use its enabled section kit.
  const kits = scaffolding.projectTypeSectionKits as unknown as Record<string, string[]>;
  const enabled = kits.build ?? allKeys;

  return {
    title: "",
    subtitle: "",
    authors: "",
    mentor: "",
    organization: "",
    school: "",
    dateRange: "",
    projectType: "build",
    sections,
    enabledSections: enabled,
    visuals: [],
    design: {
      palette: "navy-gold",
      fontPair: "playfair-source",
      template: "academic",
    },
    format: "poster-portrait",
    soWhat: "",
  };
}
