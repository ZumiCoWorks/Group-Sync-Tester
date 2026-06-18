"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '../ui/label';

const AVATARS = ['⚡', '💎', '🔥', '🪐', '🧬', '💻', '🎓', '⚖️', '🏹', '🛡️', '🧪', '🔭'];
const DISCIPLINES = ["Start-Up Finance", "Marketing and Sales", "U(I)X Operations and Design", "Business Strategy & Management"];


type StudentJoinFormProps = {
  sessionId: string;
  onJoin: (name: string, avatar: string, discipline: string) => Promise<void>;
};

export function StudentJoinForm({ sessionId, onJoin }: StudentJoinFormProps) {
  const [studentName, setStudentName] = useState('');
  const [myAvatar, setMyAvatar] = useState(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  const [discipline, setDiscipline] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName) return;

    setIsLoading(true);
    try {
      await onJoin(studentName, myAvatar, discipline === 'none' ? '' : discipline);
      // onJoin will handle setting isJoined state
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not join the session. The room might not exist.' });
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full max-w-md mx-auto p-4 animate-in slide-in-from-bottom-8">
      <div className="rounded-3xl border border-muted bg-white p-6 shadow-xl backdrop-blur-xl sm:p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold text-heading">Student Profile</h2>
          <p className="text-sm leading-6 text-body mt-2">
            Room: <span className="text-accent-creative font-mono font-semibold">{sessionId}</span>
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <Label className="text-heading font-medium">Choose your Avatar</Label>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map(a => (
              <button
                key={a}
                onClick={() => setMyAvatar(a)}
                className={`text-2xl p-2.5 rounded-xl transition-all ${myAvatar === a ? 'bg-accent-creative/20 border border-accent-creative' : 'bg-secondary border border-muted hover:bg-secondary/80'}`}
                aria-label={`Select avatar ${a}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-heading font-medium">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter Full Name"
              className="w-full p-4 h-auto bg-secondary border border-muted rounded-xl outline-none focus-visible:ring-accent-creative font-semibold"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discipline" className="text-heading font-medium">Discipline (Optional)</Label>
            <Select value={discipline} onValueChange={setDiscipline}>
              <SelectTrigger id="discipline" className="w-full p-4 h-auto bg-secondary border border-muted rounded-xl outline-none focus-visible:ring-accent-creative font-semibold">
                <SelectValue placeholder="Select your discipline..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {DISCIPLINES.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            className="w-full py-4 bg-accent-creative text-white font-semibold rounded-2xl hover:bg-accent-creative/90 transition-all shadow-md shadow-accent-creative/10 text-lg disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Joining...' : 'Join Class'}
          </Button>
        </form>
      </div>
    </main>
  );
}
