import { Crown, ShieldCheck, Terminal, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createSession } from '@/lib/actions';
import { Navbar } from '@/components/shared/navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 pt-20 text-center">
        <h1 className="text-6xl md:text-8xl font-black font-headline text-foreground tracking-tighter mb-6">
          Group students <br />
          <span className="text-primary">effortlessly.</span>
        </h1>
        <p className="text-muted-foreground text-xl md:text-2xl font-medium max-w-2xl mx-auto mb-12">
          A high-performance live grouping tool designed for seminars, labs, and collaborative lectures.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <form action={createSession}>
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto px-10 py-7 bg-foreground text-background rounded-full font-bold text-lg hover:bg-foreground/90 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 dark:shadow-slate-900"
            >
              <Crown className="w-5 h-5 text-primary" /> Host a Room
            </Button>
          </form>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto px-10 py-7 bg-transparent text-foreground border-2 border-foreground rounded-full font-bold text-lg hover:bg-foreground/5 transition-all"
          >
            <Link href="/join">Join as Student</Link>
          </Button>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left border-t pt-12">
          <div>
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground font-headline">Real-time Sync</h3>
            <p className="text-muted-foreground text-sm">Students join instantly via QR or short code. No refresh needed.</p>
          </div>
          <div>
            <div className="w-10 h-10 bg-accent/10 text-accent rounded-lg flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground font-headline">Varsity Ready</h3>
            <p className="text-muted-foreground text-sm">Clean, professional UI suitable for higher education environments.</p>
          </div>
          <div>
            <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-lg flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground font-headline">One-Click Export</h3>
            <p className="text-muted-foreground text-sm">Copy group lists directly to clipboard for attendance or LMS.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
