'use client';

import { DemoProvider, useDemoContext } from '@/components/demo/demo-context';
import { DemoHostView } from '@/components/demo/demo-host-view';
import { DemoStudentView } from '@/components/demo/demo-student-view';
import { Button } from '@/components/ui/button';
import { Eye, RotateCcw } from 'lucide-react';

function DemoContentInner() {
    const { currentView, setCurrentView, resetDemo } = useDemoContext();

    return (
        <div className="min-h-screen bg-background">
            {/* View Switcher - Only show in host view */}
            {currentView === 'host' && (
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
                    <Button
                        onClick={() => setCurrentView('student')}
                        size="lg"
                        className="shadow-2xl gap-2 bg-primary hover:bg-primary/90"
                    >
                        <Eye className="w-5 h-5" />
                        View as Student
                    </Button>
                    <Button
                        onClick={resetDemo}
                        size="lg"
                        variant="outline"
                        className="shadow-2xl gap-2"
                    >
                        <RotateCcw className="w-5 h-5" />
                        Reset Demo
                    </Button>
                </div>
            )}

            {/* Render appropriate view */}
            {currentView === 'host' ? <DemoHostView /> : <DemoStudentView />}
        </div>
    );
}

export default function DemoContent() {
    return (
        <DemoProvider>
            <DemoContentInner />
        </DemoProvider>
    );
}
