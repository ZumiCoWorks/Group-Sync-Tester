'use client';

import { useState } from 'react';
import { SavedSession } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, Users, Trash2, Edit, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToPDF, exportToXLSX } from '@/lib/export-utils';

interface SessionListProps {
    sessions: SavedSession[];
    onDelete: (sessionId: string) => void;
    onView: (session: SavedSession) => void;
    onEdit: (session: SavedSession) => void;
}

export function SessionList({ sessions, onDelete, onView, onEdit }: SessionListProps) {
    const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

    const handleDelete = () => {
        if (deleteSessionId) {
            onDelete(deleteSessionId);
            setDeleteSessionId(null);
        }
    };

    const handleExportPDF = (session: SavedSession) => {
        exportToPDF(
            {
                id: session.id,
                name: session.name,
                hostId: session.hostId,
                status: 'grouped',
                createdAt: session.createdAt,
                groups: session.groups,
                participantCount: session.participantCount,
            },
            session.groups
        );
    };

    const handleExportXLSX = (session: SavedSession) => {
        exportToXLSX(
            {
                id: session.id,
                name: session.name,
                hostId: session.hostId,
                status: 'grouped',
                createdAt: session.createdAt,
                groups: session.groups,
                participantCount: session.participantCount,
            },
            session.groups
        );
    };

    if (sessions.length === 0) {
        return (
            <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
                    <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-foreground mb-1">No Saved Sessions</h3>
                    <p className="text-muted-foreground text-sm">
                        Sessions you save will appear here for future reference
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session) => (
                    <Card key={session.id} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-grow">
                                    <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1">
                                        {session.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground font-mono">{session.id}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onEdit(session)}
                                    className="flex-shrink-0"
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDistanceToNow(session.createdAt, { addSuffix: true })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="w-4 h-4" />
                                    <span>
                                        {session.participantCount} participants, {session.groups.length} groups
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onView(session)}
                                    className="flex-grow"
                                >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <Download className="w-4 h-4 mr-1" />
                                            Export
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleExportPDF(session)}>
                                            Export as PDF
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExportXLSX(session)}>
                                            Export as XLSX
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeleteSessionId(session.id)}
                                    className="hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <AlertDialog open={!!deleteSessionId} onOpenChange={() => setDeleteSessionId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the saved session and all its data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
