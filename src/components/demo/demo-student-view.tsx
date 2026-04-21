'use client';

import { useDemoContext } from './demo-context';
import { StudentJoinForm } from '@/components/room/student-join-form';
import { StudentLobbyView } from '@/components/room/student-lobby-view';
import { StudentGroupedView } from '@/components/room/student-grouped-view';
import { getDemoSessionId } from '@/lib/mock-data';
import { Navbar } from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export function DemoStudentView() {
    const { session, participants, currentStudentId, setCurrentStudentId, addParticipant, setCurrentView } = useDemoContext();
    const [isJoined, setIsJoined] = useState(false);
    const [studentName, setStudentName] = useState('');

    // Auto-select first participant when switching to student view
    useEffect(() => {
        if (participants.length > 0 && !currentStudentId) {
            const firstStudent = participants[0];
            setCurrentStudentId(firstStudent.id);
            setStudentName(firstStudent.name);
            setIsJoined(true);
        }
    }, [participants, currentStudentId, setCurrentStudentId]);

    const currentStudent = participants.find(p => p.id === currentStudentId);

    const handleJoin = async (name: string, avatar: string, discipline: string) => {
        const newParticipant = {
            id: `demo-student-${Date.now()}`,
            name,
            avatar,
            joinedAt: Date.now(),
            discipline: discipline === 'none' ? '' : discipline
        };

        addParticipant(newParticipant);
        setCurrentStudentId(newParticipant.id);
        setStudentName(name);
        setIsJoined(true);
    };

    const handleBackToHost = () => {
        setCurrentView('host');
    };

    // Demo Mode Banner Component
    const DemoBanner = () => (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 text-center font-bold text-sm flex items-center justify-between">
            <Button
                onClick={handleBackToHost}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 gap-2"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Host View
            </Button>
            <span>
                <Sparkles className="inline w-4 h-4 mr-2" />
                DEMO MODE - Student Simulation
            </span>
            <div className="w-32"></div> {/* Spacer for centering */}
        </div>
    );

    // If no participants exist yet, show join form
    if (participants.length === 0 || (!isJoined && !currentStudentId)) {
        return (
            <div className="min-h-screen bg-background">
                <DemoBanner />
                <Navbar />
                <StudentJoinForm
                    sessionId={getDemoSessionId()}
                    onJoin={handleJoin}
                />
            </div>
        );
    }

    // Student is in grouped state
    if (session.status === 'grouped') {
        return (
            <div className="min-h-screen bg-background">
                <DemoBanner />
                <StudentGroupedView
                    sessionData={session}
                    studentName={studentName || currentStudent?.name || ''}
                />
            </div>
        );
    }

    // Student is in lobby
    return (
        <div className="min-h-screen bg-background">
            <DemoBanner />
            <Navbar />
            <StudentLobbyView
                myAvatar={currentStudent?.avatar || '👤'}
                studentName={studentName || currentStudent?.name || ''}
                sessionId={getDemoSessionId()}
            />
        </div>
    );
}
