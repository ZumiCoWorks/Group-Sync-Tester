'use client';

import { useEffect, useState, useMemo } from 'react';
import { doc, onSnapshot, collection, setDoc, updateDoc, getDocs } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import type { Session, Participant, UploadedParticipant } from '@/lib/types';
import { HostView } from '@/components/room/host-view';
import { StudentJoinForm } from '@/components/room/student-join-form';
import { StudentLobbyView } from '@/components/room/student-lobby-view';
import { StudentGroupedView } from '@/components/room/student-grouped-view';
import { SessionEndedView } from '@/components/room/session-ended-view';
import { Navbar } from '@/components/shared/navbar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { groupStudents } from '@/ai/flows/group-students-flow';
import { getRandomAvatar } from '@/lib/xlsx-parser';
import { useRouter } from 'next/navigation';

const appId = process.env.NEXT_PUBLIC_APP_ID || 'varsity-group-pro';

type ClientPageProps = {
  sessionId: string;
  isHost: boolean;
};

export default function ClientPage({ sessionId, isHost }: ClientPageProps) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const sessionRef = useMemoFirebase(() => db ? doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId) : null, [db, sessionId]);
  const participantsRef = useMemoFirebase(() => db ? collection(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId, 'participants') : null, [db, sessionId]);

  const { data: sessionData, isLoading: isSessionLoading } = useDoc<Session>(sessionRef);
  const { data: participants, isLoading: areParticipantsLoading } = useCollection<Participant>(participantsRef);

  const [isJoined, setIsJoined] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [showUrlSettings, setShowUrlSettings] = useState(false);

  const isLoading = isSessionLoading || areParticipantsLoading || isUserLoading;

  useEffect(() => {
    if (user && participants?.some(p => p.id === user.uid)) {
      setIsJoined(true);
    }
  }, [user, participants]);

  useEffect(() => {
    if (isHost && !isLoading) {
      setShowUrlSettings(true);
    }
  }, [isHost, isLoading]);

  // Redirect students if session ends
  useEffect(() => {
    if (!isHost && sessionData?.status === 'ended') {
      // Give a brief moment for the UI to update before redirecting
      const timer = setTimeout(() => {
        router.push('/group-sync');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [sessionData?.status, isHost, router]);


  // Client-side actions
  const joinSession = async (name: string, avatar: string, discipline: string) => {
    if (!user || !db) return;
    const participantRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId, 'participants', user.uid);
    const participantData = {
      id: user.uid,
      sessionId: sessionId,
      name,
      avatar,
      joinedAt: Date.now(),
      discipline: discipline || ''
    };

    return setDoc(participantRef, participantData)
      .then(() => {
        setStudentName(name);
        setIsJoined(true);
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: participantRef.path,
          operation: 'create',
          requestResourceData: participantData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
      });
  };

  const shuffleGroups = async (groupCount: number, exclusions: { p1Id: string, p2Id: string }[], useDisciplines: boolean) => {
    if (!sessionRef || !participants || participants.length < groupCount) return;

    const result = await groupStudents({
      participants,
      groupCount,
      exclusions: exclusions.map(e => [e.p1Id, e.p2Id]),
      useDisciplines
    });

    const updateData = {
      status: 'grouped',
      groups: result.groups,
    };

    return updateDoc(sessionRef, updateData).catch((serverError) => {
      const permissionError = new FirestorePermissionError({
        path: sessionRef.path,
        operation: 'update',
        requestResourceData: updateData,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
  };

  const resetToLobby = async () => {
    if (!sessionRef) return;
    const updateData = {
      status: 'lobby',
      groups: []
    };
    return updateDoc(sessionRef, updateData).catch((serverError) => {
      const permissionError = new FirestorePermissionError({
        path: sessionRef.path,
        operation: 'update',
        requestResourceData: updateData,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
  };

  const endSession = async () => {
    if (!sessionRef) return;
    const updateData = {
      status: 'ended' as const,
      endedAt: Date.now()
    };
    return updateDoc(sessionRef, updateData).catch((serverError) => {
      const permissionError = new FirestorePermissionError({
        path: sessionRef.path,
        operation: 'update',
        requestResourceData: updateData,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
  };

  const uploadParticipants = async (uploadedParticipants: UploadedParticipant[]) => {
    if (!db || !user) {
      console.error('Cannot upload participants: db or user is null');
      throw new Error('Database or user not initialized');
    }

    console.log(`Uploading ${uploadedParticipants.length} participants...`);

    try {
      const promises = uploadedParticipants.map((p, index) => {
        const participantId = `uploaded-${Date.now()}-${index}`;
        const participantRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId, 'participants', participantId);
        const participantData = {
          id: participantId,
          sessionId: sessionId,
          name: p.name,
          avatar: getRandomAvatar(index),
          joinedAt: Date.now() + index,
          discipline: p.discipline || ''
        };

        console.log(`Adding participant ${index + 1}/${uploadedParticipants.length}:`, participantData);
        return setDoc(participantRef, participantData);
      });

      await Promise.all(promises);
      console.log('All participants uploaded successfully');
    } catch (error) {
      console.error('Error uploading participants:', error);
      throw error;
    }
  };


  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!sessionData && !isSessionLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Room Not Found</AlertTitle>
            <AlertDescription>
              The session code <span className="font-bold font-mono">{sessionId}</span> does not exist or may have expired. Please check the code and try again.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  // Check if session has ended
  if (sessionData?.status === 'ended') {
    return <SessionEndedView sessionId={sessionId} />;
  }

  if (isHost) {
    return (
      <HostView
        sessionId={sessionId}
        sessionData={sessionData}
        participants={participants || []}
        showUrlSettings={showUrlSettings}
        setShowUrlSettings={setShowUrlSettings}
        shuffleGroups={shuffleGroups}
        resetToLobby={resetToLobby}
        endSession={endSession}
        uploadParticipants={uploadParticipants}
      />
    )
  }

  // Student Views
  if (sessionData?.status === 'grouped') {
    return <StudentGroupedView sessionData={sessionData} studentName={studentName || participants?.find(p => p.id === user?.uid)?.name || ''} />;
  }

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <StudentJoinForm
          sessionId={sessionId}
          onJoin={joinSession}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <StudentLobbyView myAvatar={participants?.find(p => p.id === user?.uid)?.avatar || '👤'} studentName={studentName || participants?.find(p => p.id === user?.uid)?.name || ''} sessionId={sessionId} />
    </div>
  )
}
