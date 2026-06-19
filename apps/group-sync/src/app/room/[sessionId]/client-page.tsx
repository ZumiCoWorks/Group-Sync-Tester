'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import type { SyncSession, SyncParticipant } from '@/types/shared';
import { HostView } from '@/components/room/host-view';
import { StudentJoinForm } from '@/components/room/student-join-form';
import { StudentLobbyView } from '@/components/room/student-lobby-view';
import { StudentGroupedView } from '@/components/room/student-grouped-view';
import { SessionEndedView } from '@/components/room/session-ended-view';
import { Navbar } from '@/components/shared/navbar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

type ClientPageProps = {
  sessionId: string; // The session code (e.g. 'ABCDEF')
  isHost: boolean;
};

export default function ClientPage({ sessionId, isHost }: ClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [sessionData, setSessionData] = useState<SyncSession | null>(null);
  const [participants, setParticipants] = useState<SyncParticipant[]>([]);
  
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);
  const [showUrlSettings, setShowUrlSettings] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  // 1. Load initial data and set up real-time subscription
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setIsSessionLoading(true);
        const response = await fetch(`${backendUrl}/api/group-sync/session/${sessionId}`);
        const result = await response.json();
        
        if (isMounted && response.ok && result.success) {
          const session = result.data.session;
          const parts = result.data.participants;
          
          setSessionData(session);
          setParticipants(parts);

          // Check if student has already joined previously in this browser session
          const storedParticipantId = localStorage.getItem(`sync_participant_id:${sessionId}`);
          if (storedParticipantId) {
            const matchedParticipant = parts.find((p: any) => p.id === storedParticipantId);
            if (matchedParticipant) {
              setMyParticipantId(storedParticipantId);
              setIsJoined(true);
              setStudentName(matchedParticipant.name);
            }
          }
        }
      } catch (err) {
        console.error('Error loading session data:', err);
      } finally {
        if (isMounted) setIsSessionLoading(false);
      }
    };

    loadData();

    // 2. Subscribe to Supabase Realtime updates
    const channel = supabase
      .channel(`room:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sync_sessions',
          filter: `code=eq.${sessionId}`
        },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'DELETE') {
            setSessionData(null);
          } else {
            setSessionData(payload.new as SyncSession);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sync_participants'
        },
        async () => {
          // Whenever participants change, refetch them to ensure we get matched disciplines/placements
          try {
            const response = await fetch(`${backendUrl}/api/group-sync/session/${sessionId}`);
            const result = await response.json();
            if (isMounted && response.ok && result.success) {
              setParticipants(result.data.participants);
            }
          } catch (err) {
            console.error('Error refreshing participants list:', err);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [sessionId, backendUrl]);

  // If student is joined but their participant ID is missing from active list, they have been kicked
  useEffect(() => {
    if (!isHost && isJoined && myParticipantId && participants.length > 0) {
      const stillParticipant = participants.some(p => p.id === myParticipantId);
      if (!stillParticipant) {
        setIsJoined(false);
        setMyParticipantId(null);
        setStudentName('');
        localStorage.removeItem(`sync_participant_id:${sessionId}`);
        toast({
          variant: 'destructive',
          title: 'Removed from Session',
          description: 'The host has removed you from this grouping session.',
        });
      }
    }
  }, [participants, myParticipantId, isJoined, isHost, sessionId, toast]);

  // Host action: Remove/Kick participant
  const removeParticipant = async (participantId: string) => {
    try {
      const { error } = await supabase
        .from('sync_participants')
        .delete()
        .eq('id', participantId);
        
      if (error) throw error;
      
      toast({
        title: 'Participant Removed',
        description: 'Successfully removed student from the session.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Remove',
        description: err.message || 'Could not remove participant.',
      });
    }
  };

  // Host URL overlay default
  useEffect(() => {
    if (isHost && !isSessionLoading) {
      setShowUrlSettings(true);
    }
  }, [isHost, isSessionLoading]);

  // Redirect students if session ends
  useEffect(() => {
    if (!isHost && sessionData?.status === 'ended') {
      const timer = setTimeout(() => {
        router.push('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [sessionData?.status, isHost, router]);

  // Student action: Join Lobby
  const joinSession = async (name: string, avatar: string, studentNumber: string) => {
    try {
      const response = await fetch(`${backendUrl}/api/group-sync/session/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          avatar,
          student_number: studentNumber || undefined
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to join session');
      }

      const participant = result.data;
      localStorage.setItem(`sync_participant_id:${sessionId}`, participant.id);
      setMyParticipantId(participant.id);
      setStudentName(participant.name);
      setIsJoined(true);
      
      toast({
        title: 'Joined Lobby',
        description: `Welcome, ${participant.name}! Waiting for host to start shuffler.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Join Failed',
        description: err.message || 'Connection error. Please try again.',
      });
      throw err;
    }
  };

  // Host action: Trigger Shuffler Grouping
  const shuffleGroups = async (
    groupCount: number,
    avoidSamePlacements: boolean,
    useDisciplines: boolean,
    requiredDisciplines?: string[]
  ) => {
    const response = await fetch(`${backendUrl}/api/group-sync/session/${sessionId}/group`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        groupCount,
        avoidSamePlacements,
        useDisciplines,
        requiredDisciplines
      })
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || 'Failed to generate groups');
    }
  };

  // Host action: Reset to Lobby state
  const resetToLobby = async () => {
    const response = await fetch(`${backendUrl}/api/group-sync/session/${sessionId}/reset`, {
      method: 'POST',
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || 'Failed to reset room');
    }
  };

  // Host action: End Session
  const endSession = async () => {
    const response = await fetch(`${backendUrl}/api/group-sync/session/${sessionId}/end`, {
      method: 'POST',
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || 'Failed to end session');
    }
  };

  // Host action: Upload Roster File
  const uploadRosterFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${backendUrl}/api/group-sync/session/${sessionId}/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || 'Failed to upload roster file');
    }

    return {
      students: result.data.session?.roster || [],
      summary: result.data.summary,
      studentsCount: result.data.studentsCount
    };
  };

  // Host action: Pre-populate lobby using the uploaded roster
  const populateLobbyFromRoster = async () => {
    const response = await fetch(`${backendUrl}/api/group-sync/session/${sessionId}/populate`, {
      method: 'POST'
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || 'Failed to pre-populate lobby');
    }
  };

  if (isSessionLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md border-rose-500/30 bg-rose-500/10 text-rose-700">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Room Not Found</AlertTitle>
            <AlertDescription>
              The session code <span className="font-bold font-mono text-rose-800">{sessionId}</span> does not exist or may have expired. Please check the code and try again.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  // Check if session has ended
  if (sessionData.status === 'ended') {
    return <SessionEndedView sessionId={sessionId} />;
  }

  if (isHost) {
    return (
      <HostView
        sessionId={sessionId}
        sessionData={sessionData}
        participants={participants}
        showUrlSettings={showUrlSettings}
        setShowUrlSettings={setShowUrlSettings}
        shuffleGroups={shuffleGroups}
        resetToLobby={resetToLobby}
        endSession={endSession}
        uploadRosterFile={uploadRosterFile}
        populateLobbyFromRoster={populateLobbyFromRoster}
        onRemoveParticipant={removeParticipant}
      />
    );
  }

  // Student Views
  if (sessionData.status === 'grouped') {
    return (
      <StudentGroupedView
        sessionData={sessionData}
        studentName={studentName}
      />
    );
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
    );
  }

  const myAvatar = participants.find((p) => p.id === myParticipantId)?.avatar || '👤';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <StudentLobbyView
        myAvatar={myAvatar}
        studentName={studentName}
        sessionId={sessionId}
      />
    </div>
  );
}
