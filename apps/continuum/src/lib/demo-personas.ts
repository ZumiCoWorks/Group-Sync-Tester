export const demoPersonas = {
  student: {
    label: 'Student',
    baselineRole: 'student',
    capabilities: ['venture_read'],
    focus: 'Understand your Venture participation, upcoming activity and assessment state.',
    access: 'Read-only Venture context. Registry controls and other students’ result records remain restricted.',
    primaryAction: 'production',
    primaryLabel: 'View production activity',
  },
  junior_tutor: {
    label: 'Junior Tutor',
    baselineRole: 'tutor_junior',
    capabilities: ['assessment_review', 'result_finalise'],
    focus: 'Resolve the current finalisation checkpoint before lecturer moderation begins.',
    access: 'May review evidence and finalise only within this fictional Venture scope.',
    primaryAction: 'learning',
    primaryLabel: 'Open finalisation queue',
  },
  senior_tutor: {
    label: 'Senior Tutor',
    baselineRole: 'tutor_senior',
    capabilities: ['assessment_review', 'result_finalise', 'venture_coordination'],
    focus: 'Keep the Venture on track and clear assessment or access blockers.',
    access: 'May coordinate this Venture and review fictional finalisation readiness.',
    primaryAction: 'learning',
    primaryLabel: 'Review finalisation readiness',
  },
  lecturer: {
    label: 'Discipline Lecturer',
    baselineRole: 'lecturer',
    capabilities: ['assessment_moderate', 'result_release'],
    focus: 'Prepare moderation and verify that finalised evidence is ready for release.',
    access: 'May moderate and release only the assessments assigned to this fictional scope.',
    primaryAction: 'learning',
    primaryLabel: 'Prepare moderation',
  },
  adhoc: {
    label: 'Ad hoc External Examiner',
    baselineRole: 'adhoc',
    capabilities: ['specialist_review'],
    focus: 'Complete the assigned panel review before temporary access expires.',
    access: 'Specialist evidence only. Demo access expires 09 September 2026 at 18:00 SAST.',
    primaryAction: 'learning',
    primaryLabel: 'Review assigned panel',
  },
  ops_venue_admin: {
    label: 'Operations / Venue Admin',
    baselineRole: 'ops_venue_admin',
    capabilities: ['space_request_review'],
    focus: 'Confirm that approved spaces and resources still support the Venture schedule.',
    access: 'Space and resource workflow only. Assessment and Registry controls are read-restricted.',
    primaryAction: 'spaces',
    primaryLabel: 'Review space request',
  },
  registry: {
    label: 'Registry-capable Staff',
    baselineRole: 'admin',
    capabilities: ['registry_review', 'export_authority'],
    focus: 'Resolve two held result records before preparing the fictional CARS handoff.',
    access: 'Registry capability is scoped authority layered on an existing baseline role; it is not a new role.',
    primaryAction: 'registry',
    primaryLabel: 'Resolve Registry blockers',
  },
  admin: {
    label: 'Administrator',
    baselineRole: 'admin',
    capabilities: ['venture_admin', 'capability_review', 'integration_configuration'],
    focus: 'Review the complete fictional workflow and its unresolved handoff risks.',
    access: 'Full POC visibility. No action writes to Supabase, Microsoft 365 or CARS.',
    primaryAction: 'registry',
    primaryLabel: 'Review workflow blockers',
  },
} as const;

export type DemoPersonaId = keyof typeof demoPersonas;

export const demoPersonaOptions = Object.entries(demoPersonas).map(([id, persona]) => ({
  id: id as DemoPersonaId,
  label: persona.label,
}));

export function resolveDemoPersona(value: string | undefined): DemoPersonaId {
  return value && value in demoPersonas ? value as DemoPersonaId : 'admin';
}
