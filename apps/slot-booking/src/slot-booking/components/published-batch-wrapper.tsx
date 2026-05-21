'use client';

import dynamic from 'next/dynamic';

const PublishedBatchView = dynamic(() => import('./published-batch-view').then((m) => m.PublishedBatchView), { ssr: false });

export default function PublishedBatchWrapper({ batchId }: { batchId: string }) {
  return <PublishedBatchView batchId={batchId} />;
}