import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import scaffolding from "@/data/poster/scaffolding.json";
import type { PosterContent, ProjectType } from "@/types/poster";

interface Props {
  content: PosterContent;
  onChange: (patch: Partial<PosterContent>) => void;
}

const PROJECT_TYPES: { value: ProjectType; label: string; hint: string }[] = [
  { value: "build", label: "Build", hint: "I made a thing — hardware, software, prototype." },
  { value: "data", label: "Data", hint: "I analyzed a dataset and looked for patterns." },
  { value: "research", label: "Research", hint: "I investigated a question through reading and inquiry." },
  { value: "design", label: "Design", hint: "I designed an experience, product, or system." },
  { value: "other", label: "Other", hint: "Something else — pick this if nothing fits." },
];

export function ProjectInfoTab({ content, onChange }: Props) {
  const onProjectTypeChange = (value: ProjectType) => {
    // Picking a project type pre-enables that kit's default sections.
    const kits = scaffolding.projectTypeSectionKits as unknown as Record<string, string[]>;
    const defaultEnabled = kits[value] ?? content.enabledSections;
    onChange({ projectType: value, enabledSections: defaultEnabled });
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Project info
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          The basic facts about your project and who made it. These appear in the
          poster's title block.
        </p>
      </div>

      <div className="space-y-5">
        <Field label="Title" hint="8–15 words. Specific, not clever.">
          <Input
            value={content.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Low-Cost Soil Moisture Sensors for Community Gardens"
          />
        </Field>

        <Field label="Subtitle" hintRight="Optional">
          <Input
            value={content.subtitle}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="A pilot with Cleveland community garden partners"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Author(s)">
            <Input
              value={content.authors}
              onChange={(e) => onChange({ authors: e.target.value })}
              placeholder="Alex Rivera"
            />
          </Field>
          <Field label="School">
            <Input
              value={content.school}
              onChange={(e) => onChange({ school: e.target.value })}
              placeholder="John Hay High School"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Mentor">
            <Input
              value={content.mentor}
              onChange={(e) => onChange({ mentor: e.target.value })}
              placeholder="Jane Doe, Senior Engineer"
            />
          </Field>
          <Field label="Host organization">
            <Input
              value={content.organization}
              onChange={(e) => onChange({ organization: e.target.value })}
              placeholder="MAGNET / Rid-All Green Partnership"
            />
          </Field>
        </div>

        <Field label="Date range">
          <Input
            value={content.dateRange}
            onChange={(e) => onChange({ dateRange: e.target.value })}
            placeholder="Summer 2026"
          />
        </Field>

        <Field
          label="Project type"
          hint="This pre-selects the right writing sections for your project. You can override later."
        >
          <Select
            value={content.projectType}
            onValueChange={(v) => onProjectTypeChange(v as ProjectType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <span className="font-medium">{t.label}</span>
                  <span className="text-muted-foreground ml-2">— {t.hint}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  hintRight,
  children,
}: {
  label: string;
  hint?: string;
  hintRight?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </Label>
        {hintRight && (
          <span className="text-[11px] text-muted-foreground">{hintRight}</span>
        )}
      </div>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}
