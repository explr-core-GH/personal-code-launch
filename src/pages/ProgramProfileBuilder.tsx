import { useState, useEffect, useRef } from "react";
import * as LucideIcons from "lucide-react";
import {
  Plus, Trash2, Edit3, Save, Download, Copy, X, Check, Search,
  Image as ImageIcon, FileText, ChevronLeft
} from "lucide-react";

// ============================================================
// Program Profile Builder — Lovable-ready version
// Data persists to browser localStorage (works on a single device).
// To sync across devices: swap loadIndex/saveIndex/loadProfile/saveProfile/deleteProfile
// for Supabase calls. Function signatures stay the same.
// ============================================================

const SKILL_LIBRARY = [
  { id: "engineering_design", name: "Engineering Design", desc: "Iterate through the design cycle", iconKey: "Cog" },
  { id: "coding", name: "Coding", desc: "Block-based or text-based programming", iconKey: "Code" },
  { id: "electronics", name: "Electronics", desc: "Circuits, sensors, microcontrollers", iconKey: "Cpu" },
  { id: "data_analysis", name: "Data Analysis", desc: "Collect, visualize, interpret", iconKey: "BarChart3" },
  { id: "problem_solving", name: "Creative Problem Solving", desc: "Divergent and convergent thinking", iconKey: "Lightbulb" },
  { id: "collaboration", name: "Collaboration", desc: "Team roles and communication", iconKey: "Users" },
  { id: "presentation", name: "Presentation", desc: "Share findings with an audience", iconKey: "Presentation" },
  { id: "career_exploration", name: "Career Exploration", desc: "Connect to real STEM pathways", iconKey: "Compass" },
  { id: "3d_design", name: "3D Design", desc: "Model and prototype in 3D", iconKey: "Box" },
  { id: "robotics", name: "Robotics", desc: "Build and program robots", iconKey: "Bot" },
  { id: "ai_literacy", name: "AI Literacy", desc: "Use and evaluate AI tools", iconKey: "Sparkles" },
  { id: "game_design", name: "Game Design", desc: "Design mechanics and player experience", iconKey: "Gamepad2" },
  { id: "web_design", name: "Web Design", desc: "Build and style web pages", iconKey: "Globe" },
  { id: "physical_computing", name: "Physical Computing", desc: "Bridge hardware and software", iconKey: "CircuitBoard" },
  { id: "laser_cutting", name: "Laser Cutting", desc: "Design and fabricate with a laser", iconKey: "Scissors" },
  { id: "fabrication", name: "Fabrication", desc: "Build and assemble physical prototypes", iconKey: "Hammer" },
  { id: "environmental_science", name: "Environmental Science", desc: "Investigate ecological systems", iconKey: "Leaf" },
  { id: "sustainability", name: "Sustainability", desc: "Design with impact in mind", iconKey: "Recycle" },
  { id: "prototyping", name: "Prototyping", desc: "Rapid iteration from sketch to build", iconKey: "Wrench" },
  { id: "research", name: "Research", desc: "Gather and synthesize information", iconKey: "BookOpen" },
  { id: "writing", name: "Technical Writing", desc: "Document process and findings", iconKey: "PenLine" },
  { id: "math", name: "Applied Math", desc: "Use math to solve real problems", iconKey: "Sigma" },
  { id: "physics", name: "Physics", desc: "Explore forces, motion, energy", iconKey: "Atom" },
  { id: "biology", name: "Biology", desc: "Study living systems", iconKey: "Dna" },
  { id: "chemistry", name: "Chemistry", desc: "Investigate matter and reactions", iconKey: "FlaskConical" },
  { id: "design_thinking", name: "Design Thinking", desc: "Human-centered problem solving", iconKey: "Palette" },
  { id: "entrepreneurship", name: "Entrepreneurship", desc: "Build ideas into ventures", iconKey: "TrendingUp" },
  { id: "project_management", name: "Project Management", desc: "Plan, execute, deliver", iconKey: "ListChecks" },
  { id: "video_production", name: "Video Production", desc: "Tell stories with video", iconKey: "Video" },
  { id: "photography", name: "Photography", desc: "Compose and capture images", iconKey: "Camera" },
  { id: "music_audio", name: "Music & Audio", desc: "Create and produce sound", iconKey: "Music" },
  { id: "mechanical_design", name: "Mechanical Design", desc: "Design moving systems", iconKey: "Settings2" },
  { id: "cybersecurity", name: "Cybersecurity", desc: "Protect systems and data", iconKey: "Shield" },
  { id: "networking", name: "Networking", desc: "Connect devices and systems", iconKey: "Network" },
  { id: "user_testing", name: "User Testing", desc: "Learn from real users", iconKey: "UserCheck" },
  { id: "pitching", name: "Pitching Ideas", desc: "Persuade and inspire others", iconKey: "Megaphone" },
];

function SkillIcon({ iconKey, size = 22 }) {
  const Icon = LucideIcons[iconKey] || LucideIcons.Circle;
  return <Icon size={size} strokeWidth={2} />;
}

// ============ Storage (localStorage) ============
const STORAGE_PREFIX = "profile:";
const INDEX_KEY = "profile_index";

function loadIndex() {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveIndex(idx) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
}
function loadProfile(id) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveProfile(profile) {
  localStorage.setItem(STORAGE_PREFIX + profile.id, JSON.stringify(profile));
}
function deleteProfile(id) {
  localStorage.removeItem(STORAGE_PREFIX + id);
}

function newProfile() {
  return {
    id: "p_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    eyebrow: "Summer Camp · Grades 6–8",
    title: "Program Name",
    tagline: "A one-line tagline that captures what students will do and why it matters.",
    duration: "1 week",
    format: "In-person",
    dates: "TBD",
    capacity: "20 students",
    description: "Write a 2–4 sentence description of the program. Describe the theme, the capstone or final deliverable, and what makes this experience distinct.",
    logoDataUrl: "",
    skills: ["engineering_design", "coding", "problem_solving", "collaboration"],
    customSkills: [],
    equipment: ["Laptops or Chromebooks", "3D printer & filament", "Safety glasses"],
    software: ["Tinkercad", "Google Workspace", "Canva for presentations"],
    consumables: ["PLA filament", "Cardstock", "Markers & tape"],
    staffing: ["1 Lead Instructor", "1 Assistant Instructor", "Volunteer mentors as needed"],
    location: "",
    otherInfo: "",
    footerLeft: "Program Profile",
    footerRight: "Contact: name@organization.org · website.org",
  };
}

