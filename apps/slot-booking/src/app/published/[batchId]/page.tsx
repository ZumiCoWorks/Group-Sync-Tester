import 'server-only';

import { notFound } from 'next/navigation';
import PublishedBatchWrapper from '@/slot-booking/components/published-batch-wrapper';

export default async function PublishedBatchPage(props: any) {
  const { batchId } = props.params ?? {};

  if (!batchId) {
    notFound();
  }

  return <PublishedBatchWrapper batchId={batchId} />;
}