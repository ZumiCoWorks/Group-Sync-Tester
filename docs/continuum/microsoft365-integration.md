# AFDA Continuum — Microsoft 365 Integration

## Current status

Microsoft 365 is not connected. Foundation Phase 1 uses fictional fixtures, a `MockMicrosoft365Provider` and a client-side file-import demonstration. `GraphMicrosoft365Provider` is intentionally disabled and throws a configuration error if invoked.

No tenant identifier, secret, access token or real class/student record is stored in Continuum.

## Provider-neutral contract

The application models identities, classes, members, assignments, submissions and rubric outcomes without making Teams the domain owner. Every imported record retains source metadata, external identifiers, sync status and a payload reference.

## Proposed connection sequence

1. AFDA identifies the Entra tenant and an accountable Microsoft 365 owner.
2. Security approves the minimum Graph permissions and consent model.
3. A server-side adapter obtains tokens; browser code never receives client secrets.
4. Identity matching is staged using student/staff identifiers and explicit exceptions.
5. A dry-run imports one fictional or authorised test class into staging.
6. Operations reviews duplicates, unmatched people and deletion behaviour.
7. Sync runs become idempotent, observable and auditable before pilot use.

## Operational rules

- Imports stage before confirmation.
- Unmatched identities remain unresolved.
- Re-import never silently overwrites a finalised result.
- Provider deletion does not erase required academic lineage.
- Permissions are reviewed at least quarterly and whenever the integration scope changes.
- A failed or partial sync produces a visible operational state and retry path.

## Required owner inputs

- Entra tenant and application-registration owner.
- Approved Graph permission list and consent authority.
- Identity matching fields and exception procedure.
- Retention, deletion and incident-response requirements.
- Staging test cohort and production rollout approval.
