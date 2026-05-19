import 'server-only';

import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { SlotBookingOverviewPage } from '@/slot-booking/pages/slot-booking-overview';
import { readFile } from 'fs/promises';
import path from 'path';

import PublicBatchWrapper from '@/slot-booking/components/public-batch-wrapper';

export default async function PublicBatchPage(props: any) {
  const { batchId } = props.params ?? {};

  // Minimal existence check: look up snapshot file used by worksuite store
  try {
    const storePath = path.join(process.cwd(), '.data', 'worksuite-snapshot.json');
    // if file exists, proceed; otherwise continue (we don't require it)
    // This is a soft check; if you have a real DB, the client store will fetch live data.
    // We simply render the client booking UI which will operate on client-side store.
    await readFile(storePath, 'utf8').catch(() => null);
  } catch (e) {
    // ignore
  }

  return <PublicBatchWrapper batchId={batchId} />;
}
