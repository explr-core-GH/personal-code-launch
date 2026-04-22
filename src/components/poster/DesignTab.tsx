import { useMemo } from "react";
import designTokens from "@/data/poster/design-tokens.json";
import type { PosterContent } from "@/types/poster";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Format = {
  key: string;
  name: string;
  label: string;
  kind: "poster" | "trifold";
  width?: number;
  height?: number;
  panels?: { left: { w: number; h: number }; center: { w: number; h: number }; right: { w: number; h: number } };
};
type Template = { key: string; name: string; description: string; supportedFormats: string[] };
type Palette = { key: string; name: string; header: string; accent: string; surface: string; bg: string; text: string; muted: string };
type FontPair = { key: string; name: string; display: string; body: string };

interface DesignTabProps {
  content: PosterContent;
  onChange: (patch: Partial<PosterContent>) => void;
}

export function DesignTab({ content, onChange }: DesignTabProps) {
  const formats = designTokens.formats as Format[];
  const templates = designTokens.templates as Template[];
  const palettes = designTokens.palettes as Palette[];
  const fonts = designTokens.fontPairs as FontPair[];

  const supportedTemplates = useMemo(
    () => templates.filter((t) => t.supportedFormats.includes(content.format)),
    [templates, content.format],
  );

  const setFormat = (key: string) => {
    // If current template doesn't support new format, fall back to first supported.
    const current = templates.find((t) => t.key === content.design.template);
    const stillOk = current?.supportedFormats.includes(key);
    const fallback = templates.find((t) => t.supportedFormats.includes(key))?.key;
    onChange({
      format: key,
      design: {
        ...content.design,
        template: stillOk ? content.design.template : (fallback ?? content.design.template),
      },
    });
  };

  return (
    <div className="space-y-10 max-w-3xl">
      {/* Format */}
      <Section
        title="Format"
        eyebrow="Step A"
        description="Pick the physical size and orientation. This drives the preview and the export dimensions."
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {formats.map((f) => {
            const selected = content.format === f.key;
            return (
              <SwatchTile
                key={f.key}
                selected={selected}
                onClick={() => setFormat(f.key)}
                aria-label={f.name}
              >
                <FormatThumb format={f} />
                <div className="mt-2">
                  <div className="text-sm font-medium text-foreground">{f.name}</div>
                  <div className="text-[11px] text-muted-foreground">{f.label}</div>
                </div>
              </SwatchTile>
            );
          })}
        </div>
      </Section>

      {/* Template */}
      <Section
        title="Template"
        eyebrow="Step B"
        description="Layout system. Academic is the safest choice; Editorial leans magazine-like."
      >
        <div className="grid sm:grid-cols-2 gap-3">
          {supportedTemplates.map((t) => {
            const selected = content.design.template === t.key;
            return (
              <SwatchTile
                key={t.key}
                selected={selected}
                onClick={() =>
                  onChange({ design: { ...content.design, template: t.key } })
                }
                aria-label={t.name}
              >
                <TemplateThumb templateKey={t.key} />
                <div className="mt-2">
                  <div className="text-sm font-medium text-foreground">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground leading-snug">
                    {t.description}
                  </div>
                </div>
              </SwatchTile>
            );
          })}
        </div>
      </Section>

      {/* Palette */}
      <Section
        title="Palette"
        eyebrow="Step C"
        description="Color is what makes a poster feel finished. Pick one and commit."
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {palettes.map((p) => {
            const selected = content.design.palette === p.key;
            return (
              <SwatchTile
                key={p.key}
                selected={selected}
                onClick={() =>
                  onChange({ design: { ...content.design, palette: p.key } })
                }
                aria-label={p.name}
              >
                <PaletteThumb palette={p} />
                <div className="mt-2 text-sm font-medium text-foreground truncate">
                  {p.name}
                </div>
              </SwatchTile>
            );
          })}
        </div>
      </Section>

      {/* Typography */}
      <Section
        title="Typography"
        eyebrow="Step D"
        description="Display font sets the tone of your title; body font carries everything else."
      >
        <div className="grid sm:grid-cols-2 gap-3">
          {fonts.map((fp) => {
            const selected = content.design.fontPair === fp.key;
            return (
              <SwatchTile
                key={fp.key}
                selected={selected}
                onClick={() =>
                  onChange({ design: { ...content.design, fontPair: fp.key } })
                }
                aria-label={fp.name}
              >
                <div
                  className="px-4 py-5 rounded-sm border border-border bg-card"
                  style={{ fontFamily: `'${fp.display}', serif` }}
                >
                  <div className="text-2xl leading-none text-foreground">Aa</div>
                  <div
                    className="text-[11px] text-muted-foreground mt-2"
                    style={{ fontFamily: `'${fp.body}', sans-serif` }}
                  >
                    The quick brown fox.
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-sm font-medium text-foreground">{fp.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {fp.display} · {fp.body}
                  </div>
                </div>
              </SwatchTile>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

/* ---------- Building blocks ---------- */

function Section({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-4">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-foreground mt-1">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-prose">
          {description}
        </p>
      </header>
      {children}
    </section>
  );
}

function SwatchTile({
  selected,
  onClick,
  children,
  ...rest
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative text-left p-3 rounded-md border transition-colors group",
        selected
          ? "border-foreground bg-accent"
          : "border-border bg-card hover:border-foreground/40",
      )}
      {...rest}
    >
      {selected && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center">
          <Check className="w-3 h-3" />
        </span>
      )}
      {children}
    </button>
  );
}

function FormatThumb({ format }: { format: Format }) {
  // Render a small proportional rectangle inside a fixed box.
  const boxW = 88;
  const boxH = 64;
  if (format.kind === "poster" && format.width && format.height) {
    const ratio = format.width / format.height;
    const maxW = boxW;
    const maxH = boxH;
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    return (
      <div className="h-16 flex items-center justify-center bg-muted/50 rounded-sm">
        <div
          className="bg-card border border-border"
          style={{ width: `${w}px`, height: `${h}px` }}
        />
      </div>
    );
  }
  if (format.kind === "trifold" && format.panels) {
    const totalW = format.panels.left.w + format.panels.center.w + format.panels.right.w;
    const totalH = format.panels.center.h;
    const ratio = totalW / totalH;
    let w = boxW;
    let h = w / ratio;
    if (h > boxH) {
      h = boxH;
      w = h * ratio;
    }
    const lW = (format.panels.left.w / totalW) * w;
    const cW = (format.panels.center.w / totalW) * w;
    const rW = (format.panels.right.w / totalW) * w;
    return (
      <div className="h-16 flex items-center justify-center bg-muted/50 rounded-sm">
        <div className="flex" style={{ height: `${h}px` }}>
          <div className="bg-card border border-border" style={{ width: `${lW}px` }} />
          <div className="bg-card border-y border-r border-border" style={{ width: `${cW}px` }} />
          <div className="bg-card border-y border-r border-border" style={{ width: `${rW}px` }} />
        </div>
      </div>
    );
  }
  return <div className="h-16 bg-muted/50 rounded-sm" />;
}

function TemplateThumb({ templateKey }: { templateKey: string }) {
  if (templateKey === "academic") {
    return (
      <div className="h-20 rounded-sm bg-muted/50 p-2 flex flex-col gap-1.5">
        <div className="h-3 bg-foreground/70 rounded-[1px]" />
        <div className="flex-1 grid grid-cols-3 gap-1">
          <div className="bg-card border border-border rounded-[1px]" />
          <div className="bg-card border border-border rounded-[1px]" />
          <div className="bg-card border border-border rounded-[1px]" />
        </div>
      </div>
    );
  }
  // editorial
  return (
    <div className="h-20 rounded-sm bg-muted/50 p-2 flex gap-1.5">
      <div className="flex-1 flex flex-col gap-1">
        <div className="h-4 w-3/4 bg-foreground/70 rounded-[1px]" />
        <div className="h-1.5 w-1/2 bg-foreground/30 rounded-[1px]" />
        <div className="flex-1 bg-card border border-border rounded-[1px] mt-1" />
      </div>
      <div className="w-1/3 bg-card border border-border rounded-[1px]" />
    </div>
  );
}

function PaletteThumb({ palette }: { palette: Palette }) {
  return (
    <div className="h-16 rounded-sm overflow-hidden border border-border flex">
      <div className="flex-1" style={{ background: palette.header }} />
      <div className="w-4" style={{ background: palette.accent }} />
      <div className="flex-1" style={{ background: palette.bg }} />
      <div className="w-4" style={{ background: palette.text }} />
    </div>
  );
}
