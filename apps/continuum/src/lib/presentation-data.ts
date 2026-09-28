export type PresentationView = 'setup' | 'home' | 'bcom' | 'assessment' | 'other-school' | 'cross-school';
export type PreviewRole = 'orchestrator' | 'lecturer' | 'assessor' | 'student';

export const academicPeriod = {
  name: 'Term 3 · 2026',
  dates: '20 July – 25 September',
};

export const disciplines = [
  'Start-Up Finance',
  'Marketing and Sales',
  'U(I)X Operations and Design',
  'Business Strategy & Management',
];

export const team = {
  name: 'Neighbourhood Futures',
  formed: 'Formed before Term 3 through Group Sync',
  members: [
    { name: 'Amara Ndlovu', discipline: 'Start-Up Finance', initials: 'AN' },
    { name: 'Kabelo Mokoena', discipline: 'Marketing and Sales', initials: 'KM' },
    { name: 'Leah Daniels', discipline: 'U(I)X Operations and Design', initials: 'LD' },
    { name: 'Sipho Khumalo', discipline: 'Business Strategy & Management', initials: 'SK' },
  ],
};

export const assessments = [
  { id: 'opportunity-reflection', date: '01 Aug', title: 'Opportunity Reflection', module: 'Innovation Practice', participation: 'Individual', services: 'No timed session or venue', state: 'Reviewed' },
  { id: 'business-presentation', date: '21 Aug', title: 'Business Concept Presentation', module: 'Venture Lab', participation: 'Existing team', services: 'Schedule · Studio B', state: 'Marking open' },
  { id: 'finance-review', date: '04 Sep', title: 'Finance Discipline Review', module: 'Market Systems', participation: 'Individual', services: 'Digital submission', state: 'Submitted' },
  { id: 'innovation-panel', date: '18 Sep', title: 'Innovation Readiness Panel', module: 'Venture Lab', participation: 'Panel', services: 'Schedule · Innovation Hub', state: 'Preparing' },
];

export const assessment = {
  title: 'Business Concept Presentation',
  module: 'Venture Lab',
  date: '21 August 2026',
  time: '10:30–10:50',
  venue: 'Studio B',
  venueNote: 'Planned before term · displayed as an emerging Spaces reference',
  participation: 'Existing multidisciplinary team',
  scope: 'BCom · Term 3 · this assessment only',
  rubric: [
    { title: 'Shared proposition', appliesTo: 'Team', weight: '30%', progress: 'Reviewed' },
    { title: 'Team synthesis', appliesTo: 'Team', weight: '25%', progress: 'Submitted' },
    { title: 'Commercial logic', appliesTo: 'Start-Up Finance', weight: '20%', progress: 'In progress' },
    { title: 'Market readiness', appliesTo: 'Marketing and Sales', weight: '25%', progress: 'Outstanding' },
  ],
  markers: [
    { name: 'Maya Naidoo', role: 'Lecturer · assessment lead', scope: 'Full rubric · review and approval', state: 'In progress' },
    { name: 'Naledi Jacobs', role: 'Tutor', scope: 'Team synthesis', state: 'Submitted' },
  ],
};

export const serviceLinks = {
  schedule: process.env.NEXT_PUBLIC_SCHEDULE_STAFF_URL,
  students: process.env.NEXT_PUBLIC_SCHEDULE_STUDENT_URL,
  groups: process.env.NEXT_PUBLIC_GROUPS_URL,
  spaces: process.env.NEXT_PUBLIC_WORKSUITE_URL,
};

export const previewCopy = {
  lecturer: {
    title: 'Lecturer review',
    summary: 'Maya sees the full rubric, marker progress and approval responsibility for this assessment.',
    task: 'Review the submitted team-synthesis section',
    boundary: 'Can review all rubric sections; cannot submit an official mark to CARS.',
  },
  assessor: {
    title: 'Ad hoc assessor workspace',
    summary: 'Jordan sees only this assessment, the evidence pack and the Market readiness criterion.',
    task: 'Complete Market readiness and written feedback',
    boundary: 'Access expires with this assignment; no other students, assessments or school records are visible.',
  },
  student: {
    title: 'Student assessment view',
    summary: 'Amara sees her team, session details, venue reference and released feedback status.',
    task: 'Prepare for the presentation on 21 August',
    boundary: 'Marker identities, internal notes and unreleased rubric decisions remain hidden.',
  },
} as const;
