import type { ExternalAssignment, ExternalClass, ExternalRubricOutcome, ExternalSubmission, Microsoft365Provider, Microsoft365User } from './types';

const source = { sourceType: 'microsoft_teams' as const, syncStatus: 'complete' as const };
const demoUser: Microsoft365User = { id: 'DEMO-ADMIN-001', displayName: 'Demo Admin', email: 'admin@demo.invalid' };
const demoClass: ExternalClass = { ...source, id: 'DEMO-CLASS-001', externalId: 'DEMO-CLASS-001', name: 'DEMO · Neighbourhood Futures' };
const demoAssignment: ExternalAssignment = { ...source, id: 'DEMO-ASSIGN-001', externalId: 'DEMO-ASSIGN-001', classId: demoClass.id, title: 'Market Opportunity Analysis' };

export class MockMicrosoft365Provider implements Microsoft365Provider {
  async getCurrentUser() { return demoUser; }
  async listClasses() { return [demoClass]; }
  async listClassMembers(classId: string) { return classId === demoClass.id ? [{ id: 'DEMO-STUDENT-001', displayName: 'Amara Ndlovu', studentNumber: 'DEMO-26001' }] : []; }
  async listAssignments(classId: string) { return classId === demoClass.id ? [demoAssignment] : []; }
  async listSubmissions(assignmentId: string): Promise<ExternalSubmission[]> { return assignmentId === demoAssignment.id ? [{ ...source, id: 'DEMO-SUBMISSION-001', assignmentId, externalIdentityId: 'DEMO-STUDENT-001', numericResult: 72 }] : []; }
  async listRubricOutcomes(assignmentId: string): Promise<ExternalRubricOutcome[]> { return assignmentId === demoAssignment.id ? [{ ...source, submissionId: 'DEMO-SUBMISSION-001', criterionCode: 'evidence', level: 'proficient', points: 18 }] : []; }
}

export type Microsoft365FileDataset = { currentUser: Microsoft365User; classes: ExternalClass[]; members: Microsoft365User[]; assignments: ExternalAssignment[]; submissions: ExternalSubmission[]; rubricOutcomes: ExternalRubricOutcome[] };
export class FileImportMicrosoft365Provider implements Microsoft365Provider {
  constructor(private readonly data: Microsoft365FileDataset) {}
  async getCurrentUser() { return this.data.currentUser; }
  async listClasses() { return [...this.data.classes]; }
  async listClassMembers(classId: string) { return this.data.classes.some((item) => item.id === classId) ? [...this.data.members] : []; }
  async listAssignments(classId: string) { return this.data.assignments.filter((item) => item.classId === classId); }
  async listSubmissions(assignmentId: string) { return this.data.submissions.filter((item) => item.assignmentId === assignmentId); }
  async listRubricOutcomes(assignmentId: string) { const ids = new Set((await this.listSubmissions(assignmentId)).map((item) => item.id)); return this.data.rubricOutcomes.filter((item) => ids.has(item.submissionId)); }
}

/** Disabled until AFDA supplies an approved Entra tenant, consent and Graph permissions. */
export class GraphMicrosoft365Provider implements Microsoft365Provider {
  private disabled(): never { throw new Error('Microsoft Graph is not connected in Foundation Phase 1'); }
  async getCurrentUser() { return this.disabled(); }
  async listClasses() { return this.disabled(); }
  async listClassMembers(_classId: string) { return this.disabled(); }
  async listAssignments(_classId: string) { return this.disabled(); }
  async listSubmissions(_assignmentId: string) { return this.disabled(); }
  async listRubricOutcomes(_assignmentId: string) { return this.disabled(); }
}
