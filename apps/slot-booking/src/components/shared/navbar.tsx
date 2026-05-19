"use client";

import { Settings, Terminal, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useSession, signOut } from 'next-auth/react';

type NavbarProps = {
  showSettingsButton?: boolean;
  onSettingsClick?: () => void;
};

export function Navbar({ showSettingsButton = false, onSettingsClick }: NavbarProps) {
  const { data: session } = useSession();

  return (
    <header className="px-4 py-4 md:px-6">
      <nav className="flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/group-sync" className="group flex items-center gap-2 cursor-pointer">
          <div className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center transition-colors group-hover:bg-secondary">
            <Terminal className="w-5 h-5 text-primary" />
          </div>
          <span className="font-black font-headline text-xl tracking-tight text-foreground uppercase">
            GroupSync
          </span>
        </Link>
        <div className="flex items-center gap-1 rounded-full border border-border bg-card/90 p-1">
          <Link href="/">
            <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors font-bold">
              Apps
            </Button>
          </Link>
          <Link href="/history">
            <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors font-bold">
              History
            </Button>
          </Link>
          {showSettingsButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettingsClick}
              className="rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="sr-only">URL Settings</span>
            </Button>
          )}
          {session?.user ? (
            <div className="ml-2 flex items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/5 px-3 py-1 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{session.user.name ?? session.user.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })} className="rounded-full">
                Sign out
              </Button>
            </div>
          ) : (
            <Link href="/auth/signin">
              <Button variant="ghost" size="sm" className="rounded-full">Sign in</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
