import { useState, useRef } from 'react';

// ============================================================================
// Data — palettes, fonts, templates, scaffolding
// ============================================================================

const PALETTES = {
  'navy-gold':    { name: 'Navy & Gold',    header: '#1a2b4c', accent: '#c9a961', surface: '#ffffff', bg: '#faf7f0', text: '#1a1a1a', muted: '#5a5a5a' },
  'forest-sand':  { name: 'Forest & Sand',  header: '#2d4a33', accent: '#d4a373', surface: '#ffffff', bg: '#faf4e8', text: '#1a1a1a', muted: '#5a5a5a' },
  'slate-coral':  { name: 'Slate & Coral',  header: '#374b5a', accent: '#e85a4f', surface: '#ffffff', bg: '#f8f7f5', text: '#1a1a1a', muted: '#5a5a5a' },
  'ink-ochre':    { name: 'Ink & Ochre',    header: '#1c1c1c', accent: '#d4a017', surface: '#ffffff', bg: '#fafaf7', text: '#1a1a1a', muted: '#5a5a5a' },
  'ocean':        { name: 'Ocean',          header: '#0f3e5f', accent: '#5aa9c9', surface: '#ffffff', bg: '#f0f6fa', text: '#0a1e2d', muted: '#4a6a7a' },
  'graphite-lime':{ name: 'Graphite & Lime',header: '#222222', accent: '#a8d000', surface: '#ffffff', bg: '#f4f4f2', text: '#1a1a1a', muted: '#555555' },
};

const FONT_PAIRS = {
  'playfair-source':  { name: 'Classic Academic',  display: "'Playfair Display', serif", body: "'Source Sans 3', sans-serif" },
  'fraunces-sora':    { name: 'Modern Editorial',  display: "'Fraunces', serif",         body: "'Sora', sans-serif" },
  'dmserif-dmsans':   { name: 'Elegant Display',   display: "'DM Serif Display', serif", body: "'DM Sans', sans-serif" },
  'plex-plex':        { name: 'Technical',         display: "'IBM Plex Serif', serif",   body: "'IBM Plex Sans', sans-serif" },
};

const TEMPLATES = {
  academic:  { name: 'Academic Conference', description: 'Top title band, three-column body. The classic.' },
  editorial: { name: 'Editorial Feature',   description: 'Asymmetric hero title on left, flowing sections on right.' },
};

const FORMATS = {
  'poster-portrait':  { name: 'Poster — Portrait',  w: 36, h: 48, label: '36" × 48"' },
  'poster-landscape': { name: 'Poster — Landscape', w: 48, h: 36, label: '48" × 36"' },
};

// Printable area per paper size (0.25" margin all around)
const PAPER_SIZES = {
  letter:  { name: 'Letter (8.5×11)',  w: 8.5,  h: 11, printW: 8.0, printH: 10.5, margin: 0.25 },
  tabloid: { name: 'Tabloid (11×17)',  w: 11,   h: 17, printW: 10.5, printH: 16.5, margin: 0.25 },
};

const SECTIONS = [
  {
    key: 'abstract',
    label: 'Abstract',
    wordMin: 60, wordMax: 100,
    prompt: 'Your whole project in a tiny package — problem, what you did, what you found, why it matters.',
    tips: [
      'Write this LAST, after everything else is done.',
      'Answers: what problem, what you did, what you found, so what?',
      'Avoid abstracts that are mostly background — the reader wants to know what YOU did.',
    ],
    example: '"We designed a low-cost soil moisture sensor for community gardens in Cleveland. Using an ESP32 and capacitive sensors, we built and tested 12 units across 3 garden sites over 6 weeks. Sensors reported within 5% of commercial units at roughly 1/8th the cost, and gardeners reported they now water less often. A bigger pilot is planned for 2027."',
  },
  {
    key: 'problem',
    label: 'Problem / Question',
    wordMin: 50, wordMax: 100,
    prompt: 'What you were trying to figure out, solve, or build — and why it matters.',
    tips: [
      'State clearly what is broken, unknown, or needed.',
      'Say who is affected or why the reader should care.',
      'End with the specific question or goal you pursued.',
      'Avoid starting with "In today\'s world…"',
    ],
    example: '"Cleveland\'s community gardens rely mostly on guesswork for watering, which wastes water and stresses plants. Commercial soil moisture sensors cost $150+ per unit — unaffordable for volunteer-run gardens. We asked: can we build a sensor network that gives useful watering guidance for under $20 per garden?"',
  },
  {
    key: 'background',
    label: 'Background',
    wordMin: 75, wordMax: 150,
    prompt: 'What was already known or built before you started — just enough context for your reader to follow along.',
    tips: [
      'Include key terms or tech the reader needs.',
      'Mention 1–3 things others have done in this space.',
      'Point to what is still missing — which is what you worked on.',
      'You are setting the stage, not giving a lecture.',
    ],
    example: '"Capacitive soil moisture sensors measure the dielectric constant of soil — wetter soil gives a higher reading. Prior work at OSU showed that inexpensive capacitive sensors drift over time when exposed to outdoor humidity. Commercial systems (e.g., Vegetronix VH400) solve this with sealed probes but cost $80+. No existing open hardware solution combined sealed probes with low-cost wireless reporting."',
  },
  {
    key: 'approach',
    label: 'Approach / Methods',
    wordMin: 100, wordMax: 200,
    prompt: 'The steps you took. Tools, materials, code, interviews, experiments.',
    tips: [
      'Be specific about tools: "Python pandas" not "some code."',
      'A reader should roughly be able to reproduce what you did.',
      'Visuals that work here: flowcharts, setup photos, screenshots.',
    ],
    example: '"We designed a sealed capacitive probe using a PCB with a conformal coating. An ESP32-S3 reads the probe every 30 minutes and publishes to an MQTT broker. A Python script on a Raspberry Pi logs readings and serves a simple web dashboard. We deployed 12 units across 3 garden sites and compared readings to a Vegetronix VH400 at each site for 6 weeks."',
  },
  {
    key: 'results',
    label: 'Results / Findings',
    wordMin: 100, wordMax: 200,
    prompt: 'What happened. What you made. What the data showed.',
    tips: [
      'SHOW, don\'t just tell — include at least one chart or photo.',
      'State the primary outcome (a number, a product, a finding).',
      'Be honest about what didn\'t work.',
      'Don\'t claim more than your data supports.',
    ],
    example: '"Our sensors tracked the commercial reference within ±5% across all three sites. Total parts cost was $18 per sensor vs. $150+ commercial. All three garden coordinators reported they changed their watering behavior based on the dashboard. One sensor failed after two weeks of rain — the conformal coating wasn\'t thick enough at the probe tip. Field-replaceable probes solved this in our second batch."',
  },
  {
    key: 'reflection',
    label: 'Reflection',
    wordMin: 50, wordMax: 100,
    prompt: 'What this project taught YOU as a student and future professional.',
    tips: [
      'What skill did you build that you didn\'t have before?',
      'What surprised you?',
      'What would you do differently?',
    ],
    example: '"I had never designed a PCB before this internship — learning KiCad was frustrating for the first two weeks and then suddenly clicked. The biggest surprise was how much of the work wasn\'t electronics but talking to gardeners about what they actually wanted to see on the dashboard. Next time I\'d interview users in week one, not week four."',
  },
  {
    key: 'nextSteps',
    label: 'Next Steps',
    wordMin: 40, wordMax: 80,
    prompt: 'What you didn\'t get to, or what someone could do next.',
    tips: [
      'This matters — it shows your project is part of something bigger.',
      '"I ran out of time to test with more users" is a valid next step.',
    ],
    example: '"A pilot across 10+ gardens would confirm that readings generalize across soil types. The dashboard should send SMS alerts when a garden dries out, and the sensor firmware needs over-the-air updates so we can patch field units without pulling them out of the ground."',
  },
  {
    key: 'acknowledgments',
    label: 'Acknowledgments',
    wordMin: 20, wordMax: 60,
    prompt: 'Thank your mentor, host organization, EXPLR, and anyone who helped.',
    tips: [
      'List your mentor by name and title.',
      'Thank EXPLR, CSU, MAGNET, your host org, any funders.',
    ],
    example: '"Special thanks to my mentor Jane Doe (Senior Engineer, MAGNET) and the team at Rid-All Green Partnership for hosting the pilot. This project was supported by EXPLR and the Cleveland State University / MAGNET Summer Internship Program."',
  },
];

