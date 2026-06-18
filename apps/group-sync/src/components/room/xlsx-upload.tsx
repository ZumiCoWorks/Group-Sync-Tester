'use client';

import { useState } from 'react';
import { Upload, Users, X, Check, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
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
    isOpen: boolean;
    onClose: () => void;
    onUploadFile: (file: File) => Promise<{ students: any[]; summary: any; studentsCount: number }>;
    onPopulateLobby: () => Promise<void>;
}

export function XLSXUpload({ isOpen, onClose, onUploadFile, onPopulateLobby }: XLSXUploadProps) {
    const [students, setStudents] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isPopulating, setIsPopulating] = useState(false);
    const { toast } = useToast();

    const handleFileSelect = async (file: File) => {
        setIsUploading(true);
        try {
            const result = await onUploadFile(file);
            setStudents(result.students || []);
            setSummary(result.summary || null);
            toast({
                title: 'Roster Uploaded Successfully',
                description: `Successfully loaded ${result.studentsCount} students.`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: error.message || 'Failed to parse roster file',
            });
            setStudents([]);
            setSummary(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handlePopulate = async () => {
        setIsPopulating(true);
        try {
            await onPopulateLobby();
            toast({
                title: 'Lobby Populated',
                description: `Pre-populated the lobby with ${students.length} students from the roster.`,
            });
            handleClose();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to Populate Lobby',
                description: error.message || 'An error occurred while pre-populating.',
            });
        } finally {
            setIsPopulating(false);
        }
    };

    const handleClose = () => {
        setStudents([]);
        setSummary(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-foreground">Upload Class Roster</DialogTitle>
                    <DialogDescription className="text-muted-foreground !mt-2 font-medium">
                        Upload an Excel (.xlsx, .xls) file containing:
                        <ol className="list-decimal pl-5 mt-1 space-y-0.5 text-xs">
                            <li><strong>Tab 1 (Class List):</strong> Columns: Name, Surname, Student Number, Discipline / Stream</li>
                            <li><strong>Tab 2 (Current Placements):</strong> Columns: Student Number (or Name), Current Team</li>
                        </ol>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 flex-grow overflow-hidden flex flex-col min-h-0">
                    {isUploading ? (
                        <div className="flex-grow flex flex-col items-center justify-center py-12 space-y-3">
                            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                            <p className="text-sm font-bold text-foreground">Uploading and parsing sheets...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="flex-grow flex items-center justify-center">
                            <FileUpload onFileSelect={handleFileSelect} accept=".xlsx,.xls" maxSizeMB={10} />
                        </div>
                    ) : (
                        <div className="space-y-4 flex flex-col flex-grow min-h-0">
                            <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">
                                        ✓
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground text-sm">Roster Parsed Successfully</p>
                                        <p className="text-xs text-muted-foreground">
                                            {students.length} students found (Matched: {summary?.withDiscipline || 0} disciplines, {summary?.withPlacement || 0} placements)
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => { setStudents([]); setSummary(null); }}
                                    className="hover:bg-rose-500/10 hover:text-rose-500"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="border rounded-xl overflow-hidden flex flex-col flex-grow min-h-0">
                                <div className="bg-secondary p-3 border-b">
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Roster Preview</h4>
                                </div>
                                <ScrollArea className="flex-grow">
                                    <div className="p-4 space-y-2">
                                        {students.map((student, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:bg-accent/5 transition-colors"
                                            >
                                                <span className="text-xl">👤</span>
                                                <div className="flex-grow">
                                                    <p className="font-semibold text-sm text-foreground">{student.name}</p>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {student.studentNumber && (
                                                            <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-mono">
                                                                {student.studentNumber}
                                                            </span>
                                                        )}
                                                        {student.discipline && (
                                                            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">
                                                                {student.discipline}
                                                            </span>
                                                        )}
                                                        {student.currentPlacement && (
                                                            <span className="text-[10px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full">
                                                                Original: {student.currentPlacement}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-muted-foreground">#{index + 1}</span>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button
                                    onClick={handlePopulate}
                                    disabled={isPopulating}
                                    className="flex-grow py-5 bg-emerald-500 text-white font-bold hover:bg-emerald-600 rounded-xl"
                                >
                                    {isPopulating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Populating Lobby...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5 mr-2" />
                                            Pre-Populate Lobby (For Demo/Testing)
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={isPopulating}
                                    className="py-5 font-bold rounded-xl"
                                >
                                    Done (Let Students Join Live)
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
