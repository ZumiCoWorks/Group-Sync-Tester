'use client';

type StudentLobbyViewProps = {
    myAvatar: string;
    studentName: string;
    sessionId: string;
}

export function StudentLobbyView({ myAvatar, studentName, sessionId }: StudentLobbyViewProps) {
    return (
        <main className="text-center space-y-8 pt-20">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20"></div>
              <div className="relative w-32 h-32 bg-card rounded-full flex items-center justify-center text-7xl shadow-2xl border-4">
                {myAvatar}
              </div>
            </div>
            <h2 className="text-4xl font-black text-foreground tracking-tight font-headline">Hang tight, {studentName.split(' ')[0]}</h2>
            <p className="text-muted-foreground text-lg font-medium">
                Session <span className="font-mono text-foreground font-bold">{sessionId}</span> is active.
            </p>
            <p className="text-muted-foreground text-sm">Waiting for the host to generate groups...</p>
        </main>
    )
}
