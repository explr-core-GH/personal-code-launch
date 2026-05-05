import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Header } from "@/components/wbl/Header";

// ============================================================
// Program RIASEC Coder — tags EXPLR programs with RIASEC profiles.
// Data persists to browser localStorage. To swap for Supabase:
// replace loadIndex/saveIndex/loadProgram/saveProgram/deleteProgram
// with backend calls — keep the same function signatures.
// TODO: future improvement — unify O*NET skills with SKILL_LIBRARY
// from ProgramProfileBuilder.tsx once we know which taxonomy to keep.
// ============================================================

const RIASEC_LETTERS = ["R", "I", "A", "S", "E", "C"] as const;
type RiasecLetter = typeof RIASEC_LETTERS[number];
type RiasecProfile = Record<RiasecLetter, number>;

const RIASEC_COLORS: Record<RiasecLetter, string> = {
  R: "#8B5A2B", I: "#2D5F8B", A: "#C5526E", S: "#D4A24C", E: "#6B3FA0", C: "#5D7B92",
};
const RIASEC_NAMES: Record<RiasecLetter, string> = {
  R: "Realistic", I: "Investigative", A: "Artistic", S: "Social", E: "Enterprising", C: "Conventional",
};
const RIASEC_DEFINITIONS: Record<RiasecLetter, string> = {
  R: "Hands-on physical work with materials, tools, or machines. Building, fixing, operating equipment. Includes operating digital tools that function as making instruments (CAD, code editors, 3D printers).",
  I: "Analyzing, problem-solving, hypothesis-testing, researching, figuring out how things work. The diagnostic and analytical mode.",
  A: "Creative expression, aesthetic decisions, design under ambiguity, originality. Tasks where the student is making creative choices that have no single right answer.",
  S: "Working with and through people in a helping, teaching, or coordinating mode. Genuine team-based collaboration counts. Working alongside peers does not.",
  E: "Persuading, presenting, selling, leading, competing. Public-facing work where the student is performing or pitching to an audience.",
  C: "Organizing, recording, following procedures, attention to detail, structure, data management. Procedural learning of a tool falls partly here.",
};

const ONET_SKILLS = [
  "Active Learning","Active Listening","Complex Problem Solving","Coordination",
  "Critical Thinking","Equipment Maintenance","Equipment Selection","Installation",
  "Instructing","Judgment and Decision Making","Learning Strategies","Management of Financial Resources",
  "Management of Material Resources","Management of Personnel Resources","Mathematics","Monitoring",
  "Negotiation","Operation and Control","Operations Analysis","Operations Monitoring",
  "Originality","Persuasion","Programming","Quality Control Analysis","Reading Comprehension",
  "Repairing","Science","Service Orientation","Social Perceptiveness","Speaking",
  "Systems Analysis","Systems Evaluation","Technology Design","Time Management",
  "Troubleshooting","Visualization","Writing",
];

const CAREER_CLUSTERS = [
  "Agriculture, Food & Natural Resources","Architecture & Construction",
  "Arts, A/V Technology & Communications","Business Management & Administration",
  "Education & Training","Finance","Government & Public Administration",
  "Health Science","Hospitality & Tourism","Human Services","Information Technology",
  "Law, Public Safety, Corrections & Security","Manufacturing","Marketing","STEM",
  "Transportation, Distribution & Logistics",
];

const DIFFICULTY_OPTIONS = ["Intro","Intermediate","Intermediate-Advanced","Advanced"];
const SOCIAL_STRUCTURE_OPTIONS = ["Individual","Individual + peer feedback","Small team (2-4)","Large group","Individual paths + cohort"];
const OUTPUT_TYPE_OPTIONS = ["Physical artifact","Digital artifact","Performance","Knowledge","Functional artifact + performance","Physical artifact + presentation","Digital artifact + presentation"];
const CULMINATING_OPTIONS = ["None","Reflection only","Peer share","Presentation to guests","Showcase","Competition","Mission run","Public showcase"];
const FORMAT_OPTIONS = ["Camp","Internship","League","Course","Workshop","After-school program"];
const AGE_BAND_OPTIONS = ["MS (6-8)","HS (9-12)","K-2","3-5","Mixed K-12"];

type Activity = {
  id: string;
  name: string;
  timePct: number;
  weights: RiasecProfile;
  notes?: string;
};

type Program = {
  id: string;
  name: string;
  ageBand: string;
  duration: string;
  formatType: string;
  hasBranchingPaths: boolean;
  branchingPathsNote: string;
  activities: Activity[];
  skills: string[];
  primaryCluster: string;
  secondaryClusters: string[];
  difficulty: string;
  socialStructure: string;
  outputType: string;
  culminatingEvent: string;
  notes: string;
  updatedAt?: string;
};

