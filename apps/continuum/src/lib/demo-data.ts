export type Venture = {
  id: string;
  code: string;
  title: string;
  school: string;
  period: string;
  campus: string;
  mode: 'microsoft_first' | 'hybrid' | 'continuum_first';
  status: 'active' | 'planning' | 'complete';
  summary: string;
  members: number;
  disciplines: string[];
  schedule: { label: string; state: string };
  groups: { label: string; state: string };
  space: { label: string; state: string };
  assessments: string[];
  people: { id: string; name: string; role: string; discipline?: string; expiresAt?: string }[];
  milestones: { date: string; label: string; state: string }[];
  content: { title: string; source: string; state: string }[];
};

export const ventures: Venture[] = [
  {
    id: 'venture-demo-bcom-001',
    code: 'DEMO-BV26-01',
    title: 'Neighbourhood Futures Production Venture',
    school: 'Business Innovation & Technology',
    period: '2026 · Term 3',
    campus: 'DEMO Johannesburg Campus',
    mode: 'hybrid',
    status: 'active',
    summary: 'A fictional cross-discipline venture developing an ethical launch plan and campaign prototype for a neighbourhood cinema collective.',
    members: 28,
    disciplines: ['Business Innovation', 'Marketing', 'Data & Technology', 'Motion Picture'],
    schedule: { label: 'Venture assessment consultations', state: '12 / 16 booked' },
    groups: { label: 'Learning Circle GS-DEMO-6F2', state: '7 groups formed' },
    space: { label: 'Studio B · Main Campus', state: 'Approved' },
    assessments: ['Teams: Market Opportunity Analysis', 'Continuum: Venture Pitch Review'],
    people: [
      { id: 'DEMO-26001', name: 'Amara Ndlovu', role: 'Student', discipline: 'Business Innovation' },
      { id: 'DEMO-26002', name: 'Luca Daniels', role: 'Student', discipline: 'Marketing' },
      { id: 'DEMO-TUTOR-01', name: 'Naledi Jacobs', role: 'Junior Tutor · final assessor' },
      { id: 'DEMO-TUTOR-02', name: 'Ethan Pillay', role: 'Senior Tutor' },
      { id: 'DEMO-LECT-01', name: 'Dr M. Petersen', role: 'Discipline Lecturer · moderator' },
      { id: 'DEMO-ADHOC-01', name: 'Jordan Maseko', role: 'Ad hoc External Examiner', expiresAt: '09 Sep 2026 · 18:00 SAST' },
    ],
    milestones: [
      { date: '25 Aug 2026', label: 'Venture and groups established', state: 'Complete' },
      { date: '05 Sep 2026', label: 'Teams-sourced assessment due', state: 'Complete' },
      { date: '09 Sep 2026', label: 'Tutor finalisation checkpoint', state: 'In progress' },
      { date: '12 Sep 2026', label: 'Lecturer moderation and release', state: 'Upcoming' },
      { date: '15 Sep 2026', label: 'Registry readiness review', state: 'Upcoming' },
    ],
    content: [
      { title: 'Market research brief', source: 'Microsoft Teams · disconnected fixture', state: 'Imported metadata' },
      { title: 'Venture Pitch rubric v2', source: 'Continuum', state: 'Current' },
    ],
  },
  {
    id: 'venture-demo-film-002',
    code: 'DEMO-MP26-04',
    title: 'One-Minute City Stories',
    school: 'Motion Picture Medium',
    period: '2026 · Term 3',
    campus: 'DEMO Cape Town Campus',
    mode: 'microsoft_first',
    status: 'active',
    summary: 'Fictional production sprint connecting Teams coursework to screening logistics and Registry readiness.',
    members: 19,
    disciplines: ['Directing', 'Cinematography', 'Editing'],
    schedule: { label: 'Edit review sessions', state: '8 / 10 booked' },
    groups: { label: 'Crew formation', state: '5 groups formed' },
    space: { label: 'Screening Room 2', state: 'Pending' },
    assessments: ['Teams: Production Reflection'],
    people: [], milestones: [], content: [],
  },
  {
    id: 'venture-demo-live-003',
    code: 'DEMO-LP26-02',
    title: 'Responsive Performance Lab',
    school: 'Live Performance',
    period: '2026 · Term 4',
    campus: 'DEMO Durban Campus',
    mode: 'hybrid',
    status: 'planning',
    summary: 'Fictional planning fixture showing a smaller cross-school Continuum workflow.',
    members: 14,
    disciplines: ['Performance', 'Writing', 'Sound'],
    schedule: { label: 'Mentor sessions', state: 'Draft' },
    groups: { label: 'Ensemble formation', state: 'Not started' },
    space: { label: 'Black Box', state: 'Not requested' },
    assessments: ['Continuum: Panel Review'],
    people: [], milestones: [], content: [],
  },
];

