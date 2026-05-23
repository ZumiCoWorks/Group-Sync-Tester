import BatchEditorScreen from '@/components/batch-editor-screen';

export default function EditBatchPage({ params }: { params: { batchId: string } }) {
  return <BatchEditorScreen mode="edit" batchId={params.batchId} />;
}