const SEED_PROGRAMS: Program[] = [
  {
    id: "FF", name: "FashionForge", ageBand: "MS (6-8)", duration: "1 week",
    formatType: "Camp", hasBranchingPaths: false, branchingPathsNote: "",
    activities: [
      { id: "FF-01", name: "Inspiration & research (mood boards, style ID)", timePct: 10, weights: {R:5,I:20,A:70,S:3,E:1,C:1}, notes: "Mostly Artistic with some Investigative analysis." },
      { id: "FF-02", name: "TinkerCAD instruction & tool learning", timePct: 20, weights: {R:40,I:20,A:10,S:3,E:2,C:25}, notes: "Procedural tool learning." },
      { id: "FF-03", name: "Design work in CAD (main design phase)", timePct: 35, weights: {R:35,I:20,A:35,S:1,E:1,C:8}, notes: "Heavy A-R split." },
      { id: "FF-04", name: "Iteration & 3D printing", timePct: 15, weights: {R:45,I:30,A:8,S:1,E:1,C:15}, notes: "Test-fail-fix cycles." },
      { id: "FF-05", name: "Finishing & presentation to guests", timePct: 15, weights: {R:41,I:8,A:27,S:8,E:12,C:4}, notes: "Internal split: ~10% finishing, ~5% public presentation." },
      { id: "FF-06", name: "Reflection & peer feedback", timePct: 5, weights: {R:0,I:30,A:20,S:40,E:5,C:5}, notes: "Peer feedback drives Social weight." },
    ],
    skills: ["Operations Analysis","Visualization","Active Learning","Complex Problem Solving","Originality"],
    primaryCluster: "Arts, A/V Technology & Communications",
    secondaryClusters: ["Manufacturing","Information Technology"],
    difficulty: "Intermediate", socialStructure: "Individual + peer feedback",
    outputType: "Physical artifact + presentation", culminatingEvent: "Presentation to guests",
    notes: "Stealth Realistic program with Artistic on-ramp. Strong counter-circumscription program for girls with moderate Realistic interests.",
  },
  {
    id: "SP", name: "SeaPerch ROV", ageBand: "MS (6-8)", duration: "5 days",
    formatType: "Camp", hasBranchingPaths: false, branchingPathsNote: "",
    activities: [
      { id: "SP-01", name: "Introduction to ROVs / engineering / buoyancy", timePct: 5, weights: {R:20,I:60,A:5,S:10,E:2,C:3}, notes: "Concept-heavy intro session." },
      { id: "SP-02", name: "PVC frame construction", timePct: 18, weights: {R:70,I:8,A:5,S:2,E:0,C:15}, notes: "Pure Realistic with Conventional measurement." },
      { id: "SP-03", name: "Electrical & motor assembly + soldering", timePct: 22, weights: {R:50,I:25,A:3,S:2,E:0,C:20}, notes: "Hands-on circuit work." },
      { id: "SP-04", name: "Waterproofing & seal testing", timePct: 7, weights: {R:65,I:8,A:1,S:1,E:0,C:25}, notes: "Procedural Realistic work." },
      { id: "SP-05", name: "Initial water testing & debugging", timePct: 13, weights: {R:40,I:45,A:1,S:8,E:1,C:5}, notes: "Heavy Investigative." },
      { id: "SP-06", name: "Mission challenges & iteration (team)", timePct: 20, weights: {R:30,I:35,A:3,S:25,E:2,C:5}, notes: "Team-based problem-solving." },
      { id: "SP-07", name: "Final competition / mission run", timePct: 10, weights: {R:35,I:10,A:3,S:25,E:25,C:2}, notes: "Competition adds Enterprising." },
      { id: "SP-08", name: "Reflection & documentation", timePct: 5, weights: {R:2,I:35,A:5,S:35,E:3,C:20}, notes: "Team debrief." },
    ],
    skills: ["Troubleshooting","Operation and Control","Complex Problem Solving","Coordination","Operations Analysis"],
    primaryCluster: "STEM",
    secondaryClusters: ["Manufacturing","Transportation, Distribution & Logistics"],
    difficulty: "Intermediate-Advanced", socialStructure: "Small team (2-4)",
    outputType: "Functional artifact + performance", culminatingEvent: "Competition",
    notes: "Team-based engineering. R-leaning students who also need social/team structure.",
  },
  {
    id: "AID", name: "AI Deep Dive", ageBand: "HS (9-12)", duration: "6 weeks",
    formatType: "Internship", hasBranchingPaths: true,
    branchingPathsNote: "Four AI platform paths. Profile is the average across paths.",
    activities: [
      { id: "AID-01", name: "Onboarding & AI fundamentals", timePct: 10, weights: {R:15,I:50,A:3,S:20,E:2,C:10}, notes: "Cohort discussion adds Social." },
      { id: "AID-02", name: "Platform learning & tutorials", timePct: 20, weights: {R:40,I:30,A:5,S:3,E:2,C:20}, notes: "Operating digital platforms." },
      { id: "AID-03", name: "Exploratory experiments / prompt engineering", timePct: 15, weights: {R:30,I:45,A:15,S:3,E:2,C:5}, notes: "Investigative-dominant capability testing." },
      { id: "AID-04", name: "Project ideation & scoping", timePct: 10, weights: {R:2,I:35,A:30,S:10,E:15,C:8}, notes: "Creative problem framing." },
      { id: "AID-05", name: "Project building & development", timePct: 25, weights: {R:40,I:35,A:7,S:2,E:1,C:15}, notes: "Main build phase." },
      { id: "AID-06", name: "Iteration & debugging", timePct: 10, weights: {R:35,I:50,A:1,S:5,E:1,C:8}, notes: "Heavy Investigative." },
      { id: "AID-07", name: "Final presentation / showcase", timePct: 7, weights: {R:5,I:10,A:20,S:25,E:35,C:5}, notes: "Public presentation." },
      { id: "AID-08", name: "Reflection & career exploration", timePct: 3, weights: {R:2,I:30,A:3,S:40,E:15,C:10}, notes: "Career conversations." },
    ],
    skills: ["Active Learning","Complex Problem Solving","Programming","Critical Thinking","Systems Analysis"],
    primaryCluster: "Information Technology",
    secondaryClusters: ["STEM","Business Management & Administration"],
    difficulty: "Advanced", socialStructure: "Individual paths + cohort",
    outputType: "Digital artifact + presentation", culminatingEvent: "Public showcase",
    notes: "First I-dominant program. 6-week paid internship structure.",
  },
];

// ============================================================
// Storage layer (localStorage). Swap with Supabase in future.
// ============================================================
const STORAGE_PREFIX = "riasec_program:";
const INDEX_KEY = "riasec_program_index";

function migrateProgram(p: any): Program {
  return {
    id: p?.id ?? "",
    name: p?.name ?? "",
    ageBand: p?.ageBand ?? "MS (6-8)",
    duration: p?.duration ?? "",
    formatType: p?.formatType ?? "Camp",
    hasBranchingPaths: !!p?.hasBranchingPaths,
    branchingPathsNote: p?.branchingPathsNote ?? "",
    activities: Array.isArray(p?.activities) ? p.activities.map((a: any) => ({
      id: a?.id ?? "",
      name: a?.name ?? "",
      timePct: Number(a?.timePct) || 0,
      weights: {
        R: Number(a?.weights?.R) || 0, I: Number(a?.weights?.I) || 0,
        A: Number(a?.weights?.A) || 0, S: Number(a?.weights?.S) || 0,
        E: Number(a?.weights?.E) || 0, C: Number(a?.weights?.C) || 0,
      },
      notes: a?.notes ?? "",
    })) : [],
    skills: Array.isArray(p?.skills) ? p.skills : [],
    primaryCluster: p?.primaryCluster ?? "",
    secondaryClusters: Array.isArray(p?.secondaryClusters) ? p.secondaryClusters : [],
    difficulty: p?.difficulty ?? "Intermediate",
    socialStructure: p?.socialStructure ?? "Individual",
    outputType: p?.outputType ?? "Physical artifact",
    culminatingEvent: p?.culminatingEvent ?? "None",
    notes: p?.notes ?? "",
    updatedAt: p?.updatedAt ?? new Date().toISOString(),
  };
}

