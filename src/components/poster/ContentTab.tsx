import { useMemo, useState } from "react";
import scaffolding from "@/data/poster/scaffolding.json";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Lock, Lightbulb, Quote, Image as ImageIcon } from "lucide-react";
import type { PosterContent } from "@/types/poster";
import { cn } from "@/lib/utils";
import { VisualsEditor } from "./VisualsEditor";

type Section = {
  key: string;
  label: string;
  order: number;
  required: boolean;
  wordMin: number;
  wordMax: number;
  prompt: string;
  tips: string[];
  example: string;
};

interface ContentTabProps {
  content: PosterContent;
  onChange: (patch: Partial<PosterContent>) => void;
  projectId: string;
}

function countWords(s: string): number {
  const t = s.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

export function ContentTab({ content, onChange, projectId }: ContentTabProps) {
  const sections = useMemo(
    () =>
      ([...(scaffolding.sections as Section[])]).sort((a, b) => a.order - b.order),
    [],
  );

  const enabledSet = useMemo(
    () => new Set(content.enabledSections),
    [content.enabledSections],
  );

  // Default to first enabled section.
  const firstEnabled =
    sections.find((s) => enabledSet.has(s.key))?.key ?? sections[0].key;
  const [activeKey, setActiveKey] = useState<string>(firstEnabled);

  const active = sections.find((s) => s.key === activeKey) ?? sections[0];
  const activeText = content.sections[active.key] ?? "";
  const activeWordCount = countWords(activeText);

  const updateSectionText = (key: string, value: string) => {
    onChange({ sections: { ...content.sections, [key]: value } });
  };

  const toggleSection = (key: string, enabled: boolean) => {
    const section = sections.find((s) => s.key === key);
    if (!section) return;
    if (section.required) return; // cannot disable required sections
    const next = enabled
      ? Array.from(new Set([...content.enabledSections, key]))
      : content.enabledSections.filter((k) => k !== key);
    onChange({ enabledSections: next });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      {/* Section list */}
      <aside>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
          Sections
        </div>
        <ol className="space-y-1">
          {sections.map((s) => {
            const enabled = enabledSet.has(s.key);
            const wc = countWords(content.sections[s.key] ?? "");
            const meets = enabled && wc >= s.wordMin;
            const visualCount = content.visuals.filter((v) => v.section === s.key).length;
            const isActive = s.key === activeKey;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setActiveKey(s.key)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm flex items-start gap-2 transition-colors border",
                    isActive
                      ? "bg-accent border-border text-foreground"
                      : "border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    !enabled && "opacity-50",
                  )}
                >
                  <span className="font-mono text-[10px] mt-0.5 w-4 shrink-0">
                    {s.order}.
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{s.label}</span>
                    <span className="block text-[10px] text-muted-foreground/80 mt-0.5 flex items-center gap-1.5">
                      <span>
                        {enabled ? `${wc} / ${s.wordMin}–${s.wordMax} words` : "Off"}
                      </span>
                      {visualCount > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <ImageIcon className="w-2.5 h-2.5" />
                          {visualCount}
                        </span>
                      )}
                    </span>
                  </span>
                  {meets ? (
                    <Check className="w-3.5 h-3.5 text-foreground/60 mt-0.5 shrink-0" />
                  ) : s.required ? (
                    <Lock className="w-3 h-3 text-muted-foreground/60 mt-1 shrink-0" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      {/* Editor + coaching */}
      <div className="space-y-6 min-w-0">
        <header className="flex items-start justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Section {active.order}
              {active.required ? " · Required" : " · Optional"}
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground mt-1">
              {active.label}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-prose">
              {active.prompt}
            </p>
          </div>
          {!active.required && (
            <div className="flex items-center gap-2 shrink-0 pt-1">
              <Label htmlFor={`enable-${active.key}`} className="text-xs text-muted-foreground">
                Include
              </Label>
              <Switch
                id={`enable-${active.key}`}
                checked={enabledSet.has(active.key)}
                onCheckedChange={(v) => toggleSection(active.key, v)}
              />
            </div>
          )}
        </header>

        {!enabledSet.has(active.key) ? (
          <div className="rounded-md border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              This section is turned off and won't appear on your poster.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => toggleSection(active.key, true)}
            >
              Include this section
            </Button>
          </div>
        ) : (
          <>
            <div>
              <Textarea
                value={activeText}
                onChange={(e) => updateSectionText(active.key, e.target.value)}
                placeholder={`Draft your ${active.label.toLowerCase()} here…`}
                className="min-h-[260px] text-sm leading-relaxed font-serif resize-y"
              />
              <div className="mt-2 flex items-center justify-between text-xs">
                <WordCountStatus
                  count={activeWordCount}
                  min={active.wordMin}
                  max={active.wordMax}
                />
                <span className="text-muted-foreground">
                  Target: {active.wordMin}–{active.wordMax} words
                </span>
              </div>
            </div>

            {/* Coaching */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Tips
                </div>
                <ul className="mt-3 space-y-2 text-sm text-foreground/90">
                  {active.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-muted-foreground/60 select-none">—</span>
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                  <Quote className="w-3.5 h-3.5" />
                  Example
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/80 font-serif italic">
                  {active.example}
                </p>
              </div>
            </div>

            <VisualsEditor
              projectId={projectId}
              sectionKey={active.key}
              content={content}
              onChange={onChange}
            />
          </>
        )}
      </div>
    </div>
  );
}

function WordCountStatus({
  count,
  min,
  max,
}: {
  count: number;
  min: number;
  max: number;
}) {
  let label: string;
  let tone: "muted" | "ok" | "warn";
  if (count === 0) {
    label = "Empty";
    tone = "muted";
  } else if (count < min) {
    label = `${count} words · keep going`;
    tone = "warn";
  } else if (count > max) {
    label = `${count} words · trim a little`;
    tone = "warn";
  } else {
    label = `${count} words · on target`;
    tone = "ok";
  }
  return (
    <span
      className={cn(
        "font-mono",
        tone === "muted" && "text-muted-foreground",
        tone === "ok" && "text-foreground",
        tone === "warn" && "text-foreground/70",
      )}
    >
      {label}
    </span>
  );
}
