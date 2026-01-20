export interface Skill {
  id: string;
  name: string;
  icon: string;
  description: string;
  suggestedTools: string[];
}

export interface Step {
  id: number;
  title: string;
  short: string;
  description: string;
}

export interface SkillData {
  skill_id: string;
  selected_tools: string;
  task_mapping: string;
  teaching_strategy: string;
  monitoring_approach: string;
  notes: string;
  completed: boolean;
  updated_at: string;
}

export const SKILLS: Skill[] = [
  { id: 'career-management', name: 'Career Management', icon: '🎯', description: 'Help students understand career paths and set professional goals', suggestedTools: ['StrengthsAssessment', 'FuturePlans', 'SchoolJoy', 'Paper goal form', 'Digital goal form', 'Supervisor meeting'] },
  { id: 'reliability', name: 'Reliability', icon: '✅', description: 'Teach students to be dependable and meet commitments', suggestedTools: ['Daily task list', 'Shared checklist', 'Supervisor check-ins', 'Progress board'] },
  { id: 'work-ethic', name: 'Work Ethic', icon: '💪', description: 'Develop strong commitment to quality work', suggestedTools: ['Whiteboard GANTT chart', 'KanBan board', 'Trello', 'Microsoft Planner'] },
  { id: 'punctuality', name: 'Punctuality', icon: '⏰', description: 'Build time management and scheduling habits', suggestedTools: ['Google Calendar', 'Outlook reminders', 'Printed schedule', 'Time tracking app'] },
  { id: 'discipline', name: 'Discipline', icon: '📋', description: 'Create structured work habits and routines', suggestedTools: ['Checklists', 'SOPs', 'Daily routines', 'Task plans'] },
  { id: 'teamwork', name: 'Teamwork & Collaboration', icon: '🤝', description: 'Foster effective collaboration skills', suggestedTools: ['Shared documents', 'Team meetings', 'Small group projects', 'Collaboration platforms'] },
  { id: 'professionalism', name: 'Professionalism', icon: '👔', description: 'Set workplace behavior expectations', suggestedTools: ['Orientation packet', 'Handbook', 'Weekly feedback sessions', 'Mentor meetings'] },
  { id: 'learning-agility', name: 'Learning Agility', icon: '🧠', description: 'Encourage continuous learning and adaptation', suggestedTools: ['Weekly reflection form', 'Retrospective meeting', 'Learning journal', 'Skill tracker'] },
  { id: 'critical-thinking', name: 'Critical Thinking & Problem-Solving', icon: '🔍', description: 'Develop analytical and problem-solving abilities', suggestedTools: ['Root cause analysis', 'Brainstorming protocol', 'Risk assessment template', '5 Whys technique'] },
  { id: 'leadership', name: 'Leadership', icon: '🎖️', description: 'Provide leadership experience opportunities', suggestedTools: ['Leading a meeting', 'Managing a mini-project', 'Coordinating a task', 'Mentoring peers'] },
  { id: 'creativity', name: 'Creativity & Innovation', icon: '💡', description: 'Encourage creative thinking and innovation', suggestedTools: ['Brainstorming sessions', 'Design thinking activities', 'Innovation challenges', 'Ideation workshops'] },
  { id: 'communication', name: 'Oral & Written Communication', icon: '💬', description: 'Practice professional communication', suggestedTools: ['Emails', 'Reports', 'Presentations', 'Project updates', 'Meeting notes'] },
  { id: 'digital-tech', name: 'Digital Technology', icon: '💻', description: 'Build digital literacy and tool proficiency', suggestedTools: ['Shared drives', 'Spreadsheets', 'Communication platforms', 'Scheduling software'] },
  { id: 'global-fluency', name: 'Global & Intercultural Fluency', icon: '🌍', description: 'Promote inclusive and diverse perspectives', suggestedTools: ['Diverse team assignments', 'Inclusive communication norms', 'Accessibility-focused deliverables'] }
];

export const STEPS: Step[] = [
  { id: 1, title: 'Select Skills', short: 'Skills', description: 'Identify which skills you will explicitly teach' },
  { id: 2, title: 'Choose Tools', short: 'Tools', description: 'Select the tools and systems you will use for each skill' },
  { id: 3, title: 'Map Tasks', short: 'Tasks', description: 'Map each skill to a real task or experience' },
  { id: 4, title: 'Teaching Methods', short: 'Teaching', description: 'Determine how you will teach and model each skill' },
  { id: 5, title: 'Monitor Progress', short: 'Monitor', description: 'Decide how you will monitor student progress' },
  { id: 6, title: 'OMJ Alignment', short: 'Align', description: 'Align your choices with the OMJ Readiness Seal' },
  { id: 7, title: 'Communicate', short: 'Share', description: 'Communicate your plan to students and staff' }
];

export const TEACHING_STRATEGIES = [
  'Modeling the behavior',
  'Providing examples or templates',
  'Guided practice with feedback',
  'Project management routines',
  'Shadowing experienced staff',
  'Structured debrief sessions'
];

export const MONITORING_APPROACHES = [
  'Weekly supervisor check-ins',
  'Progress tracking tools',
  'Mid-point evaluation',
  'Final evaluation',
  'Student self-assessments',
  'Reflection journals'
];

export const COMMUNICATION_ITEMS = [
  { icon: '📋', title: 'Expectations', description: 'Share workplace rules, dress code, and behavior standards' },
  { icon: '🛠️', title: 'Tools Being Used', description: 'Explain the tools and systems students will work with' },
  { icon: '🎯', title: 'Skill Goals', description: 'Outline which skills students will develop' },
  { icon: '💬', title: 'Feedback Process', description: 'Explain how and when feedback will be provided' },
  { icon: '🏆', title: 'Success Criteria', description: 'Define what success looks like for this internship' }
];
