import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OHIO_DATA } from "@/config/ohio-data";
import {
  Upload,
  Camera,
  FileText,
  Loader2,
  CheckCircle2,
  Check,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Award,
  BookOpen,
  Target,
  ArrowRight,
  Sparkles,
  X,
  TrendingUp,
  Clock,
  Compass,
  Download,
  Printer,
} from "lucide-react";

/* OHIO_DATA imported from @/config/ohio-data */

/* ============================================================================
   API CALL — REPLACE THIS FOR LOVABLE
   In this artifact the Claude API is available directly (no key needed).
   In Lovable, replace the fetch() target with a call to a Supabase Edge
   Function that holds your Anthropic API key server-side. The request
   body shape can stay the same; just change the URL and auth header.
   ============================================================================ */

// Robust JSON extraction — handles preamble, markdown fences, and trailing text.
// Walks the string tracking brace depth (respecting strings and escapes) to
// find the first complete top-level JSON object.
function extractJSON(text) {
  if (!text) return null;

  // Strip common markdown code fences first
  let cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  const start = cleaned.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const candidate = cleaned.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

async function analyzeTranscript({ fileData, textContent, gradeLevel, interests, selectedPathways }) {
  // Build a minimal, focused JSON schema description for the prompt based
  // only on the selected pathways — keeps the output tight.
  const pathwayBlocks = [];
  if (selectedPathways.includes("college")) {
    pathwayBlocks.push(`    "college": [ { "course": "specific course name (e.g. 'Algebra II', 'AP Biology', 'CCP ENG-1010 at Tri-C')", "rationale": "2 sentences, evidence-based, reference transcript and tie to CSU or Tri-C pathway", "priority": "high|medium|low", "ccpEligible": true|false, "institution": "CSU|Tri-C|both|null" } ]`);
  }
  if (selectedPathways.includes("career")) {
    pathwayBlocks.push(`    "career": [ { "course": "...", "rationale": "2 sentences, evidence-based", "priority": "high|medium|low", "cluster": "Ohio cluster name", "credentialOpportunity": "credential or null" } ]`);
  }
  if (selectedPathways.includes("military")) {
    pathwayBlocks.push(`    "military": [ { "course": "...", "rationale": "2 sentences, evidence-based", "priority": "high|medium|low", "branch": "Army|Navy|Air Force|Marines|Coast Guard|Space Force|General" } ]`);
  }

  const systemPrompt = `You are an Ohio education pathway advisor with deep expertise in:
- Ohio's 16 National Career Clusters and their career pathways
- Ohio's 12 Diploma Seals (9 state-defined, 3 locally-defined)
- The OhioMeansJobs-Readiness Seal and its 15 professional skills
- Ohio high school graduation requirements (20+ credits, specific subject distributions)
- Ohio's Career-Technical Education (CTE) programs and Career-Technical Planning Districts (CTPDs)
- College Credit Plus (CCP) opportunities for dual enrollment
- Career-Technical Assurance Guides (CTAGs) for articulated college credit
- Industry-Recognized Credentials with point values
- Ohio workforce pathways in priority sectors (manufacturing, healthcare, IT, skilled trades)

REFERENCE DATA:
Ohio Career Clusters: ${OHIO_DATA.careerClusters.join("; ")}
State-Defined Seals: ${OHIO_DATA.stateDefinedSeals.join("; ")}
Locally-Defined Seals: ${OHIO_DATA.locallyDefinedSeals.join("; ")}
OMJ Readiness Seal Skills: ${OHIO_DATA.omjReadinessSkills.join("; ")}
Ohio HS Graduation Credits: English 4, Math 4, Science 3, Social Studies 3, Health 0.5, PE 0.5, Fine Arts 1 (waivable for CTE), Financial Literacy 0.5 (class of 2026+), Electives 5, Total 20 minimum.

PRIMARY COLLEGE PARTNERS (for college pathway recommendations — focus exclusively on these two institutions):

Cleveland State University (CSU) — 4-year public research university:
- Colleges: ${OHIO_DATA.partnerInstitutions.csu.notableColleges.join("; ")}
- Notable programs: ${OHIO_DATA.partnerInstitutions.csu.notablePrograms.join("; ")}
- Dual enrollment: ${OHIO_DATA.partnerInstitutions.csu.dualEnrollment}

Cuyahoga Community College (Tri-C) — 2-year community college:
- Divisions: ${OHIO_DATA.partnerInstitutions.tric.notableColleges.join("; ")}
- Notable programs: ${OHIO_DATA.partnerInstitutions.tric.notablePrograms.join("; ")}
- Dual enrollment: ${OHIO_DATA.partnerInstitutions.tric.dualEnrollment}
- Transfer pathway: ${OHIO_DATA.partnerInstitutions.tric.transferToCsu}

CRITICAL OUTPUT FORMAT:
Your entire response must be a single JSON object and nothing else. Do not include explanatory text before or after. Do not wrap it in markdown code fences. Do not say "Here is the analysis" or similar. Start your response with { and end with }. The response must be valid parseable JSON.`;

  const userContent = [];

  if (fileData) {
    if (fileData.mediaType === "application/pdf") {
      userContent.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: fileData.base64,
        },
      });
    } else if (fileData.mediaType.startsWith("image/")) {
      userContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: fileData.mediaType,
          data: fileData.base64,
        },
      });
    }
  }

  if (textContent && textContent.trim()) {
    userContent.push({
      type: "text",
      text: `TRANSCRIPT TEXT:\n${textContent}`,
    });
  }

  userContent.push({
    type: "text",
    text: `STUDENT CONTEXT:
- Current grade level: ${gradeLevel}
- Stated interests / career goals: ${interests || "Not specified — infer from coursework"}
- Pathway focuses requested: ${selectedPathways.join(", ")}

Analyze the transcript and respond with a single JSON object matching this shape exactly:

{
  "studentSummary": {
    "gradeLevel": "string",
    "totalCreditsEarned": 0,
    "gpaEstimate": "string or null",
    "coursesSummary": "2-3 sentences",
    "strengths": ["3-5 short phrases"],
    "gaps": ["2-4 short phrases"]
  },
  "creditProgress": {
    "english": { "earned": 0, "required": 4 },
    "math": { "earned": 0, "required": 4 },
    "science": { "earned": 0, "required": 3 },
    "socialStudies": { "earned": 0, "required": 3 },
    "healthPE": { "earned": 0, "required": 1 },
    "fineArts": { "earned": 0, "required": 1 },
    "financialLiteracy": { "earned": 0, "required": 0.5 },
    "electives": { "earned": 0, "required": 5 }
  },
  "careerClusterAlignment": [ /* TOP 3 ONLY */
    { "cluster": "name from Ohio's 16", "alignmentScore": 0, "evidence": "specific courses", "pathways": ["pathway names"] }
  ],
  "recommendationReasoning": "3-4 sentence plain-English explanation of why these courses were recommended",
  "recommendedNextCourses": {
${pathwayBlocks.join(",\n")}
  },
  "diplomaSealProgress": [ /* 1-2 MOST RELEVANT SEALS ONLY — not all 12 */
    { "seal": "exact Ohio seal name", "stateDefined": true, "progress": "not_started|in_progress|likely_earned", "requirements": "what it requires", "nextSteps": "actions" }
  ],
  "workforceReadinessSealStatus": {
    "eligible": false,
    "mentorsNeeded": 3,
    "skillsDemonstrated": ["up to 6"],
    "skillsToDemonstrate": ["up to 6"],
    "actionItems": ["2-4 concrete steps"]
  },
  "recommendedPathways": [ /* 2-3 MAX */
    { "name": "string", "type": "college|career|military|hybrid", "description": "1-2 sentences", "courseSequence": ["2-4 courses in order"], "credentials": ["credentials"], "postsecondaryOptions": ["Ohio options"] }
  ],
  "actionPlan": {
    "immediate": ["2-4 actions in next 2 weeks"],
    "thisSemester": ["2-4 actions"],
    "nextYear": ["2-4 actions"],
    "beforeGraduation": ["2-4 actions"]
  }
}

STRICT RULES:
- Respond with ONLY the JSON object. No preamble. No markdown fences. Start with { and end with }.
- Only include pathway keys in recommendedNextCourses for: ${selectedPathways.join(", ")}
- 3-4 courses per pathway maximum. Rationales must reference actual transcript content.
- COLLEGE PATHWAY: All college recommendations must be grounded in Cleveland State University (CSU) or Cuyahoga Community College (Tri-C). Name specific CSU or Tri-C programs/majors/certificates. For each college course, set "institution" to "CSU", "Tri-C", or "both" — never a generic "college". Consider the 2+2 transfer pathway (Tri-C → CSU) for students who may benefit from starting at Tri-C. For advanced HS students, recommend specific CCP courses at either institution. postsecondaryOptions under recommendedPathways should name specific CSU colleges/majors or Tri-C programs, not generic categories.
- Middle school (grades 6-8): focus on career exploration and preparing for high school CTE pathway selection.
- College transcripts: focus on major alignment, credentials, internships — anchor recommendations in CSU or Tri-C program offerings.
- Military: reference ASVAB prep, JROTC, branch/MOS alignment.
- Be concrete and Ohio-specific. Prefer specificity over comprehensiveness.`,
  });

  // Call our Supabase Edge Function, which proxies to Anthropic with the API key
  // kept server-side. The edge function URL is injected via env var so it
  // works across dev/prod without hardcoding.
  const { data, error: fnError } = await supabase.functions.invoke("analyze-transcript", {
    body: {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    },
  });

  if (fnError) {
    throw new Error(`API error: ${fnError.message}`);
  }
  if (data?.error) {
    throw new Error(`API error: ${typeof data.error === "string" ? data.error : JSON.stringify(data.error)}`);
  }
  const textBlock = data?.content?.find((c) => c.type === "text");

  if (!textBlock?.text) {
    throw new Error("The model returned an empty response. Please try again.");
  }

  const parsed = extractJSON(textBlock.text);

  if (!parsed) {
    if (data.stop_reason === "max_tokens") {
      throw new Error(
        "The response was cut off before the model could finish. Try selecting fewer pathways, or shorten the transcript and try again."
      );
    }
    const snippet = textBlock.text.slice(0, 200);
    throw new Error(`Could not parse the model's response. Snippet: "${snippet}"`);
  }

  if (data.stop_reason === "max_tokens") {
    parsed._truncated = true;
  }
  return parsed;
}

