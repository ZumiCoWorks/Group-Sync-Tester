'use client';

import { useCallback, useEffect, useState } from 'react';
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
  const [hostAuthRequired, setHostAuthRequired] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  const getHostAccessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) {
      throw new Error('Sign in with the staff account that owns this session.');
    }
    return data.session.access_token;
  }, []);

  const hostFetch = useCallback(async (path: string, init: RequestInit = {}) => {
    const token = await getHostAccessToken();
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    return fetch(`${backendUrl}${path}`, { ...init, headers });
  }, [backendUrl, getHostAccessToken]);

  // Load only the view authorized for this browser. Polling avoids exposing the
  // permissive database realtime channel directly to the frontend.
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const storedParticipantId = localStorage.getItem(`sync_participant_id:${sessionId}`);
        let response: Response;
        if (isHost) {
          try {
            response = await hostFetch(`/api/group-sync/session/${sessionId}/host`);
            if (isMounted) setHostAuthRequired(false);
          } catch {
            if (isMounted) setHostAuthRequired(true);
            return;
          }
        } else {
          response = await fetch(`${backendUrl}/api/group-sync/session/${sessionId}`, {
            headers: storedParticipantId ? { 'X-Group-Sync-Participant': storedParticipantId } : undefined,
          });
        }
        const result = await response.json();

        if (response.status === 401 || response.status === 403) {
          if (isMounted && isHost) setHostAuthRequired(true);
          return;
        }

        if (response.status === 404 && !isHost && storedParticipantId) {
          localStorage.removeItem(`sync_participant_id:${sessionId}`);
          if (isMounted) {
            setMyParticipantId(null);
            setIsJoined(false);
            setStudentName('');
          }
          return;
        }

        if (isMounted && response.ok && result.success) {
          const session = result.data.session;
          const parts = result.data.participants;

          setSessionData(session);
          setParticipants(parts);

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

    void loadData();
    const poll = window.setInterval(() => void loadData(), 2500);

    return () => {
      isMounted = false;
      window.clearInterval(poll);
    };
  }, [sessionId, backendUrl, hostFetch, isHost]);

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
      const response = await hostFetch(`/api/group-sync/session/${sessionId}/participants/${participantId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || 'Could not remove participant.');
      
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
    const response = await hostFetch(`/api/group-sync/session/${sessionId}/group`, {
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
    const response = await hostFetch(`/api/group-sync/session/${sessionId}/reset`, {
      method: 'POST',
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || 'Failed to reset room');
    }
  };

  // Host action: End Session
  const endSession = async () => {
    const response = await hostFetch(`/api/group-sync/session/${sessionId}/end`, {
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

    const response = await hostFetch(`/api/group-sync/session/${sessionId}/upload`, {
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
    const response = await hostFetch(`/api/group-sync/session/${sessionId}/populate`, {
      method: 'POST'
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || 'Failed to pre-populate lobby');
    }
  };

  const updateSessionGroups = async (groups: SyncSession['groups']) => {
    const response = await hostFetch(`/api/group-sync/session/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groups }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || 'Failed to update groups');
    }
    setSessionData(result.data);
  };

  const updateSessionName = async (name: string) => {
    const response = await hostFetch(`/api/group-sync/session/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || 'Failed to update session name');
    }
    setSessionData(result.data);
  };

  if (isSessionLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!sessionData) {
    if (isHost && hostAuthRequired) {
      return (
        <div className="min-h-screen bg-background flex flex-col">
          <Navbar />
          <main className="flex-grow flex items-center justify-center p-4">
            <Alert className="max-w-md border-amber-500/30 bg-amber-500/10 text-amber-800">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Staff sign-in required</AlertTitle>
              <AlertDescription>
                Sign in from the Group Sync home page with the staff account that owns this room, then reopen it.
              </AlertDescription>
            </Alert>
          </main>
        </div>
      );
    }
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
        onUpdateGroups={updateSessionGroups}
        onUpdateName={updateSessionName}
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