function loadIndex(): string[] {
  try { const raw = localStorage.getItem(INDEX_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveIndex(ids: string[]) {
  try { localStorage.setItem(INDEX_KEY, JSON.stringify(ids)); } catch { }
}
function loadProgram(id: string): Program | null {
  try { const raw = localStorage.getItem(STORAGE_PREFIX + id); return raw ? migrateProgram(JSON.parse(raw)) : null; } catch { return null; }
}
function saveProgram(p: Program) {
  try { localStorage.setItem(STORAGE_PREFIX + p.id, JSON.stringify({ ...p, updatedAt: new Date().toISOString() })); } catch { }
}
function deleteProgram(id: string) {
  try { localStorage.removeItem(STORAGE_PREFIX + id); } catch { }
}
function loadAllPrograms(): Program[] {
  const ids = loadIndex();
  if (!ids.length) return [];
  return ids.map(loadProgram).filter(Boolean) as Program[];
}
function persistAll(programs: Program[]) {
  saveIndex(programs.map((p) => p.id));
  programs.forEach(saveProgram);
}
function seedIfEmpty(): Program[] {
  if (!loadIndex().length) {
    persistAll(SEED_PROGRAMS);
    return SEED_PROGRAMS.map(migrateProgram);
  }
  return loadAllPrograms();
}

// ============================================================
// Pure compute
// ============================================================
const computeProfile = (program: Program): RiasecProfile => {
  const profile: RiasecProfile = { R:0,I:0,A:0,S:0,E:0,C:0 };
  for (const act of program.activities || []) {
    const time = Number(act.timePct) || 0;
    for (const l of RIASEC_LETTERS) {
      const w = Number(act.weights?.[l]) || 0;
      profile[l] += (time * w) / 100;
    }
  }
  return profile;
};
const computeTopCode = (profile: RiasecProfile) =>
  RIASEC_LETTERS.map((l) => ({ l, v: profile[l] })).sort((a,b) => b.v - a.v).slice(0,3).map((x) => x.l).join("");
const computeTimeTotal = (program: Program) =>
  (program.activities || []).reduce((s, a) => s + (Number(a.timePct) || 0), 0);
const computeActivityWeightSum = (a: Activity) =>
  RIASEC_LETTERS.reduce((s, l) => s + (Number(a.weights?.[l]) || 0), 0);
const newActivityId = (programId: string, existing: Activity[]) => {
  const nums = existing.map((a) => parseInt((a.id.split("-")[1] || "0"), 10)).filter((n) => !isNaN(n));
  return `${programId}-${String(nums.length ? Math.max(...nums) + 1 : 1).padStart(2, "0")}`;
};
const blankProgram = (): Program => ({
  id: "", name: "New Program", ageBand: "MS (6-8)", duration: "",
  formatType: "Camp", hasBranchingPaths: false, branchingPathsNote: "",
  activities: [], skills: [], primaryCluster: "", secondaryClusters: [],
  difficulty: "Intermediate", socialStructure: "Individual",
  outputType: "Physical artifact", culminatingEvent: "None", notes: "",
});

// ============================================================
// Radar charts
// ============================================================
const RiasecRadar = ({ profile, size = 280, color = "hsl(164 100% 21%)", label = "" }:
  { profile: RiasecProfile; size?: number; color?: string; label?: string }) => {
  const cx = size / 2, cy = size / 2, maxR = size * 0.35;
  const order = RIASEC_LETTERS;
  const angle = (i: number) => (Math.PI / 3) * i - Math.PI / 2;
  const point = (i: number, r: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) });
  const ringPoints = (frac: number) => order.map((_, i) => { const p = point(i, maxR * frac); return `${p.x},${p.y}`; }).join(" ");
  const dataPoints = order.map((l, i) => {
    const v = (profile[l] || 0) / 50;
    return point(i, Math.min(maxR, maxR * v));
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ") + " Z";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      {[0.25,0.5,0.75,1].map((f, idx) => (
        <polygon key={idx} points={ringPoints(f)} fill={idx === 3 ? "white" : "none"} stroke="hsl(214 32% 91%)" strokeWidth="1" />
      ))}
      {order.map((_, i) => { const p = point(i, maxR); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="hsl(214 32% 91%)" strokeWidth="1" />; })}
      <path d={dataPath} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={RIASEC_COLORS[order[i]]} stroke="white" strokeWidth="1.5" />
      ))}
      {order.map((l, i) => {
        const p = point(i, maxR + 22);
        return (
          <g key={l}>
            <text x={p.x} y={p.y - 2} textAnchor="middle" fontSize="13" fontWeight="700" fill={RIASEC_COLORS[l]} style={{ fontVariantNumeric: "tabular-nums" }}>{l}</text>
            <text x={p.x} y={p.y + 11} textAnchor="middle" fontSize="11" fill="hsl(215 16% 47%)" style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(profile[l] || 0)}</text>
          </g>
        );
      })}
      {label && <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="hsl(215 16% 47%)" letterSpacing="1.5" fontWeight="600">{label}</text>}
    </svg>
  );
};

const COMPARE_COLORS = ["hsl(164 100% 21%)", "#2D5F8B", "#C5526E", "#6B3FA0"];

const CompareRadar = ({ programs, size = 380 }: { programs: Program[]; size?: number }) => {
  const cx = size / 2, cy = size / 2, maxR = size * 0.32;
  const order = RIASEC_LETTERS;
  const angle = (i: number) => (Math.PI / 3) * i - Math.PI / 2;
  const point = (i: number, r: number) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) });
  const ringPoints = (frac: number) => order.map((_, i) => { const p = point(i, maxR * frac); return `${p.x},${p.y}`; }).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      {[0.25,0.5,0.75,1].map((f, idx) => (
        <polygon key={idx} points={ringPoints(f)} fill={idx === 3 ? "white" : "none"} stroke="hsl(214 32% 91%)" strokeWidth="1" />
      ))}
      {order.map((_, i) => { const p = point(i, maxR); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="hsl(214 32% 91%)" strokeWidth="1" />; })}
      {programs.map((prog, pIdx) => {
        const profile = computeProfile(prog);
        const dataPoints = order.map((l, i) => {
          const v = (profile[l] || 0) / 50;
          return point(i, Math.min(maxR, maxR * v));
        });
        const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ") + " Z";
        const color = COMPARE_COLORS[pIdx % COMPARE_COLORS.length];
        return (
          <g key={prog.id}>
            <path d={dataPath} fill={color} fillOpacity="0.12" stroke={color} strokeWidth="2" strokeLinejoin="round" />
            {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke="white" strokeWidth="1.5" />)}
          </g>
        );
      })}
      {order.map((l, i) => {
        const p = point(i, maxR + 24);
        return <text key={l} x={p.x} y={p.y + 4} textAnchor="middle" fontSize="14" fontWeight="700" fill={RIASEC_COLORS[l]}>{l}</text>;
      })}
    </svg>
  );
};