/* ============================================================================
   IMAGE COMPRESSION UTILITY
   Client-side downscale + JPEG re-encode before base64 encoding. Keeps
   transcript photos readable (long edge 2000px is plenty for OCR/vision)
   while cutting payload 70-80% for typical phone captures. PDFs skip this
   entirely since they can't be canvas-processed.
   ============================================================================ */

const MAX_IMAGE_DIMENSION = 2000;
const JPEG_QUALITY = 0.85;
const COMPRESSION_SKIP_THRESHOLD = 800 * 1024; // 800KB — don't bother compressing small images

async function compressImage(file) {
  // Small images pass through unchanged
  if (file.size < COMPRESSION_SKIP_THRESHOLD) {
    const base64 = await fileToBase64Raw(file);
    return {
      base64,
      mediaType: file.type,
      originalSize: file.size,
      compressedSize: file.size,
      wasCompressed: false,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { width, height } = img;
      const longEdge = Math.max(width, height);
      const scale = longEdge > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / longEdge : 1;
      const newWidth = Math.round(width * scale);
      const newHeight = Math.round(height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext("2d");

      // White background for any transparent source (PNG screenshots)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, newWidth, newHeight);
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed"));
            return;
          }
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              base64: reader.result.split(",")[1],
              mediaType: "image/jpeg",
              originalSize: file.size,
              compressedSize: blob.size,
              wasCompressed: true,
            });
          reader.onerror = () => reject(new Error("Read failed"));
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image — format may be unsupported"));
    };

    img.src = url;
  });
}

