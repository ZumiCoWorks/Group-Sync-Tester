'use client';

import { useState } from 'react';
import { SavedSession } from '@/lib/types';
import { X, Edit2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

interface SessionDetailModalProps {
    session: SavedSession | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateName: (sessionId: string, newName: string) => void;
}

export function SessionDetailModal({ session, isOpen, onClose, onUpdateName }: SessionDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');

    if (!session) return null;

    const handleEdit = () => {
        setEditedName(session.name);
        setIsEditing(true);
    };

    const handleSave = () => {
        if (editedName.trim()) {
            onUpdateName(session.id, editedName.trim());
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedName('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        {isEditing ? (
                            <div className="flex items-center gap-2 flex-grow">
                                <Input
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    className="text-xl font-bold"
                                    autoFocus
                                />
                                <Button size="sm" onClick={handleSave}>
                                    <Save className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleCancel}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <span className="text-2xl font-black">{session.name}</span>
                                <Button size="icon" variant="ghost" onClick={handleEdit}>
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-secondary rounded-xl">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Session ID</Label>
                            <p className="font-mono font-bold text-sm mt-1">{session.id}</p>
                        </div>
                        <div className="p-4 bg-secondary rounded-xl">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Created</Label>
                            <p className="font-bold text-sm mt-1">{new Date(session.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="p-4 bg-secondary rounded-xl">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Participants</Label>
                            <p className="font-bold text-sm mt-1">{session.participantCount}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-4">Groups ({session.groups.length})</h3>
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {session.groups.map((group, idx) => (
                                    <div key={idx} className="bg-card border rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold text-sm uppercase tracking-wider">Group {idx + 1}</h4>
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-bold">
                                                {group.members.length} members
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {group.members.map((member, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm p-2 bg-secondary rounded-lg">
                                                    <span className="text-lg">{member.avatar}</span>
                                                    <span className="font-medium">{member.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
