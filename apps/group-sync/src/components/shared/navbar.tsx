import { Settings, Terminal } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

type NavbarProps = {
  showSettingsButton?: boolean;
  onSettingsClick?: () => void;
};

export function Navbar({ showSettingsButton = false, onSettingsClick }: NavbarProps) {
  return (
    <header className="py-6 px-4">
      <nav className="flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 bg-foreground rounded flex items-center justify-center">
            <Terminal className="w-5 h-5 text-primary" />
          </div>
          <span className="font-black font-headline text-xl tracking-tighter text-foreground uppercase">
            GroupSync
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/history">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-colors font-bold">
              History
            </Button>
          </Link>
          {showSettingsButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettingsClick}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="sr-only">URL Settings</span>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
