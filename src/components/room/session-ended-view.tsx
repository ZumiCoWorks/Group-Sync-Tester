'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/shared/navbar';

interface SessionEndedViewProps {
    sessionId: string;
}

export function SessionEndedView({ sessionId }: SessionEndedViewProps) {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-10 h-10 text-destructive" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-foreground">Session Ended</h1>
                        <p className="text-muted-foreground">
                            The host has ended session <span className="font-mono font-bold">{sessionId}</span>.
                        </p>
                    </div>

                    <div className="p-6 bg-card border rounded-2xl text-left space-y-3">
                        <p className="text-sm text-muted-foreground">
                            This grouping session is no longer active. If you believe this is an error, please contact your instructor.
                        </p>
                    </div>

                    <Button
                        onClick={() => router.push('/group-sync')}
                        size="lg"
                        className="w-full py-6 font-bold text-lg"
                    >
                        <Home className="w-5 h-5 mr-2" />
                        Return to Home
                    </Button>
                </div>
            </main>
        </div>
    );
}
