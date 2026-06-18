"use client";
import { Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

type UrlOverrideModalProps = {
  isOpen: boolean;
  onClose: () => void;
  manualInviteUrl: string;
  setManualInviteUrl: (url: string) => void;
};

export function UrlOverrideModal({ isOpen, onClose, manualInviteUrl, setManualInviteUrl }: UrlOverrideModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] bg-card rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Settings className="w-5 h-5 text-primary" /> Confirm Public URL
          </DialogTitle>
          <DialogDescription className="pt-2">
            This app may not be able to detect its public URL. Please ensure the URL below is the correct public address for students to join. You can copy it from your browser's address bar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">
              Invite URL
            </Label>
            <Input
              id="url"
              value={manualInviteUrl}
              onChange={(e) => setManualInviteUrl(e.target.value)}
              placeholder="https://..."
              className="col-span-3 font-mono text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="w-full">Looks Good</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
