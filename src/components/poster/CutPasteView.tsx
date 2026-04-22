import { useMemo } from "react";
import type { PosterContent } from "@/types/poster";
import designTokens from "@/data/poster/design-tokens.json";
import {
  extractElements,
  tilePlan,
  getFormat,
  getPaper,
  boardDims,
  type Element,
  type Format,
} from "@/lib/poster/cutPaste";

type Palette = { key: string; name: string; header: string; accent: string; surface: string; bg: string; text: string; muted: string };

interface CutPasteViewProps {
  content: PosterContent;
  paperSize: "letter" | "tabloid";
}

export function CutPasteView({ content, paperSize }: CutPasteViewProps) {
  const format = getFormat(content.format);
  const paper = getPaper(paperSize);
  const palettes = designTokens.palettes as Palette[];
  const palette =
    palettes.find((p) => p.key === content.design.palette) ?? palettes[0];

  const elements = useMemo(() => extractElements(content, format), [content, format]);
  const total = useMemo(
    () => elements.reduce((sum, el) => sum + tilePlan(el.w, el.h, paper).total, 0),
    [elements, paper],
  );

  return (
    <div className="w-full max-w-2xl space-y-4">
      {/* Diagram */}
      <div className="rounded-md border border-border bg-card p-4">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
          Board layout · dashed outlines = cut lines
        </div>
        <BoardDiagram elements={elements} format={format} palette={palette} />
      </div>

      {/* Summary */}
      <div className="rounded-md bg-foreground text-background px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest opacity-70">
            Assembly packet
          </div>
          <div className="text-base font-semibold mt-0.5">
            {total} page{total !== 1 ? "s" : ""} on {paper.name}
          </div>
        </div>
        <div className="text-xs opacity-80 text-right">
          {elements.length} element{elements.length !== 1 ? "s" : ""} · cut &amp; glue
        </div>
      </div>

      {/* Manifest */}
      <ol className="rounded-md border border-border bg-card overflow-hidden">
        {elements.map((el, i) => {
          const plan = tilePlan(el.w, el.h, paper);
          const tiled = plan.total > 1;
          return (
            <li
              key={el.id}
              className="grid items-center gap-3 px-4 py-3 border-t border-border first:border-t-0"
              style={{ gridTemplateColumns: "32px 1fr auto" }}
            >
              <div
                className="w-7 h-7 rounded-sm flex items-center justify-center text-sm font-semibold"
                style={{ background: palette.accent, color: palette.header }}
              >
                {i + 1}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {el.label}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {el.w.toFixed(1)}″ × {el.h.toFixed(1)}″ · {el.placement}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-foreground">
                  {plan.total} page{plan.total !== 1 ? "s" : ""}
                </div>
                {tiled && (
                  <div className="text-[10px] text-foreground/60 mt-0.5">
                    tiles {plan.cols}×{plan.rows}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        <strong className="text-foreground">How to use:</strong> Generate the
        Assembly Packet from the Export menu. Each page prints one piece of your
        poster at true scale. Cut along the dashed lines, line up registration
        marks on multi-page pieces, and glue everything onto your board in the
        positions shown above.
      </p>
    </div>
  );
}

function BoardDiagram({
  elements,
  format,
  palette,
}: {
  elements: Element[];
  format: Format;
  palette: Palette;
}) {
  const { w, h } = boardDims(format);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-auto block"
      style={{ background: palette.bg, maxHeight: "min(60vh, 480px)" }}
      preserveAspectRatio="xMidYMid meet"
    >
      {elements.map((el, i) => (
        <g key={el.id}>
          <rect
            x={el.x}
            y={el.y}
            width={el.w}
            height={el.h}
            fill={
              el.kind === "title"
                ? palette.header
                : el.kind === "footer"
                  ? palette.surface
                  : "#fff"
            }
            stroke={palette.header}
            strokeWidth={0.08}
            strokeDasharray="0.4 0.3"
            opacity={0.9}
          />
          <text
            x={el.x + el.w / 2}
            y={el.y + el.h / 2}
            fill={el.kind === "title" ? "#fff" : palette.header}
            fontSize={el.w < 10 ? 0.8 : 1.2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="sans-serif"
            fontWeight={500}
          >
            {i + 1}. {el.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
