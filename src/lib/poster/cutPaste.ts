// Cut & Paste math: which physical elements make up the poster, and how many
// pages each one takes on a given letter/tabloid printer.
// Ported directly from poster-builder.reference.jsx.

import scaffolding from "@/data/poster/scaffolding.json";
import designTokens from "@/data/poster/design-tokens.json";
import type { PosterContent } from "@/types/poster";

export type Format = {
  key: string;
  name: string;
  label: string;
  kind: "poster" | "trifold";
  width?: number;
  height?: number;
  panels?: { left: { w: number; h: number }; center: { w: number; h: number }; right: { w: number; h: number } };
};

export type Paper = { name: string; w: number; h: number; printW: number; printH: number; margin: number };

export type Element = {
  id: string;
  label: string;
  kind: "title" | "section" | "footer" | "panel";
  sectionKey?: string;
  w: number;   // inches
  h: number;   // inches
  x: number;   // inches from left of board
  y: number;   // inches from top of board
  placement: string;
};

export function getFormat(key: string): Format {
  const formats = designTokens.formats as Format[];
  return formats.find((f) => f.key === key) ?? formats[0];
}

export function getPaper(size: "letter" | "tabloid"): Paper {
  const sizes = designTokens.paperSizes as unknown as Record<string, Paper>;
  return sizes[size] ?? sizes.letter;
}

function boardDims(format: Format): { w: number; h: number } {
  if (format.kind === "trifold" && format.panels) {
    return {
      w: format.panels.left.w + format.panels.center.w + format.panels.right.w,
      h: format.panels.center.h,
    };
  }
  return { w: format.width ?? 36, h: format.height ?? 48 };
}

export function extractElements(
  content: PosterContent,
  format: Format,
): Element[] {
  const sections = scaffolding.sections as Array<{ key: string; label: string }>;
  const enabled = content.enabledSections.filter((k) => k !== "acknowledgments");

  // Tri-fold: each panel is its own element, no cross-panel content.
  if (format.kind === "trifold" && format.panels) {
    const els: Element[] = [];
    let xOffset = 0;
    (["left", "center", "right"] as const).forEach((p) => {
      const panel = format.panels![p];
      els.push({
        id: `panel-${p}`,
        label: `${p[0].toUpperCase()}${p.slice(1)} panel`,
        kind: "panel",
        w: panel.w,
        h: panel.h,
        x: xOffset,
        y: 0,
        placement: `${p} panel · ${panel.w}″ × ${panel.h}″`,
      });
      xOffset += panel.w;
    });
    return els;
  }

  // Poster: title band, section grid, footer.
  const { w: pw, h: ph } = boardDims(format);
  const pad = 0.5;
  const gap = 0.5;
  const isPortrait = ph > pw;
  const cols = isPortrait ? 3 : 4;
  const titleH = isPortrait ? 4.375 : 3.54;
  const footerH = 1.75;
  const bodyH = ph - titleH - footerH;
  const colW = (pw - pad * 2 - gap * (cols - 1)) / cols;
  const rows = Math.max(1, Math.ceil(enabled.length / cols));
  const sectionH = (bodyH - (rows - 1) * gap) / rows;

  const elements: Element[] = [
    {
      id: "title",
      label: "Title Block",
      kind: "title",
      w: pw,
      h: titleH,
      x: 0,
      y: 0,
      placement: "Top of poster, full width",
    },
  ];

  enabled.forEach((sectionKey, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (colW + gap);
    const y = titleH + pad + row * (sectionH + gap);
    const sec = sections.find((s) => s.key === sectionKey);
    elements.push({
      id: `sec-${sectionKey}`,
      label: sec?.label ?? sectionKey,
      kind: "section",
      sectionKey,
      w: colW,
      h: sectionH,
      x,
      y,
      placement: `Column ${col + 1}, Row ${row + 1} (${x.toFixed(1)}″ from left, ${y.toFixed(1)}″ from top)`,
    });
  });

  elements.push({
    id: "footer",
    label: "Footer (Acknowledgments)",
    kind: "footer",
    w: pw,
    h: footerH,
    x: 0,
    y: ph - footerH,
    placement: "Bottom of poster, full width",
  });

  return elements;
}

export function tilePlan(elementW: number, elementH: number, paper: Paper) {
  const cols = Math.max(1, Math.ceil(elementW / paper.printW));
  const rows = Math.max(1, Math.ceil(elementH / paper.printH));
  return { cols, rows, total: cols * rows };
}

export function totalPages(content: PosterContent, format: Format, paper: Paper): number {
  return extractElements(content, format).reduce(
    (sum, el) => sum + tilePlan(el.w, el.h, paper).total,
    0,
  );
}

export { boardDims };
