'use client';

import dynamic from 'next/dynamic';

// Dynamically import demo components with no SSR to avoid Firebase initialization
// The demo-content imports the AI flow which is marked 'use server', causing SSR issues
const DemoContent = dynamic(() => import('./demo-content'), {
    ssr: false,
    loading: () => (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-muted-foreground font-semibold">Loading Demo Mode...</p>
            </div>
        </div>
    )
});

export default function DemoPage() {
    return <DemoContent />;
}
