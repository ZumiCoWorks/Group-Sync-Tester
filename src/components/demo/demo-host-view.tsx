'use client';

import { useDemoContext } from './demo-context';
import { HostView } from '@/components/room/host-view';
import { getDemoSessionId } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Users, Sparkles } from 'lucide-react';
import { useState } from 'react';

export function DemoHostView() {
    const { session, participants, shuffleGroups, resetToLobby, addMockParticipants } = useDemoContext();
    const [showUrlSettings, setShowUrlSettings] = useState(false);

    const handleAddMockStudents = (count: number) => {
        addMockParticipants(count);
    };

    return (
        <div className="relative">
            {/* Demo Mode Banner */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 text-center font-bold text-sm">
                <Sparkles className="inline w-4 h-4 mr-2" />
                DEMO MODE - No authentication required. Changes are not saved.
            </div>

            {/* Quick Actions for Demo */}
            {session.status === 'lobby' && (
                <div className="bg-muted/50 border-b border-border p-4">
                    <div className="max-w-4xl mx-auto flex flex-wrap gap-3 items-center justify-center">
                        <span className="text-sm font-semibold text-muted-foreground">Quick Start:</span>
                        <Button
                            onClick={() => handleAddMockStudents(5)}
                            size="sm"
                            variant="outline"
                            className="gap-2"
                        >
                            <Users className="w-4 h-4" />
                            Add 5 Students
                        </Button>
                        <Button
                            onClick={() => handleAddMockStudents(10)}
                            size="sm"
                            variant="outline"
                            className="gap-2"
                        >
                            <Users className="w-4 h-4" />
                            Add 10 Students
                        </Button>
                        <Button
                            onClick={() => handleAddMockStudents(20)}
                            size="sm"
                            variant="outline"
                            className="gap-2"
                        >
                            <Users className="w-4 h-4" />
                            Add 20 Students
                        </Button>
                    </div>
                </div>
            )}

            <HostView
                sessionId={getDemoSessionId()}
                sessionData={session}
                participants={participants}
                showUrlSettings={showUrlSettings}
                setShowUrlSettings={setShowUrlSettings}
                shuffleGroups={shuffleGroups}
                resetToLobby={resetToLobby}
            />
        </div>
    );
}