// ============ Export: opens printable version in a new tab ============
const LUCIDE_ICON_NODES = {
  Circle: [["circle", { cx: 12, cy: 12, r: 10 }]],
  Cog: [
    ["path", { d: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" }],
    ["path", { d: "M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" }],
    ["path", { d: "M12 2v2" }], ["path", { d: "M12 20v2" }],
    ["path", { d: "m4.93 4.93 1.41 1.41" }], ["path", { d: "m17.66 17.66 1.41 1.41" }],
    ["path", { d: "M2 12h2" }], ["path", { d: "M20 12h2" }],
    ["path", { d: "m6.34 17.66-1.41 1.41" }], ["path", { d: "m19.07 4.93-1.41 1.41" }],
  ],
  Code: [["polyline", { points: "16 18 22 12 16 6" }], ["polyline", { points: "8 6 2 12 8 18" }]],
  Cpu: [
    ["rect", { x: 4, y: 4, width: 16, height: 16, rx: 2 }],
    ["rect", { x: 9, y: 9, width: 6, height: 6 }],
    ["path", { d: "M15 2v2" }], ["path", { d: "M15 20v2" }],
    ["path", { d: "M2 15h2" }], ["path", { d: "M2 9h2" }],
    ["path", { d: "M20 15h2" }], ["path", { d: "M20 9h2" }],
    ["path", { d: "M9 2v2" }], ["path", { d: "M9 20v2" }],
  ],
  BarChart3: [
    ["path", { d: "M3 3v18h18" }],
    ["path", { d: "M18 17V9" }], ["path", { d: "M13 17V5" }], ["path", { d: "M8 17v-3" }],
  ],
  Lightbulb: [
    ["path", { d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" }],
    ["path", { d: "M9 18h6" }], ["path", { d: "M10 22h4" }],
  ],
  Users: [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["circle", { cx: 9, cy: 7, r: 4 }],
    ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }],
    ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }],
  ],
  Presentation: [
    ["path", { d: "M2 3h20" }],
    ["path", { d: "M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" }],
    ["path", { d: "m7 21 5-5 5 5" }],
  ],
  Compass: [
    ["circle", { cx: 12, cy: 12, r: 10 }],
    ["polygon", { points: "16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" }],
  ],
  Box: [
    ["path", { d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" }],
    ["path", { d: "m3.3 7 8.7 5 8.7-5" }],
    ["path", { d: "M12 22V12" }],
  ],
  Bot: [
    ["path", { d: "M12 8V4H8" }],
    ["rect", { width: 16, height: 12, x: 4, y: 8, rx: 2 }],
    ["path", { d: "M2 14h2" }], ["path", { d: "M20 14h2" }],
    ["path", { d: "M15 13v2" }], ["path", { d: "M9 13v2" }],
  ],
  Sparkles: [
    ["path", { d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" }],
    ["path", { d: "M20 3v4" }], ["path", { d: "M22 5h-4" }],
    ["path", { d: "M4 17v2" }], ["path", { d: "M5 18H3" }],
  ],
  Gamepad2: [
    ["line", { x1: 6, x2: 10, y1: 11, y2: 11 }], ["line", { x1: 8, x2: 8, y1: 9, y2: 13 }],
    ["line", { x1: 15, x2: 15.01, y1: 12, y2: 12 }], ["line", { x1: 18, x2: 18.01, y1: 10, y2: 10 }],
    ["path", { d: "M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258A4 4 0 0 0 17.32 5Z" }],
  ],
  Globe: [
    ["circle", { cx: 12, cy: 12, r: 10 }],
    ["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }],
    ["path", { d: "M2 12h20" }],
  ],
  CircuitBoard: [
    ["rect", { width: 18, height: 18, x: 3, y: 3, rx: 2 }],
    ["path", { d: "M11 9h4a2 2 0 0 0 2-2V3" }],
    ["circle", { cx: 9, cy: 9, r: 2 }],
    ["path", { d: "M7 21v-4a2 2 0 0 1 2-2h4" }],
    ["circle", { cx: 15, cy: 15, r: 2 }],
  ],
  Scissors: [
    ["circle", { cx: 6, cy: 6, r: 3 }],
    ["path", { d: "M8.12 8.12 12 12" }],
    ["path", { d: "M20 4 8.12 15.88" }],
    ["circle", { cx: 6, cy: 18, r: 3 }],
    ["path", { d: "M14.8 14.8 20 20" }],
  ],
  Hammer: [
    ["path", { d: "m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9" }],
    ["path", { d: "m18 15 4-4" }],
    ["path", { d: "m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5" }],
  ],
  Leaf: [
    ["path", { d: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96c1.4 2.16 2.54 5.38 1.85 9.55-.68 4.28-2.72 7.59-5.47 8.85-2.63 1.2-4.58.54-6.58.54" }],
    ["path", { d: "M2 21c0-3 1.85-5.36 5.08-6" }],
  ],
  Recycle: [
    ["path", { d: "M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" }],
    ["path", { d: "M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" }],
    ["path", { d: "m14 16-3 3 3 3" }],
    ["path", { d: "M8.293 13.596 7.196 9.5 3.1 10.598" }],
    ["path", { d: "m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" }],
    ["path", { d: "m13.378 9.633 4.096 1.098 1.097-4.096" }],
  ],
  Wrench: [["path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" }]],
  BookOpen: [
    ["path", { d: "M12 7v14" }],
    ["path", { d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" }],
  ],
  PenLine: [
    ["path", { d: "M12 20h9" }],
    ["path", { d: "M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" }],
  ],
  Sigma: [["path", { d: "M18 7V4H6l6 8-6 8h12v-3" }]],
  Atom: [
    ["circle", { cx: 12, cy: 12, r: 1 }],
    ["path", { d: "M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" }],
    ["path", { d: "M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" }],
  ],
  Dna: [
    ["path", { d: "m10 16 1.5 1.5" }], ["path", { d: "m14 8-1.5-1.5" }],
    ["path", { d: "M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" }],
    ["path", { d: "m16.5 10.5 1 1" }], ["path", { d: "m17 6-2.891-2.891" }],
    ["path", { d: "M2 15c6.667-6 13.333 0 20-6" }],
    ["path", { d: "m20 9 .891.891" }],
    ["path", { d: "M3.109 14.109 4 15" }], ["path", { d: "m6.5 12.5 1 1" }],
    ["path", { d: "m7 18 2.891 2.891" }],
    ["path", { d: "M9 22c1.798-1.998 2.518-3.995 2.807-5.993" }],
  ],
  FlaskConical: [
    ["path", { d: "M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2" }],
    ["path", { d: "M6.453 15h11.094" }], ["path", { d: "M8.5 2h7" }],
  ],
  Palette: [
    ["circle", { cx: 13.5, cy: 6.5, r: ".5", fill: "currentColor" }],
    ["circle", { cx: 17.5, cy: 10.5, r: ".5", fill: "currentColor" }],
    ["circle", { cx: 8.5, cy: 7.5, r: ".5", fill: "currentColor" }],
    ["circle", { cx: 6.5, cy: 12.5, r: ".5", fill: "currentColor" }],
    ["path", { d: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" }],
  ],
  TrendingUp: [
    ["polyline", { points: "22 7 13.5 15.5 8.5 10.5 2 17" }],
    ["polyline", { points: "16 7 22 7 22 13" }],
  ],
  ListChecks: [
    ["path", { d: "m3 17 2 2 4-4" }],
    ["path", { d: "m3 7 2 2 4-4" }],
    ["path", { d: "M13 6h8" }], ["path", { d: "M13 12h8" }], ["path", { d: "M13 18h8" }],
  ],
  Video: [
    ["path", { d: "m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" }],
    ["rect", { x: 2, y: 6, width: 14, height: 12, rx: 2 }],
  ],
  Camera: [
    ["path", { d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" }],
    ["circle", { cx: 12, cy: 13, r: 3 }],
  ],
  Music: [
    ["path", { d: "M9 18V5l12-2v13" }],
    ["circle", { cx: 6, cy: 18, r: 3 }], ["circle", { cx: 18, cy: 16, r: 3 }],
  ],
  Settings2: [
    ["path", { d: "M20 7h-9" }], ["path", { d: "M14 17H5" }],
    ["circle", { cx: 17, cy: 17, r: 3 }], ["circle", { cx: 7, cy: 7, r: 3 }],
  ],
  Shield: [["path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }]],
  Network: [
    ["rect", { x: 16, y: 16, width: 6, height: 6, rx: 1 }],
    ["rect", { x: 2, y: 16, width: 6, height: 6, rx: 1 }],
    ["rect", { x: 9, y: 2, width: 6, height: 6, rx: 1 }],
    ["path", { d: "M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" }],
    ["path", { d: "M12 12V8" }],
  ],
  UserCheck: [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["circle", { cx: 9, cy: 7, r: 4 }],
    ["polyline", { points: "16 11 18 13 22 9" }],
  ],
  Megaphone: [
    ["path", { d: "m3 11 18-5v12L3 14v-3z" }],
    ["path", { d: "M11.6 16.8a3 3 0 1 1-5.8-1.6" }],
  ],
  Monitor: [
    ["rect", { width: 20, height: 14, x: 2, y: 3, rx: 2 }],
    ["line", { x1: 8, x2: 16, y1: 21, y2: 21 }], ["line", { x1: 12, x2: 12, y1: 17, y2: 21 }],
  ],
  Package: [
    ["path", { d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" }],
    ["path", { d: "M12 22V12" }],
    ["polyline", { points: "3.29 7 12 12 20.71 7" }],
    ["path", { d: "m7.5 4.27 9 5.15" }],
  ],
  Star: [["polygon", { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" }]],
  Zap: [["polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" }]],
  Target: [
    ["circle", { cx: 12, cy: 12, r: 10 }],
    ["circle", { cx: 12, cy: 12, r: 6 }],
    ["circle", { cx: 12, cy: 12, r: 2 }],
  ],
  Rocket: [
    ["path", { d: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" }],
    ["path", { d: "m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" }],
    ["path", { d: "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" }],
    ["path", { d: "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" }],
  ],
  Flame: [["path", { d: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" }]],
  Heart: [["path", { d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" }]],
  Award: [
    ["path", { d: "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" }],
    ["circle", { cx: 12, cy: 8, r: 6 }],
  ],
  Trophy: [
    ["path", { d: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6" }],
    ["path", { d: "M18 9h1.5a2.5 2.5 0 0 0 0-5H18" }],
    ["path", { d: "M4 22h16" }],
    ["path", { d: "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" }],
    ["path", { d: "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" }],
    ["path", { d: "M18 2H6v7a6 6 0 0 0 12 0V2Z" }],
  ],
  Flag: [
    ["path", { d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" }],
    ["line", { x1: 4, x2: 4, y1: 22, y2: 15 }],
  ],
  Bookmark: [["path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" }]],
  Gem: [
    ["path", { d: "M6 3h12l4 6-10 13L2 9Z" }],
    ["path", { d: "M11 3 8 9l4 13 4-13-3-6" }],
    ["path", { d: "M2 9h20" }],
  ],
  Key: [
    ["path", { d: "m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" }],
    ["path", { d: "m21 2-9.6 9.6" }],
    ["circle", { cx: 7.5, cy: 15.5, r: 5.5 }],
  ],
  Map: [
    ["polygon", { points: "3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" }],
    ["line", { x1: 9, x2: 9, y1: 3, y2: 18 }], ["line", { x1: 15, x2: 15, y1: 6, y2: 21 }],
  ],
  Anchor: [
    ["path", { d: "M12 22V8" }], ["path", { d: "M5 12H2a10 10 0 0 0 20 0h-3" }],
    ["circle", { cx: 12, cy: 5, r: 3 }],
  ],
  Feather: [
    ["path", { d: "M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z" }],
    ["path", { d: "M16 8 2 22" }], ["path", { d: "M17.5 15H9" }],
  ],
  Mountain: [["path", { d: "m8 3 4 8 5-5 5 15H2L8 3z" }]],
  Sun: [
    ["circle", { cx: 12, cy: 12, r: 4 }],
    ["path", { d: "M12 2v2" }], ["path", { d: "M12 20v2" }],
    ["path", { d: "m4.93 4.93 1.41 1.41" }], ["path", { d: "m17.66 17.66 1.41 1.41" }],
    ["path", { d: "M2 12h2" }], ["path", { d: "M20 12h2" }],
    ["path", { d: "m6.34 17.66-1.41 1.41" }], ["path", { d: "m19.07 4.93-1.41 1.41" }],
  ],
  Moon: [["path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" }]],
  Cloud: [["path", { d: "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" }]],
  Droplet: [["path", { d: "M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" }]],
};

function renderIconSvg(iconKey, size = 22) {
  const nodes = LUCIDE_ICON_NODES[iconKey] || LUCIDE_ICON_NODES.Circle;
  const children = nodes.map(([tag, attrs]) => {
    const a = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ");
    return `<${tag} ${a} />`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function exportToPrintableTab(profile, skills) {
  const cols = skills.length <= 3 ? (skills.length || 1)
             : skills.length === 4 ? 4
             : skills.length <= 6 ? 3
             : 4;

  const skillsHtml = skills.length === 0
    ? `<div style="font-size:12px;color:#94a3b8;font-style:italic;padding:10px 0;">No skills selected.</div>`
    : `<div class="skills-grid" style="display:grid;grid-template-columns:repeat(${cols}, 1fr);gap:10px;">
        ${skills.map(s => `
          <div class="skill-card">
            <div class="skill-icon">${renderIconSvg(s.iconKey, 22)}</div>
            <div class="skill-name">${esc(s.name)}</div>
            <div class="skill-desc">${esc(s.desc)}</div>
          </div>
        `).join("")}
      </div>`;

  const logoHtml = profile.logoDataUrl
    ? `<img src="${profile.logoDataUrl}" alt="" style="width:100%;height:100%;object-fit:contain;" />`
    : `<div style="text-align:center;color:#64748b;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;">Program<br><strong style="font-size:13px;color:#475569;font-weight:700;letter-spacing:0.04em;">Logo</strong></div>`;

  const resourceList = (items) => items.map(i => `<li>${esc(i)}</li>`).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${esc(profile.title)} — Program Profile</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #1a2332; background: #eef2f6; }
  .toolbar { position: sticky; top: 0; background: white; border-bottom: 1px solid #e2e8f0; padding: 12px 20px; display: flex; gap: 10px; justify-content: flex-end; z-index: 10; }
  .toolbar button { background: #00694e; color: white; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; font-family: inherit; }
  .toolbar button:hover { background: #005538; }
  .toolbar .hint { margin-right: auto; align-self: center; font-size: 12px; color: #64748b; }
  .page { width: 8.5in; min-height: 11in; background: white; padding: 0.5in 0.6in; margin: 24px auto; box-shadow: 0 4px 24px rgba(15,23,42,0.08); display: flex; flex-direction: column; gap: 0.22in; }
  header.hero { display: grid; grid-template-columns: 1.55in 1fr; gap: 0.25in; border-bottom: 3px solid #1a2332; padding-bottom: 0.18in; }
  .logo-box { width: 1.55in; height: 1.55in; border-radius: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; ${profile.logoDataUrl ? "background:white;border:1px solid #e2e8f0;" : "background:#f8fafc;border:2px dashed #e2e8f0;"} }
  .hero-text { display: flex; flex-direction: column; justify-content: center; gap: 4px; }
  .eyebrow { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #00694e; font-weight: 700; }
  h1.program-title { font-size: 32px; line-height: 1.05; margin: 0; font-weight: 800; letter-spacing: -0.015em; }
  .tagline { font-size: 14px; color: #475569; font-style: italic; line-height: 1.4; margin-top: 4px; }
  .meta-row { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 8px; font-size: 11px; color: #64748b; }
  .meta-item { display: flex; align-items: center; gap: 6px; }
  .meta-item strong { color: #1a2332; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; font-size: 10px; }
  .meta-item span { color: #475569; font-size: 12px; }
  .dot { width: 3px; height: 3px; border-radius: 50%; background: #e2e8f0; }
  .description { font-size: 13px; line-height: 1.55; color: #475569; border-left: 4px solid #00694e; padding: 2px 0 2px 14px; }
  .section-title { display: flex; align-items: center; gap: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em; font-weight: 800; color: #1a2332; margin: 0 0 10px 0; }
  .section-title::before { content: ""; display: inline-block; width: 18px; height: 2px; background: #00694e; }
  .skill-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 10px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; background: white; }
  .skill-icon { width: 38px; height: 38px; border-radius: 9px; background: #e8f3ef; color: #00694e; display: flex; align-items: center; justify-content: center; }
  .skill-name { font-size: 12px; font-weight: 700; color: #1a2332; line-height: 1.25; }
  .skill-desc { font-size: 10px; color: #64748b; line-height: 1.35; }
  .resources { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.22in; margin-top: 0.05in; }
  .resource-col { border-top: 2px solid #1a2332; padding-top: 10px; }
  .resource-col h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; font-weight: 800; color: #1a2332; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px; }
  .resource-col h3 .h-icon { display: inline-flex; width: 20px; height: 20px; align-items: center; justify-content: center; color: #00694e; }
  .resource-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .resource-list li { font-size: 11.5px; color: #475569; line-height: 1.4; padding: 3px 0 3px 14px; position: relative; }
  .resource-list li::before { content: ""; position: absolute; left: 0; top: 10px; width: 6px; height: 2px; background: #00694e; }
  footer.page-footer { margin-top: auto; padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #64748b; letter-spacing: 0.08em; text-transform: uppercase; }
  footer .brand { font-weight: 800; color: #1a2332; letter-spacing: 0.12em; }
  @media print {
    @page { size: letter portrait; margin: 0.4in; }
    body { background: white; }
    .toolbar { display: none; }
    .page { box-shadow: none; padding: 0; margin: 0; width: 100%; min-height: 0; }
  }
</style>
</head>
<body>
<div class="toolbar">
  <span class="hint">Use your browser's print dialog → "Save as PDF"</span>
  <button onclick="window.print()">Print / Save as PDF</button>
</div>
<div class="page">
  <header class="hero">
    <div class="logo-box">${logoHtml}</div>
    <div class="hero-text">
      <div class="eyebrow">${esc(profile.eyebrow)}</div>
      <h1 class="program-title">${esc(profile.title)}</h1>
      <div class="tagline">${esc(profile.tagline)}</div>
      <div class="meta-row">
        <div class="meta-item"><strong>Duration</strong><span>${esc(profile.duration)}</span></div>
        <div class="dot"></div>
        <div class="meta-item"><strong>Format</strong><span>${esc(profile.format)}</span></div>
        <div class="dot"></div>
        <div class="meta-item"><strong>Dates</strong><span>${esc(profile.dates)}</span></div>
        <div class="dot"></div>
        <div class="meta-item"><strong>Capacity</strong><span>${esc(profile.capacity)}</span></div>
      </div>
    </div>
  </header>
  <section class="description">${esc(profile.description)}</section>
  <section>
    <h2 class="section-title">Skills Students Develop</h2>
    ${skillsHtml}
  </section>
  <section class="resources">
    <div class="resource-col">
      <h3><span class="h-icon">${renderIconSvg("Wrench", 16)}</span>Equipment</h3>
      <ul class="resource-list">${resourceList(profile.equipment)}</ul>
    </div>
    <div class="resource-col">
      <h3><span class="h-icon">${renderIconSvg("Monitor", 16)}</span>Software</h3>
      <ul class="resource-list">${resourceList(profile.software)}</ul>
    </div>
    <div class="resource-col">
      <h3><span class="h-icon">${renderIconSvg("Package", 16)}</span>Consumables</h3>
      <ul class="resource-list">${resourceList(profile.consumables)}</ul>
    </div>
    <div class="resource-col">
      <h3><span class="h-icon">${renderIconSvg("Users", 16)}</span>Staffing</h3>
      <ul class="resource-list">${resourceList(profile.staffing)}</ul>
    </div>
  </section>
  ${profile.location ? `<section class="resources" style="grid-template-columns: 1fr 1fr; margin-top: 0.18in;">
    <div class="resource-col">
      <h3><span class="h-icon">${renderIconSvg("Compass", 16)}</span>Location</h3>
      <div style="font-size:11px;line-height:1.55;color:#475569;">${esc(profile.location)}</div>
    </div>
    ${profile.otherInfo ? `<div class="resource-col">
      <h3><span class="h-icon">${renderIconSvg("BookOpen", 16)}</span>Other Information</h3>
      <div style="font-size:11px;line-height:1.55;color:#475569;">${esc(profile.otherInfo)}</div>
    </div>` : ""}
  </section>` : (profile.otherInfo ? `<section class="resources" style="grid-template-columns: 1fr; margin-top: 0.18in;">
    <div class="resource-col">
      <h3><span class="h-icon">${renderIconSvg("BookOpen", 16)}</span>Other Information</h3>
      <div style="font-size:11px;line-height:1.55;color:#475569;">${esc(profile.otherInfo)}</div>
    </div>
  </section>` : "")}
  <footer class="page-footer">
    <div class="brand">${esc(profile.footerLeft)}</div>
    <div>${esc(profile.footerRight)}</div>
  </footer>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  }
}

// ============ App ============
export default function ProgramProfileBuilder() {
  const [view, setView] = useState("library");
  const [index, setIndex] = useState([]);
  const [current, setCurrent] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setIndex(loadIndex());
  }, []);

  function flash(msg) { setToast(msg); setTimeout(() => setToast(""), 2000); }

  function handleCreate() {
    setCurrent(newProfile());
    setView("editor");
  }
  function handleOpen(id) {
    const p = loadProfile(id);
    if (p) { setCurrent(p); setView("editor"); }
  }
  function handleSave(profile) {
    const updated = { ...profile, updatedAt: Date.now() };
    saveProfile(updated);
    const existing = index.find(e => e.id === updated.id);
    const newIndex = existing
      ? index.map(e => e.id === updated.id ? { id: updated.id, title: updated.title, updatedAt: updated.updatedAt } : e)
      : [...index, { id: updated.id, title: updated.title, updatedAt: updated.updatedAt }];
    saveIndex(newIndex);
    setIndex(newIndex);
    setCurrent(updated);
    flash("Saved");
  }
  function handleDuplicate(id) {
    const p = loadProfile(id);
    if (!p) return;
    const copy = {
      ...p,
      id: "p_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      title: p.title + " (Copy)",
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    saveProfile(copy);
    const newIndex = [...index, { id: copy.id, title: copy.title, updatedAt: copy.updatedAt }];
    saveIndex(newIndex);
    setIndex(newIndex);
    flash("Duplicated");
  }
  function handleDelete(id) {
    if (!window.confirm("Delete this profile? This cannot be undone.")) return;
    deleteProfile(id);
    const newIndex = index.filter(e => e.id !== id);
    saveIndex(newIndex);
    setIndex(newIndex);
    flash("Deleted");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      <style>{PRINT_CSS}</style>
      {toast && (
        <div className="no-print" style={{
          position: "fixed", top: 20, right: 20, zIndex: 100,
          background: "#00694e", color: "white", padding: "10px 18px",
          borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontSize: 13, fontWeight: 600,
        }}>
          <Check size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
          {toast}
        </div>
      )}
      {view === "library" ? (
        <LibraryView index={index} onCreate={handleCreate} onOpen={handleOpen} onDuplicate={handleDuplicate} onDelete={handleDelete} />
      ) : (
        <Editor profile={current} onChange={setCurrent} onSave={handleSave} onBack={() => setView("library")} />
      )}
    </div>
  );
}

function LibraryView({ index, onCreate, onOpen, onDuplicate, onDelete }) {
  const sorted = [...index].sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <div className="no-print" style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, borderBottom: "3px solid #1a2332", paddingBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#00694e", fontWeight: 700, marginBottom: 6 }}>Profile Library</div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: "-0.015em", color: "#1a2332" }}>Program Profiles</h1>
        </div>
        <button onClick={onCreate} style={btnPrimary}>
          <Plus size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
          New Profile
        </button>
      </div>

      {sorted.length === 0 ? (
        <div style={{ background: "white", border: "2px dashed #e2e8f0", borderRadius: 12, padding: 60, textAlign: "center" }}>
          <FileText size={40} style={{ color: "#cbd5e1", marginBottom: 12 }} />
          <div style={{ fontSize: 16, color: "#475569", fontWeight: 600, marginBottom: 4 }}>No profiles yet</div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>Create your first program profile to get started.</div>
          <button onClick={onCreate} style={btnPrimary}>
            <Plus size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
            Create Profile
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {sorted.map(entry => (
            <div key={entry.id} style={{
              background: "white", border: "1px solid #e2e8f0", borderRadius: 10,
              padding: 16, display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{ width: 42, height: 42, borderRadius: 8, background: "#e8f3ef", color: "#00694e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1a2332", marginBottom: 2 }}>{entry.title || "Untitled"}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  Updated {new Date(entry.updatedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </div>
              </div>
              <button onClick={() => onOpen(entry.id)} style={btnSecondary}>
                <Edit3 size={14} style={{ marginRight: 4, verticalAlign: "middle" }} /> Open
              </button>
              <button onClick={() => onDuplicate(entry.id)} style={btnIcon} title="Duplicate"><Copy size={16} /></button>
              <button onClick={() => onDelete(entry.id)} style={{ ...btnIcon, color: "#b91c1c" }} title="Delete"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 32, fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
        Profiles are saved in your browser and persist across sessions.
      </div>
    </div>
  );
}

function Editor({ profile, onChange, onSave, onBack }) {
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");
  const [showCustomSkill, setShowCustomSkill] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const fileInputRef = useRef(null);
  if (!profile) return null;

  function handleSaveClick() {
    setSaveState("saving");
    try {
      onSave(profile);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1800);
    } catch (e) {
      setSaveState("idle");
      alert("Save failed: " + (e?.message || "unknown error"));
    }
  }

  function update(patch) { onChange({ ...profile, ...patch }); }
  function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update({ logoDataUrl: ev.target.result });
    reader.readAsDataURL(file);
  }
  function toggleSkill(id) {
    update({ skills: profile.skills.includes(id) ? profile.skills.filter(s => s !== id) : [...profile.skills, id] });
  }
  function removeSkill(id) {
    update({
      skills: profile.skills.filter(s => s !== id),
      customSkills: profile.customSkills.filter(s => s.id !== id),
    });
  }
  function addCustomSkill(name, desc, iconKey) {
    const id = "custom_" + Date.now();
    const skill = { id, name, desc, iconKey };
    update({ customSkills: [...profile.customSkills, skill], skills: [...profile.skills, id] });
  }

  const allSkills = [...SKILL_LIBRARY, ...profile.customSkills];
  const selectedSkills = profile.skills.map(id => allSkills.find(s => s.id === id)).filter(Boolean);
  const filteredLibrary = SKILL_LIBRARY.filter(s =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
    s.desc.toLowerCase().includes(skillSearch.toLowerCase())
  );

  return (
    <>
      <div className="no-print" style={{
        position: "sticky", top: 0, zIndex: 10, background: "white",
        borderBottom: "1px solid #e2e8f0", padding: "12px 20px",
        display: "flex", gap: 10, alignItems: "center",
      }}>
        <button onClick={onBack} style={btnGhost}>
          <ChevronLeft size={16} style={{ marginRight: 2, verticalAlign: "middle" }} /> Library
        </button>
        <div style={{ flex: 1, fontSize: 13, color: "#64748b", marginLeft: 12 }}>
          Editing: <strong style={{ color: "#1a2332" }}>{profile.title || "Untitled"}</strong>
        </div>
        <button
          onClick={handleSaveClick}
          disabled={saveState === "saving"}
          style={{
            ...btnPrimary,
            background: saveState === "saved" ? "#166534" : "#00694e",
            opacity: saveState === "saving" ? 0.7 : 1,
          }}
        >
          {saveState === "saved" ? (
            <><Check size={14} style={{ marginRight: 6, verticalAlign: "middle" }} /> Saved</>
          ) : saveState === "saving" ? (
            <>Saving…</>
          ) : (
            <><Save size={14} style={{ marginRight: 6, verticalAlign: "middle" }} /> Save</>
          )}
        </button>
        <button onClick={() => exportToPrintableTab(profile, selectedSkills)} style={btnSecondary}>
          <Download size={14} style={{ marginRight: 6, verticalAlign: "middle" }} /> Export PDF
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", alignItems: "flex-start" }}>
        <div className="no-print" style={{
          background: "white", borderRight: "1px solid #e2e8f0",
          padding: "20px 18px", maxHeight: "calc(100vh - 60px)",
          overflowY: "auto", position: "sticky", top: 60,
        }}>
          <Section title="Header">
            <Field label="Eyebrow (program type)"><input value={profile.eyebrow} onChange={e => update({ eyebrow: e.target.value })} style={inputStyle} /></Field>
            <Field label="Program title"><input value={profile.title} onChange={e => update({ title: e.target.value })} style={inputStyle} /></Field>
            <Field label="Tagline"><textarea value={profile.tagline} onChange={e => update({ tagline: e.target.value })} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Field label="Duration"><input value={profile.duration} onChange={e => update({ duration: e.target.value })} style={inputStyle} /></Field>
              <Field label="Format"><input value={profile.format} onChange={e => update({ format: e.target.value })} style={inputStyle} /></Field>
              <Field label="Dates"><input value={profile.dates} onChange={e => update({ dates: e.target.value })} style={inputStyle} /></Field>
              <Field label="Capacity"><input value={profile.capacity} onChange={e => update({ capacity: e.target.value })} style={inputStyle} /></Field>
            </div>
          </Section>

          <Section title="Logo / Image">
            <div style={{
              border: "2px dashed #e2e8f0", borderRadius: 8, padding: 12,
              background: "#f8fafc", textAlign: "center", cursor: "pointer",
            }} onClick={() => fileInputRef.current?.click()}>
              {profile.logoDataUrl ? (
                <img src={profile.logoDataUrl} alt="logo" style={{ maxWidth: "100%", maxHeight: 100, display: "block", margin: "0 auto" }} />
              ) : (
                <>
                  <ImageIcon size={24} style={{ color: "#94a3b8", marginBottom: 4 }} />
                  <div style={{ fontSize: 12, color: "#64748b" }}>Click to upload logo</div>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
            {profile.logoDataUrl && (
              <button onClick={() => update({ logoDataUrl: "" })} style={{ ...btnGhost, marginTop: 6, fontSize: 11, width: "100%" }}>
                <X size={12} style={{ marginRight: 4, verticalAlign: "middle" }} /> Remove image
              </button>
            )}
          </Section>

          <Section title="Description">
            <textarea value={profile.description} onChange={e => update({ description: e.target.value })} style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} />
          </Section>

          <Section title={`Skills (${selectedSkills.length})`}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {selectedSkills.map(s => (
                <div key={s.id} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "#e8f3ef", color: "#00694e",
                  padding: "6px 10px", borderRadius: 16, fontSize: 12, fontWeight: 600,
                }}>
                  <SkillIcon iconKey={s.iconKey} size={14} />
                  {s.name}
                  <button onClick={() => removeSkill(s.id)} style={{
                    background: "transparent", border: "none", padding: 0, marginLeft: 2,
                    color: "#00694e", cursor: "pointer", display: "flex",
                  }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowSkillPicker(true)} style={{ ...btnSecondary, width: "100%" }}>
              <Plus size={14} style={{ marginRight: 4, verticalAlign: "middle" }} /> Add skills
            </button>
          </Section>

          <Section title="Equipment"><ListEditor items={profile.equipment} onChange={items => update({ equipment: items })} placeholder="Add equipment..." /></Section>
          <Section title="Software"><ListEditor items={profile.software} onChange={items => update({ software: items })} placeholder="Add software..." /></Section>
          <Section title="Consumables"><ListEditor items={profile.consumables} onChange={items => update({ consumables: items })} placeholder="Add consumable..." /></Section>
          <Section title="Staffing"><ListEditor items={profile.staffing} onChange={items => update({ staffing: items })} placeholder="Add staffing role..." /></Section>
          <Section title="Location">
            <textarea
              value={profile.location}
              onChange={e => update({ location: e.target.value })}
              placeholder="e.g. CSU Engineering Building, Room 204, Fort Collins, CO"
              style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "inherit" } as React.CSSProperties}
            />
          </Section>
          <Section title="Other Information">
            <textarea
              value={profile.otherInfo}
              onChange={e => update({ otherInfo: e.target.value })}
              placeholder="Anything else parents/students should know (transportation, meals, prerequisites, etc.)"
              style={{ ...inputStyle, minHeight: 90, resize: "vertical", fontFamily: "inherit" } as React.CSSProperties}
            />
          </Section>

          <Section title="Footer">
            <Field label="Left text"><input value={profile.footerLeft} onChange={e => update({ footerLeft: e.target.value })} style={inputStyle} /></Field>
            <Field label="Right text"><input value={profile.footerRight} onChange={e => update({ footerRight: e.target.value })} style={inputStyle} /></Field>
          </Section>
        </div>

        <div style={{ padding: "30px 30px 60px 30px", overflow: "auto" }}>
          <ProfilePreview profile={profile} skills={selectedSkills} />
        </div>
      </div>

      {showSkillPicker && (
        <div className="no-print" style={modalBackdrop} onClick={() => setShowSkillPicker(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1a2332" }}>Choose skills</h3>
              <button onClick={() => setShowSkillPicker(false)} style={btnIcon}><X size={18} /></button>
            </div>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input value={skillSearch} onChange={e => setSkillSearch(e.target.value)} placeholder="Search skills…" style={{ ...inputStyle, paddingLeft: 30 }} />
              </div>
              <button onClick={() => setShowCustomSkill(true)} style={btnSecondary}>
                <Plus size={14} style={{ marginRight: 4, verticalAlign: "middle" }} /> Custom
              </button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {filteredLibrary.map(s => <SkillOption key={s.id} skill={s} selected={profile.skills.includes(s.id)} onClick={() => toggleSkill(s.id)} />)}
              </div>
              {profile.customSkills.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 20, marginBottom: 8, paddingLeft: 4 }}>Custom</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {profile.customSkills.map(s => <SkillOption key={s.id} skill={s} selected={profile.skills.includes(s.id)} onClick={() => toggleSkill(s.id)} />)}
                  </div>
                </>
              )}
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid #e2e8f0", textAlign: "right" }}>
              <button onClick={() => setShowSkillPicker(false)} style={btnPrimary}>Done</button>
            </div>
          </div>
        </div>
      )}

      {showCustomSkill && (
        <CustomSkillModal onClose={() => setShowCustomSkill(false)} onAdd={(name, desc, iconKey) => { addCustomSkill(name, desc, iconKey); setShowCustomSkill(false); }} />
      )}
    </>
  );
}

function SkillOption({ skill, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 12px", borderRadius: 8, cursor: "pointer",
      background: selected ? "#e8f3ef" : "white",
      border: selected ? "1px solid #00694e" : "1px solid #e2e8f0",
      textAlign: "left", fontFamily: "inherit",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 7, flexShrink: 0,
        background: selected ? "#00694e" : "#e8f3ef",
        color: selected ? "white" : "#00694e",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <SkillIcon iconKey={skill.iconKey} size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1a2332" }}>{skill.name}</div>
        <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.3 }}>{skill.desc}</div>
      </div>
      {selected && <Check size={14} style={{ color: "#00694e", flexShrink: 0 }} />}
    </button>
  );
}

function CustomSkillModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [iconKey, setIconKey] = useState("Sparkles");
  const ICON_CHOICES = [
    "Sparkles", "Star", "Zap", "Target", "Rocket", "Flame",
    "Heart", "Award", "Trophy", "Flag", "Bookmark", "Gem",
    "Puzzle", "Key", "Compass", "Map", "Anchor", "Feather",
    "Leaf", "Mountain", "Sun", "Moon", "Cloud", "Droplet",
  ];
  return (
    <div className="no-print" style={modalBackdrop} onClick={onClose}>
      <div style={{ ...modalBox, maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1a2332" }}>Create custom skill</h3>
          <button onClick={onClose} style={btnIcon}><X size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <Field label="Skill name"><input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="e.g. Aquaponics" autoFocus /></Field>
          <Field label="Short description"><input value={desc} onChange={e => setDesc(e.target.value)} style={inputStyle} placeholder="e.g. Design closed-loop ecosystems" /></Field>
          <Field label="Icon">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6 }}>
              {ICON_CHOICES.map(k => (
                <button key={k} onClick={() => setIconKey(k)} style={{
                  aspectRatio: "1", borderRadius: 7, cursor: "pointer",
                  background: iconKey === k ? "#00694e" : "#f8fafc",
                  color: iconKey === k ? "white" : "#475569",
                  border: iconKey === k ? "1px solid #00694e" : "1px solid #e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <SkillIcon iconKey={k} size={16} />
                </button>
              ))}
            </div>
          </Field>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button
            onClick={() => name.trim() && onAdd(name.trim(), desc.trim() || "Custom skill", iconKey)}
            disabled={!name.trim()}
            style={{ ...btnPrimary, opacity: name.trim() ? 1 : 0.5, cursor: name.trim() ? "pointer" : "not-allowed" }}
          >Add skill</button>
        </div>
      </div>
    </div>
  );
}

function ProfilePreview({ profile, skills }) {
  const cols = skills.length <= 3 ? (skills.length || 1)
             : skills.length === 4 ? 4
             : skills.length <= 6 ? 3
             : 4;
  return (
    <div className="print-page" style={{
      width: "8.5in", minHeight: "11in", background: "white",
      padding: "0.5in 0.6in", margin: "0 auto",
      boxShadow: "0 4px 24px rgba(15,23,42,0.08)",
      display: "flex", flexDirection: "column", gap: "0.22in",
      color: "#1a2332",
    }}>
      <header style={{
        display: "grid", gridTemplateColumns: "1.55in 1fr", gap: "0.25in",
        borderBottom: "3px solid #1a2332", paddingBottom: "0.18in",
      }}>
        <div style={{
          width: "1.55in", height: "1.55in", borderRadius: 10,
          background: profile.logoDataUrl ? "white" : "#f8fafc",
          border: profile.logoDataUrl ? "1px solid #e2e8f0" : "2px dashed #e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
        }}>
          {profile.logoDataUrl ? (
            <img src={profile.logoDataUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="" />
          ) : (
            <div style={{ textAlign: "center", color: "#64748b", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Program<br /><strong style={{ fontSize: 13, color: "#475569", fontWeight: 700, letterSpacing: "0.04em" }}>Logo</strong>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#00694e", fontWeight: 700 }}>{profile.eyebrow}</div>
          <h1 style={{ fontSize: 32, margin: 0, fontWeight: 800, letterSpacing: "-0.015em", lineHeight: 1.05 }}>{profile.title}</h1>
          <div style={{ fontSize: 14, color: "#475569", fontStyle: "italic", lineHeight: 1.4, marginTop: 4 }}>{profile.tagline}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 8, fontSize: 11, color: "#64748b" }}>
            <MetaItem label="DURATION" value={profile.duration} />
            <Dot /><MetaItem label="FORMAT" value={profile.format} />
            <Dot /><MetaItem label="DATES" value={profile.dates} />
            <Dot /><MetaItem label="CAPACITY" value={profile.capacity} />
          </div>
        </div>
      </header>

      <section style={{ fontSize: 13, lineHeight: 1.55, color: "#475569", borderLeft: "4px solid #00694e", padding: "2px 0 2px 14px" }}>
        {profile.description}
      </section>

      <section>
        <SectionHeading>Skills Students Develop</SectionHeading>
        {skills.length === 0 ? (
          <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", padding: "10px 0" }}>No skills selected yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
            {skills.map(s => (
              <div key={s.id} style={{
                border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 10px",
                display: "flex", flexDirection: "column", alignItems: "center",
                textAlign: "center", gap: 6, background: "white",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 9, background: "#e8f3ef",
                  color: "#00694e", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <SkillIcon iconKey={s.iconKey} size={22} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.25 }}>{s.name}</div>
                <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.35 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.22in", marginTop: "0.05in" }}>
        <ResourceCol title="Equipment" iconKey="Wrench" items={profile.equipment} />
        <ResourceCol title="Software" iconKey="Monitor" items={profile.software} />
        <ResourceCol title="Consumables" iconKey="Package" items={profile.consumables} />
      </section>

      <footer style={{
        marginTop: "auto", paddingTop: 10, borderTop: "1px solid #e2e8f0",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 9, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase",
      }}>
        <div style={{ fontWeight: 800, color: "#1a2332", letterSpacing: "0.12em" }}>{profile.footerLeft}</div>
        <div>{profile.footerRight}</div>
      </footer>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <h2 style={{
      display: "flex", alignItems: "center", gap: 10,
      fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em",
      fontWeight: 800, color: "#1a2332", margin: "0 0 10px 0",
    }}>
      <span style={{ display: "inline-block", width: 18, height: 2, background: "#00694e" }} />
      {children}
    </h2>
  );
}
function MetaItem({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <strong style={{ color: "#1a2332", fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", fontSize: 10 }}>{label}</strong>
      <span style={{ color: "#475569", fontSize: 12 }}>{value}</span>
    </div>
  );
}
function Dot() { return <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#e2e8f0" }} />; }
function ResourceCol({ title, iconKey, items }) {
  return (
    <div style={{ borderTop: "2px solid #1a2332", paddingTop: 10 }}>
      <h3 style={{
        fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em",
        fontWeight: 800, color: "#1a2332", margin: "0 0 8px 0",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ display: "inline-flex", width: 20, height: 20, alignItems: "center", justifyContent: "center", color: "#00694e" }}>
          <SkillIcon iconKey={iconKey} size={16} />
        </span>
        {title}
      </h3>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.4, padding: "3px 0 3px 14px", position: "relative" }}>
            <span style={{ position: "absolute", left: 0, top: 10, width: 6, height: 2, background: "#00694e" }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListEditor({ items, onChange, placeholder }) {
  const [draft, setDraft] = useState("");
  function add() {
    if (!draft.trim()) return;
    onChange([...items, draft.trim()]);
    setDraft("");
  }
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 4 }}>
            <input value={item} onChange={e => onChange(items.map((it, idx) => idx === i ? e.target.value : it))} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} style={{ ...btnIcon, color: "#b91c1c", width: 32, height: 32, flexShrink: 0 }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())} placeholder={placeholder} style={{ ...inputStyle, flex: 1 }} />
        <button onClick={add} style={{ ...btnSecondary, padding: "6px 10px" }}><Plus size={14} /></button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase",
        color: "#1a2332", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #e2e8f0",
      }}>{title}</div>
      {children}
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 6, fontFamily: "inherit", color: "#1a2332", background: "white", boxSizing: "border-box", outline: "none" };
const btnPrimary: React.CSSProperties = { background: "#00694e", color: "white", border: "none", padding: "8px 14px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit", display: "inline-flex", alignItems: "center" };
const btnSecondary: React.CSSProperties = { background: "white", color: "#1a2332", border: "1px solid #e2e8f0", padding: "8px 14px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit", display: "inline-flex", alignItems: "center" };
const btnGhost: React.CSSProperties = { background: "transparent", color: "#1a2332", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit", display: "inline-flex", alignItems: "center" };
const btnIcon: React.CSSProperties = { background: "transparent", color: "#64748b", border: "none", padding: 6, borderRadius: 6, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" };
const modalBackdrop: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 };
const modalBox: React.CSSProperties = { background: "white", borderRadius: 12, width: "100%", maxWidth: 600, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" };

const PRINT_CSS = `
@media print {
  @page { size: letter portrait; margin: 0.4in; }
  body { background: white !important; }
  .no-print { display: none !important; }
  .print-page {
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    min-height: 0 !important;
  }
}
`;
