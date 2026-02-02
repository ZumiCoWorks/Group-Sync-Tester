'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { useAuth } from '@/components/providers/auth-provider';
import { db, appId } from '@/lib/firebase';
import type { Session, Participant } from '@/lib/types';

import { HostView } from '@/components/room/host-view';
import { StudentJoinForm } from '@/components/room/student-join-form';
import { StudentLobbyView } from '@/components/room/student-lobby-view';
import { StudentGroupedView } from '@/components/room/student-grouped-view';
import { Navbar } from '@/components/shared/navbar';

type ClientPageProps = {
  sessionId: string;
  isHost: boolean;
  initialSession: Session;
  initialParticipants: Participant[];
};

export default function ClientPage({
  sessionId,
  isHost,
  initialSession,
  initialParticipants,
}: ClientPageProps) {
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState<Session | null>(initialSession);
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [isJoined, setIsJoined] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [showUrlSettings, setShowUrlSettings] = useState(false);
  
  useEffect(() => {
    if (!user || !sessionId) return;
    
    if(isHost && sessionData?.hostId === 'pending') {
        const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId);
        setDoc(sessionRef, { hostId: user.uid }, { merge: true });
    }

    const unsubSession = onSnapshot(
      doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId),
      (doc) => {
        if (doc.exists()) {
          setSessionData(doc.data() as Session);
        }
      }
    );

    const unsubParticipants = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId, 'participants'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Participant[];
        setParticipants(list);
        if (user && list.some(p => p.id === user.uid)) {
          setIsJoined(true);
        }
      }
    );

    return () => {
      unsubSession();
      unsubParticipants();
    };
  }, [user, sessionId, isHost, sessionData?.hostId]);


  if (isHost) {
    return (
        <HostView 
            sessionId={sessionId}
            sessionData={sessionData}
            participants={participants}
            showUrlSettings={showUrlSettings}
            setShowUrlSettings={setShowUrlSettings}
        />
    )
  }

  // Student Views
  if (sessionData?.status === 'grouped') {
    return <StudentGroupedView sessionData={sessionData} studentName={studentName} />;
  }
  
  if (!isJoined) {
    return (
        <div className="min-h-screen bg-background">
          <Navbar />
          <StudentJoinForm 
            sessionId={sessionId} 
            onJoin={(name) => {
              setIsJoined(true);
              setStudentName(name);
            }} 
          />
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <StudentLobbyView myAvatar={participants.find(p => p.id === user?.uid)?.avatar || '👤'} studentName={studentName || participants.find(p=>p.id === user?.uid)?.name || ''} sessionId={sessionId} />
    </div>
  )
}
