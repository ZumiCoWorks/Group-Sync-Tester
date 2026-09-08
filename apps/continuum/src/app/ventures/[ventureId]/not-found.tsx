import { ActionLink, Alert, PageHeader } from '@afda/continuum-ui';

export default function VentureNotFound() {
  return <>
    <PageHeader title="Venture not found" summary="This fictional Venture identifier is unavailable or no longer belongs to the local demonstration set." actions={<ActionLink href="/ventures">Return to Ventures</ActionLink>} />
    <Alert title="Nothing was changed" tone="warning">Check the link or return to the Ventures index. This POC does not query Supabase or another external system for missing records.</Alert>
  </>;
}
