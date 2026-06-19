'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { RotateCcw, Users, Link as LinkIcon, X, Download, Upload, Save, Power, FileText } from 'lucide-react';
import type { SyncSession, SyncParticipant } from '@/types/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UrlOverrideModal } from './url-override-modal';
import { XLSXUpload } from './xlsx-upload';
import { Navbar } from '../shared/navbar';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { exportToPDF, exportToXLSX, copyGroupsToClipboard } from '@/lib/export-utils';
import { supabase } from '@/utils/supabase';

type HostViewProps = {
  sessionId: string;
  sessionData: SyncSession | null;
  participants: SyncParticipant[];
  showUrlSettings: boolean;
  setShowUrlSettings: (show: boolean) => void;
  shuffleGroups: (groupCount: number, avoidSamePlacements: boolean, useDisciplines: boolean, requiredDisciplines?: string[]) => Promise<void>;
  resetToLobby: () => Promise<void>;
  endSession: () => Promise<void>;
  uploadRosterFile: (file: File) => Promise<{ students: any[]; summary: any; studentsCount: number }>;
  populateLobbyFromRoster: () => Promise<void>;
  onRemoveParticipant: (id: string) => Promise<void>;
};

export function HostView({
  sessionId,
  sessionData,
  participants,
  showUrlSettings,
  setShowUrlSettings,
  shuffleGroups,
  resetToLobby,
  endSession,
  uploadRosterFile,
  populateLobbyFromRoster,
  onRemoveParticipant
}: HostViewProps) {
  const [groupCount, setGroupCount] = useState(3);
  const [isAnimating, setIsAnimating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [manualInviteUrl, setManualInviteUrl] = useState('');
  const { toast } = useToast();

  const [useDisciplines, setUseDisciplines] = useState(false);
  const [avoidSamePlacements, setAvoidSamePlacements] = useState(true);
  const [showXLSXUpload, setShowXLSXUpload] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [sessionName, setSessionName] = useState(sessionData?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [requiredDisciplines, setRequiredDisciplines] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [isDraggingOverGroup, setIsDraggingOverGroup] = useState<number | null>(null);

  useEffect(() => {
    setSelectedGroups([]);
  }, [sessionData?.status, sessionData?.groups?.length]);

  const handleReshuffleSelected = async () => {
    if (!sessionData || selectedGroups.length < 2) return;
    const originalGroups = [...sessionData.groups];
    const targetSizes = selectedGroups.map(idx => originalGroups[idx].members.length);
    const membersToShuffle = selectedGroups.flatMap(idx => originalGroups[idx].members);
    
    // Fisher-Yates shuffle
    const shuffled = [...membersToShuffle];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let currentIdx = 0;
    const updatedGroups = originalGroups.map((g, idx) => {
      const selIdx = selectedGroups.indexOf(idx);
      if (selIdx === -1) return g;
      const size = targetSizes[selIdx];
      const slice = shuffled.slice(currentIdx, currentIdx + size);
      currentIdx += size;
      return { ...g, members: slice };
    });

    try {
      const { error } = await supabase
        .from('sync_sessions')
        .update({ groups: updatedGroups })
        .eq('code', sessionId);

      if (error) throw error;
      toast({ title: 'Reshuffle Completed', description: 'Successfully shuffled selected groups.' });
      setSelectedGroups([]);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to reshuffle selected groups.' });
    }
  };

  const handleDragStart = (e: React.DragEvent, sourceGroupIdx: number, memberIdx: number) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ sourceGroupIdx, memberIdx }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetGroupIdx: number) => {
    e.preventDefault();
    setIsDraggingOverGroup(null);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const { sourceGroupIdx, memberIdx } = JSON.parse(dataStr);
      if (sourceGroupIdx === targetGroupIdx) return;
      if (!sessionData) return;

      const originalGroups = [...sessionData.groups];
      const memberToMove = originalGroups[sourceGroupIdx].members[memberIdx];

      const updatedSourceMembers = originalGroups[sourceGroupIdx].members.filter((_, idx) => idx !== memberIdx);
      const updatedTargetMembers = [...originalGroups[targetGroupIdx].members, memberToMove];

      const updatedGroups = originalGroups.map((g, idx) => {
        if (idx === sourceGroupIdx) return { ...g, members: updatedSourceMembers };
        if (idx === targetGroupIdx) return { ...g, members: updatedTargetMembers };
        return g;
      });

      const { error } = await supabase
        .from('sync_sessions')
        .update({ groups: updatedGroups })
        .eq('code', sessionId);

      if (error) throw error;
      toast({ title: 'Student Reassigned', description: `Moved ${memberToMove.name} to Group ${targetGroupIdx + 1}` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to move student.' });
    }
  };

  const handleRemoveFromGroup = async (groupIndex: number, memberIndex: number, member: any) => {
    if (!sessionData) return;
    const updatedGroups = sessionData.groups.map((g, gIdx) => {
      if (gIdx !== groupIndex) return g;
      return { ...g, members: g.members.filter((_, mIdx) => mIdx !== memberIndex) };
    });

    try {
      const { error } = await supabase
        .from('sync_sessions')
        .update({ groups: updatedGroups })
        .eq('code', sessionId);

      if (error) throw error;

      const match = participants.find(p => 
        (member.student_number && String(p.student_number).trim().toLowerCase() === String(member.student_number).trim().toLowerCase()) ||
        (p.name && String(p.name).trim().toLowerCase() === String(member.name).trim().toLowerCase())
      );

      if (match) {
        await onRemoveParticipant(match.id);
      }
      toast({ title: 'Student Removed', description: `Successfully removed ${member.name} from the room` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to remove student' });
    }
  };

  // Unique disciplines in current lobby participants
  const availableDisciplines = useMemo(() => {
    const discs = participants
      .map(p => p.discipline?.trim())
      .filter((d): d is string => !!d);
    return Array.from(new Set(discs));
  }, [participants]);

  // Clean up requiredDisciplines if they are no longer in available list
  useEffect(() => {
    setRequiredDisciplines(prev => prev.filter(d => availableDisciplines.includes(d)));
  }, [availableDisciplines]);

  useEffect(() => {
    if (sessionData?.name) {
      setSessionName(sessionData.name);
    }
  }, [sessionData?.name]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('host');
      setManualInviteUrl(url.toString());
    }
  }, []);

  const getInviteUrl = () => {
    try {
      const url = new URL(manualInviteUrl || window.location.href);
      url.searchParams.delete('host');
      // Fix: Ensure route points to the student join path
      return `${url.origin}/join?code=${sessionId}`;
    } catch (e) {
      return manualInviteUrl;
    }
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
    if (participants.length < 2) {
      toast({ variant: 'destructive', title: 'Error', description: 'Not enough participants to group.' });
      return;
    }
    setIsAnimating(true);
    try {
      await shuffleGroups(groupCount, avoidSamePlacements, useDisciplines, requiredDisciplines);
      toast({ title: 'Success', description: 'Groups generated successfully!' });
    } catch (error: any) {
      console.error('Grouping error details:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to generate groups.' });
    } finally {
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handleReset = async () => {
    try {
      await resetToLobby();
      toast({ title: 'Lobby Reset', description: 'Participants returned to lobby.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to reset session.' });
    }
  };

  const handleSaveName = async () => {
    if (!sessionName.trim()) return;
    try {
      const { error } = await supabase
        .from('sync_sessions')
        .update({ name: sessionName.trim() })
        .eq('code', sessionId);
      
      if (error) throw error;
      setIsEditingName(false);
      toast({ title: 'Success', description: 'Session name updated' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update session name' });
    }
  };

  const handleEndSession = async () => {
    try {
      await endSession();
      toast({ title: 'Session Ended', description: 'All participants have been notified' });
      setShowEndDialog(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to end session' });
    }
  };

  const handleExportPDF = () => {
    if (!sessionData || sessionData.groups.length === 0) return;
    exportToPDF(sessionData as any, sessionData.groups as any);
    toast({ title: 'Success', description: 'PDF exported successfully' });
  };

  const handleExportXLSX = () => {
    if (!sessionData || sessionData.groups.length === 0) return;
    exportToXLSX(sessionData as any, sessionData.groups as any);
    toast({ title: 'Success', description: 'XLSX exported successfully' });
  };

  const handleCopyGroups = async () => {
    if (!sessionData || sessionData.groups.length === 0) return;
    try {
      await copyGroupsToClipboard(sessionData.groups as any);
      toast({ title: 'Success', description: 'Groups copied to clipboard' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to copy to clipboard' });
    }
  };

  const inviteUrlForQr = useMemo(() => {
    return encodeURIComponent(getInviteUrl());
  }, [manualInviteUrl, sessionId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar showSettingsButton onSettingsClick={() => setShowUrlSettings(true)} />

      <UrlOverrideModal
        isOpen={showUrlSettings}
        onClose={() => setShowUrlSettings(false)}
        manualInviteUrl={manualInviteUrl}
        setManualInviteUrl={setManualInviteUrl}
      />

      <XLSXUpload
        isOpen={showXLSXUpload}
        onClose={() => setShowXLSXUpload(false)}
        onUploadFile={uploadRosterFile}
        onPopulateLobby={populateLobbyFromRoster}
      />

      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20 pt-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card p-8 rounded-[2.5rem] shadow-xl border text-center relative overflow-hidden">
            <div className="absolute top-6 right-6 px-3 py-1 bg-rose-500/10 text-rose-600 text-[10px] font-black rounded-full uppercase tracking-widest">Live Lobby</div>
            <h2 className="text-lg font-black text-foreground uppercase tracking-widest mb-6 font-headline">Join Session</h2>

            <div className="bg-secondary p-4 rounded-3xl inline-block border-2 mb-6 group cursor-pointer relative" onClick={copyInvite}>
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${inviteUrlForQr}&color=e11d48&bgcolor=f9fafb`}
                alt="QR Code for joining session"
                width={200}
                height={200}
                className="rounded-xl"
                key={inviteUrlForQr}
              />
              <div className="absolute inset-0 bg-background/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl">
                <span className="text-xs font-black text-foreground flex items-center gap-2"><LinkIcon className="w-4 h-4" /> COPY LINK</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-4xl font-black text-foreground font-mono tracking-widest">{sessionId}</div>
              <Button onClick={copyInvite} variant={linkCopied ? 'default' : 'secondary'} className="w-full py-3 px-4 rounded-xl text-xs font-bold transition-all border-2">
                {linkCopied ? 'LINK COPIED' : 'COPY INVITE URL'}
              </Button>
            </div>
          </div>

          <div className="bg-card p-6 rounded-[2.5rem] shadow-xl border space-y-4">
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest font-headline mb-3">Session Name</h3>
            <div className="flex gap-2">
              <Input
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Enter session name..."
                disabled={!isEditingName}
                className="flex-grow"
              />
              {isEditingName ? (
                <>
                  <Button size="icon" onClick={handleSaveName}>
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button size="icon" variant="outline" onClick={() => setIsEditingName(true)}>
                  <FileText className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Button
              onClick={() => setShowXLSXUpload(true)}
              variant="outline"
              className="w-full text-xs font-bold"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Class Roster (XLSX)
            </Button>
          </div>

          <div className="bg-card p-8 rounded-[2.5rem] shadow-xl border space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-black text-muted-foreground uppercase tracking-widest font-headline">Groups Needed</span>
                <input
                  type="number"
                  min={2}
                  max={Math.max(2, participants.length)}
                  value={groupCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      setGroupCount(val);
                    }
                  }}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value);
                    if (isNaN(val) || val < 2) {
                      setGroupCount(2);
                    } else if (val > participants.length) {
                      setGroupCount(Math.max(2, participants.length));
                    }
                  }}
                  className="text-2xl font-black text-foreground w-16 text-center bg-transparent border-2 border-transparent hover:border-primary/20 focus:border-primary rounded-lg px-2 py-1 transition-colors cursor-pointer"
                  disabled={participants.length < 2}
                />
              </div>
              <input
                type="range"
                min={2}
                max={Math.max(2, participants.length)}
                value={groupCount}
                onChange={(e) => setGroupCount(parseInt(e.target.value))}
                className="w-full accent-rose-500 h-2 bg-secondary rounded-full appearance-none cursor-pointer"
                disabled={participants.length < 2}
              />
              {participants.length < 2 && (
                <p className="text-xs text-muted-foreground mt-2">Add at least 2 students to adjust groups</p>
              )}
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Label htmlFor="discipline-switch" className="text-sm font-black text-muted-foreground uppercase tracking-widest font-headline">Balance Disciplines</Label>
                  <span className="text-[10px] text-muted-foreground">Distribute disciplines evenly</span>
                </div>
                <Switch id="discipline-switch" checked={useDisciplines} onCheckedChange={setUseDisciplines} />
              </div>
              {useDisciplines && availableDisciplines.length > 0 && (
                <div className="pl-1 pt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Require at least one in every group:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableDisciplines.map(disc => {
                      const isChecked = requiredDisciplines.includes(disc);
                      return (
                        <label key={disc} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${isChecked ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-secondary/40 border-border hover:bg-secondary text-muted-foreground'}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRequiredDisciplines(prev => [...prev, disc]);
                              } else {
                                setRequiredDisciplines(prev => prev.filter(d => d !== disc));
                              }
                            }}
                            className="rounded border-gray-300 text-rose-500 focus:ring-rose-500 accent-rose-500 w-3 h-3"
                          />
                          <span>{disc}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Label htmlFor="placement-switch" className="text-sm font-black text-muted-foreground uppercase tracking-widest font-headline">Mix Placements</Label>
                  <span className="text-[10px] text-muted-foreground">Separate old team members</span>
                </div>
                <Switch id="placement-switch" checked={avoidSamePlacements} onCheckedChange={setAvoidSamePlacements} />
              </div>
            </div>
            <Separator />
            <Button
              onClick={handleShuffle}
              disabled={participants.length < 2 || isAnimating}
              className="w-full py-6 rounded-2xl font-black text-lg bg-rose-500 text-white hover:bg-rose-600 flex items-center justify-center gap-3 transition-all shadow-xl shadow-rose-500/20 transform active:scale-95 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
            >
              <RotateCcw className={isAnimating ? 'animate-spin' : ''} />
              {isAnimating ? 'MIXING...' : 'GENERATE GROUPS'}
            </Button>
          </div>
        </div>

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
                <div className="flex gap-2 flex-wrap">
                  {selectedGroups.length >= 2 && (
                    <Button
                      onClick={handleReshuffleSelected}
                      className="bg-rose-500 text-white hover:bg-rose-600 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 transform active:scale-95 transition-all"
                      size="sm"
                    >
                      <RotateCcw className="w-3 h-3 mr-1 animate-pulse" />
                      Reshuffle Selected ({selectedGroups.length})
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest">
                        <Download className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={handleExportPDF}>
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportXLSX}>
                        Export as XLSX
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCopyGroups}>
                        Copy to Clipboard
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button onClick={handleReset} variant="secondary" size="sm" className="text-[10px] font-black uppercase tracking-widest">
                    Reshuffle
                  </Button>
                  <Button onClick={() => setShowEndDialog(true)} variant="destructive" size="sm" className="text-[10px] font-black uppercase tracking-widest">
                    <Power className="w-3 h-3 mr-1" />
                    End Session
                  </Button>
                </div>
              )}
            </div>

            {sessionData?.status === 'grouped' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                {sessionData.groups.map((group, idx) => {
                  const isOver = isDraggingOverGroup === idx;
                  return (
                    <div
                      key={idx}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={() => setIsDraggingOverGroup(idx)}
                      onDragLeave={() => setIsDraggingOverGroup(null)}
                      onDrop={(e) => handleDrop(e, idx)}
                      className={`p-6 rounded-3xl border transition-all duration-200 ${
                        isOver
                          ? 'bg-rose-500/5 border-dashed border-rose-500 shadow-lg shadow-rose-500/10 scale-[1.02]'
                          : 'bg-secondary border-border hover:bg-card hover:shadow-xl hover:border-rose-500/20'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedGroups.includes(idx)}
                            onChange={() => {
                              setSelectedGroups(prev =>
                                prev.includes(idx)
                                  ? prev.filter(item => item !== idx)
                                  : [...prev, idx]
                              );
                            }}
                            className="rounded border-gray-300 text-rose-500 focus:ring-rose-500 accent-rose-500 w-4 h-4 cursor-pointer"
                          />
                          <h3 className="text-sm font-black text-foreground uppercase tracking-tighter font-headline">Group {idx + 1}</h3>
                        </div>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2 py-1 rounded-md">{group.members.length} Students</span>
                      </div>
                      <div className="space-y-2">
                        {group.members.map((m, i) => (
                          <div
                            key={i}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, idx, i)}
                            className="flex flex-col bg-card p-3 rounded-xl shadow-sm border text-sm font-bold text-foreground relative group/student cursor-grab active:cursor-grabbing hover:border-rose-500/30 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{m.avatar}</span>
                                <span>{m.name}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveFromGroup(idx, i, m)}
                                className="w-6 h-6 rounded-md hover:bg-rose-500/10 hover:text-rose-500 opacity-100 md:opacity-0 md:group-hover/student:opacity-100 transition-opacity flex-shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {m.discipline && (
                                <span className="text-[9px] bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full font-bold">
                                  {m.discipline}
                                </span>
                              )}
                              {m.current_placement && (
                                <span className="text-[9px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full font-bold">
                                  Original: {m.current_placement}
                                </span>
                              )}
                              {m.performance && (
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                  m.performance === 'good'
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : 'bg-amber-500/10 text-amber-600'
                                }`}>
                                  Rating: {m.performance}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
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
                      className="animate-in zoom-in slide-in-from-bottom-2 bg-card border pl-4 pr-3 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3 group/card"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0">{p.avatar}</span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-foreground text-sm truncate">{p.name}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {p.discipline && (
                              <span className="text-[9px] bg-rose-500/10 text-rose-600 px-1.5 py-0.2 rounded font-bold">
                                {p.discipline}
                              </span>
                            )}
                            {p.current_placement && (
                              <span className="text-[9px] bg-purple-500/10 text-purple-600 px-1.5 py-0.2 rounded font-bold">
                                Original: {p.current_placement}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveParticipant(p.id)}
                        className="w-7 h-7 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 transition-opacity flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end the session for all participants. Students will be disconnected and redirected.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndSession} className="bg-destructive hover:bg-destructive/90">
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
