'use client';

import { useState } from 'react';
import { Upload, Users, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { parseXLSXFile, validateParticipants, getRandomAvatar } from '@/lib/xlsx-parser';
import { UploadedParticipant } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface XLSXUploadProps {
    onUpload: (participants: UploadedParticipant[]) => Promise<void>;
    isOpen: boolean;
    onClose: () => void;
}

export function XLSXUpload({ onUpload, isOpen, onClose }: XLSXUploadProps) {
    const [participants, setParticipants] = useState<UploadedParticipant[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const handleFileSelect = async (file: File) => {
        const result = await parseXLSXFile(file);

        if (!result.success) {
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: result.error || 'Failed to parse file',
            });
            return;
        }

        const validation = validateParticipants(result.participants);
        if (!validation.valid) {
            toast({
                variant: 'destructive',
                title: 'Validation Failed',
                description: validation.error,
            });
            return;
        }

        setParticipants(result.participants);
        toast({
            title: 'File Parsed Successfully',
            description: `Found ${result.participants.length} participants`,
        });
    };

    const handleUpload = async () => {
        setIsUploading(true);
        try {
            await onUpload(participants);
            toast({
                title: 'Success',
                description: `${participants.length} participants added to session`,
            });
            setParticipants([]);
            onClose();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: 'Failed to add participants to session',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setParticipants([]);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Upload Class List</DialogTitle>
                    <DialogDescription>
                        Upload an XLSX file with your class list. Supported columns include:{' '}
                        <span className="font-semibold">Name</span>, <span className="font-semibold">Surname</span>,{' '}
                        <span className="font-semibold">Programme</span>, <span className="font-semibold">Student Number</span>, etc.
                        <br />
                        <span className="text-xs text-muted-foreground mt-1 block">
                            Name or Name+Surname is required. Programme/School will be used for discipline-based grouping.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {participants.length === 0 ? (
                        <FileUpload onFileSelect={handleFileSelect} accept=".xlsx,.xls" maxSizeMB={5} />
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                                        <Check className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground">File Loaded</p>
                                        <p className="text-sm text-muted-foreground">{participants.length} participants found</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setParticipants([])}
                                    className="hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="border rounded-xl overflow-hidden">
                                <div className="bg-secondary p-3 border-b">
                                    <h4 className="font-bold text-sm uppercase tracking-wider">Preview</h4>
                                </div>
                                <ScrollArea className="h-[300px]">
                                    <div className="p-4 space-y-2">
                                        {participants.map((participant, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:bg-accent/5 transition-colors"
                                            >
                                                <span className="text-xl">{getRandomAvatar(index)}</span>
                                                <div className="flex-grow">
                                                    <p className="font-semibold text-sm">{participant.name}</p>
                                                    {participant.discipline && (
                                                        <p className="text-xs text-primary">{participant.discipline}</p>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">#{index + 1}</span>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="flex-grow py-6 font-bold text-lg"
                                >
                                    <Users className="w-5 h-5 mr-2" />
                                    {isUploading ? 'Adding Participants...' : `Add ${participants.length} Participants`}
                                </Button>
                                <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
