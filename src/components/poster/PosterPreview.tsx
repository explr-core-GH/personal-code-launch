import { useMemo } from "react";
import scaffolding from "@/data/poster/scaffolding.json";
import designTokens from "@/data/poster/design-tokens.json";
import type { PosterContent } from "@/types/poster";

type Format = {
  key: string;
  name: string;
  label: string;
  kind: "poster" | "trifold";
  width?: number;
  height?: number;
  panels?: { left: { w: number; h: number }; center: { w: number; h: number }; right: { w: number; h: number } };
};
type Palette = { key: string; name: string; header: string; accent: string; surface: string; bg: string; text: string; muted: string };
type FontPair = { key: string; display: string; body: string };
type Section = { key: string; label: string; order: number };

interface PosterPreviewProps {
  content: PosterContent;
  mode: "full" | "cut-paste";
}

export function PosterPreview({ content, mode }: PosterPreviewProps) {
  const formats = designTokens.formats as Format[];
  const palettes = designTokens.palettes as Palette[];
  const fonts = designTokens.fontPairs as FontPair[];
  const sections = scaffolding.sections as Section[];

  const format = formats.find((f) => f.key === content.format) ?? formats[0];
  const palette = palettes.find((p) => p.key === content.design.palette) ?? palettes[0];
  const font = fonts.find((f) => f.key === content.design.fontPair) ?? fonts[0];

  const enabledOrdered = useMemo(
    () =>
      sections
        .filter((s) => content.enabledSections.includes(s.key))
        .sort((a, b) => a.order - b.order),
    [sections, content.enabledSections],
  );

  // Outer wrapper aspect comes from the format dimensions.
  const dims = useMemo(() => {
    if (format.kind === "poster" && format.width && format.height) {
      return { w: format.width, h: format.height };
    }
    if (format.kind === "trifold" && format.panels) {
      const w =
        format.panels.left.w + format.panels.center.w + format.panels.right.w;
      return { w, h: format.panels.center.h };
    }
    return { w: 36, h: 48 };
  }, [format]);

  const aspect = `${dims.w} / ${dims.h}`;

  return (
    <div
      className="w-full max-w-full mx-auto shadow-lg"
      style={{
        aspectRatio: aspect,
        background: palette.bg,
        color: palette.text,
        fontFamily: `'${font.body}', sans-serif`,
        // Use container query units so type scales with the rendered preview.
        fontSize: "1.4cqw",
      }}
    >
      {format.kind === "trifold" ? (
        <TrifoldLayout
          content={content}
          enabled={enabledOrdered}
          palette={palette}
          font={font}
          format={format}
          mode={mode}
        />
      ) : (
        <PosterLayout
          content={content}
          enabled={enabledOrdered}
          palette={palette}
          font={font}
          template={content.design.template}
          mode={mode}
        />
      )}
    </div>
  );
}

/* -------- Layouts -------- */

