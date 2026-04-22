'use client';

import { LockKeyhole, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWorksuiteAuth } from '../auth/worksuite-auth';
import { WorksuiteRole } from '../types';

type WorksuiteRoleGuardProps = {
  allowedRoles: WorksuiteRole[];
  title: string;
  description: string;
  children: React.ReactNode;
};

export function WorksuiteRoleGuard({ allowedRoles, title, description, children }: WorksuiteRoleGuardProps) {
  const { user, canToggleRole, setRole } = useWorksuiteAuth();

  if (allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  return (
    <Card className="border-border bg-card p-6 text-card-foreground">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Access restricted</p>
          <h2 className="mt-2 text-2xl font-black">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{description}</p>
          <p className="mt-3 text-sm text-muted-foreground">Current role: <strong className="text-foreground">{user.role}</strong></p>
        </div>
      </div>

      {canToggleRole && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LockKeyhole className="h-4 w-4 text-primary" />
            Switch to an allowed role in DEV mode.
          </div>
          {allowedRoles.map((role) => (
            <Button key={role} variant="outline" className="rounded-full border-border bg-background text-foreground hover:bg-secondary" onClick={() => setRole(role)}>
              {role}
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
}