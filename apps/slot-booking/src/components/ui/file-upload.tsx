'use client';

import { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    maxSizeMB?: number;
    className?: string;
}

export function FileUpload({ onFileSelect, accept = '.xlsx,.xls', maxSizeMB = 5, className }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    }, []);

    const handleDragOut = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const validateFile = (file: File): boolean => {
        setError(null);

        // Check file size
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            setError(`File size must be less than ${maxSizeMB}MB`);
            return false;
        }

        // Check file type
        const acceptedTypes = accept.split(',').map(t => t.trim());
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedTypes.includes(fileExtension)) {
            setError(`File type must be one of: ${accept}`);
            return false;
        }

        return true;
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (validateFile(file)) {
                onFileSelect(file);
            }
        }
    }, [onFileSelect, validateFile]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (validateFile(file)) {
                onFileSelect(file);
            }
        }
    };

    return (
        <div className={cn('w-full', className)}>
            <div
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                    'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer',
                    isDragging
                        ? 'border-primary bg-primary/5 scale-[1.02]'
                        : 'border-border hover:border-primary/50 hover:bg-accent/5'
                )}
            >
                <input
                    type="file"
                    accept={accept}
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                        isDragging ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    )}>
                        <Upload className="w-6 h-6" />
                    </div>

                    <div>
                        <p className="font-bold text-foreground mb-1">
                            {isDragging ? 'Drop file here' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {accept} (max {maxSizeMB}MB)
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                    <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}
        </div>
    );
}
