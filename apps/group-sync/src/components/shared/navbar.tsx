import { Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

type NavbarProps = {
  showSettingsButton?: boolean;
  onSettingsClick?: () => void;
};

export function Navbar({ showSettingsButton = false, onSettingsClick }: NavbarProps) {
  return (
    <header className="border-b border-muted bg-white/90 backdrop-blur-xl py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex flex-col cursor-pointer group">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-creative transition-colors group-hover:text-accent-creative/80">AFDA</p>
          <h1 className="text-2xl font-bold text-heading">Group Sync</h1>
        </Link>
        <div className="flex items-center gap-3">
          {showSettingsButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettingsClick}
              className="text-body hover:text-heading"
            >
              <Settings className="w-5 h-5" />
              <span className="sr-only">URL Settings</span>
            </Button>
          )}
          <div className="rounded-full border border-muted bg-secondary px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-body hidden sm:block">
            Live Shuffler
          </div>
        </div>
      </div>
    </header>
  );
}
