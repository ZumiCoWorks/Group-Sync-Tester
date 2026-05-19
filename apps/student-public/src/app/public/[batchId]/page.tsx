import PublicBatchWrapper from '@/slot-booking/components/public-batch-wrapper';

export default function PublicBatchPage(props: any) {
  const batchId = props.params?.batchId ?? '';
  return <PublicBatchWrapper batchId={batchId} />;
}