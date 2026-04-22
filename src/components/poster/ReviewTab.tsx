import { useMemo } from "react";
import scaffolding from "@/data/poster/scaffolding.json";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, AlertTriangle, X } from "lucide-react";
import type { PosterContent } from "@/types/poster";
import { cn } from "@/lib/utils";

type Status = "ok" | "warn" | "fail";
type Item = { label: string; status: Status; note?: string };

interface ReviewTabProps {
  content: PosterContent;
  onChange: (patch: Partial<PosterContent>) => void;
}

function countWords(s: string): number {
  const t = (s ?? "").trim();
  return t ? t.split(/\s+/).length : 0;
}

export function ReviewTab({ content, onChange }: ReviewTabProps) {
  const sections = scaffolding.sections as Array<{
    key: string;
    label: string;
    wordMin: number;
    required: boolean;
  }>;

  const items: Item[] = useMemo(() => {
    const list: Item[] = [];

    // Title
    const titleWords = countWords(content.title);
    list.push({
      label: "Title is present and ≤ 20 words",
      status: titleWords === 0 ? "fail" : titleWords > 20 ? "warn" : "ok",
      note: titleWords === 0 ? "Add a title" : `${titleWords} words`,
    });

    // Authors / mentor
    list.push({
      label: "Authors and mentor filled",
      status:
        content.authors.trim() && content.mentor.trim()
          ? "ok"
          : !content.authors.trim() && !content.mentor.trim()
            ? "fail"
            : "warn",
    });

    // Each enabled section meets word minimum
    const enabled = sections.filter((s) => content.enabledSections.includes(s.key));
    enabled.forEach((s) => {
      const w = countWords(content.sections[s.key] ?? "");
      list.push({
        label: `${s.label} reaches ${s.wordMin}+ words`,
        status: w === 0 ? "fail" : w < s.wordMin ? "warn" : "ok",
        note: `${w} / ${s.wordMin}`,
      });
    });

    // At least one visual has a caption
    const hasCaptioned = content.visuals.some((v) => v.caption.trim().length > 0);
    list.push({
      label: "At least one visual has a caption",
      status: content.visuals.length === 0 ? "warn" : hasCaptioned ? "ok" : "warn",
      note:
        content.visuals.length === 0
          ? "No visuals yet"
          : hasCaptioned
            ? undefined
            : "Captions help readers",
    });

    // No low-res visuals
    const lowRes = content.visuals.filter((v) => v.width > 0 && v.width < 800);
    list.push({
      label: "No low-resolution visuals remain",
      status: lowRes.length === 0 ? "ok" : "warn",
      note: lowRes.length ? `${lowRes.length} under 800px wide` : undefined,
    });

    // Acknowledgments
    const acks = countWords(content.sections.acknowledgments ?? "");
    list.push({
      label: "Acknowledgments filled",
      status: acks === 0 ? "fail" : acks < 15 ? "warn" : "ok",
      note: `${acks} words`,
    });

    return list;
  }, [content, sections]);

  const counts = useMemo(() => {
    return items.reduce(
      (acc, it) => {
        acc[it.status]++;
        return acc;
      },
      { ok: 0, warn: 0, fail: 0 } as Record<Status, number>,
    );
  }, [items]);

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Pre-flight
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mt-1">
          Review your poster
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Quiet checks before you export. Nothing here is a hard block —
          warnings are advice, not errors.
        </p>
        <div className="mt-4 flex gap-3 text-xs text-muted-foreground">
          <span>{counts.ok} ready</span>
          <span className="opacity-40">·</span>
          <span>{counts.warn} to review</span>
          <span className="opacity-40">·</span>
          <span>{counts.fail} missing</span>
        </div>
      </header>

      <ul className="rounded-md border border-border divide-y divide-border bg-card">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-3 px-4 py-3">
            <StatusIcon status={it.status} />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-foreground">{it.label}</div>
              {it.note && (
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {it.note}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <section className="rounded-md border border-border bg-card p-5">
        <Label
          htmlFor="so-what"
          className="text-[10px] uppercase tracking-widest text-muted-foreground"
        >
          Self-check · doesn't appear on the poster
        </Label>
        <h3 className="text-base font-semibold text-foreground mt-1">
          So what?
        </h3>
        <p className="text-sm text-muted-foreground mt-1 mb-3">
          {scaffolding.soWhatPrompt}
        </p>
        <Textarea
          id="so-what"
          value={content.soWhat}
          onChange={(e) => onChange({ soWhat: e.target.value })}
          placeholder="In one sentence…"
          className="min-h-[80px] text-sm"
        />
      </section>
    </div>
  );
}

function StatusIcon({ status }: { status: Status }) {
  const Icon = status === "ok" ? Check : status === "warn" ? AlertTriangle : X;
  return (
    <span
      className={cn(
        "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0",
        status === "ok" && "bg-foreground text-background",
        status === "warn" && "bg-muted text-foreground border border-border",
        status === "fail" && "bg-muted text-muted-foreground border border-border",
      )}
    >
      <Icon className="w-3 h-3" />
    </span>
  );
}