function fileToBase64Raw(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

function formatBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

/* ============================================================================
   PRINTABLE REPORT BUILDER
   Generates a standalone HTML document with print-optimized styles.
   User opens print dialog and chooses "Save as PDF" — works in every browser
   without external libraries.
   ============================================================================ */

function buildPrintableReport(data, ctx) {
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const s = data.studentSummary || {};
  const cp = data.creditProgress || {};
  const clusters = data.careerClusterAlignment || [];
  const rec = data.recommendedNextCourses || {};
  const seals = data.diplomaSealProgress || [];
  const omj = data.workforceReadinessSealStatus || {};
  const paths = data.recommendedPathways || [];
  const plan = data.actionPlan || {};

  const creditRows = [
    ["English", cp.english],
    ["Math", cp.math],
    ["Science", cp.science],
    ["Social Studies", cp.socialStudies],
    ["Health & PE", cp.healthPE],
    ["Fine Arts", cp.fineArts],
    ["Financial Literacy", cp.financialLiteracy],
    ["Electives", cp.electives],
  ].filter(([, v]) => v);

  const pathwayLabels = {
    college: "College (CSU / Tri-C)",
    career: "Career / CTE",
    military: "Military",
  };

  const renderCourseList = (list, key) =>
    (list || [])
      .map(
        (c) => `
      <div class="course">
        <div class="course-header">
          <h4>${esc(c.course)}</h4>
          <span class="priority priority-${esc(c.priority)}">${esc(c.priority || "")}</span>
        </div>
        <div class="rationale">
          <div class="label">Reasoning</div>
          <p>${esc(c.rationale)}</p>
        </div>
        <div class="tags">
          ${key === "college" && c.institution && c.institution !== "null" ? `<span class="tag tag-institution">${esc(c.institution === "both" ? "CSU + Tri-C" : c.institution)}</span>` : ""}
          ${key === "college" && c.ccpEligible ? `<span class="tag tag-ccp">CCP eligible</span>` : ""}
          ${c.cluster ? `<span class="tag">${esc(c.cluster)}</span>` : ""}
          ${c.credentialOpportunity ? `<span class="tag tag-credential">→ ${esc(c.credentialOpportunity)}</span>` : ""}
          ${c.branch ? `<span class="tag tag-branch">Branch: ${esc(c.branch)}</span>` : ""}
        </div>
      </div>`
      )
      .join("");

  const pathwaySections = Object.keys(pathwayLabels)
    .filter((k) => Array.isArray(rec[k]) && rec[k].length > 0)
    .map(
      (k) => `
      <div class="pathway-column">
        <h3>${pathwayLabels[k]}</h3>
        ${renderCourseList(rec[k], k)}
      </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Pathway Analysis — ${esc(s.gradeLevel || ctx.gradeLevel)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');

  @page { size: letter; margin: 0.6in; }

  * { box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    color: #1a1a1a;
    line-height: 1.5;
    margin: 0;
    background: #ffffff;
    font-size: 10.5pt;
  }
  h1, h2, h3, h4 { font-family: 'Fraunces', Georgia, serif; font-weight: 600; margin: 0; }
  h1 { font-size: 28pt; line-height: 1.1; }
  h2 { font-size: 16pt; margin-top: 24pt; margin-bottom: 8pt; padding-bottom: 6pt; border-bottom: 1px solid #ddd; }
  h3 { font-size: 13pt; margin-bottom: 6pt; color: #b8471f; }
  h4 { font-size: 11pt; font-family: 'Inter', sans-serif; font-weight: 600; }

  .header {
    border-bottom: 3px solid #b8471f;
    padding-bottom: 14pt;
    margin-bottom: 18pt;
  }
  .header .brand {
    font-size: 9pt;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #b8471f;
    font-weight: 700;
    margin-bottom: 6pt;
  }
  .header .meta {
    margin-top: 10pt;
    font-size: 9pt;
    color: #666;
  }

  .context-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12pt;
    margin-bottom: 14pt;
    padding: 10pt;
    background: #faf7f2;
    border-radius: 6pt;
  }
  .context-item .label {
    font-size: 8pt;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 2pt;
  }
  .context-item .value { font-size: 10.5pt; font-weight: 600; }

  .summary p { font-size: 11pt; line-height: 1.55; }

  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18pt;
    margin-top: 8pt;
  }
  .strengths .label, .gaps .label {
    font-size: 8pt;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 700;
    margin-bottom: 4pt;
  }
  .strengths .label { color: #15803d; }
  .gaps .label { color: #b8471f; }
  .strengths ul, .gaps ul { margin: 0; padding-left: 14pt; }
  .strengths li, .gaps li { margin-bottom: 2pt; }

  .reasoning-box {
    background: #fef3ec;
    border-left: 4px solid #b8471f;
    padding: 12pt 14pt;
    margin: 10pt 0;
    border-radius: 0 4pt 4pt 0;
  }
  .reasoning-box .label {
    font-size: 9pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 700;
    color: #b8471f;
    margin-bottom: 4pt;
  }
  .reasoning-box p { margin: 0; font-size: 10.5pt; line-height: 1.55; }

  .credits-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6pt;
  }
  .credits-table th, .credits-table td {
    text-align: left;
    padding: 5pt 8pt;
    font-size: 10pt;
  }
  .credits-table th {
    background: #faf7f2;
    font-weight: 600;
    border-bottom: 1px solid #ddd;
  }
  .credits-table td { border-bottom: 1px solid #f0ece5; }
  .credits-table .met { color: #15803d; font-weight: 600; }
  .credits-table .pending { color: #666; }

  .cluster {
    padding: 8pt 10pt;
    border: 1px solid #e8e3db;
    border-radius: 4pt;
    margin-bottom: 6pt;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10pt;
  }
  .cluster .cluster-body { flex: 1; }
  .cluster .cluster-score {
    font-family: 'Fraunces', serif;
    font-size: 18pt;
    color: #b8471f;
    font-weight: 600;
    text-align: right;
  }
  .cluster .cluster-score .label {
    font-family: 'Inter', sans-serif;
    font-size: 7pt;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #888;
    font-weight: 500;
  }
  .cluster h4 { margin-bottom: 3pt; font-family: 'Fraunces', serif; font-size: 11pt; }
  .cluster p { margin: 0; font-size: 9.5pt; color: #555; }

  .pathways-grid {
    display: grid;
    grid-template-columns: ${pathwaySections.includes("pathway-column") ? "1fr" : "1fr"};
    gap: 14pt;
  }

  .course {
    padding: 8pt 10pt;
    border-left: 2px solid #e8ccbb;
    margin-bottom: 10pt;
    page-break-inside: avoid;
  }
  .course-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 4pt;
  }
  .course-header h4 { font-size: 10.5pt; }
  .priority {
    font-size: 7.5pt;
    padding: 2pt 6pt;
    border-radius: 10pt;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .priority-high { background: #b8471f; color: #fff; }
  .priority-medium { background: #fef3c7; color: #78350f; }
  .priority-low { background: #f3f4f6; color: #555; }

  .rationale {
    background: #faf7f2;
    padding: 6pt 8pt;
    border-radius: 3pt;
    margin: 4pt 0;
  }
  .rationale .label {
    font-size: 7pt;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #888;
    font-weight: 700;
    margin-bottom: 2pt;
  }
  .rationale p { margin: 0; font-size: 9.5pt; line-height: 1.5; }

  .tags { margin-top: 4pt; display: flex; flex-wrap: wrap; gap: 4pt; }
  .tag {
    font-size: 8pt;
    padding: 1pt 7pt;
    border-radius: 10pt;
    background: #f3f4f6;
    color: #555;
  }
  .tag-institution { background: #e0e7ff; color: #3730a3; font-weight: 600; }
  .tag-ccp { background: #dbeafe; color: #1e3a8a; }
  .tag-credential { background: #fef3c7; color: #78350f; }
  .tag-branch { background: #dcfce7; color: #14532d; }

  .seal {
    padding: 8pt 10pt;
    border: 1px solid #e8e3db;
    border-radius: 4pt;
    margin-bottom: 6pt;
    page-break-inside: avoid;
  }
  .seal-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 4pt;
  }
  .seal h4 { font-family: 'Fraunces', serif; font-size: 11pt; }
  .seal .meta { font-size: 8pt; color: #888; }
  .seal .status {
    font-size: 8pt;
    padding: 2pt 7pt;
    border-radius: 10pt;
    font-weight: 600;
  }
  .status-likely_earned { background: #dcfce7; color: #14532d; }
  .status-in_progress { background: #fef3c7; color: #78350f; }
  .status-not_started { background: #f3f4f6; color: #555; }
  .seal p { font-size: 9.5pt; margin: 2pt 0; }
  .seal .next { color: #b8471f; font-size: 9.5pt; margin-top: 4pt; font-weight: 500; }

  .omj-box {
    background: #1a1a1a;
    color: #fff;
    padding: 14pt;
    border-radius: 6pt;
    margin-bottom: 12pt;
    page-break-inside: avoid;
  }
  .omj-box h3 { color: #fff; font-size: 14pt; margin-bottom: 8pt; }
  .omj-box .label {
    font-size: 7.5pt;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    margin-bottom: 3pt;
  }
  .omj-box .skill-list {
    display: flex;
    flex-wrap: wrap;
    gap: 3pt;
    margin-bottom: 8pt;
  }
  .omj-box .skill {
    font-size: 8pt;
    padding: 1pt 6pt;
    border-radius: 8pt;
    background: rgba(255,255,255,0.1);
  }
  .omj-box .skill.done { background: rgba(34,197,94,0.2); color: #86efac; }
  .omj-box ul { margin: 4pt 0 0; padding-left: 14pt; font-size: 9.5pt; }

  .action-plan {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10pt;
  }
  .action-bucket {
    padding: 8pt 10pt;
    border: 1px solid #e8e3db;
    border-radius: 4pt;
    page-break-inside: avoid;
  }
  .action-bucket h4 { font-family: 'Fraunces', serif; font-size: 11pt; color: #b8471f; margin-bottom: 2pt; }
  .action-bucket .subtitle { font-size: 8pt; color: #888; margin-bottom: 6pt; }
  .action-bucket ul { margin: 0; padding-left: 14pt; font-size: 9.5pt; }
  .action-bucket li { margin-bottom: 3pt; }

  .pathway-rec {
    padding: 8pt 10pt;
    border: 1px solid #e8e3db;
    border-radius: 4pt;
    margin-bottom: 8pt;
    page-break-inside: avoid;
  }
  .pathway-rec .type-badge {
    font-size: 8pt;
    padding: 2pt 7pt;
    border-radius: 10pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4pt;
    display: inline-block;
  }
  .type-college { background: #dbeafe; color: #1e3a8a; }
  .type-career { background: #fef3ec; color: #b8471f; }
  .type-military { background: #dcfce7; color: #14532d; }
  .type-hybrid { background: #ede9fe; color: #5b21b6; }
  .pathway-rec h4 { font-family: 'Fraunces', serif; font-size: 12pt; margin-bottom: 3pt; }
  .pathway-rec p { font-size: 9.5pt; margin: 2pt 0; }
  .pathway-rec .label {
    font-size: 7.5pt;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #888;
    margin-top: 4pt;
  }

  .footer {
    margin-top: 24pt;
    padding-top: 10pt;
    border-top: 1px solid #ddd;
    font-size: 8pt;
    color: #888;
    text-align: center;
  }

  section { page-break-inside: auto; }
  h2 { page-break-after: avoid; }
  h3, h4 { page-break-after: avoid; }

  @media print {
    body { font-size: 10pt; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="brand">Ohio Pathway Analysis</div>
  <h1>${esc(s.gradeLevel || ctx.gradeLevel)}</h1>
  <div class="meta">Report generated ${today}${ctx.interests ? ` &middot; Student interests: ${esc(ctx.interests)}` : ""}</div>
</div>

<div class="context-grid">
  <div class="context-item">
    <div class="label">Credits earned</div>
    <div class="value">${esc(s.totalCreditsEarned ?? "—")}</div>
  </div>
  <div class="context-item">
    <div class="label">GPA estimate</div>
    <div class="value">${esc(s.gpaEstimate ?? "—")}</div>
  </div>
  <div class="context-item">
    <div class="label">Pathway focus</div>
    <div class="value">${(ctx.selectedPathways || []).map((p) => esc(pathwayLabels[p] || p)).join(" · ")}</div>
  </div>
</div>

<section class="summary">
  <h2>Summary</h2>
  <p>${esc(s.coursesSummary)}</p>
  <div class="two-col">
    <div class="strengths">
      <div class="label">Strengths</div>
      <ul>${(s.strengths || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    </div>
    <div class="gaps">
      <div class="label">Gaps to address</div>
      <ul>${(s.gaps || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    </div>
  </div>
</section>

${creditRows.length > 0 ? `
<section>
  <h2>Credit progress</h2>
  <table class="credits-table">
    <thead>
      <tr><th>Subject</th><th>Earned</th><th>Required</th><th>Status</th></tr>
    </thead>
    <tbody>
      ${creditRows
        .map(([label, v]) => {
          const met = v.earned >= v.required;
          return `<tr>
            <td>${esc(label)}</td>
            <td>${esc(v.earned)}</td>
            <td>${esc(v.required)}</td>
            <td class="${met ? "met" : "pending"}">${met ? "Met" : "In progress"}</td>
          </tr>`;
        })
        .join("")}
    </tbody>
  </table>
</section>
` : ""}

${clusters.length > 0 ? `
<section>
  <h2>Career cluster alignment</h2>
  ${clusters
    .map(
      (c) => `
    <div class="cluster">
      <div class="cluster-body">
        <h4>${esc(c.cluster)}</h4>
        <p>${esc(c.evidence)}</p>
      </div>
      <div class="cluster-score">
        ${esc(c.alignmentScore)}
        <div class="label">alignment</div>
      </div>
    </div>`
    )
    .join("")}
</section>
` : ""}

${data.recommendationReasoning ? `
<section>
  <h2>Why these recommendations</h2>
  <div class="reasoning-box">
    <div class="label">Reasoning</div>
    <p>${esc(data.recommendationReasoning)}</p>
  </div>
</section>
` : ""}

${pathwaySections ? `
<section>
  <h2>Recommended next courses</h2>
  <div class="pathways-grid">${pathwaySections}</div>
</section>
` : ""}

${omj.mentorsNeeded || (omj.skillsDemonstrated && omj.skillsDemonstrated.length) ? `
<section>
  <h2>OhioMeansJobs-Readiness Seal</h2>
  <div class="omj-box">
    <h3>Workforce readiness progress</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12pt;">
      <div>
        <div class="label">Skills demonstrated</div>
        <div class="skill-list">
          ${(omj.skillsDemonstrated || []).map((x) => `<span class="skill done">${esc(x)}</span>`).join("") || '<span style="font-size:9pt;color:rgba(255,255,255,0.4);">None yet</span>'}
        </div>
      </div>
      <div>
        <div class="label">Skills to demonstrate</div>
        <div class="skill-list">
          ${(omj.skillsToDemonstrate || []).map((x) => `<span class="skill">${esc(x)}</span>`).join("")}
        </div>
      </div>
    </div>
    ${(omj.actionItems || []).length > 0 ? `
    <div class="label" style="margin-top:8pt;">Action items</div>
    <ul>${(omj.actionItems || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    ` : ""}
  </div>
</section>
` : ""}

${seals.length > 0 ? `
<section>
  <h2>Diploma seal progress</h2>
  ${seals
    .map(
      (s) => `
    <div class="seal">
      <div class="seal-header">
        <div>
          <h4>${esc(s.seal)}</h4>
          <div class="meta">${s.stateDefined ? "State-defined" : "Locally-defined"}</div>
        </div>
        <span class="status status-${esc(s.progress)}">${esc((s.progress || "").replace(/_/g, " "))}</span>
      </div>
      <p>${esc(s.requirements)}</p>
      ${s.nextSteps ? `<p class="next">→ ${esc(s.nextSteps)}</p>` : ""}
    </div>`
    )
    .join("")}
</section>
` : ""}

${paths.length > 0 ? `
<section>
  <h2>Recommended pathways</h2>
  ${paths
    .map(
      (p) => `
    <div class="pathway-rec">
      <span class="type-badge type-${esc(p.type)}">${esc(p.type)}</span>
      <h4>${esc(p.name)}</h4>
      <p>${esc(p.description)}</p>
      ${p.courseSequence?.length ? `<div class="label">Course sequence</div><p>${p.courseSequence.map(esc).join(" → ")}</p>` : ""}
      ${p.credentials?.length ? `<div class="label">Credentials</div><p>${p.credentials.map(esc).join(", ")}</p>` : ""}
      ${p.postsecondaryOptions?.length ? `<div class="label">After graduation</div><p>${p.postsecondaryOptions.map(esc).join(", ")}</p>` : ""}
    </div>`
    )
    .join("")}
</section>
` : ""}

${plan.immediate || plan.thisSemester || plan.nextYear || plan.beforeGraduation ? `
<section>
  <h2>Action plan</h2>
  <div class="action-plan">
    <div class="action-bucket">
      <h4>Immediate</h4>
      <div class="subtitle">Next 2 weeks</div>
      <ul>${(plan.immediate || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    </div>
    <div class="action-bucket">
      <h4>This semester</h4>
      <div class="subtitle">Current term</div>
      <ul>${(plan.thisSemester || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    </div>
    <div class="action-bucket">
      <h4>Next year</h4>
      <div class="subtitle">Upcoming school year</div>
      <ul>${(plan.nextYear || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    </div>
    <div class="action-bucket">
      <h4>Before graduation</h4>
      <div class="subtitle">Long-term</div>
      <ul>${(plan.beforeGraduation || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    </div>
  </div>
</section>
` : ""}

<div class="footer">
  Analysis generated by EXPLR Ohio Pathway Analyzer &middot; AI-generated guidance grounded in Ohio Department of Education and Workforce frameworks &middot; Always verify specific graduation requirements with the student's school counselor.
</div>

</body>
</html>`;
}

/* ============================================================================
   MAIN COMPONENT
   ============================================================================ */

export default function TranscriptPathwayAnalyzer() {
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState(null); // { base64, mediaType }
  const [textInput, setTextInput] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [interests, setInterests] = useState("");
  const [selectedPathways, setSelectedPathways] = useState(["college", "career"]);
  const [loading, setLoading] = useState(false);
  const lastToggleRef = useRef({ value: null, time: 0 });

  const togglePathway = (v) => {
    // Guard against mobile double-fire (touchend + click firing both within ~50ms)
    const now = Date.now();
    if (lastToggleRef.current.value === v && now - lastToggleRef.current.time < 300) {
      return;
    }
    lastToggleRef.current = { value: v, time: now };
    setSelectedPathways((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loadingMessage, setLoadingMessage] = useState("");
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Rotate loading messages to show progress during the wait
  useEffect(() => {
    if (!loading) {
      setLoadingMessage("");
      return;
    }
    const messages = [
      "Reading transcript...",
      "Identifying completed courses...",
      "Matching to Ohio career clusters...",
      "Checking CSU & Tri-C program fit...",
      "Evaluating diploma seal progress...",
      "Generating next-course recommendations...",
      "Finalizing pathway analysis...",
    ];
    let i = 0;
    setLoadingMessage(messages[0]);
    const interval = setInterval(() => {
      i = Math.min(i + 1, messages.length - 1);
      setLoadingMessage(messages[i]);
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError(null);
    try {
      if (f.type === "application/pdf") {
        // PDFs pass through unchanged
        const base64 = await fileToBase64Raw(f);
        setFileData({
          base64,
          mediaType: f.type,
          originalSize: f.size,
          compressedSize: f.size,
          wasCompressed: false,
        });
      } else if (f.type.startsWith("image/")) {
        // Images get downscaled + re-encoded
        const result = await compressImage(f);
        setFileData(result);
      } else {
        throw new Error("Unsupported file type");
      }
    } catch (err) {
      setError(
        `Could not process that file: ${err.message}. Try a different file or paste transcript text instead.`
      );
      setFile(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setFileData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const canAnalyze =
    (fileData || textInput.trim().length > 50) &&
    gradeLevel &&
    selectedPathways.length > 0 &&
    !loading;

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const r = await analyzeTranscript({
        fileData,
        textContent: textInput,
        gradeLevel,
        interests,
        selectedPathways,
      });
      setResults(r);
      setActiveTab("overview");
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    clearFile();
    setTextInput("");
    setInterests("");
    setResults(null);
    setError(null);
  };

  const handleExport = () => {
    if (!results) return;
    const html = buildPrintableReport(results, { gradeLevel, interests, selectedPathways });
    const win = window.open("", "_blank");
    if (!win) {
      alert("Please allow popups to export the report.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    // Give the new window a moment to render before opening print dialog
    setTimeout(() => {
      win.focus();
      win.print();
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#1a1a1a]" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; }

        /* Pathway selector — hardcoded styles, no Tailwind dependency */
        .pathway-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border-radius: 10px;
          border: 2px solid rgba(26, 26, 26, 0.25);
          background-color: #ffffff;
          color: #1a1a1a;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          font-size: 15px;
          font-weight: 600;
          transition: background-color 120ms ease, border-color 120ms ease, transform 80ms ease;
          -webkit-tap-highlight-color: transparent;
          -webkit-user-select: none;
          user-select: none;
          touch-action: manipulation;
        }
        .pathway-btn:active { transform: scale(0.98); }
        .pathway-btn--active {
          background-color: #b8471f !important;
          border-color: #8a3517 !important;
          color: #ffffff !important;
          box-shadow: inset 4px 0 0 0 #ffffff, 0 2px 8px rgba(184, 71, 31, 0.25);
        }
        .pathway-btn__indicator {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 2px solid rgba(26, 26, 26, 0.35);
          background-color: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pathway-btn--active .pathway-btn__indicator {
          background-color: #ffffff;
          border-color: #ffffff;
        }
        .pathway-btn__icon { color: #b8471f; flex-shrink: 0; }
        .pathway-btn--active .pathway-btn__icon { color: #ffffff; }
        .pathway-btn__selected-badge {
          margin-left: auto;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.2);
          padding: 3px 8px;
          border-radius: 4px;
        }

        /* Submit button — hardcoded styles, no Tailwind dependency */
        .submit-btn {
          width: 100%;
          padding: 16px;
          border-radius: 8px;
          border: 2px solid transparent;
          font-family: inherit;
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: background-color 120ms ease, transform 80ms ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .submit-btn--enabled {
          background-color: #b8471f;
          color: #ffffff;
          border-color: #8a3517;
          box-shadow: 0 2px 8px rgba(184, 71, 31, 0.3);
        }
        .submit-btn--enabled:hover { background-color: #9e3c1a; }
        .submit-btn--enabled:active { transform: scale(0.98); }
        .submit-btn--disabled {
          background-color: #d4d0cb;
          color: #6b6560;
          border-color: #b8b2ac;
          cursor: not-allowed;
        }
        .submit-btn--loading {
          background-color: #8a3517;
          color: #ffffff;
          border-color: #6d2a12;
          cursor: wait;
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-[#1a1a1a]/10 bg-[#faf7f2]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#b8471f] flex items-center justify-center">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-[#1a1a1a]/60">Ohio Pathway Analyzer</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-500 leading-tight">
            Where does this student <em className="text-[#b8471f]">go next</em>?
          </h1>
          <p className="mt-3 text-[#1a1a1a]/70 max-w-2xl">
            Upload a transcript (grades 6–12 or college). We map completed coursework to Ohio career clusters,
            workforce seals, and next-step recommendations for college and career pathways.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {!results && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* LEFT: Upload / Input */}
            <section className="bg-white border border-[#1a1a1a]/10 rounded-lg p-6">
              <h2 className="font-display text-xl mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#b8471f]" /> Transcript
              </h2>

              {/* File upload / camera */}
              <div className="mb-4">
                <label className="text-xs uppercase tracking-wider text-[#1a1a1a]/60 mb-2 block">
                  Upload file or take a photo
                </label>
                {!file ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#1a1a1a]/20 rounded-md p-5 text-center cursor-pointer hover:border-[#b8471f] hover:bg-[#b8471f]/5 transition group"
                    >
                      <Upload className="w-6 h-6 mx-auto mb-2 text-[#1a1a1a]/40 group-hover:text-[#b8471f] transition" />
                      <p className="text-sm text-[#1a1a1a]/80 font-medium">Upload file</p>
                      <p className="text-xs text-[#1a1a1a]/50 mt-0.5">PDF, PNG, JPG</p>
                    </button>
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="border-2 border-dashed border-[#1a1a1a]/20 rounded-md p-5 text-center cursor-pointer hover:border-[#b8471f] hover:bg-[#b8471f]/5 transition group"
                    >
                      <Camera className="w-6 h-6 mx-auto mb-2 text-[#1a1a1a]/40 group-hover:text-[#b8471f] transition" />
                      <p className="text-sm text-[#1a1a1a]/80 font-medium">Take photo</p>
                      <p className="text-xs text-[#1a1a1a]/50 mt-0.5">Use camera</p>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-[#b8471f]/5 border border-[#b8471f]/20 rounded-md p-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-[#b8471f] flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm truncate">{file.name}</div>
                        {fileData && (
                          <div className="text-xs text-[#1a1a1a]/50 mt-0.5">
                            {fileData.wasCompressed ? (
                              <>
                                <span className="line-through">{formatBytes(fileData.originalSize)}</span>
                                <span className="mx-1">→</span>
                                <span className="text-green-700 font-medium">
                                  {formatBytes(fileData.compressedSize)}
                                </span>
                                <span className="ml-1">
                                  ({Math.round((1 - fileData.compressedSize / fileData.originalSize) * 100)}% smaller)
                                </span>
                              </>
                            ) : (
                              <span>{formatBytes(fileData.originalSize)}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={clearFile} className="text-[#1a1a1a]/50 hover:text-[#b8471f] flex-shrink-0 ml-2">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="text-center text-xs uppercase tracking-wider text-[#1a1a1a]/40 my-3">or</div>

              {/* Paste text */}
              <div>
                <label className="text-xs uppercase tracking-wider text-[#1a1a1a]/60 mb-2 block">
                  Paste transcript text
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Course names, grades, credits, terms..."
                  className="w-full h-40 p-3 border border-[#1a1a1a]/15 rounded-md text-sm focus:outline-none focus:border-[#b8471f] resize-none"
                />
                <p className="text-xs text-[#1a1a1a]/50 mt-1">
                  Either upload a file or paste at least ~50 characters of text.
                </p>
              </div>
            </section>

            {/* RIGHT: Context */}
            <section className="bg-white border border-[#1a1a1a]/10 rounded-lg p-6">
              <h2 className="font-display text-xl mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#b8471f]" /> Student context
              </h2>

              <div className="mb-4">
                <label className="text-xs uppercase tracking-wider text-[#1a1a1a]/60 mb-2 block">
                  Current grade level *
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full p-3 border border-[#1a1a1a]/15 rounded-md text-sm bg-white focus:outline-none focus:border-[#b8471f]"
                >
                  <option value="">Select grade level...</option>
                  <option value="6th grade">6th grade</option>
                  <option value="7th grade">7th grade</option>
                  <option value="8th grade">8th grade</option>
                  <option value="9th grade">9th grade (freshman)</option>
                  <option value="10th grade">10th grade (sophomore)</option>
                  <option value="11th grade">11th grade (junior)</option>
                  <option value="12th grade">12th grade (senior)</option>
                  <option value="College freshman">College — freshman</option>
                  <option value="College sophomore">College — sophomore</option>
                  <option value="College junior">College — junior</option>
                  <option value="College senior">College — senior</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="text-xs uppercase tracking-wider text-[#1a1a1a]/60 mb-2 block">
                  Career interests (optional)
                </label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. robotics, nursing, skilled trades, undecided"
                  className="w-full p-3 border border-[#1a1a1a]/15 rounded-md text-sm focus:outline-none focus:border-[#b8471f]"
                />
              </div>

              <div className="mb-6">
                <div className="flex items-baseline justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider text-[#1a1a1a]/60">
                    Pathway focus
                  </label>
                  <span className="text-xs text-[#1a1a1a]/40">select one or more</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { v: "college", label: "College", icon: GraduationCap },
                    { v: "career", label: "Career / CTE", icon: Briefcase },
                    { v: "military", label: "Military", icon: Award },
                  ].map((p) => {
                    const active = selectedPathways.includes(p.v);
                    const Icon = p.icon;
                    return (
                      <button
                        type="button"
                        key={p.v}
                        onClick={() => togglePathway(p.v)}
                        className={`pathway-btn ${active ? "pathway-btn--active" : ""}`}
                        aria-pressed={active}
                      >
                        <span className="pathway-btn__indicator">
                          {active && (
                            <Check
                              size={18}
                              strokeWidth={4}
                              style={{ color: "#b8471f" }}
                            />
                          )}
                        </span>
                        <Icon size={20} className="pathway-btn__icon" />
                        <span>{p.label}</span>
                        {active && <span className="pathway-btn__selected-badge">Selected</span>}
                      </button>
                    );
                  })}
                </div>
                {selectedPathways.length === 0 && (
                  <p className="text-xs text-[#b8471f] mt-2">Select at least one pathway.</p>
                )}
              </div>

              {/* Helpful hint when button is disabled */}
              {!canAnalyze && !loading && (
                <div className="mb-3 text-xs text-[#1a1a1a]/60 bg-[#faf7f2] border border-[#1a1a1a]/10 rounded-md p-2.5">
                  <span className="font-medium text-[#1a1a1a]/80">To continue: </span>
                  {[
                    !fileData && textInput.trim().length <= 50 && "add a transcript (file, photo, or paste text)",
                    !gradeLevel && "select a grade level",
                    selectedPathways.length === 0 && "pick at least one pathway",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className={`submit-btn ${
                  loading ? "submit-btn--loading" : canAnalyze ? "submit-btn--enabled" : "submit-btn--disabled"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {loadingMessage || "Analyzing transcript..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate pathway analysis
                  </>
                )}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </section>
          </div>
        )}

        {/* RESULTS */}
        {results && (
          <div>
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#1a1a1a]/60 mb-1">Analysis complete</div>
                <h2 className="font-display text-3xl">{results.studentSummary?.gradeLevel || gradeLevel}</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="px-4 py-2 text-sm bg-[#b8471f] text-white rounded-md hover:bg-[#9e3c1a] transition flex items-center gap-2 font-semibold"
                  style={{ backgroundColor: "#b8471f", color: "#ffffff" }}
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
                <button
                  onClick={resetAll}
                  className="px-4 py-2 text-sm border border-[#1a1a1a]/20 rounded-md hover:bg-[#1a1a1a] hover:text-white transition"
                >
                  New analysis
                </button>
              </div>
            </div>

            {results._truncated && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  This analysis was condensed to fit within available space. Results are complete but may be shorter than usual.
                </span>
              </div>
            )}

            {/* Tabs */}
            <div className="border-b border-[#1a1a1a]/10 mb-6 flex gap-1 overflow-x-auto">
              {[
                { id: "overview", label: "Overview", icon: BookOpen },
                { id: "credits", label: "Credits", icon: GraduationCap },
                { id: "clusters", label: "Career clusters", icon: Compass },
                { id: "next", label: "Next courses", icon: ArrowRight },
                { id: "seals", label: "Diploma seals", icon: Award },
                { id: "plan", label: "Action plan", icon: Target },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition flex items-center gap-2 ${
                    activeTab === t.id
                      ? "border-[#b8471f] text-[#b8471f]"
                      : "border-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "overview" && <OverviewTab data={results} />}
            {activeTab === "credits" && <CreditsTab data={results} />}
            {activeTab === "clusters" && <ClustersTab data={results} />}
            {activeTab === "next" && <NextCoursesTab data={results} />}
            {activeTab === "seals" && <SealsTab data={results} />}
            {activeTab === "plan" && <ActionPlanTab data={results} />}
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-8 text-xs text-[#1a1a1a]/50 border-t border-[#1a1a1a]/10 mt-12">
        Analysis is AI-generated guidance grounded in Ohio Department of Education and Workforce frameworks.
        Always verify specific graduation requirements with the student's school counselor.
      </footer>
    </div>
  );
}

/* ============================================================================
   TAB COMPONENTS
   ============================================================================ */

function OverviewTab({ data }) {
  const s = data.studentSummary || {};
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-white border border-[#1a1a1a]/10 rounded-lg p-6">
        <h3 className="font-display text-xl mb-3">Summary</h3>
        <p className="text-sm text-[#1a1a1a]/80 leading-relaxed mb-4">{s.coursesSummary}</p>

        <div className="grid grid-cols-2 gap-4 mt-5">
          <div>
            <div className="text-xs uppercase tracking-wider text-green-700 mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Strengths
            </div>
            <ul className="space-y-1.5">
              {(s.strengths || []).map((x, i) => (
                <li key={i} className="text-sm text-[#1a1a1a]/80 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-[#b8471f] mb-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Gaps to address
            </div>
            <ul className="space-y-1.5">
              {(s.gaps || []).map((x, i) => (
                <li key={i} className="text-sm text-[#1a1a1a]/80 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#b8471f] mt-2 flex-shrink-0"></span>
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] text-white rounded-lg p-6 flex flex-col justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/50 mb-3">At a glance</div>
          <div className="space-y-4">
            <Stat label="Credits earned" value={s.totalCreditsEarned ?? "—"} />
            <Stat label="GPA estimate" value={s.gpaEstimate ?? "—"} />
            <Stat label="Top pathway" value={(data.careerClusterAlignment?.[0]?.cluster) || "—"} small />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, small }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-white/50 mb-1">{label}</div>
      <div className={`font-display ${small ? "text-lg" : "text-3xl"} leading-tight`}>{value}</div>
    </div>
  );
}

function CreditsTab({ data }) {
  const cp = data.creditProgress || {};
  const rows = [
    ["English", cp.english],
    ["Math", cp.math],
    ["Science", cp.science],
    ["Social Studies", cp.socialStudies],
    ["Health & PE", cp.healthPE],
    ["Fine Arts", cp.fineArts],
    ["Financial Literacy", cp.financialLiteracy],
    ["Electives", cp.electives],
  ].filter(([, v]) => v);

  return (
    <div className="bg-white border border-[#1a1a1a]/10 rounded-lg p-6">
      <h3 className="font-display text-xl mb-2">Ohio graduation credit progress</h3>
      <p className="text-sm text-[#1a1a1a]/60 mb-6">
        Ohio requires 20 credits minimum. Fine Arts waivable for CTE pathway students. Financial Literacy required for class of 2026+.
      </p>
      <div className="space-y-4">
        {rows.map(([label, v]) => {
          const pct = Math.min(100, Math.round((v.earned / v.required) * 100));
          const met = v.earned >= v.required;
          return (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium">{label}</span>
                <span className={met ? "text-green-700" : "text-[#1a1a1a]/60"}>
                  {v.earned} / {v.required} {met && "✓"}
                </span>
              </div>
              <div className="h-2 bg-[#1a1a1a]/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${met ? "bg-green-600" : "bg-[#b8471f]"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClustersTab({ data }) {
  const clusters = data.careerClusterAlignment || [];
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#1a1a1a]/60 mb-2">
        Alignment to Ohio's 16 National Career Clusters, ranked by evidence in the transcript.
      </p>
      {clusters.map((c, i) => (
        <div key={i} className="bg-white border border-[#1a1a1a]/10 rounded-lg p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#1a1a1a]/50 mb-1">
                Cluster #{i + 1}
              </div>
              <h4 className="font-display text-lg">{c.cluster}</h4>
            </div>
            <div className="text-right">
              <div className="text-2xl font-display text-[#b8471f]">{c.alignmentScore}</div>
              <div className="text-xs text-[#1a1a1a]/50">alignment</div>
            </div>
          </div>
          <p className="text-sm text-[#1a1a1a]/70 mb-3">{c.evidence}</p>
          {c.pathways && c.pathways.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {c.pathways.map((p, j) => (
                <span key={j} className="text-xs px-2.5 py-1 bg-[#b8471f]/10 text-[#b8471f] rounded-full">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function NextCoursesTab({ data }) {
  const rec = data.recommendedNextCourses || {};
  const reasoning = data.recommendationReasoning;

  const pathwayConfig = {
    college: { title: "College pathway (CSU / Tri-C)", icon: GraduationCap },
    career: { title: "Career / CTE pathway", icon: Briefcase },
    military: { title: "Military pathway", icon: Award },
  };

  const activePathways = Object.keys(pathwayConfig).filter(
    (k) => Array.isArray(rec[k]) && rec[k].length > 0
  );

  return (
    <div className="space-y-6">
      {/* Overall reasoning — the "why" behind everything below */}
      {reasoning && (
        <div className="bg-[#b8471f]/5 border-l-4 border-[#b8471f] rounded-r-lg p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#b8471f] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display text-lg mb-1.5">Why these recommendations</h3>
              <p className="text-sm text-[#1a1a1a]/80 leading-relaxed">{reasoning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pathway columns — flex grid that adapts 1/2/3/4 columns */}
      <div
        className={`grid gap-6 ${
          activePathways.length === 1
            ? "grid-cols-1"
            : activePathways.length === 2
            ? "md:grid-cols-2"
            : "md:grid-cols-2 xl:grid-cols-3"
        }`}
      >
        {activePathways.map((key) => (
          <CourseColumn
            key={key}
            title={pathwayConfig[key].title}
            icon={pathwayConfig[key].icon}
            courses={rec[key]}
            variant={key}
          />
        ))}
      </div>

      {activePathways.length === 0 && (
        <div className="bg-white border border-[#1a1a1a]/10 rounded-lg p-6 text-sm text-[#1a1a1a]/60">
          No course recommendations returned for the selected pathways.
        </div>
      )}
    </div>
  );
}

function CourseColumn({ title, icon: Icon, courses, variant }) {
  return (
    <div className="bg-white border border-[#1a1a1a]/10 rounded-lg p-6">
      <h3 className="font-display text-xl mb-5 flex items-center gap-2">
        <Icon className="w-5 h-5 text-[#b8471f]" />
        {title}
      </h3>
      <div className="space-y-5">
        {courses.map((c, i) => (
          <div key={i} className="border-l-2 border-[#b8471f]/30 pl-4 py-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-medium text-[#1a1a1a] leading-snug">{c.course}</h4>
              <PriorityBadge level={c.priority} />
            </div>

            {/* Reasoning — prominent, labeled */}
            <div className="bg-[#faf7f2] border border-[#1a1a1a]/5 rounded-md p-3 mb-2">
              <div className="text-[10px] uppercase tracking-wider text-[#1a1a1a]/50 mb-1 font-medium">
                Reasoning
              </div>
              <p className="text-sm text-[#1a1a1a]/80 leading-relaxed">{c.rationale}</p>
            </div>

            {/* Metadata tags */}
            <div className="flex flex-wrap gap-2 text-xs">
              {variant === "college" && c.institution && c.institution !== "null" && (
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-900 rounded-full font-semibold">
                  {c.institution === "both" ? "CSU + Tri-C" : c.institution}
                </span>
              )}
              {variant === "college" && c.ccpEligible && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded-full">CCP eligible</span>
              )}
              {c.cluster && (
                <span className="px-2 py-0.5 bg-[#1a1a1a]/5 text-[#1a1a1a]/70 rounded-full">{c.cluster}</span>
              )}
              {c.credentialOpportunity && (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-900 rounded-full">
                  → {c.credentialOpportunity}
                </span>
              )}
              {c.branch && (
                <span className="px-2 py-0.5 bg-green-50 text-green-900 rounded-full">
                  Branch: {c.branch}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriorityBadge({ level }) {
  const styles = {
    high: "bg-[#b8471f] text-white",
    medium: "bg-amber-100 text-amber-900",
    low: "bg-[#1a1a1a]/5 text-[#1a1a1a]/60",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${styles[level] || styles.low}`}>
      {level}
    </span>
  );
}

function SealsTab({ data }) {
  const seals = data.diplomaSealProgress || [];
  const omj = data.workforceReadinessSealStatus || {};
  return (
    <div className="space-y-6">
      {/* OMJ Readiness Seal highlighted */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2520] text-white rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1">Workforce seal status</div>
            <h3 className="font-display text-2xl">OhioMeansJobs-Readiness Seal</h3>
          </div>
          <div className={`text-xs px-3 py-1 rounded-full ${omj.eligible ? "bg-green-500/20 text-green-300" : "bg-amber-500/20 text-amber-300"}`}>
            {omj.eligible ? "Eligible" : "In progress"}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/50 mb-2">Mentors needed</div>
            <div className="font-display text-3xl mb-4">{omj.mentorsNeeded ?? 3}</div>
            <div className="text-xs uppercase tracking-wider text-white/50 mb-2">Skills demonstrated</div>
            <div className="flex flex-wrap gap-1.5">
              {(omj.skillsDemonstrated || []).map((s, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full">
                  {s}
                </span>
              ))}
              {(!omj.skillsDemonstrated || omj.skillsDemonstrated.length === 0) && (
                <span className="text-xs text-white/40">None yet</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/50 mb-2">Skills to demonstrate</div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(omj.skillsToDemonstrate || []).map((s, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-white/10 text-white/80 rounded-full">
                  {s}
                </span>
              ))}
            </div>
            <div className="text-xs uppercase tracking-wider text-white/50 mb-2">Action items</div>
            <ul className="space-y-1">
              {(omj.actionItems || []).map((a, i) => (
                <li key={i} className="text-sm text-white/80 flex items-start gap-1.5">
                  <span className="text-[#b8471f] mt-0.5">→</span> {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Other seals */}
      <div className="grid md:grid-cols-2 gap-4">
        {seals.map((s, i) => (
          <div key={i} className="bg-white border border-[#1a1a1a]/10 rounded-lg p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-display text-lg">{s.seal}</h4>
                <div className="text-xs text-[#1a1a1a]/50 mt-0.5">
                  {s.stateDefined ? "State-defined" : "Locally-defined"}
                </div>
              </div>
              <SealStatus status={s.progress} />
            </div>
            <p className="text-sm text-[#1a1a1a]/70 mb-2">{s.requirements}</p>
            {s.nextSteps && (
              <div className="text-sm text-[#b8471f] flex items-start gap-1.5">
                <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {s.nextSteps}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SealStatus({ status }) {
  const config = {
    likely_earned: { label: "Likely earned", cls: "bg-green-100 text-green-800" },
    in_progress: { label: "In progress", cls: "bg-amber-100 text-amber-900" },
    not_started: { label: "Not started", cls: "bg-[#1a1a1a]/5 text-[#1a1a1a]/60" },
  };
  const c = config[status] || config.not_started;
  return <span className={`text-xs px-2.5 py-1 rounded-full ${c.cls}`}>{c.label}</span>;
}

function ActionPlanTab({ data }) {
  const plan = data.actionPlan || {};
  const pathways = data.recommendedPathways || [];
  return (
    <div className="space-y-6">
      {/* Pathways */}
      {pathways.length > 0 && (
        <div>
          <h3 className="font-display text-xl mb-4">Recommended pathways</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {pathways.map((p, i) => (
              <div key={i} className="bg-white border border-[#1a1a1a]/10 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    p.type === "college"
                      ? "bg-blue-100 text-blue-800"
                      : p.type === "career"
                      ? "bg-[#b8471f]/10 text-[#b8471f]"
                      : p.type === "military"
                      ? "bg-green-100 text-green-800"
                      : "bg-purple-100 text-purple-800"
                  }`}>
                    {p.type}
                  </span>
                </div>
                <h4 className="font-display text-lg mb-2">{p.name}</h4>
                <p className="text-sm text-[#1a1a1a]/70 mb-3">{p.description}</p>
                {p.courseSequence?.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs uppercase tracking-wider text-[#1a1a1a]/50 mb-1">Course sequence</div>
                    <div className="text-sm text-[#1a1a1a]/80">{p.courseSequence.join(" → ")}</div>
                  </div>
                )}
                {p.credentials?.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs uppercase tracking-wider text-[#1a1a1a]/50 mb-1">Credentials</div>
                    <div className="flex flex-wrap gap-1">
                      {p.credentials.map((c, j) => (
                        <span key={j} className="text-xs px-2 py-0.5 bg-amber-50 text-amber-900 rounded-full">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {p.postsecondaryOptions?.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#1a1a1a]/50 mb-1">After graduation</div>
                    <div className="text-sm text-[#1a1a1a]/80">{p.postsecondaryOptions.join(", ")}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline action plan */}
      <div>
        <h3 className="font-display text-xl mb-4">Action plan</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <TimelineCard title="Immediate" subtitle="Next 2 weeks" items={plan.immediate || []} />
          <TimelineCard title="This semester" subtitle="Current term" items={plan.thisSemester || []} />
          <TimelineCard title="Next year" subtitle="Upcoming year" items={plan.nextYear || []} />
          <TimelineCard title="Before graduation" subtitle="Long-term" items={plan.beforeGraduation || []} />
        </div>
      </div>
    </div>
  );
}

function TimelineCard({ title, subtitle, items }) {
  return (
    <div className="bg-white border border-[#1a1a1a]/10 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4 text-[#b8471f]" />
        <h4 className="font-display text-base">{title}</h4>
      </div>
      <div className="text-xs text-[#1a1a1a]/50 mb-3">{subtitle}</div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-[#1a1a1a]/80 flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-[#b8471f] mt-2 flex-shrink-0"></span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