// ============================================================================
// Helpers
// ============================================================================

const wordCount = (s) => (s || '').trim().split(/\s+/).filter(Boolean).length;

// ============================================================================
// Cut & Paste: element extraction + tile math
// ============================================================================

// For a given format + template, return the list of discrete elements that
// make up the poster, with their target size in INCHES on the final board.
// Each element has a kind that tells the renderer how to draw it from project data.
function extractElements(project, format) {
  const { w: pw, h: ph } = format;           // poster dimensions in inches
  const pad = 0.5;                            // matches the 48px @ 96dpi padding in templates
  const gap = 0.5;
  const isPortrait = ph > pw;
  const cols = isPortrait ? 3 : 4;
  const titleH = isPortrait ? 4.375 : 3.54;   // matches the titleBand height in AcademicPoster
  const footerH = 1.75;
  const bodyH = ph - titleH - footerH;
  const colW = (pw - pad * 2 - gap * (cols - 1)) / cols;

  const enabled = (project.enabledSections ||
    ['abstract','problem','background','approach','results','reflection','nextSteps'])
    .filter((k) => k !== 'acknowledgments');

  // Split enabled sections across columns using a simple round-robin.
  // In practice the board only has `cols` columns, and rows stack.
  const rows = Math.ceil(enabled.length / cols);
  const sectionH = (bodyH - (rows - 1) * gap) / rows;

  const elements = [];

  // Title block
  elements.push({
    id: 'title',
    label: 'Title Block',
    kind: 'title',
    w: pw,
    h: titleH,
    placement: 'Top of poster, full width',
  });

  // Section blocks
  enabled.forEach((sectionKey, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (colW + gap);
    const y = titleH + pad + row * (sectionH + gap);
    const sec = SECTIONS.find((s) => s.key === sectionKey);
    elements.push({
      id: `sec-${sectionKey}`,
      label: sec?.label || sectionKey,
      kind: 'section',
      sectionKey,
      w: colW,
      h: sectionH,
      placement: `Column ${col + 1}, Row ${row + 1} (${x.toFixed(1)}" from left, ${y.toFixed(1)}" from top)`,
    });
  });

  // Footer
  elements.push({
    id: 'footer',
    label: 'Footer (Acknowledgments)',
    kind: 'footer',
    w: pw,
    h: footerH,
    placement: 'Bottom of poster, full width',
  });

  return elements;
}

// Compute how many tile pages an element needs on a given paper size.
function tilePlan(elementW, elementH, paper) {
  const cols = Math.max(1, Math.ceil(elementW / paper.printW));
  const rows = Math.max(1, Math.ceil(elementH / paper.printH));
  return { cols, rows, total: cols * rows };
}



