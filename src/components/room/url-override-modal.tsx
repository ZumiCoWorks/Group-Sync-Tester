"use client";
import { Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

type UrlOverrideModalProps = {
  isOpen: boolean;
  onClose: () => void;
  manualBaseUrl: string;
  setManualBaseUrl: (url: string) => void;
};

export function UrlOverrideModal({ isOpen, onClose, manualBaseUrl, setManualBaseUrl }: UrlOverrideModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Settings className="w-5 h-5 text-primary" /> URL Override
          </DialogTitle>
          <DialogDescription className="pt-2">
            If the QR code says "No usable data", copy the URL from your browser's address bar and paste it here.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">
              Base URL
            </Label>
            <Input
              id="url"
              value={manualBaseUrl}
              onChange={(e) => setManualBaseUrl(e.target.value)}
              placeholder="https://..."
              className="col-span-3 font-mono text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="w-full">Apply Fix</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