function PosterLayout({
  content,
  enabled,
  palette,
  font,
  template,
  mode,
}: {
  content: PosterContent;
  enabled: Section[];
  palette: Palette;
  font: FontPair;
  template: string;
  mode: "full" | "cut-paste";
}) {
  const editorial = template === "editorial";
  // Skip abstract from main column flow if present — render it as a callout under the header.
  const abstract = enabled.find((s) => s.key === "abstract");
  const acks = enabled.find((s) => s.key === "acknowledgments");
  const body = enabled.filter(
    (s) => s.key !== "abstract" && s.key !== "acknowledgments",
  );

  return (
    <div className="w-full h-full flex flex-col" style={{ containerType: "inline-size" }}>
      {/* Header band */}
      <header
        className="px-[3%] py-[2.5%]"
        style={{
          background: editorial ? palette.bg : palette.header,
          color: editorial ? palette.text : palette.surface,
          borderBottom: editorial ? `0.4cqw solid ${palette.accent}` : "none",
        }}
      >
        <div
          className="leading-[1.05] font-bold"
          style={{
            fontFamily: `'${font.display}', serif`,
            fontSize: editorial ? "5.5cqw" : "4.4cqw",
          }}
        >
          {content.title || "Your Project Title"}
        </div>
        {content.subtitle && (
          <div
            className="mt-[0.6cqw] opacity-90"
            style={{ fontSize: "1.6cqw" }}
          >
            {content.subtitle}
          </div>
        )}
        <div
          className="mt-[1cqw] flex flex-wrap gap-x-[2cqw] gap-y-[0.4cqw]"
          style={{ fontSize: "1.2cqw", opacity: 0.85 }}
        >
          {content.authors && <span>{content.authors}</span>}
          {content.mentor && <span>Mentor: {content.mentor}</span>}
          {content.organization && <span>{content.organization}</span>}
          {content.school && <span>{content.school}</span>}
          {content.dateRange && <span>{content.dateRange}</span>}
        </div>
      </header>

      {/* Abstract callout */}
      {abstract && (
        <div
          className="mx-[3%] mt-[2%] p-[1.5cqw]"
          style={{
            background: palette.surface,
            borderLeft: `0.5cqw solid ${palette.accent}`,
            fontSize: "1.35cqw",
            lineHeight: 1.5,
          }}
        >
          <div
            className="uppercase tracking-widest mb-[0.4cqw]"
            style={{ fontSize: "0.95cqw", color: palette.muted }}
          >
            Abstract
          </div>
          <div>
            {content.sections[abstract.key] || (
              <span style={{ color: palette.muted, fontStyle: "italic" }}>
                Your abstract will appear here.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Body columns */}
      <div
        className="flex-1 px-[3%] py-[2%] grid gap-[2cqw]"
        style={{ gridTemplateColumns: editorial ? "1.6fr 1fr" : "repeat(3, 1fr)" }}
      >
        {body.map((s) => (
          <SectionBlock
            key={s.key}
            label={s.label}
            text={content.sections[s.key]}
            palette={palette}
            font={font}
          />
        ))}
      </div>

      {/* Acknowledgments footer */}
      {acks && (
        <footer
          className="px-[3%] py-[1.5%]"
          style={{
            background: palette.header,
            color: palette.surface,
            fontSize: "1.05cqw",
            lineHeight: 1.4,
          }}
        >
          <div
            className="uppercase tracking-widest mb-[0.3cqw] opacity-80"
            style={{ fontSize: "0.85cqw" }}
          >
            Acknowledgments
          </div>
          <div className="opacity-95">
            {content.sections[acks.key] || "Thank your mentor, host org, and program."}
          </div>
        </footer>
      )}
    </div>
  );
}

function TrifoldLayout({
  content,
  enabled,
  palette,
  font,
  format,
  mode,
}: {
  content: PosterContent;
  enabled: Section[];
  palette: Palette;
  font: FontPair;
  format: Format;
  mode: "full" | "cut-paste";
}) {
  if (!format.panels) return null;
  const { left, center, right } = format.panels;
  const total = left.w + center.w + right.w;
  const lPct = (left.w / total) * 100;
  const cPct = (center.w / total) * 100;
  const rPct = (right.w / total) * 100;

  // Distribute sections: roughly first third left, middle = title + most content, last third = right.
  const abstract = enabled.find((s) => s.key === "abstract");
  const acks = enabled.find((s) => s.key === "acknowledgments");
  const body = enabled.filter(
    (s) => s.key !== "abstract" && s.key !== "acknowledgments",
  );
  const leftSecs = body.slice(0, Math.ceil(body.length / 3));
  const rightSecs = body.slice(-Math.floor(body.length / 3) || body.length);
  const centerSecs = body.slice(leftSecs.length, body.length - rightSecs.length);

  return (
    <div
      className="w-full h-full grid"
      style={{
        gridTemplateColumns: `${lPct}% ${cPct}% ${rPct}%`,
        containerType: "inline-size",
      }}
    >
      {/* Left panel */}
      <div
        className="p-[3%] space-y-[2cqw] border-r border-dashed"
        style={{ borderColor: `${palette.muted}55` }}
      >
        {leftSecs.map((s) => (
          <SectionBlock
            key={s.key}
            label={s.label}
            text={content.sections[s.key]}
            palette={palette}
            font={font}
          />
        ))}
      </div>

      {/* Center panel */}
      <div className="flex flex-col">
        <header
          className="px-[4%] py-[3%]"
          style={{ background: palette.header, color: palette.surface }}
        >
          <div
            className="leading-[1.05] font-bold"
            style={{
              fontFamily: `'${font.display}', serif`,
              fontSize: "3.6cqw",
            }}
          >
            {content.title || "Your Project Title"}
          </div>
          {content.subtitle && (
            <div className="mt-[0.6cqw]" style={{ fontSize: "1.4cqw", opacity: 0.9 }}>
              {content.subtitle}
            </div>
          )}
          <div
            className="mt-[1cqw] flex flex-wrap gap-x-[1.6cqw] gap-y-[0.3cqw]"
            style={{ fontSize: "1cqw", opacity: 0.85 }}
          >
            {content.authors && <span>{content.authors}</span>}
            {content.mentor && <span>Mentor: {content.mentor}</span>}
            {content.organization && <span>{content.organization}</span>}
          </div>
        </header>
        {abstract && (
          <div
            className="mx-[4%] mt-[3%] p-[1.4cqw]"
            style={{
              background: palette.surface,
              borderLeft: `0.5cqw solid ${palette.accent}`,
              fontSize: "1.15cqw",
              lineHeight: 1.5,
            }}
          >
            <div
              className="uppercase tracking-widest mb-[0.3cqw]"
              style={{ fontSize: "0.85cqw", color: palette.muted }}
            >
              Abstract
            </div>
            <div>
              {content.sections[abstract.key] || (
                <span style={{ color: palette.muted, fontStyle: "italic" }}>
                  Your abstract will appear here.
                </span>
              )}
            </div>
          </div>
        )}
        <div className="flex-1 px-[4%] py-[3%] space-y-[2cqw] overflow-hidden">
          {centerSecs.map((s) => (
            <SectionBlock
              key={s.key}
              label={s.label}
              text={content.sections[s.key]}
              palette={palette}
              font={font}
            />
          ))}
        </div>
        {acks && (
          <footer
            className="px-[4%] py-[1.5%]"
            style={{
              background: palette.header,
              color: palette.surface,
              fontSize: "0.95cqw",
              lineHeight: 1.4,
            }}
          >
            <div
              className="uppercase tracking-widest mb-[0.2cqw] opacity-80"
              style={{ fontSize: "0.75cqw" }}
            >
              Acknowledgments
            </div>
            <div className="opacity-95">
              {content.sections[acks.key] || "Thank your mentor, host org, and program."}
            </div>
          </footer>
        )}
      </div>

      {/* Right panel */}
      <div
        className="p-[3%] space-y-[2cqw] border-l border-dashed"
        style={{ borderColor: `${palette.muted}55` }}
      >
        {rightSecs.map((s) => (
          <SectionBlock
            key={s.key}
            label={s.label}
            text={content.sections[s.key]}
            palette={palette}
            font={font}
          />
        ))}
      </div>
    </div>
  );
}

function SectionBlock({
  label,
  text,
  palette,
  font,
}: {
  label: string;
  text?: string;
  palette: Palette;
  font: FontPair;
}) {
  return (
    <div>
      <div
        className="uppercase tracking-widest font-semibold"
        style={{
          fontFamily: `'${font.display}', serif`,
          color: palette.header,
          fontSize: "1.15cqw",
          borderBottom: `0.15cqw solid ${palette.accent}`,
          paddingBottom: "0.3cqw",
          marginBottom: "0.5cqw",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "1.1cqw",
          lineHeight: 1.5,
          color: text ? palette.text : palette.muted,
          fontStyle: text ? "normal" : "italic",
          whiteSpace: "pre-wrap",
        }}
      >
        {text || `Your ${label.toLowerCase()} will appear here.`}
      </div>
    </div>
  );
}