// ============================================================
// Inline styles for activity grid + fade-in
// ============================================================
const STYLES = `
.riasec-fade-in { animation: riasecFadeIn 0.3s ease-out; }
@keyframes riasecFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.riasec-card-hover { transition: all 0.2s ease-out; }
.riasec-card-hover:hover { transform: translateY(-2px); border-color: hsl(214 20% 75%); }
.riasec-grid-row, .riasec-grid-row-h {
  display: grid;
  grid-template-columns: 60px 280px 80px repeat(6, 56px) 80px;
  gap: 6px; align-items: center;
}
.riasec-grid-row-h { padding: 10px 0; border-bottom: 1px solid hsl(214 32% 91%); }
@media (max-width: 900px) {
  .riasec-grid-row, .riasec-grid-row-h {
    grid-template-columns: 1fr; gap: 4px; padding: 8px;
    border: 1px solid hsl(214 32% 91%); margin-bottom: 8px; border-radius: 0.5rem;
  }
}
.riasec-input {
  padding: 6px 8px; border: 1px solid transparent; background: transparent;
  font-size: 13px; width: 100%; border-radius: 4px; transition: all 0.1s;
  color: hsl(217 32% 15%);
}
.riasec-input:hover { border-color: hsl(214 32% 91%); }
.riasec-input:focus { outline: none; border-color: hsl(164 100% 21%); background: white; }
.riasec-input.numeric { font-variant-numeric: tabular-nums; text-align: center; }
.riasec-field {
  display: block; width: 100%; padding: 8px 12px;
  border: 1px solid hsl(214 32% 91%); background: white;
  font-size: 14px; border-radius: 0.5rem; transition: all 0.15s;
  color: hsl(217 32% 15%);
}
.riasec-field:focus { outline: none; border-color: hsl(164 100% 21%); box-shadow: 0 0 0 3px hsl(164 100% 21% / 0.15); }
.riasec-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; font-size: 13px; font-weight: 500;
  border: 1px solid; cursor: pointer; transition: all 0.15s; border-radius: 0.5rem;
}
.riasec-btn-primary { background: hsl(164 100% 21%); color: white; border-color: hsl(164 100% 21%); }
.riasec-btn-primary:hover { background: hsl(164 100% 28%); border-color: hsl(164 100% 28%); }
.riasec-btn-secondary { background: white; color: hsl(217 32% 15%); border-color: hsl(214 32% 91%); }
.riasec-btn-secondary:hover { background: hsl(210 40% 98%); border-color: hsl(214 20% 75%); }
.riasec-btn-ghost { background: transparent; color: hsl(215 16% 47%); border-color: transparent; padding: 8px 12px; }
.riasec-btn-ghost:hover { color: hsl(164 100% 21%); background: hsl(156 33% 93%); }
.riasec-btn-danger { background: white; color: hsl(0 72% 45%); border-color: hsl(0 70% 90%); }
.riasec-btn-danger:hover { background: hsl(0 70% 97%); border-color: hsl(0 72% 45%); }
.riasec-tab {
  padding: 14px 0; margin-right: 28px; font-size: 14px; font-weight: 500;
  cursor: pointer; border-bottom: 2px solid transparent;
  color: hsl(215 16% 47%); transition: all 0.15s; background: transparent;
}
.riasec-tab.active { color: hsl(164 100% 21%); border-bottom-color: hsl(164 100% 21%); font-weight: 600; }
.riasec-tab:hover:not(.active) { color: hsl(217 32% 15%); }
.riasec-badge {
  display: inline-flex; align-items: center; padding: 2px 10px;
  font-size: 11px; font-weight: 600; font-variant-numeric: tabular-nums;
  border: 1px solid hsl(214 32% 91%); border-radius: 999px; background: white;
  color: hsl(215 16% 47%); letter-spacing: 0.02em;
}
.riasec-badge.ok { background: hsl(156 33% 93%); border-color: hsl(164 100% 35%); color: hsl(164 100% 21%); }
.riasec-badge.warn { background: hsl(45 100% 95%); border-color: hsl(45 70% 60%); color: hsl(35 80% 35%); }
`;

// ============================================================
// Sub-components
// ============================================================
const FormLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5" style={{ letterSpacing: "0.05em", color: "hsl(215 16% 47%)" }}>{children}</label>
);

const ActivitiesEditor = ({ program, onChange }: { program: Program; onChange: (p: Program) => void }) => {
  const updateActivity = (idx: number, patch: Partial<Activity>) => {
    const arr = [...program.activities]; arr[idx] = { ...arr[idx], ...patch };
    onChange({ ...program, activities: arr });
  };
  const updateWeight = (idx: number, letter: RiasecLetter, value: number) => {
    const arr = [...program.activities];
    arr[idx] = { ...arr[idx], weights: { ...arr[idx].weights, [letter]: value } };
    onChange({ ...program, activities: arr });
  };
  const addActivity = () => {
    const id = newActivityId(program.id || "X", program.activities);
    onChange({ ...program, activities: [...program.activities, { id, name: "New activity", timePct: 0, weights: {R:0,I:0,A:0,S:0,E:0,C:0}, notes: "" }] });
  };
  const removeActivity = (idx: number) => {
    if (!confirm("Delete this activity?")) return;
    onChange({ ...program, activities: program.activities.filter((_, i) => i !== idx) });
  };
  const timeTotal = computeTimeTotal(program);
  const timeStatus = timeTotal === 100 ? "ok" : timeTotal === 0 ? "" : "warn";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ letterSpacing: "0.05em" }}>Activities</h3>
          <span className={`riasec-badge ${timeStatus}`}>time total {timeTotal}%</span>
        </div>
        <button onClick={addActivity} className="riasec-btn riasec-btn-secondary">+ Add activity</button>
      </div>

      <div className="hidden md:grid riasec-grid-row-h text-xs uppercase tracking-wider font-semibold" style={{ color: "hsl(215 16% 47%)" }}>
        <div>ID</div>
        <div>Name</div>
        <div className="text-center">Time %</div>
        {RIASEC_LETTERS.map((l) => (
          <div key={l} className="text-center font-bold" style={{ color: RIASEC_COLORS[l] }}>{l}</div>
        ))}
        <div className="text-center">Sum</div>
      </div>

      <div className="space-y-1">
        {program.activities.map((act, idx) => {
          const sum = computeActivityWeightSum(act);
          const sumOk = sum === 100;
          return (
            <div key={act.id} className="riasec-grid-row py-1 border-b" style={{ borderColor: "hsl(214 32% 91% / 0.5)" }}>
              <div className="text-xs font-mono" style={{ color: "hsl(215 16% 47%)" }}>{act.id}</div>
              <div><input className="riasec-input" value={act.name} onChange={(e) => updateActivity(idx, { name: e.target.value })} /></div>
              <div><input type="number" className="riasec-input numeric" value={act.timePct} min={0} max={100} onChange={(e) => updateActivity(idx, { timePct: Number(e.target.value) || 0 })} /></div>
              {RIASEC_LETTERS.map((l) => (
                <div key={l}>
                  <input type="number" className="riasec-input numeric" value={act.weights?.[l] ?? 0} min={0} max={100} style={{ color: RIASEC_COLORS[l], fontWeight: 600 }} onChange={(e) => updateWeight(idx, l, Number(e.target.value) || 0)} />
                </div>
              ))}
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold tabular-nums" style={{ color: sumOk ? "hsl(164 100% 21%)" : "hsl(0 72% 45%)" }}>{sum}</span>
                <button onClick={() => removeActivity(idx)} className="text-xs hover:text-destructive" style={{ color: "hsl(215 16% 60%)" }} title="Delete">✕</button>
              </div>
              <div className="md:col-span-full md:pl-[66px] md:pr-2">
                <input className="riasec-input text-xs italic" style={{ color: "hsl(215 16% 47%)" }} value={act.notes || ""} placeholder="Notes (optional)" onChange={(e) => updateActivity(idx, { notes: e.target.value })} />
              </div>
            </div>
          );
        })}
      </div>

      {program.activities.length === 0 && (
        <div className="py-12 text-center text-sm rounded-lg border-2 border-dashed" style={{ borderColor: "hsl(214 32% 91%)", color: "hsl(215 16% 47%)" }}>
          No activities yet. Click "Add activity" to start coding.
        </div>
      )}
    </div>
  );
};

