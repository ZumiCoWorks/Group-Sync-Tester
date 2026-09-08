export type SourceType = 'continuum' | 'microsoft_teams' | 'microsoft_graph' | 'spreadsheet_import' | 'existing_schedule' | 'existing_group_sync' | 'existing_worksuite';
export type SyncStatus = 'not_connected' | 'pending' | 'running' | 'complete' | 'partial' | 'failed';
export type ResultState = 'draft' | 'submitted' | 'finalised' | 'released' | 'certified' | 'exported';
export type ScopedCapability = 'venture_member' | 'assessor' | 'lead_assessor' | 'moderator' | 'finaliser' | 'release_authority' | 'registry_review' | 'export_authority' | 'venue_approver';

export type SourceMetadata = { sourceType: SourceType; externalId?: string; externalUrl?: string; lastSyncedAt?: string; syncStatus: SyncStatus; sourcePayloadReference?: string };
export type ExternalIdentity = SourceMetadata & { id: string; userId?: string; displayName: string; email?: string; studentNumber?: string };
export type ExternalClass = SourceMetadata & { id: string; name: string };
export type ExternalAssignment = SourceMetadata & { id: string; classId: string; title: string; dueAt?: string };
export type ExternalSubmission = SourceMetadata & { id: string; assignmentId: string; externalIdentityId: string; submittedAt?: string; numericResult?: number };
export type ExternalRubricOutcome = SourceMetadata & { submissionId: string; criterionCode: string; level: string; points?: number };
export type IntegrationConnection = { id: string; provider: string; status: SyncStatus; currentMode: string; futureMode: string; lastSyncedAt?: string };
export type IntegrationSyncRun = { id: string; connectionId: string; startedAt: string; completedAt?: string; imported: number; rejected: number; mappingErrors: number; status: SyncStatus };
export type EntityMapping = { id: string; sourceType: SourceType; sourceId: string; targetType: string; targetId: string; status: 'matched' | 'unmatched' | 'ignored' };
export type ProductionVenture = { id: string; code: string; name: string; description: string; academicPeriod: string; campus: string; schools: string[]; disciplines: string[]; operatingMode: 'microsoft_first' | 'hybrid' | 'continuum_first' };
export type VentureMember = { ventureId: string; userId: string; displayName: string; memberType: 'student' | 'staff' | 'adhoc'; discipline?: string };
export type CapabilityGrant = { id: string; userId: string; ventureId: string; assessmentId?: string; capabilities: ScopedCapability[]; startsAt: string; expiresAt: string; grantedByUserId: string; reason: string; status: 'active' | 'revoked' | 'expired' };
export type Assessment = SourceMetadata & { id: string; ventureId: string; title: string; mode: 'individual' | 'group'; resultState: ResultState; rubricVersion?: string; assessorIds: string[]; finaliserId?: string; moderatorId?: string };
export type Evaluation = SourceMetadata & { id: string; assessmentId: string; subjectId: string; assessorId: string; status: 'draft' | 'submitted' | 'finalised'; score?: number; feedback?: string };
export type ExportBatch = { id: string; createdAt: string; createdByUserId: string; format: 'csv' | 'xlsx'; status: 'preview' | 'generated' | 'confirmed' | 'outdated'; resultIds: string[]; mappingVersion: string };

export type Microsoft365User = { id: string; displayName: string; email?: string; studentNumber?: string };
export interface Microsoft365Provider {
  getCurrentUser(): Promise<Microsoft365User>;
  listClasses(): Promise<ExternalClass[]>;
  listClassMembers(classId: string): Promise<Microsoft365User[]>;
  listAssignments(classId: string): Promise<ExternalAssignment[]>;
  listSubmissions(assignmentId: string): Promise<ExternalSubmission[]>;
  listRubricOutcomes(assignmentId: string): Promise<ExternalRubricOutcome[]>;
}