export const assessments = [
  {
    id: 'assessment-demo-teams-001',
    ventureId: ventures[0].id,
    title: 'Market Opportunity Analysis',
    source: 'Microsoft Teams file import',
    type: 'Teams-sourced',
    state: 'Verified',
    authority: 'Tutor · finaliser',
    completion: '26 / 28 matched',
  },
  {
    id: 'assessment-demo-native-001',
    ventureId: ventures[0].id,
    title: 'Venture Pitch Review',
    source: 'Continuum',
    type: 'Native assessment',
    state: 'Moderation',
    authority: 'Lecturer · moderator',
    completion: '24 / 28 evaluated',
  },
  {
    id: 'assessment-demo-panel-001',
    ventureId: ventures[0].id,
    title: 'Industry Panel Contribution',
    source: 'Continuum',
    type: 'Specialist preview',
    state: 'Adhoc review open',
    authority: 'External examiner · expires 09 Sep 2026',
    completion: '6 / 7 groups reviewed',
  },
];

export const demoImportRows = [
  { studentNumber: 'DEMO-26001', studentName: 'Amara Ndlovu', assignment: 'Market Opportunity Analysis', result: 72, state: 'matched' },
  { studentNumber: 'DEMO-26002', studentName: 'Luca Daniels', assignment: 'Market Opportunity Analysis', result: 68, state: 'matched' },
  { studentNumber: 'DEMO-26002', studentName: 'Luca Daniels', assignment: 'Market Opportunity Analysis', result: 68, state: 'duplicate' },
  { studentNumber: 'DEMO-26999', studentName: 'Rea Mokone', assignment: 'Market Opportunity Analysis', result: 75, state: 'unmatched' },
] as const;

export const registryRows = [
  { studentNumber: 'DEMO-26001', assessmentCode: 'DEMO-BV-MOA', result: 72, status: 'Certified', source: 'Microsoft Teams file import', assessor: 'Teams import · Demo Lecturer', finaliser: 'Naledi Jacobs', carsMapping: 'Mapped', exportReady: 'Ready' },
  { studentNumber: 'DEMO-26002', assessmentCode: 'DEMO-BV-MOA', result: 68, status: 'Certified', source: 'Microsoft Teams file import', assessor: 'Teams import · Demo Lecturer', finaliser: 'Naledi Jacobs', carsMapping: 'Mapped', exportReady: 'Ready' },
  { studentNumber: 'DEMO-26003', assessmentCode: 'DEMO-BV-MOA', result: 81, status: 'Awaiting finalisation', source: 'Microsoft Teams file import', assessor: 'Demo Lecturer', finaliser: 'Not recorded', carsMapping: 'Mapped', exportReady: 'Blocked' },
  { studentNumber: 'DEMO-26004', assessmentCode: 'DEMO-BV-VPR', result: 76, status: 'Moderation', source: 'Continuum', assessor: 'Jordan Maseko', finaliser: 'Naledi Jacobs', carsMapping: 'Missing assessment code', exportReady: 'Blocked' },
];

export const activity = [
  { time: '07 Sep · 14:32', text: 'Tutor Naledi Jacobs finalised Market Opportunity Analysis · version 2' },
  { time: '07 Sep · 13:18', text: 'Registry validation identified one unmatched student number' },
  { time: '07 Sep · 11:05', text: 'Studio B request approved by Operations' },
  { time: '06 Sep · 16:47', text: 'Fictional Teams result file imported · 28 rows, 2 held for review' },
];
