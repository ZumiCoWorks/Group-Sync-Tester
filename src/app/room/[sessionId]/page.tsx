import ClientPage from "./client-page";

type RoomPageProps = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { sessionId } = await params;
  const search = await searchParams;
  const isHost = search.host === 'true';

  return (
    <ClientPage
      sessionId={sessionId.toUpperCase()}
      isHost={isHost}
    />
  );
}

export const dynamic = 'force-dynamic';
