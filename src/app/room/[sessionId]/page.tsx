import { getDoc, doc, collection, getDocs } from "firebase/firestore";
import { db, appId } from "@/lib/firebase";
import { Session, Participant } from "@/lib/types";
import ClientPage from "./client-page";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

type RoomPageProps = {
  params: { sessionId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

async function getSessionData(sessionId: string) {
  try {
    const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return null;
    }

    const participantsRef = collection(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId, 'participants');
    const participantsSnap = await getDocs(participantsRef);

    const initialSession = sessionSnap.data() as Session;
    const initialParticipants = participantsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Participant[];

    return { initialSession, initialParticipants };
  } catch (error) {
    console.error("Failed to fetch session data:", error);
    return null;
  }
}

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { sessionId } = params;
  const isHost = searchParams.host === 'true';

  const data = await getSessionData(sessionId.toUpperCase());

  if (!data) {
     return (
       <div className="min-h-screen bg-background flex flex-col">
         <Navbar />
         <main className="flex-grow flex items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-md">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Room Not Found</AlertTitle>
              <AlertDescription>
                The session code <span className="font-bold font-mono">{sessionId.toUpperCase()}</span> does not exist or may have expired. Please check the code and try again.
              </AlertDescription>
            </Alert>
         </main>
       </div>
     )
  }

  const { initialSession, initialParticipants } = data;

  return (
    <ClientPage
      sessionId={sessionId.toUpperCase()}
      isHost={isHost}
      initialSession={initialSession}
      initialParticipants={initialParticipants}
    />
  );
}

export const dynamic = 'force-dynamic';
