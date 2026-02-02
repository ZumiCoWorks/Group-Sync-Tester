"use client";
import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { joinSession } from '@/app/room/[sessionId]/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const AVATARS = ['⚡', '💎', '🔥', '🪐', '🧬', '💻', '🎓', '⚖️', '🏹', '🛡️', '🧪', '🔭'];

type StudentJoinFormProps = {
  sessionId: string;
  onJoin: (name: string) => void;
};

export function StudentJoinForm({ sessionId, onJoin }: StudentJoinFormProps) {
  const { user } = useAuth();
  const [studentName, setStudentName] = useState('');
  const [myAvatar, setMyAvatar] = useState(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !studentName) return;

    setIsLoading(true);
    try {
      await joinSession(sessionId, user.uid, studentName, myAvatar);
      onJoin(studentName);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not join the session. The room might not exist.' });
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full max-w-md mx-auto p-8 animate-in slide-in-from-bottom-8">
      <Card className="rounded-3xl shadow-2xl border-none">
        <CardHeader>
          <CardTitle className="text-3xl font-black font-headline text-foreground">Student Profile</CardTitle>
          <CardDescription className="!mt-2">
            Room: <span className="text-primary font-mono font-bold">{sessionId}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-8">
            {AVATARS.map(a => (
              <button
                key={a}
                onClick={() => setMyAvatar(a)}
                className={`text-3xl p-3 rounded-2xl transition-all ${myAvatar === a ? 'bg-primary/20 border-2 border-primary' : 'bg-secondary border-2 border-transparent hover:bg-muted'}`}
                aria-label={`Select avatar ${a}`}
              >
                {a}
              </button>
            ))}
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter Full Name"
              className="w-full p-4 h-auto bg-secondary border-border rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
            />
            <Button
              type="submit"
              className="w-full py-6 bg-foreground text-background font-black rounded-xl hover:bg-foreground/90 transition-all text-lg"
              disabled={isLoading}
            >
              {isLoading ? 'Joining...' : 'Join Class'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
