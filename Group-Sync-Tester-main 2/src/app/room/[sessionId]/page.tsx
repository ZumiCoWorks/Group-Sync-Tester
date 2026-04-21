import ClientPage from "./client-page";

type RoomPageProps = {
  params: { sessionId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function RoomPage({ params, searchParams }: RoomPageProps) {
  const { sessionId } = params;
  const isHost = searchParams.host === 'true';

  return (
    <ClientPage
      sessionId={sessionId.toUpperCase()}
      isHost={isHost}
    />
  );
}

export const dynamic = 'force-dynamic';