export default function PosterBuilder() {
  const [project, setProject] = useState({
    title: 'Low-Cost Soil Moisture Sensors for Community Gardens',
    subtitle: 'A Pilot with Cleveland Community Garden Partners',
    authors: 'Alex Rivera',
    mentor: 'Jane Doe, Senior Engineer',
    organization: 'MAGNET / Rid-All Green Partnership',
    school: 'John Hay High School',
    dateRange: 'Summer 2026',
    sections: {
      abstract: '', problem: '', background: '', approach: '',
      results: '', reflection: '', nextSteps: '', acknowledgments: '',
    },
    visuals: [],
    design: { palette: 'navy-gold', fontPair: 'playfair-source', template: 'academic' },
    format: 'poster-portrait',
  });

  const [tab, setTab] = useState('content');
  const [currentSection, setCurrentSection] = useState('abstract');
  const [exportMode, setExportMode] = useState('full'); // 'full' | 'cut-paste'
  const [paperSize, setPaperSize] = useState('letter'); // 'letter' | 'tabloid'

  const palette = PALETTES[project.design.palette];
  const fontPair = FONT_PAIRS[project.design.fontPair];
  const format = FORMATS[project.format];

  const updateProject = (patch) => setProject((p) => ({ ...p, ...patch }));
  const updateSection = (key, value) =>
    setProject((p) => ({ ...p, sections: { ...p.sections, [key]: value } }));
  const updateDesign = (patch) =>
    setProject((p) => ({ ...p, design: { ...p.design, ...patch } }));
  const addVisual = (visual) =>
    setProject((p) => ({ ...p, visuals: [...p.visuals, visual] }));
  const updateVisual = (id, patch) =>
    setProject((p) => ({ ...p, visuals: p.visuals.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
  const removeVisual = (id) =>
    setProject((p) => ({ ...p, visuals: p.visuals.filter((v) => v.id !== id) }));

  const section = SECTIONS.find((s) => s.key === currentSection);
  const sectionValue = project.sections[currentSection] || '';
  const wc = wordCount(sectionValue);
  const wcStatus =
    wc === 0 ? 'empty'
    : wc < section.wordMin ? 'short'
    : wc <= section.wordMax ? 'good'
    : 'long';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#f5f1eb] text-[#1a1a1a] builder-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,800&family=Sora:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;700;900&family=Source+Sans+3:wght@300;400;500;600;700&family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Serif:wght@400;500;600&display=swap');

        .builder-root, .builder-root * { box-sizing: border-box; }
        .builder-root { font-family: 'Sora', sans-serif; font-feature-settings: 'ss01'; }
        .display-font { font-family: 'Fraunces', serif; font-optical-sizing: auto; }

        .chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px; border-radius: 999px;
          font-size: 11px; letter-spacing: 0.02em;
          background: #ebe4d6; color: #4a3f2a;
        }
        .chip-good { background: #dbe8d5; color: #3a5a2a; }
        .chip-short { background: #f1e5c9; color: #7a5a1a; }
        .chip-long { background: #f1d5c9; color: #7a3a1a; }

        .tab-btn {
          padding: 10px 18px; font-size: 13px; letter-spacing: 0.04em;
          text-transform: uppercase; font-weight: 500;
          border-bottom: 2px solid transparent;
          color: #6a5f4a; cursor: pointer; background: transparent; border-top: 0; border-left: 0; border-right: 0;
          transition: color 0.2s, border-color 0.2s;
        }
        .tab-btn:hover { color: #1a1a1a; }
        .tab-btn.active { color: #1a1a1a; border-bottom-color: #1a1a1a; }

        .section-btn {
          width: 100%; text-align: left; padding: 10px 14px;
          border-radius: 6px; font-size: 13px; background: transparent;
          border: 1px solid transparent; cursor: pointer; display: flex;
          justify-content: space-between; align-items: center;
          color: #4a3f2a; transition: all 0.15s;
        }
        .section-btn:hover { background: rgba(0,0,0,0.03); }
        .section-btn.active { background: #1a1a1a; color: #f5f1eb; border-color: #1a1a1a; }

        .field-label {
          display: block; font-size: 11px; letter-spacing: 0.08em;
          text-transform: uppercase; color: #6a5f4a; margin-bottom: 6px;
          font-weight: 500;
        }
        .field-input {
          width: 100%; padding: 10px 12px; font-size: 14px;
          background: #fff; border: 1px solid #d9d1c0; border-radius: 4px;
          font-family: inherit; color: #1a1a1a;
          transition: border-color 0.15s;
        }
        .field-input:focus { outline: none; border-color: #1a1a1a; }

        textarea.field-input { min-height: 180px; resize: vertical; line-height: 1.55; }

        .palette-tile {
          display: flex; align-items: center; gap: 10px;
          padding: 10px; border-radius: 6px; cursor: pointer;
          border: 2px solid transparent; background: #fff;
          transition: border-color 0.15s;
        }
        .palette-tile:hover { border-color: #d9d1c0; }
        .palette-tile.active { border-color: #1a1a1a; }
        .palette-swatch {
          display: flex; gap: 2px; width: 52px; height: 28px;
          border-radius: 3px; overflow: hidden;
        }
        .palette-swatch > div { flex: 1; }

        .font-tile {
          padding: 12px 14px; border-radius: 6px; cursor: pointer;
          border: 2px solid transparent; background: #fff;
          transition: border-color 0.15s;
        }
        .font-tile:hover { border-color: #d9d1c0; }
        .font-tile.active { border-color: #1a1a1a; }

        .preview-shell {
          flex: 1; overflow: auto; background: #ebe4d6;
          padding: 32px; display: flex; justify-content: center; align-items: flex-start;
        }
        .preview-paper {
          background: #fff;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08);
        }

        .print-only-cutpaste { display: none; }

        @media print {
          ${exportMode === 'full' ? `
            @page { size: ${format.w}in ${format.h}in; margin: 0; }
            body * { visibility: hidden; }
            .print-root, .print-root * { visibility: visible; }
            .print-root {
              position: absolute; left: 0; top: 0;
              width: ${format.w}in; height: ${format.h}in;
              transform: none !important;
            }
            .builder-root { background: #fff !important; }
          ` : `
            @page { size: ${PAPER_SIZES[paperSize].w}in ${PAPER_SIZES[paperSize].h}in; margin: 0; }
            body * { visibility: hidden; }
            .print-only-cutpaste, .print-only-cutpaste * { visibility: visible; }
            .print-only-cutpaste { display: block !important; position: absolute; left: 0; top: 0; }
            .builder-root { background: #fff !important; }
          `}
        }
      `}</style>

      {/* =================== Header =================== */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-[#d9d1c0] bg-[#f5f1eb]">
        <div className="flex items-center gap-5">
          <div className="display-font text-2xl font-bold tracking-tight">EXPLR</div>
          <div className="h-5 w-px bg-[#bfb6a1]" />
          <div className="text-sm uppercase tracking-widest text-[#6a5f4a]">Poster Builder</div>
        </div>
        <div className="flex items-center gap-4">
          {/* Export mode toggle */}
          <div className="flex items-center bg-white rounded-sm p-0.5 border border-[#d9d1c0]">
            <button
              onClick={() => setExportMode('full')}
              className={`px-3 py-1.5 text-xs rounded-sm transition ${exportMode === 'full' ? 'bg-[#1a1a1a] text-[#f5f1eb]' : 'text-[#6a5f4a] hover:text-[#1a1a1a]'}`}
            >
              Full Poster
            </button>
            <button
              onClick={() => setExportMode('cut-paste')}
              className={`px-3 py-1.5 text-xs rounded-sm transition ${exportMode === 'cut-paste' ? 'bg-[#1a1a1a] text-[#f5f1eb]' : 'text-[#6a5f4a] hover:text-[#1a1a1a]'}`}
            >
              Cut &amp; Paste
            </button>
          </div>
          {exportMode === 'cut-paste' && (
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              className="text-xs px-2 py-1.5 bg-white border border-[#d9d1c0] rounded-sm text-[#1a1a1a]"
            >
              {Object.entries(PAPER_SIZES).map(([key, p]) => (
                <option key={key} value={key}>{p.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-[#1a1a1a] text-[#f5f1eb] text-sm font-medium tracking-wide rounded-sm hover:bg-black transition"
          >
            {exportMode === 'cut-paste' ? 'Print Assembly Packet →' : 'Print / Save PDF →'}
          </button>
        </div>
      </header>

      {/* =================== Main grid =================== */}
      <div className="flex-1 grid min-h-0" style={{ gridTemplateColumns: '1fr 1.05fr' }}>
        {/* =============== Editor pane =============== */}
        <div className="flex flex-col min-h-0 border-r border-[#d9d1c0]">
          {/* Tabs */}
          <div className="flex gap-1 px-8 pt-2 border-b border-[#d9d1c0] bg-[#f5f1eb]">
            {['info', 'content', 'design'].map((t) => (
              <button
                key={t}
                className={`tab-btn ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'info' ? '1 · Project Info' : t === 'content' ? '2 · Content' : '3 · Design'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto">
            {tab === 'info' && <InfoTab project={project} update={updateProject} />}
            {tab === 'content' && (
              <ContentTab
                project={project}
                updateSection={updateSection}
                currentSection={currentSection}
                setCurrentSection={setCurrentSection}
                section={section}
                wc={wc}
                wcStatus={wcStatus}
                addVisual={addVisual}
                updateVisual={updateVisual}
                removeVisual={removeVisual}
              />
            )}
            {tab === 'design' && (
              <DesignTab project={project} updateDesign={updateDesign} update={updateProject} />
            )}
          </div>
        </div>

        {/* =============== Preview pane =============== */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between px-6 py-3 border-b border-[#d9d1c0] bg-[#f5f1eb]">
            <div className="text-[11px] tracking-widest uppercase text-[#6a5f4a]">
              {exportMode === 'cut-paste' ? 'Cut & Paste Preview' : 'Live Preview'}
            </div>
            <div className="text-[11px] text-[#6a5f4a]">
              {exportMode === 'cut-paste'
                ? `Prints on ${PAPER_SIZES[paperSize].name}`
                : `Actual size: ${format.label} · scaled to fit`}
            </div>
          </div>
          <div className="preview-shell">
            {exportMode === 'full' ? (
              <PosterPreview project={project} palette={palette} fontPair={fontPair} format={format} />
            ) : (
              <CutPasteView
                project={project}
                palette={palette}
                fontPair={fontPair}
                format={format}
                paper={PAPER_SIZES[paperSize]}
              />
            )}
          </div>
        </div>
      </div>

      {/* Hidden print-only layouts */}
      <div className="print-only-cutpaste">
        {exportMode === 'cut-paste' && (
          <CutPastePrintLayout
            project={project}
            palette={palette}
            fontPair={fontPair}
            format={format}
            paper={PAPER_SIZES[paperSize]}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Project Info
// ============================================================================

function InfoTab({ project, update }) {
  const f = (k) => ({
    value: project[k],
    onChange: (e) => update({ [k]: e.target.value }),
  });
  return (
    <div className="p-8 max-w-2xl">
      <h2 className="display-font text-3xl font-semibold mb-1">Project Info</h2>
      <p className="text-sm text-[#6a5f4a] mb-6">
        The basic facts about your project and who made it.
      </p>
      <div className="space-y-4">
        <div>
          <label className="field-label">Title</label>
          <input className="field-input" {...f('title')} />
          <div className="text-[11px] text-[#8a7f6a] mt-1">8–15 words. Specific, not clever.</div>
        </div>
        <div>
          <label className="field-label">Subtitle (optional)</label>
          <input className="field-input" {...f('subtitle')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Author(s)</label>
            <input className="field-input" {...f('authors')} />
          </div>
          <div>
            <label className="field-label">School</label>
            <input className="field-input" {...f('school')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Mentor</label>
            <input className="field-input" {...f('mentor')} />
          </div>
          <div>
            <label className="field-label">Host Organization</label>
            <input className="field-input" {...f('organization')} />
          </div>
        </div>
        <div>
          <label className="field-label">Date Range</label>
          <input className="field-input" {...f('dateRange')} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Content
// ============================================================================

function ContentTab({ project, updateSection, currentSection, setCurrentSection, section, wc, wcStatus, addVisual, updateVisual, removeVisual }) {
  const value = project.sections[currentSection] || '';
  const sectionVisuals = project.visuals.filter((v) => v.section === currentSection);
  return (
    <div className="grid h-full min-h-0" style={{ gridTemplateColumns: '220px 1fr' }}>
      {/* Section list */}
      <aside className="border-r border-[#d9d1c0] p-4 overflow-auto bg-[#f0ead9]">
        <div className="text-[10px] tracking-widest uppercase text-[#6a5f4a] mb-2 px-2">Sections</div>
        <div className="flex flex-col gap-0.5">
          {SECTIONS.map((s) => {
            const w = wordCount(project.sections[s.key]);
            const done = w >= s.wordMin;
            const imgCount = project.visuals.filter((v) => v.section === s.key).length;
            return (
              <button
                key={s.key}
                className={`section-btn ${currentSection === s.key ? 'active' : ''}`}
                onClick={() => setCurrentSection(s.key)}
              >
                <span>{s.label}</span>
                <span className="text-[10px] opacity-70 flex items-center gap-1.5">
                  {imgCount > 0 && <span>◩{imgCount}</span>}
                  {done ? '✓' : w > 0 ? '…' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Editor + scaffolding */}
      <div className="overflow-auto">
        <div className="grid" style={{ gridTemplateColumns: '1fr 300px', minHeight: '100%' }}>
          {/* Editor */}
          <div className="p-8">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="display-font text-3xl font-semibold">{section.label}</h2>
              <span className={`chip ${wcStatus === 'good' ? 'chip-good' : wcStatus === 'short' ? 'chip-short' : wcStatus === 'long' ? 'chip-long' : ''}`}>
                {wc} words · aim {section.wordMin}–{section.wordMax}
              </span>
            </div>
            <p className="text-sm text-[#6a5f4a] mb-5">{section.prompt}</p>
            <textarea
              className="field-input"
              value={value}
              onChange={(e) => updateSection(currentSection, e.target.value)}
              placeholder={`Write your ${section.label.toLowerCase()} here…`}
            />

            <VisualsEditor
              sectionKey={currentSection}
              sectionLabel={section.label}
              visuals={sectionVisuals}
              addVisual={addVisual}
              updateVisual={updateVisual}
              removeVisual={removeVisual}
            />
          </div>

          {/* Scaffolding sidebar */}
          <aside className="bg-[#f0ead9] border-l border-[#d9d1c0] p-6 overflow-auto">
            <div className="text-[10px] tracking-widest uppercase text-[#6a5f4a] mb-2">Coaching</div>
            <h3 className="display-font text-xl font-semibold mb-3">What good looks like</h3>
            <ul className="space-y-2 mb-6">
              {section.tips.map((tip, i) => (
                <li key={i} className="text-xs text-[#3a3228] leading-relaxed flex gap-2">
                  <span className="text-[#b8a77a] mt-0.5">▸</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
            <div className="text-[10px] tracking-widest uppercase text-[#6a5f4a] mb-2">Example</div>
            <div className="text-xs text-[#3a3228] leading-relaxed italic border-l-2 border-[#b8a77a] pl-3 mb-6">
              {section.example}
            </div>
            <div className="text-[10px] tracking-widest uppercase text-[#6a5f4a] mb-2">On visuals</div>
            <div className="text-xs text-[#3a3228] leading-relaxed">
              Every visual needs a caption that tells the reader what to <em>notice</em>. Upload high-resolution images — the tool will warn if an image is too small for print.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Visuals Editor (inline, per section)
// ============================================================================

function VisualsEditor({ sectionKey, sectionLabel, visuals, addVisual, updateVisual, removeVisual }) {
  const fileRef = useRef(null);

  const handleFiles = (fileList) => {
    Array.from(fileList || []).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target.result;
        const img = new Image();
        img.onload = () => {
          addVisual({
            id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            section: sectionKey,
            src,
            caption: '',
            credit: '',
            filename: file.name,
            width: img.width,
            height: img.height,
          });
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <label className="field-label mb-0">Visuals for {sectionLabel}</label>
        <button
          onClick={() => fileRef.current?.click()}
          className="text-xs px-3 py-1.5 bg-[#1a1a1a] text-[#f5f1eb] rounded-sm hover:bg-black transition"
        >
          + Add image
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {visuals.length === 0 && (
        <div
          className="border-2 border-dashed border-[#d9d1c0] rounded-md p-6 text-center text-xs text-[#8a7f6a] bg-white/40 cursor-pointer hover:border-[#a89c82] transition"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        >
          Drop an image here, or click to upload.<br />
          Charts, photos, diagrams, screenshots — all work.
        </div>
      )}

      {visuals.length > 0 && (
        <div className="space-y-3">
          {visuals.map((v) => {
            const lowRes = v.width < 800;
            return (
              <div key={v.id} className="flex gap-3 p-3 bg-white rounded border border-[#e4ddc8]">
                <div className="shrink-0 w-24 h-24 rounded overflow-hidden bg-[#f0ead9] flex items-center justify-center">
                  <img src={v.src} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    className="field-input text-xs mb-2"
                    placeholder="Caption — tell the reader what to notice"
                    value={v.caption}
                    onChange={(e) => updateVisual(v.id, { caption: e.target.value })}
                  />
                  <input
                    className="field-input text-xs"
                    placeholder="Credit (optional) — who made this?"
                    value={v.credit}
                    onChange={(e) => updateVisual(v.id, { credit: e.target.value })}
                  />
                  <div className="flex items-center justify-between mt-2 text-[10px] text-[#8a7f6a]">
                    <span>
                      {v.width}×{v.height}px · {v.filename}
                      {lowRes && <span className="text-[#a04a1a] ml-2">⚠ low resolution for print</span>}
                    </span>
                    <button
                      onClick={() => removeVisual(v.id)}
                      className="text-[#a04a1a] hover:text-[#6a1a0a]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Tab: Design
// ============================================================================

function DesignTab({ project, updateDesign, update }) {
  return (
    <div className="p-8 max-w-3xl space-y-10">
      {/* Format */}
      <section>
        <h2 className="display-font text-3xl font-semibold mb-1">Format</h2>
        <p className="text-sm text-[#6a5f4a] mb-4">What you're printing to.</p>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(FORMATS).map(([key, f]) => (
            <button
              key={key}
              onClick={() => update({ format: key })}
              className={`p-4 bg-white rounded border-2 text-left transition ${
                project.format === key ? 'border-[#1a1a1a]' : 'border-transparent hover:border-[#d9d1c0]'
              }`}
            >
              <div className="text-sm font-medium">{f.name}</div>
              <div className="text-xs text-[#6a5f4a] mt-0.5">{f.label}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Template */}
      <section>
        <h2 className="display-font text-3xl font-semibold mb-1">Template</h2>
        <p className="text-sm text-[#6a5f4a] mb-4">The overall layout system.</p>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <button
              key={key}
              onClick={() => updateDesign({ template: key })}
              className={`p-4 bg-white rounded border-2 text-left transition ${
                project.design.template === key ? 'border-[#1a1a1a]' : 'border-transparent hover:border-[#d9d1c0]'
              }`}
            >
              <div className="text-sm font-medium">{t.name}</div>
              <div className="text-xs text-[#6a5f4a] mt-0.5">{t.description}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Palette */}
      <section>
        <h2 className="display-font text-3xl font-semibold mb-1">Color palette</h2>
        <p className="text-sm text-[#6a5f4a] mb-4">Picked, not picked — these all look good in print.</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PALETTES).map(([key, p]) => (
            <button
              key={key}
              onClick={() => updateDesign({ palette: key })}
              className={`palette-tile ${project.design.palette === key ? 'active' : ''}`}
            >
              <div className="palette-swatch">
                <div style={{ background: p.header }} />
                <div style={{ background: p.accent }} />
                <div style={{ background: p.bg }} />
              </div>
              <span className="text-sm">{p.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Font pair */}
      <section>
        <h2 className="display-font text-3xl font-semibold mb-1">Typography</h2>
        <p className="text-sm text-[#6a5f4a] mb-4">A display font for headlines, a body font for reading.</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(FONT_PAIRS).map(([key, fp]) => (
            <button
              key={key}
              onClick={() => updateDesign({ fontPair: key })}
              className={`font-tile ${project.design.fontPair === key ? 'active' : ''} text-left`}
            >
              <div style={{ fontFamily: fp.display, fontSize: 22, lineHeight: 1.1 }}>Headline</div>
              <div style={{ fontFamily: fp.body, fontSize: 12, color: '#5a5a5a', marginTop: 4 }}>
                {fp.name} — body text example
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// Poster preview
// ============================================================================

function PosterPreview({ project, palette, fontPair, format }) {
  // Scale the full-size poster down to fit the preview area.
  // We'll target ~440px wide. At 96 DPI, 36in = 3456px, so scale = 440/3456 ≈ 0.127
  const targetPx = 440;
  const scale = targetPx / (format.w * 96);
  const scaledW = format.w * 96 * scale;
  const scaledH = format.h * 96 * scale;

  const PosterContent = project.design.template === 'academic'
    ? AcademicPoster
    : EditorialPoster;

  return (
    <div
      className="preview-paper"
      style={{ width: `${scaledW}px`, height: `${scaledH}px`, overflow: 'hidden' }}
    >
      <div
        className="print-root"
        style={{
          width: `${format.w * 96}px`,
          height: `${format.h * 96}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          background: palette.bg,
          color: palette.text,
          fontFamily: fontPair.body,
        }}
      >
        <PosterContent project={project} palette={palette} fontPair={fontPair} format={format} />
      </div>
    </div>
  );
}

// --- Academic template ---
function AcademicPoster({ project, palette, fontPair, format }) {
  const isPortrait = format.h > format.w;
  const cols = isPortrait ? 3 : 4;
  const pad = 48; // px at full-size
  const titleBand = isPortrait ? 420 : 340;

  const bodySections = SECTIONS.filter((s) => s.key !== 'acknowledgments');
  const ackSection = SECTIONS.find((s) => s.key === 'acknowledgments');

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Title band */}
      <div
        style={{
          background: palette.header,
          color: '#fff',
          padding: `${pad * 1.2}px ${pad}px`,
          height: `${titleBand}px`,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          borderBottom: `12px solid ${palette.accent}`,
        }}
      >
        <div style={{ fontFamily: fontPair.display, fontSize: isPortrait ? 72 : 64, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.01em' }}>
          {project.title || 'Your project title'}
        </div>
        {project.subtitle && (
          <div style={{ fontFamily: fontPair.body, fontSize: 28, fontWeight: 300, marginTop: 18, opacity: 0.9 }}>
            {project.subtitle}
          </div>
        )}
        <div style={{ display: 'flex', gap: 40, marginTop: 28, fontSize: 20, opacity: 0.85, flexWrap: 'wrap' }}>
          <span><strong>{project.authors}</strong>{project.school ? ` · ${project.school}` : ''}</span>
          {project.mentor && <span>Mentor: {project.mentor}</span>}
          {project.organization && <span>{project.organization}</span>}
          {project.dateRange && <span>{project.dateRange}</span>}
        </div>
      </div>

      {/* Body columns */}
      <div
        style={{
          flex: 1,
          padding: `${pad}px`,
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: `${pad}px`,
        }}
      >
        {bodySections.map((s) => {
          const val = project.sections[s.key];
          const sectionVisuals = project.visuals.filter((v) => v.section === s.key);
          if (!val && sectionVisuals.length === 0) return (
            <div key={s.key}>
              <SectionHeading palette={palette} fontPair={fontPair}>{s.label}</SectionHeading>
              <div style={{ fontSize: 16, color: palette.muted, fontStyle: 'italic' }}>
                {s.prompt}
              </div>
            </div>
          );
          return (
            <div key={s.key}>
              <SectionHeading palette={palette} fontPair={fontPair}>{s.label}</SectionHeading>
              {sectionVisuals.map((v) => (
                <figure key={v.id} style={{ margin: '0 0 16px 0' }}>
                  <img src={v.src} alt="" style={{ width: '100%', display: 'block', borderRadius: 2 }} />
                  {(v.caption || v.credit) && (
                    <figcaption style={{ fontSize: 14, lineHeight: 1.35, color: palette.muted, marginTop: 6, fontStyle: 'italic' }}>
                      {v.caption}
                      {v.credit && <span style={{ fontStyle: 'normal', opacity: 0.7 }}>  — {v.credit}</span>}
                    </figcaption>
                  )}
                </figure>
              ))}
              {val && <div style={{ fontSize: 18, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{val}</div>}
            </div>
          );
        })}
      </div>

      {/* Footer strip */}
      <div
        style={{
          padding: `${pad * 0.75}px ${pad}px`,
          background: palette.surface,
          borderTop: `3px solid ${palette.accent}`,
          fontSize: 14, display: 'flex', justifyContent: 'space-between',
          color: palette.muted,
        }}
      >
        <div>
          <strong style={{ color: palette.header, fontFamily: fontPair.display, fontSize: 18 }}>Acknowledgments.</strong>{' '}
          {project.sections.acknowledgments || ackSection.prompt}
        </div>
        <div style={{ fontFamily: fontPair.display, fontWeight: 700, color: palette.header, fontSize: 20 }}>EXPLR</div>
      </div>
    </div>
  );
}

// --- Editorial template ---
function EditorialPoster({ project, palette, fontPair, format }) {
  const pad = 56;
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'grid',
      gridTemplateColumns: '1fr 1.4fr',
      background: palette.bg,
    }}>
      {/* Left hero panel */}
      <div style={{
        background: palette.header, color: '#fff',
        padding: `${pad}px`, display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ fontFamily: fontPair.body, fontSize: 16, letterSpacing: '0.15em', textTransform: 'uppercase', color: palette.accent, marginBottom: 40 }}>
          EXPLR · {project.dateRange || 'Summer Internship'}
        </div>
        <div style={{ fontFamily: fontPair.display, fontSize: 88, fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.02em', marginBottom: 28 }}>
          {project.title || 'Your project title'}
        </div>
        {project.subtitle && (
          <div style={{ fontFamily: fontPair.body, fontSize: 26, fontWeight: 300, lineHeight: 1.3, opacity: 0.85, marginBottom: 48 }}>
            {project.subtitle}
          </div>
        )}
        <div style={{ marginTop: 'auto', fontSize: 18, lineHeight: 1.5, opacity: 0.9 }}>
          <div style={{ fontWeight: 600, fontSize: 22 }}>{project.authors}</div>
          {project.school && <div>{project.school}</div>}
          <div style={{ height: 1, background: palette.accent, margin: '20px 0', width: 80 }} />
          {project.mentor && <div><span style={{ opacity: 0.6 }}>Mentor</span> {project.mentor}</div>}
          {project.organization && <div>{project.organization}</div>}
        </div>
      </div>

      {/* Right content panel */}
      <div style={{ padding: `${pad}px`, overflow: 'hidden' }}>
        {SECTIONS.filter((s) => s.key !== 'acknowledgments').map((s, i) => {
          const val = project.sections[s.key];
          const sectionVisuals = project.visuals.filter((v) => v.section === s.key);
          return (
            <div key={s.key} style={{ marginBottom: 36, breakInside: 'avoid' }}>
              <div style={{
                fontFamily: fontPair.body, fontSize: 13, letterSpacing: '0.16em',
                textTransform: 'uppercase', color: palette.accent, fontWeight: 600, marginBottom: 10,
              }}>
                <span style={{ opacity: 0.5 }}>{String(i + 1).padStart(2, '0')} /</span> {s.label}
              </div>
              {sectionVisuals.map((v) => (
                <figure key={v.id} style={{ margin: '0 0 14px 0' }}>
                  <img src={v.src} alt="" style={{ width: '100%', display: 'block' }} />
                  {(v.caption || v.credit) && (
                    <figcaption style={{ fontSize: 13, lineHeight: 1.35, color: palette.muted, marginTop: 6, fontStyle: 'italic' }}>
                      {v.caption}
                      {v.credit && <span style={{ fontStyle: 'normal', opacity: 0.7 }}>  — {v.credit}</span>}
                    </figcaption>
                  )}
                </figure>
              ))}
              <div style={{ fontSize: val ? 18 : 17, lineHeight: 1.5, color: val ? palette.text : palette.muted, fontStyle: val ? 'normal' : 'italic', whiteSpace: 'pre-wrap' }}>
                {val || s.prompt}
              </div>
            </div>
          );
        })}
        {project.sections.acknowledgments && (
          <div style={{ marginTop: 48, padding: 20, background: palette.surface, borderLeft: `3px solid ${palette.accent}`, fontSize: 15, lineHeight: 1.5 }}>
            <strong style={{ color: palette.header, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 12 }}>Acknowledgments</strong>
            <div style={{ marginTop: 8 }}>{project.sections.acknowledgments}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ children, palette, fontPair }) {
  return (
    <div style={{
      fontFamily: fontPair.display,
      fontWeight: 700,
      fontSize: 28,
      color: palette.header,
      borderBottom: `3px solid ${palette.accent}`,
      paddingBottom: 8,
      marginBottom: 12,
      letterSpacing: '-0.01em',
    }}>
      {children}
    </div>
  );
}

// ============================================================================
// Cut & Paste — preview (manifest view in the preview pane)
// ============================================================================

function CutPasteView({ project, palette, fontPair, format, paper }) {
  const elements = extractElements(project, format);
  const totalPages = elements.reduce((sum, el) => sum + tilePlan(el.w, el.h, paper).total, 0);

  return (
    <div style={{ width: '100%', maxWidth: 640 }}>
      {/* Little diagram of the board with element boxes */}
      <div style={{
        background: '#fff',
        padding: 16,
        border: '1px solid #d9d1c0',
        borderRadius: 4,
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6a5f4a', marginBottom: 10 }}>
          Board layout · dashed lines = cut lines
        </div>
        <BoardDiagram elements={elements} format={format} palette={palette} />
      </div>

      {/* Summary */}
      <div style={{
        background: '#1a1a1a', color: '#f5f1eb',
        padding: '14px 18px', borderRadius: 4, marginBottom: 12,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}>Assembly packet</div>
          <div style={{ fontSize: 18, fontFamily: fontPair.display, marginTop: 2 }}>{totalPages} page{totalPages !== 1 ? 's' : ''} on {paper.name}</div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, textAlign: 'right' }}>
          {elements.length} element{elements.length !== 1 ? 's' : ''} · cut &amp; glue
        </div>
      </div>

      {/* Element manifest */}
      <div style={{
        background: '#fff', border: '1px solid #d9d1c0', borderRadius: 4,
        overflow: 'hidden',
      }}>
        {elements.map((el, i) => {
          const plan = tilePlan(el.w, el.h, paper);
          const needsTiling = plan.total > 1;
          return (
            <div key={el.id} style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr auto',
              gap: 12, padding: '12px 14px',
              borderTop: i > 0 ? '1px solid #e9e2cc' : 'none',
              alignItems: 'center',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 4,
                background: palette.accent, color: palette.header,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: fontPair.display, fontWeight: 700, fontSize: 13,
              }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{el.label}</div>
                <div style={{ fontSize: 11, color: '#8a7f6a', marginTop: 2 }}>
                  {el.w.toFixed(1)}″ × {el.h.toFixed(1)}″ · {el.placement}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#1a1a1a', fontWeight: 500 }}>
                  {plan.total} page{plan.total !== 1 ? 's' : ''}
                </div>
                {needsTiling && (
                  <div style={{ fontSize: 10, color: '#a04a1a', marginTop: 2 }}>
                    tiles {plan.cols}×{plan.rows}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 11, color: '#6a5f4a', marginTop: 14, lineHeight: 1.5 }}>
        <strong>How to use:</strong> Click "Print Assembly Packet." Each page prints one piece of your poster at the correct physical size. Cut along the dashed lines, line up the registration marks on multi-page pieces, and glue everything onto your board in the positions shown above.
      </div>
    </div>
  );
}

function BoardDiagram({ elements, format, palette }) {
  // Draw a scaled-down schematic of the board with labeled element boxes.
  const targetW = 500;
  const scale = targetW / format.w;
  return (
    <svg
      viewBox={`0 0 ${format.w} ${format.h}`}
      style={{ width: '100%', height: 'auto', background: palette.bg, display: 'block' }}
    >
      {/* Element boxes */}
      {elements.map((el, i) => {
        // Reconstruct x/y from kind
        const pad = 0.5;
        const titleH = format.h > format.w ? 4.375 : 3.54;
        const footerH = 1.75;
        let x = 0, y = 0;
        if (el.kind === 'title') { x = 0; y = 0; }
        else if (el.kind === 'footer') { x = 0; y = format.h - footerH; }
        else {
          const cols = format.h > format.w ? 3 : 4;
          const gap = 0.5;
          const colW = (format.w - pad * 2 - gap * (cols - 1)) / cols;
          const sections = elements.filter((e) => e.kind === 'section');
          const idx = sections.indexOf(el);
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const rows = Math.ceil(sections.length / cols);
          const bodyH = format.h - titleH - footerH;
          const sectionH = (bodyH - (rows - 1) * gap) / rows;
          x = pad + col * (colW + gap);
          y = titleH + pad + row * (sectionH + gap);
        }
        return (
          <g key={el.id}>
            <rect
              x={x} y={y} width={el.w} height={el.h}
              fill={el.kind === 'title' ? palette.header : el.kind === 'footer' ? palette.surface : '#fff'}
              stroke={palette.header}
              strokeWidth={0.08}
              strokeDasharray="0.4 0.3"
              opacity={0.9}
            />
            <text
              x={x + el.w / 2} y={y + el.h / 2}
              fill={el.kind === 'title' ? '#fff' : palette.header}
              fontSize={el.w < 10 ? 0.8 : 1.2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="sans-serif"
              fontWeight="500"
            >
              {i + 1}. {el.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================================
// Cut & Paste — print layout (hidden except in @media print)
// ============================================================================

function CutPastePrintLayout({ project, palette, fontPair, format, paper }) {
  const elements = extractElements(project, format);

  // Flatten elements into individual tile pages.
  const pages = [];
  elements.forEach((el, elIdx) => {
    const plan = tilePlan(el.w, el.h, paper);
    for (let row = 0; row < plan.rows; row++) {
      for (let col = 0; col < plan.cols; col++) {
        pages.push({
          element: el,
          elIdx,
          tileCol: col,
          tileRow: row,
          plan,
        });
      }
    }
  });

  return (
    <>
      {/* Cover page */}
      <AssemblyCoverPage
        elements={elements}
        format={format}
        paper={paper}
        palette={palette}
        fontPair={fontPair}
        totalPages={pages.length}
      />
      {/* Element pages */}
      {pages.map((page, i) => (
        <CutPastePage
          key={`${page.element.id}-${page.tileRow}-${page.tileCol}`}
          page={page}
          pageNumber={i + 1}
          totalPages={pages.length}
          project={project}
          palette={palette}
          fontPair={fontPair}
          paper={paper}
        />
      ))}
    </>
  );
}

function AssemblyCoverPage({ elements, format, paper, palette, fontPair, totalPages }) {
  return (
    <div style={{
      width: `${paper.w}in`, height: `${paper.h}in`,
      padding: `${paper.margin + 0.25}in`,
      pageBreakAfter: 'always',
      fontFamily: fontPair.body,
      color: '#1a1a1a',
      background: '#fff',
      boxSizing: 'border-box',
    }}>
      <div style={{ fontFamily: fontPair.display, fontSize: '0.4in', fontWeight: 700, borderBottom: `0.04in solid ${palette.header}`, paddingBottom: '0.1in' }}>
        Assembly Packet
      </div>
      <div style={{ fontSize: '0.14in', color: '#5a5a5a', marginTop: '0.05in' }}>
        Cut and paste your poster together piece by piece
      </div>

      <div style={{ marginTop: '0.4in', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3in' }}>
        <div>
          <div style={{ fontSize: '0.1in', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6a5f4a', marginBottom: '0.05in' }}>Final board</div>
          <div style={{ fontSize: '0.18in', fontWeight: 600 }}>{format.label}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.1in', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6a5f4a', marginBottom: '0.05in' }}>Paper size</div>
          <div style={{ fontSize: '0.18in', fontWeight: 600 }}>{paper.name}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.1in', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6a5f4a', marginBottom: '0.05in' }}>Pieces</div>
          <div style={{ fontSize: '0.18in', fontWeight: 600 }}>{elements.length}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.1in', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6a5f4a', marginBottom: '0.05in' }}>Pages to print</div>
          <div style={{ fontSize: '0.18in', fontWeight: 600 }}>{totalPages}</div>
        </div>
      </div>

      <div style={{ marginTop: '0.4in', fontSize: '0.1in', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6a5f4a', marginBottom: '0.12in' }}>Board layout</div>
      <div style={{ border: `0.02in solid ${palette.header}`, padding: '0.1in', background: palette.bg }}>
        <BoardDiagram elements={elements} format={format} palette={palette} />
      </div>

      <div style={{ marginTop: '0.3in', fontSize: '0.13in', lineHeight: 1.5 }}>
        <div style={{ fontWeight: 600, marginBottom: '0.08in' }}>Assembly steps</div>
        <ol style={{ paddingLeft: '0.2in', margin: 0 }}>
          <li>Print all {totalPages} pages on {paper.name} paper.</li>
          <li>Cut each piece along the dashed lines.</li>
          <li>For multi-page pieces, line up the ✚ registration marks and tape the pages together on the back.</li>
          <li>Starting with the title block, glue each piece onto your board in the numbered position shown above.</li>
          <li>Double-check spacing before pressing down — the glue gives you a few seconds to shift.</li>
        </ol>
      </div>
    </div>
  );
}

function CutPastePage({ page, pageNumber, totalPages, project, palette, fontPair, paper }) {
  const { element, elIdx, tileCol, tileRow, plan } = page;
  const isTiled = plan.total > 1;

  // The printable tile window on this page, in inches.
  const tileW = Math.min(paper.printW, element.w - tileCol * paper.printW);
  const tileH = Math.min(paper.printH, element.h - tileRow * paper.printH);

  // The element is rendered at full size; we translate it so the right tile shows.
  const translateX = -tileCol * paper.printW;
  const translateY = -tileRow * paper.printH;

  return (
    <div style={{
      width: `${paper.w}in`, height: `${paper.h}in`,
      pageBreakAfter: 'always',
      position: 'relative',
      background: '#fff',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      {/* Label strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: `${paper.margin * 0.5}in ${paper.margin}in`,
        fontSize: '0.1in',
        color: '#6a5f4a',
        fontFamily: fontPair.body,
        display: 'flex', justifyContent: 'space-between',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        <span>
          <strong style={{ color: '#1a1a1a' }}>{elIdx + 1}. {element.label}</strong>
          {isTiled && <span> · tile {tileRow * plan.cols + tileCol + 1} of {plan.total} (col {tileCol + 1}, row {tileRow + 1})</span>}
        </span>
        <span>{element.placement}</span>
      </div>

      {/* Tile content clipping window */}
      <div style={{
        position: 'absolute',
        left: `${paper.margin}in`,
        top: `${paper.margin + 0.2}in`,
        width: `${tileW}in`,
        height: `${tileH}in`,
        overflow: 'hidden',
      }}>
        {/* Full element, translated so current tile is visible */}
        <div style={{
          position: 'absolute',
          left: `${translateX}in`,
          top: `${translateY}in`,
          width: `${element.w}in`,
          height: `${element.h}in`,
        }}>
          <ElementRenderer element={element} project={project} palette={palette} fontPair={fontPair} />
        </div>
      </div>

      {/* Cut lines around the tile */}
      <CutMarks
        left={paper.margin}
        top={paper.margin + 0.2}
        width={tileW}
        height={tileH}
        isTiled={isTiled}
        tileCol={tileCol}
        tileRow={tileRow}
        plan={plan}
      />

      {/* Page footer */}
      <div style={{
        position: 'absolute',
        bottom: `${paper.margin * 0.5}in`, left: `${paper.margin}in`, right: `${paper.margin}in`,
        fontSize: '0.08in', color: '#8a7f6a',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>EXPLR Poster Builder · Assembly packet</span>
        <span>Page {pageNumber} of {totalPages}</span>
      </div>
    </div>
  );
}

function CutMarks({ left, top, width, height, isTiled, tileCol, tileRow, plan }) {
  const markLen = 0.25;
  const markOffset = 0.08;
  const regSize = 0.18;

  // Dashed cut rectangle
  return (
    <>
      <div style={{
        position: 'absolute',
        left: `${left}in`, top: `${top}in`,
        width: `${width}in`, height: `${height}in`,
        border: '1px dashed #999',
        pointerEvents: 'none',
      }} />

      {/* Corner tick marks (outside the box) */}
      {[[0,0],[1,0],[0,1],[1,1]].map(([cx, cy], i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${left + cx * width + (cx ? markOffset : -markOffset - markLen)}in`,
          top:  `${top  + cy * height + (cy ? markOffset : -markOffset - markLen)}in`,
          width: `${markLen}in`, height: `${markLen}in`,
          borderTop: cy ? 'none' : '1px solid #333',
          borderBottom: cy ? '1px solid #333' : 'none',
          borderLeft: cx ? 'none' : '1px solid #333',
          borderRight: cx ? '1px solid #333' : 'none',
        }} />
      ))}

      {/* Registration marks on edges shared with other tiles */}
      {isTiled && (
        <>
          {tileCol < plan.cols - 1 && (
            <RegMark x={left + width} y={top + height / 2} size={regSize} />
          )}
          {tileRow < plan.rows - 1 && (
            <RegMark x={left + width / 2} y={top + height} size={regSize} />
          )}
          {tileCol > 0 && (
            <RegMark x={left} y={top + height / 2} size={regSize} />
          )}
          {tileRow > 0 && (
            <RegMark x={left + width / 2} y={top} size={regSize} />
          )}
        </>
      )}
    </>
  );
}

function RegMark({ x, y, size }) {
  return (
    <svg
      style={{
        position: 'absolute',
        left: `${x - size / 2}in`, top: `${y - size / 2}in`,
        width: `${size}in`, height: `${size}in`,
      }}
      viewBox="0 0 20 20"
    >
      <circle cx="10" cy="10" r="8" fill="none" stroke="#333" strokeWidth="0.5" />
      <line x1="10" y1="0" x2="10" y2="20" stroke="#333" strokeWidth="0.5" />
      <line x1="0" y1="10" x2="20" y2="10" stroke="#333" strokeWidth="0.5" />
    </svg>
  );
}

// Renders a single element (title / section / footer) at full size inside a box
// sized exactly to the element's inch dimensions.
function ElementRenderer({ element, project, palette, fontPair }) {
  const common = { width: '100%', height: '100%', background: palette.bg, color: palette.text, fontFamily: fontPair.body };

  if (element.kind === 'title') {
    return (
      <div style={{
        ...common,
        background: palette.header, color: '#fff',
        padding: '0.5in 0.5in',
        borderBottom: `0.12in solid ${palette.accent}`,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        boxSizing: 'border-box',
      }}>
        <div style={{ fontFamily: fontPair.display, fontSize: '0.85in', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.01em' }}>
          {project.title || 'Your project title'}
        </div>
        {project.subtitle && (
          <div style={{ fontFamily: fontPair.body, fontSize: '0.3in', fontWeight: 300, marginTop: '0.15in', opacity: 0.9 }}>
            {project.subtitle}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.45in', marginTop: '0.25in', fontSize: '0.22in', opacity: 0.88, flexWrap: 'wrap' }}>
          {project.authors && <span><strong>{project.authors}</strong>{project.school ? ` · ${project.school}` : ''}</span>}
          {project.mentor && <span>Mentor: {project.mentor}</span>}
          {project.organization && <span>{project.organization}</span>}
          {project.dateRange && <span>{project.dateRange}</span>}
        </div>
      </div>
    );
  }

  if (element.kind === 'footer') {
    return (
      <div style={{
        ...common,
        background: palette.surface,
        borderTop: `0.03in solid ${palette.accent}`,
        padding: '0.35in 0.5in',
        color: palette.muted,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        fontSize: '0.14in',
        boxSizing: 'border-box',
      }}>
        <div>
          <strong style={{ color: palette.header, fontFamily: fontPair.display, fontSize: '0.2in' }}>Acknowledgments.</strong>{' '}
          {project.sections.acknowledgments || 'Thank your mentor, host org, EXPLR, and anyone who helped.'}
        </div>
        <div style={{ fontFamily: fontPair.display, fontWeight: 700, color: palette.header, fontSize: '0.25in' }}>EXPLR</div>
      </div>
    );
  }

  // Section
  const section = SECTIONS.find((s) => s.key === element.sectionKey);
  const val = project.sections[element.sectionKey];
  const sectionVisuals = project.visuals.filter((v) => v.section === element.sectionKey);

  return (
    <div style={{
      ...common,
      padding: '0.15in',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      <div style={{
        fontFamily: fontPair.display,
        fontWeight: 700,
        fontSize: '0.3in',
        color: palette.header,
        borderBottom: `0.04in solid ${palette.accent}`,
        paddingBottom: '0.08in',
        marginBottom: '0.12in',
        letterSpacing: '-0.005em',
      }}>
        {element.label}
      </div>
      {sectionVisuals.map((v) => (
        <figure key={v.id} style={{ margin: '0 0 0.15in 0' }}>
          <img src={v.src} alt="" style={{ width: '100%', display: 'block' }} />
          {(v.caption || v.credit) && (
            <figcaption style={{ fontSize: '0.14in', lineHeight: 1.35, color: palette.muted, marginTop: '0.06in', fontStyle: 'italic' }}>
              {v.caption}
              {v.credit && <span style={{ fontStyle: 'normal', opacity: 0.7 }}>  — {v.credit}</span>}
            </figcaption>
          )}
        </figure>
      ))}
      <div style={{
        fontSize: '0.2in',
        lineHeight: 1.45,
        whiteSpace: 'pre-wrap',
        color: val ? palette.text : palette.muted,
        fontStyle: val ? 'normal' : 'italic',
      }}>
        {val || section?.prompt}
      </div>
    </div>
  );
}