const MetadataForm = ({ program, onChange }: { program: Program; onChange: (p: Program) => void }) => {
  const update = (patch: Partial<Program>) => onChange({ ...program, ...patch });
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><FormLabel>Program ID</FormLabel>
        <input className="riasec-field" style={{ fontVariantNumeric: "tabular-nums" }} value={program.id} maxLength={6} onChange={(e) => update({ id: e.target.value.toUpperCase() })} placeholder="e.g. FF, SP, AID" /></div>
      <div><FormLabel>Program Name</FormLabel><input className="riasec-field" value={program.name} onChange={(e) => update({ name: e.target.value })} /></div>
      <div><FormLabel>Age Band</FormLabel>
        <select className="riasec-field" value={program.ageBand} onChange={(e) => update({ ageBand: e.target.value })}>
          {AGE_BAND_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select></div>
      <div><FormLabel>Duration</FormLabel><input className="riasec-field" value={program.duration} onChange={(e) => update({ duration: e.target.value })} placeholder="e.g. 1 week, 6 weeks" /></div>
      <div><FormLabel>Format Type</FormLabel>
        <select className="riasec-field" value={program.formatType} onChange={(e) => update({ formatType: e.target.value })}>
          {FORMAT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select></div>
      <div><FormLabel>Difficulty</FormLabel>
        <select className="riasec-field" value={program.difficulty} onChange={(e) => update({ difficulty: e.target.value })}>
          {DIFFICULTY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select></div>
      <div><FormLabel>Social Structure</FormLabel>
        <select className="riasec-field" value={program.socialStructure} onChange={(e) => update({ socialStructure: e.target.value })}>
          {SOCIAL_STRUCTURE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select></div>
      <div><FormLabel>Output Type</FormLabel>
        <select className="riasec-field" value={program.outputType} onChange={(e) => update({ outputType: e.target.value })}>
          {OUTPUT_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select></div>
      <div><FormLabel>Culminating Event</FormLabel>
        <select className="riasec-field" value={program.culminatingEvent} onChange={(e) => update({ culminatingEvent: e.target.value })}>
          {CULMINATING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select></div>
      <div className="flex items-end pb-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded" checked={program.hasBranchingPaths} onChange={(e) => update({ hasBranchingPaths: e.target.checked })} />
          Has branching paths
        </label>
      </div>
      {program.hasBranchingPaths && (
        <div className="md:col-span-2"><FormLabel>Branching paths note</FormLabel>
          <input className="riasec-field" value={program.branchingPathsNote} onChange={(e) => update({ branchingPathsNote: e.target.value })} placeholder="Describe the paths" /></div>
      )}
      <div className="md:col-span-2"><FormLabel>Notes</FormLabel>
        <textarea className="riasec-field" rows={2} value={program.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="Commentary, recommendation logic, design decisions..." /></div>
    </div>
  );
};

const SkillsClustersEditor = ({ program, onChange }: { program: Program; onChange: (p: Program) => void }) => {
  const updateSkill = (idx: number, value: string) => {
    const arr = [...(program.skills || [])]; arr[idx] = value;
    onChange({ ...program, skills: arr });
  };
  const addSkill = () => {
    if ((program.skills || []).length >= 5) return;
    onChange({ ...program, skills: [...(program.skills || []), ""] });
  };
  const removeSkill = (idx: number) => onChange({ ...program, skills: (program.skills || []).filter((_, i) => i !== idx) });
  const toggleSecondary = (c: string) => {
    const cur = program.secondaryClusters || [];
    onChange({ ...program, secondaryClusters: cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c] });
  };
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <FormLabel>Top 5 Skills Built (O*NET categories)</FormLabel>
          {(program.skills || []).length < 5 && (
            <button onClick={addSkill} className="text-xs font-semibold" style={{ color: "hsl(164 100% 21%)" }}>+ Add skill</button>
          )}
        </div>
        <div className="space-y-2">
          {(program.skills || []).map((skill, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs font-semibold w-6 tabular-nums" style={{ color: "hsl(215 16% 47%)" }}>{idx + 1}.</span>
              <select className="riasec-field flex-1" value={skill} onChange={(e) => updateSkill(idx, e.target.value)}>
                <option value="">— Select skill —</option>
                {ONET_SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={() => removeSkill(idx)} className="text-xs px-2" style={{ color: "hsl(215 16% 60%)" }}>✕</button>
            </div>
          ))}
          {(program.skills || []).length === 0 && (
            <div className="text-xs italic py-2" style={{ color: "hsl(215 16% 60%)" }}>No skills selected yet.</div>
          )}
        </div>
      </div>
      <div><FormLabel>Primary Career Cluster</FormLabel>
        <select className="riasec-field" value={program.primaryCluster || ""} onChange={(e) => onChange({ ...program, primaryCluster: e.target.value })}>
          <option value="">— Select cluster —</option>
          {CAREER_CLUSTERS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select></div>
      <div><FormLabel>Secondary Career Clusters</FormLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
          {CAREER_CLUSTERS.map((c) => (
            <label key={c} className="flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-muted">
              <input type="checkbox" className="w-4 h-4 rounded" checked={(program.secondaryClusters || []).includes(c)} onChange={() => toggleSecondary(c)} />
              <span className="text-xs">{c}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProgramDetail = ({ program, onChange, onDelete }: { program: Program; onChange: (p: Program) => void; onDelete: () => void }) => {
  const profile = useMemo(() => computeProfile(program), [program]);
  const topCode = computeTopCode(profile);
  const timeTotal = computeTimeTotal(program);
  return (
    <div className="space-y-6 riasec-fade-in">
      <div className="flex items-start justify-between border-b pb-5" style={{ borderColor: "hsl(214 32% 91%)" }}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(215 16% 47%)" }}>Program</span>
            <span className="riasec-badge">{program.id || "—"}</span>
          </div>
          <h2 className="text-3xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>{program.name}</h2>
          <div className="text-sm mt-2" style={{ color: "hsl(215 16% 47%)" }}>
            {program.ageBand} · {program.duration} · {program.formatType}
            {program.hasBranchingPaths && <span className="ml-2 font-semibold" style={{ color: "hsl(164 100% 21%)" }}>· branching paths</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "hsl(215 16% 47%)" }}>Holland Code</div>
          <div className="text-4xl font-extrabold tracking-wider" style={{ color: "hsl(164 100% 21%)", fontVariantNumeric: "tabular-nums" }}>{topCode}</div>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center" style={{ borderColor: "hsl(214 32% 91%)" }}>
        <div className="flex justify-center"><RiasecRadar profile={profile} size={300} label={topCode} /></div>
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ letterSpacing: "0.05em" }}>Computed Profile</h3>
          <div className="space-y-2">
            {RIASEC_LETTERS.map((l) => ({ l, v: profile[l], name: RIASEC_NAMES[l] }))
              .sort((a, b) => b.v - a.v)
              .map(({ l, v, name }) => (
                <div key={l} className="flex items-center gap-3">
                  <span className="text-sm font-bold w-4 tabular-nums" style={{ color: RIASEC_COLORS[l] }}>{l}</span>
                  <span className="text-sm w-32" style={{ color: "hsl(215 16% 47%)" }}>{name}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: "hsl(210 40% 96%)" }}>
                    <div style={{ width: `${Math.min(100, (v / 50) * 100)}%`, background: RIASEC_COLORS[l] }} className="h-full rounded-full" />
                  </div>
                  <span className="text-sm font-semibold w-12 text-right tabular-nums">{v.toFixed(1)}</span>
                </div>
              ))}
          </div>
          {timeTotal !== 100 && (
            <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "hsl(45 100% 95%)", border: "1px solid hsl(45 70% 80%)", color: "hsl(35 80% 30%)" }}>
              ⚠ Activity time total is {timeTotal}%, should be 100% for accurate profile.
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6" style={{ borderColor: "hsl(214 32% 91%)" }}>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ letterSpacing: "0.05em" }}>Metadata</h3>
        <MetadataForm program={program} onChange={onChange} />
      </div>

      <div className="bg-card rounded-lg border p-6" style={{ borderColor: "hsl(214 32% 91%)" }}>
        <ActivitiesEditor program={program} onChange={onChange} />
      </div>

      <div className="bg-card rounded-lg border p-6" style={{ borderColor: "hsl(214 32% 91%)" }}>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ letterSpacing: "0.05em" }}>Skills Built &amp; Career Clusters</h3>
        <SkillsClustersEditor program={program} onChange={onChange} />
      </div>

      <div className="rounded-lg border p-4 flex items-center justify-between" style={{ borderColor: "hsl(0 70% 90%)", background: "hsl(0 70% 99%)" }}>
        <span className="text-xs" style={{ color: "hsl(215 16% 47%)" }}>Permanently delete this program from local storage</span>
        <button onClick={onDelete} className="riasec-btn riasec-btn-danger">Delete program</button>
      </div>
    </div>
  );
};

const ProgramsList = ({ programs, selectedId, onSelect, onAdd }:
  { programs: Program[]; selectedId: string | null; onSelect: (id: string) => void; onAdd: () => void }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h2 className="text-xs font-bold uppercase tracking-wider" style={{ letterSpacing: "0.05em" }}>Programs ({programs.length})</h2>
      <button onClick={onAdd} className="riasec-btn riasec-btn-secondary text-xs py-1 px-3">+ New</button>
    </div>
    <div className="space-y-2">
      {programs.map((p) => {
        const code = computeTopCode(computeProfile(p));
        const isSelected = p.id === selectedId;
        return (
          <button key={p.id} onClick={() => onSelect(p.id)}
            className="riasec-card-hover w-full text-left p-3 rounded-lg border bg-card"
            style={{ borderColor: isSelected ? "hsl(164 100% 21%)" : "hsl(214 32% 91%)", boxShadow: isSelected ? "0 0 0 1px hsl(164 100% 21%)" : "none" }}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold tabular-nums" style={{ color: "hsl(215 16% 47%)" }}>{p.id}</span>
                  <span className="text-xs" style={{ color: "hsl(215 16% 60%)" }}>{p.ageBand?.split(" ")[0]}</span>
                </div>
                <div className="text-sm font-semibold truncate" style={{ color: isSelected ? "hsl(164 100% 21%)" : "hsl(217 32% 15%)" }}>{p.name}</div>
              </div>
              <span className="text-xs font-bold tabular-nums" style={{ color: isSelected ? "hsl(164 100% 21%)" : "hsl(215 16% 47%)" }}>{code}</span>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

const CompareTab = ({ programs }: { programs: Program[] }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter((i) => i !== id));
    else if (selectedIds.length < 4) setSelectedIds([...selectedIds, id]);
  };
  const selected = programs.filter((p) => selectedIds.includes(p.id));
  return (
    <div className="space-y-6 riasec-fade-in">
      <div className="bg-card rounded-lg border p-6" style={{ borderColor: "hsl(214 32% 91%)" }}>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ letterSpacing: "0.05em" }}>Select up to 4 programs to compare</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {programs.map((p) => {
            const isSel = selectedIds.includes(p.id);
            const cIdx = selectedIds.indexOf(p.id);
            return (
              <button key={p.id} onClick={() => toggle(p.id)}
                className="riasec-card-hover text-left p-3 rounded-lg border bg-card"
                style={{
                  borderColor: isSel ? COMPARE_COLORS[cIdx] : "hsl(214 32% 91%)",
                  borderLeft: isSel ? `4px solid ${COMPARE_COLORS[cIdx]}` : "1px solid hsl(214 32% 91%)",
                }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold tabular-nums" style={{ color: "hsl(215 16% 47%)" }}>{p.id}</span>
                  <span className="text-sm font-medium">{p.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected.length > 0 && (
        <>
          <div className="bg-card rounded-lg border p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center" style={{ borderColor: "hsl(214 32% 91%)" }}>
            <div className="flex justify-center"><CompareRadar programs={selected} size={400} /></div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ letterSpacing: "0.05em" }}>Programs</h3>
              <div className="space-y-2">
                {selected.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3 text-sm">
                    <div className="w-3 h-3 rounded-sm" style={{ background: COMPARE_COLORS[idx] }} />
                    <span className="text-xs font-semibold w-12 tabular-nums" style={{ color: "hsl(215 16% 47%)" }}>{p.id}</span>
                    <span className="flex-1">{p.name}</span>
                    <span className="text-xs font-bold tabular-nums">{computeTopCode(computeProfile(p))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-6 overflow-x-auto" style={{ borderColor: "hsl(214 32% 91%)" }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ letterSpacing: "0.05em" }}>Side-by-Side Profile Data</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "hsl(214 32% 91%)" }}>
                  <th className="text-left py-2 px-2 text-xs uppercase tracking-wider font-semibold" style={{ color: "hsl(215 16% 47%)" }}>Dimension</th>
                  {selected.map((p, idx) => (
                    <th key={p.id} className="text-right py-2 px-2 text-xs uppercase tracking-wider font-bold" style={{ color: COMPARE_COLORS[idx] }}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RIASEC_LETTERS.map((l) => (
                  <tr key={l} className="border-b" style={{ borderColor: "hsl(214 32% 91% / 0.5)" }}>
                    <td className="py-2 px-2">
                      <span className="font-bold mr-2 tabular-nums" style={{ color: RIASEC_COLORS[l] }}>{l}</span>
                      <span style={{ color: "hsl(215 16% 47%)" }}>{RIASEC_NAMES[l]}</span>
                    </td>
                    {selected.map((p) => {
                      const v = computeProfile(p)[l];
                      return <td key={p.id} className="text-right py-2 px-2 tabular-nums">{v.toFixed(1)}</td>;
                    })}
                  </tr>
                ))}
                <tr className="border-t-2" style={{ borderColor: "hsl(217 32% 15%)" }}>
                  <td className="py-2 px-2 font-bold">Top 3 Code</td>
                  {selected.map((p) => (
                    <td key={p.id} className="text-right py-2 px-2 font-extrabold tabular-nums">{computeTopCode(computeProfile(p))}</td>
                  ))}
                </tr>
                {[
                  { label: "Difficulty", key: "difficulty" as const },
                  { label: "Social Structure", key: "socialStructure" as const },
                  { label: "Culminating Event", key: "culminatingEvent" as const },
                ].map(({ label, key }) => (
                  <tr key={key} className="border-b" style={{ borderColor: "hsl(214 32% 91% / 0.5)" }}>
                    <td className="py-1.5 px-2 text-xs uppercase tracking-wider font-semibold" style={{ color: "hsl(215 16% 47%)" }}>{label}</td>
                    {selected.map((p) => <td key={p.id} className="text-right py-1.5 px-2 text-xs">{(p as any)[key]}</td>)}
                  </tr>
                ))}
                <tr>
                  <td className="py-1.5 px-2 text-xs uppercase tracking-wider font-semibold align-top" style={{ color: "hsl(215 16% 47%)" }}>Top Skills</td>
                  {selected.map((p) => (
                    <td key={p.id} className="text-right py-1.5 px-2 text-xs">{(p.skills || []).slice(0, 3).join(", ") || "—"}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {selected.length === 0 && (
        <div className="text-center py-16" style={{ color: "hsl(215 16% 47%)" }}>Select programs above to see comparison.</div>
      )}
    </div>
  );
};

const ReferenceTab = () => (
  <div className="space-y-6 riasec-fade-in">
    <div className="bg-card rounded-lg border p-6" style={{ borderColor: "hsl(214 32% 91%)" }}>
      <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ letterSpacing: "0.05em" }}>RIASEC Type Definitions for Coding</h3>
      <div className="space-y-4">
        {RIASEC_LETTERS.map((l) => (
          <div key={l} className="grid grid-cols-12 gap-3 items-start">
            <div className="col-span-12 md:col-span-2 flex items-center gap-2">
              <span className="text-2xl font-extrabold tabular-nums" style={{ color: RIASEC_COLORS[l] }}>{l}</span>
              <span className="text-sm font-bold">{RIASEC_NAMES[l]}</span>
            </div>
            <div className="col-span-12 md:col-span-10 text-sm" style={{ color: "hsl(215 16% 47%)" }}>{RIASEC_DEFINITIONS[l]}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-card rounded-lg border p-6" style={{ borderColor: "hsl(214 32% 91%)" }}>
      <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ letterSpacing: "0.05em" }}>The Five-Pass Rubric</h3>
      <ol className="space-y-3 text-sm" style={{ color: "hsl(215 16% 47%)" }}>
        {[
          ["Pass 1.", "Inventory the activities and rough time allocations. Aim for 5-10 activity buckets per program."],
          ["Pass 2.", "Code each activity to the six RIASEC dimensions, summing to 100. Code cognitive activity and behavior, not nominal subject matter."],
          ["Pass 3.", "Roll up to program level (handled automatically by this tool)."],
          ["Pass 4.", "Identify the top 3 to 5 skills built (from the O*NET skills list)."],
          ["Pass 5.", "Tag the metadata: difficulty, social structure, output type, career clusters, branching paths."],
        ].map(([k, v], i) => (
          <li key={i}><span className="font-bold mr-2 tabular-nums" style={{ color: "hsl(217 32% 15%)" }}>{k}</span>{v}</li>
        ))}
      </ol>
    </div>

    <div className="bg-card rounded-lg border p-6" style={{ borderColor: "hsl(214 32% 91%)" }}>
      <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ letterSpacing: "0.05em" }}>Key Design Principles</h3>
      <ul className="space-y-3 text-sm" style={{ color: "hsl(215 16% 47%)" }}>
        {[
          ["Code cognitive activity, not nominal content.", "A 'fashion design camp' that spends 70% of its hours on CAD work is more Realistic than Artistic in actual student behavior."],
          ["Track interests served and skills built separately.", "They often diverge meaningfully. FashionForge serves Artistic interest while building engineering skills."],
          ["Code branching paths separately when they differ.", "The parent program gets the average. AI Deep Dive's 4 paths likely warrant individual codings."],
          ["Always note the culminating event type.", "Presentations, competitions, and showcases generate Enterprising and Social weight that curriculum docs typically understate."],
          ["Duration matters for Investigative weight.", "Longer programs allow real problem-solving cycles. Don't overstate I weight in 1-week intro camps."],
        ].map(([k, v], i) => (
          <li key={i} className="flex gap-3">
            <span className="font-bold" style={{ color: "hsl(164 100% 21%)" }}>→</span>
            <span><span className="font-semibold" style={{ color: "hsl(217 32% 15%)" }}>{k}</span> {v}</span>
          </li>
        ))}
      </ul>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-card rounded-lg border p-6" style={{ borderColor: "hsl(214 32% 91%)" }}>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ letterSpacing: "0.05em" }}>O*NET Skill Categories ({ONET_SKILLS.length})</h3>
        <div className="grid grid-cols-2 gap-1 text-xs" style={{ color: "hsl(215 16% 47%)" }}>
          {ONET_SKILLS.map((s) => <div key={s} className="py-0.5">{s}</div>)}
        </div>
      </div>
      <div className="bg-card rounded-lg border p-6" style={{ borderColor: "hsl(214 32% 91%)" }}>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ letterSpacing: "0.05em" }}>16 Federal Career Clusters</h3>
        <div className="space-y-1 text-xs" style={{ color: "hsl(215 16% 47%)" }}>
          {CAREER_CLUSTERS.map((c) => <div key={c} className="py-0.5">{c}</div>)}
        </div>
      </div>
    </div>
  </div>
);

// ============================================================
// Main page
// ============================================================
export default function ProgramRiasecCoder() {
  const [programs, setPrograms] = useState<Program[]>(() => seedIfEmpty());
  const [selectedId, setSelectedIdState] = useState<string | null>(programs[0]?.id || null);
  const [tab, setTabState] = useState<"programs" | "compare" | "reference">(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    return (t === "compare" || t === "reference") ? t : "programs";
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setTab = (t: "programs" | "compare" | "reference") => {
    setTabState(t);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", t);
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  };

  // Persist on change
  useEffect(() => { persistAll(programs); }, [programs]);

  const selected = programs.find((p) => p.id === selectedId) || null;

  const updateProgram = useCallback((updated: Program) => {
    setPrograms((prev) => {
      const oldId = selectedId;
      const newId = updated.id || oldId || "";
      // If id changed, remove old key
      if (oldId && newId !== oldId) deleteProgram(oldId);
      return prev.map((p) => (p.id === oldId ? { ...updated, id: newId } : p));
    });
    if (updated.id && updated.id !== selectedId) setSelectedIdState(updated.id);
  }, [selectedId]);

  const addProgram = () => {
    let id = `NEW${programs.length + 1}`;
    while (programs.some((p) => p.id === id)) id += "_";
    const np: Program = { ...blankProgram(), id };
    setPrograms([...programs, np]);
    setSelectedIdState(id);
    setTab("programs");
  };

  const handleDelete = () => {
    if (!selected) return;
    if (!confirm(`Delete program "${selected.name}"? This cannot be undone.`)) return;
    deleteProgram(selected.id);
    const remaining = programs.filter((p) => p.id !== selected.id);
    setPrograms(remaining);
    setSelectedIdState(remaining[0]?.id || null);
  };

  const exportData = () => {
    const data = JSON.stringify(programs, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `explr_riasec_data_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${programs.length} programs`);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || ""));
        if (!Array.isArray(parsed)) throw new Error("Invalid format");
        if (!confirm(`Import ${parsed.length} programs? This will replace your current data.`)) return;
        // Clear existing
        loadIndex().forEach(deleteProgram);
        const migrated = parsed.map(migrateProgram);
        setPrograms(migrated);
        setSelectedIdState(migrated[0]?.id || null);
        toast.success(`Imported ${migrated.length} programs`);
      } catch (err: any) {
        toast.error("Could not import file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const resetToSeed = () => {
    if (!confirm("Reset to the three example programs? Your current data will be lost.")) return;
    loadIndex().forEach(deleteProgram);
    setPrograms(SEED_PROGRAMS.map(migrateProgram));
    setSelectedIdState(SEED_PROGRAMS[0].id);
    toast.success("Reset to example programs");
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      <style>{STYLES}</style>
      <Header />
      <div className="px-6 py-5 border-b" style={{ borderColor: "hsl(214 32% 91%)" }}>
        <div className="max-w-7xl mx-auto flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>Program RIASEC Coder</h1>
            <p className="text-sm mt-1" style={{ color: "hsl(215 16% 47%)" }}>
              Tag program activities with RIASEC interest weights to drive student-program matching.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <input ref={fileInputRef} type="file" accept=".json" onChange={importData} style={{ display: "none" }} />
            <button onClick={() => fileInputRef.current?.click()} className="riasec-btn riasec-btn-ghost text-xs">Import JSON</button>
            <button onClick={exportData} className="riasec-btn riasec-btn-secondary">Export JSON</button>
            <button onClick={resetToSeed} className="riasec-btn riasec-btn-ghost text-xs">Reset to examples</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex gap-0 mt-3">
          <button className={`riasec-tab ${tab === "programs" ? "active" : ""}`} onClick={() => setTab("programs")}>Programs</button>
          <button className={`riasec-tab ${tab === "compare" ? "active" : ""}`} onClick={() => setTab("compare")}>Compare</button>
          <button className={`riasec-tab ${tab === "reference" ? "active" : ""}`} onClick={() => setTab("reference")}>Reference</button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">
        {tab === "programs" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <aside className="lg:col-span-3">
              <ProgramsList programs={programs} selectedId={selectedId} onSelect={setSelectedIdState} onAdd={addProgram} />
            </aside>
            <section className="lg:col-span-9">
              {selected ? (
                <ProgramDetail program={selected} onChange={updateProgram} onDelete={handleDelete} />
              ) : (
                <div className="bg-card rounded-lg border p-12 text-center" style={{ borderColor: "hsl(214 32% 91%)" }}>
                  <p className="mb-4" style={{ color: "hsl(215 16% 47%)" }}>No program selected.</p>
                  <button onClick={addProgram} className="riasec-btn riasec-btn-primary">Create your first program</button>
                </div>
              )}
            </section>
          </div>
        )}
        {tab === "compare" && <CompareTab programs={programs} />}
        {tab === "reference" && <ReferenceTab />}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-6 text-xs w-full" style={{ color: "hsl(215 16% 47%)" }}>
        Local data persists in your browser. Export regularly. Built for EXPLR_TOOLS.
      </footer>
    </div>
  );
}
