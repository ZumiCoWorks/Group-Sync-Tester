'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { History, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/shared/navbar';
import { SessionList } from '@/components/session-history/session-list';
import { SessionDetailModal } from '@/components/session-history/session-detail-modal';
import { useUser, useFirestore } from '@/firebase';
import { getSavedSessions, updateSessionName, deleteSavedSession } from '@/lib/session-storage';
import { SavedSession } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function HistoryPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const db = useFirestore();
    const { toast } = useToast();

    const [sessions, setSessions] = useState<SavedSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<SavedSession | null>(null);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/group-sync');
            return;
        }

        if (user && db) {
            loadSessions();
        }
    }, [user, db, isUserLoading]);

    const loadSessions = async () => {
        if (!user || !db) return;

        try {
            setIsLoading(true);
            const savedSessions = await getSavedSessions(db, user.uid);
            setSessions(savedSessions);
        } catch (error) {
            console.error('Error loading sessions:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load session history',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (sessionId: string) => {
        if (!user || !db) return;

        try {
            await deleteSavedSession(db, user.uid, sessionId);
            setSessions(sessions.filter((s) => s.id !== sessionId));
            toast({
                title: 'Success',
                description: 'Session deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting session:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete session',
            });
        }
    };

    const handleUpdateName = async (sessionId: string, newName: string) => {
        if (!user || !db) return;

        try {
            await updateSessionName(db, user.uid, sessionId, newName);
            setSessions(
                sessions.map((s) => (s.id === sessionId ? { ...s, name: newName } : s))
            );
            if (selectedSession?.id === sessionId) {
                setSelectedSession({ ...selectedSession, name: newName });
            }
            toast({
                title: 'Success',
                description: 'Session name updated',
            });
        } catch (error) {
            console.error('Error updating session name:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update session name',
            });
        }
    };

    if (isUserLoading || isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/group-sync')}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <History className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-foreground">Session History</h1>
                            <p className="text-muted-foreground">
                                View and manage your saved grouping sessions
                            </p>
                        </div>
                    </div>
                </div>

                <SessionList
                    sessions={sessions}
                    onDelete={handleDelete}
                    onView={setSelectedSession}
                    onEdit={setSelectedSession}
                />

                <SessionDetailModal
                    session={selectedSession}
                    isOpen={!!selectedSession}
                    onClose={() => setSelectedSession(null)}
                    onUpdateName={handleUpdateName}
                />
            </main>
        </div>
    );
}
