'use client';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { RotateCcw, Users, Link as LinkIcon } from 'lucide-react';
import { Session, Participant } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UrlOverrideModal } from './url-override-modal';
import { Navbar } from '../shared/navbar';

type HostViewProps = {
  sessionId: string;
  sessionData: Session | null;
  participants: Participant[];
  showUrlSettings: boolean;
  setShowUrlSettings: (show: boolean) => void;
  shuffleGroups: (groupCount: number) => Promise<void>;
  resetToLobby: () => Promise<void>;
};

export function HostView({ sessionId, sessionData, participants, showUrlSettings, setShowUrlSettings, shuffleGroups, resetToLobby }: HostViewProps) {
  const [groupCount, setGroupCount] = useState(3);
  const [isAnimating, setIsAnimating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [manualBaseUrl, setManualBaseUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setManualBaseUrl(window.location.origin + window.location.pathname.replace(/\/~.*$/, ''));
  }, []);

  const getInviteUrl = () => {
    const base = manualBaseUrl || (window.location.origin);
    return `${base.replace(/\/room\/.*$/, '')}/room/${sessionId}`;
  };

  const copyInvite = () => {
    const text = getInviteUrl();
    navigator.clipboard.writeText(text).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast({ title: 'Success', description: 'Invite link copied to clipboard!' });
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to copy link.' });
    });
  };

  const handleShuffle = async () => {
    if (participants.length < 2) return;
    setIsAnimating(true);
    try {
      await shuffleGroups(groupCount);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate groups.' });
    } finally {
        setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handleReset = async () => {
    await resetToLobby();
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar showSettingsButton onSettingsClick={() => setShowUrlSettings(true)} />

      <UrlOverrideModal
        isOpen={showUrlSettings}
        onClose={() => setShowUrlSettings(false)}
        manualBaseUrl={manualBaseUrl}
        setManualBaseUrl={setManualBaseUrl}
      />

      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card p-8 rounded-[2.5rem] shadow-xl border text-center relative overflow-hidden">
            <div className="absolute top-6 right-6 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">Live</div>
            <h2 className="text-lg font-black text-foreground uppercase tracking-widest mb-6 font-headline">Join Session</h2>

            <div className="bg-secondary p-4 rounded-3xl inline-block border-2 mb-6 group cursor-pointer relative" onClick={copyInvite}>
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getInviteUrl())}&color=0f172a&bgcolor=f9fafb`}
                alt="QR Code for joining session"
                width={200}
                height={200}
                className="rounded-xl"
              />
              <div className="absolute inset-0 bg-background/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl">
                <span className="text-xs font-black text-foreground flex items-center gap-2"><LinkIcon className="w-4 h-4" /> COPY LINK</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-4xl font-black text-foreground font-mono tracking-widest">{sessionId}</div>
              <Button
                onClick={copyInvite}
                variant={linkCopied ? 'default' : 'secondary'}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold transition-all border-2"
              >
                {linkCopied ? 'LINK COPIED' : 'COPY INVITE URL'}
              </Button>
            </div>
          </div>

          <div className="bg-card p-8 rounded-[2.5rem] shadow-xl border space-y-8">
            <div className="flex justify-between items-center">
              <span className="text-sm font-black text-muted-foreground uppercase tracking-widest font-headline">Groups Needed</span>
              <span className="text-2xl font-black text-foreground">{groupCount}</span>
            </div>
            <Input
              type="range"
              min="2"
              max={Math.max(2, Math.floor(participants.length / 2))}
              value={groupCount}
              onChange={(e) => setGroupCount(parseInt(e.target.value))}
              className="w-full accent-primary h-2 bg-secondary rounded-full appearance-none cursor-pointer"
              disabled={participants.length < 4}
            />
            <Button
              onClick={handleShuffle}
              disabled={participants.length < 2 || isAnimating}
              className="w-full py-6 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/20 transform active:scale-95 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
            >
              <RotateCcw className={isAnimating ? 'animate-spin' : ''} />
              {isAnimating ? 'MIXING...' : 'GENERATE GROUPS'}
            </Button>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8">
          <div className="bg-card p-10 rounded-[2.5rem] shadow-xl border min-h-[600px]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12 border-b border-border pb-8">
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight font-headline">
                  {sessionData?.status === 'grouped' ? 'Grouping Finalized' : 'Class Lobby'}
                </h2>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">
                  {participants.length} Student{participants.length !== 1 && 's'} Connected
                </p>
              </div>
              
              {sessionData?.status === 'grouped' && (
                <div className="flex gap-2">
                  <Button onClick={handleReset} variant="secondary" className="text-[10px] font-black uppercase tracking-widest">
                    Reshuffle
                  </Button>
                </div>
              )}
            </div>

            {sessionData?.status === 'grouped' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                {sessionData.groups.map((group, idx) => (
                  <div key={idx} className="bg-secondary p-6 rounded-3xl border group hover:bg-card hover:shadow-xl hover:border-primary/20 transition-all">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tighter font-headline">Group {idx + 1}</h3>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{group.length} Students</span>
                     </div>
                     <div className="space-y-2">
                        {group.map((m, i) => (
                          <div key={i} className="flex items-center gap-3 bg-card p-3 rounded-xl shadow-sm border text-sm font-bold text-secondary-foreground">
                            <span className="text-xl">{m.avatar}</span> {m.name}
                          </div>
                        ))}
                     </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {participants.length === 0 ? (
                  <div className="w-full text-center py-32 space-y-4">
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto text-muted-foreground/50">
                      <Users className="w-8 h-8" />
                    </div>
                    <p className="text-muted-foreground font-bold">Awaiting student connections...</p>
                  </div>
                ) : (
                  participants.map((p, i) => (
                    <div 
                      key={p.id} 
                      className="animate-in zoom-in slide-in-from-bottom-2 bg-card border px-5 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-3"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <span className="text-2xl">{p.avatar}</span>
                      <span className="font-bold text-foreground">{p.name}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
