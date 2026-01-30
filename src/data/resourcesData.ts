export type ResourceType = 'document' | 'link' | 'video' | 'template';
export type AudienceType = 'educators' | 'counselors' | 'organizations' | 'industry';

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  audiences: AudienceType[];
  url: string;
  icon: string;
}

export const RESOURCE_TYPES: { value: ResourceType; label: string; icon: string }[] = [
  { value: 'document', label: 'Documents', icon: '📄' },
  { value: 'link', label: 'External Links', icon: '🔗' },
  { value: 'video', label: 'Videos', icon: '🎥' },
  { value: 'template', label: 'Templates', icon: '📋' },
];

export const AUDIENCE_TYPES: { value: AudienceType; label: string; icon: string }[] = [
  { value: 'educators', label: 'Educators', icon: '👩‍🏫' },
  { value: 'counselors', label: 'Guidance Counselors', icon: '🧭' },
  { value: 'organizations', label: 'Organizations', icon: '🏢' },
  { value: 'industry', label: 'Industry Partners', icon: '🤝' },
];

export const RESOURCES: Resource[] = [
  // Documents
  {
    id: 'wbl-handbook',
    title: 'WBL Program Handbook',
    description: 'Comprehensive guide to setting up and managing work-based learning programs.',
    type: 'document',
    audiences: ['educators', 'organizations'],
    url: 'https://education.ohio.gov/Topics/Career-Tech/Career-Connections/Work-Based-Learning',
    icon: '📘',
  },
  {
    id: 'internship-guide',
    title: 'Internship Setup Guide',
    description: 'Step-by-step instructions for creating meaningful internship experiences.',
    type: 'document',
    audiences: ['organizations', 'industry'],
    url: 'https://education.ohio.gov/Topics/Career-Tech/Career-Connections/Work-Based-Learning',
    icon: '📖',
  },
  {
    id: 'student-assessment',
    title: 'Student Skill Assessment Guide',
    description: 'Tools and rubrics for evaluating student skill development.',
    type: 'document',
    audiences: ['educators', 'counselors'],
    url: 'https://education.ohio.gov/Topics/Career-Tech/Career-Connections/Work-Based-Learning',
    icon: '📊',
  },
  {
    id: 'omj-readiness',
    title: 'OhioMeansJobs Readiness Seal Guide',
    description: 'Official documentation on the OMJ Readiness Seal requirements and validation.',
    type: 'document',
    audiences: ['educators', 'counselors', 'organizations'],
    url: 'https://education.ohio.gov/Topics/Career-Tech/Career-Connections/OhioMeansJobs-Readiness-Seal',
    icon: '🏆',
  },
  
  // External Links
  {
    id: 'ohio-wbl-portal',
    title: 'Ohio WBL Portal',
    description: 'Official Ohio Department of Education work-based learning resources.',
    type: 'link',
    audiences: ['educators', 'counselors', 'organizations', 'industry'],
    url: 'https://education.ohio.gov/Topics/Career-Tech/Career-Connections/Work-Based-Learning',
    icon: '🌐',
  },
  {
    id: 'omj-website',
    title: 'OhioMeansJobs Website',
    description: 'Career exploration and job search tools for students and educators.',
    type: 'link',
    audiences: ['counselors', 'educators'],
    url: 'https://ohiomeansjobs.ohio.gov/',
    icon: '💼',
  },
  {
    id: 'career-clusters',
    title: 'Career Clusters Framework',
    description: 'National framework for organizing career pathways and skills.',
    type: 'link',
    audiences: ['educators', 'counselors'],
    url: 'https://careertech.org/career-clusters/',
    icon: '🗂️',
  },
  {
    id: 'employer-toolkit',
    title: 'Employer Engagement Toolkit',
    description: 'Resources for industry partners to maximize student internship experiences.',
    type: 'link',
    audiences: ['industry', 'organizations'],
    url: 'https://education.ohio.gov/Topics/Career-Tech/Career-Connections/Work-Based-Learning',
    icon: '🧰',
  },
  
  // Videos
  {
    id: 'wbl-overview-video',
    title: 'Introduction to Work-Based Learning',
    description: 'Overview video explaining the benefits and structure of WBL programs.',
    type: 'video',
    audiences: ['educators', 'counselors', 'organizations', 'industry'],
    url: 'https://www.youtube.com/results?search_query=work+based+learning+overview',
    icon: '🎬',
  },
  {
    id: 'mentor-training',
    title: 'Workplace Mentor Training',
    description: 'Training video for industry mentors on supporting student interns.',
    type: 'video',
    audiences: ['industry', 'organizations'],
    url: 'https://www.youtube.com/results?search_query=workplace+mentor+training',
    icon: '🎓',
  },
  {
    id: 'soft-skills-video',
    title: 'Teaching Soft Skills in the Workplace',
    description: 'Strategies for developing professional skills with student interns.',
    type: 'video',
    audiences: ['industry', 'organizations', 'educators'],
    url: 'https://www.youtube.com/results?search_query=teaching+soft+skills+workplace',
    icon: '💡',
  },
  
  // Templates
  {
    id: 'training-plan-template',
    title: 'Internship Training Plan Template',
    description: 'Customizable template for mapping skills to workplace tasks.',
    type: 'template',
    audiences: ['organizations', 'industry', 'educators'],
    url: 'https://education.ohio.gov/Topics/Career-Tech/Career-Connections/Work-Based-Learning',
    icon: '📝',
  },
  {
    id: 'evaluation-form',
    title: 'Student Evaluation Form',
    description: 'Template for mid-point and final student performance evaluations.',
    type: 'template',
    audiences: ['industry', 'organizations'],
    url: 'https://education.ohio.gov/Topics/Career-Tech/Career-Connections/Work-Based-Learning',
    icon: '✅',
  },
  {
    id: 'reflection-journal',
    title: 'Student Reflection Journal',
    description: 'Weekly reflection template for students to document their learning.',
    type: 'template',
    audiences: ['educators', 'counselors'],
    url: 'https://education.ohio.gov/Topics/Career-Tech/Career-Connections/Work-Based-Learning',
    icon: '📓',
  },
  {
    id: 'mou-template',
    title: 'WBL Partnership Agreement Template',
    description: 'Memorandum of understanding template for school-employer partnerships.',
    type: 'template',
    audiences: ['educators', 'organizations', 'industry'],
    url: 'https://education.ohio.gov/Topics/Career-Tech/Career-Connections/Work-Based-Learning',
    icon: '🤝',
  },
];
