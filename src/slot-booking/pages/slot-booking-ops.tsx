'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lock, ShieldAlert, Table2, UploadCloud } from 'lucide-react';
import { getLockoutCopy } from '@/worksuite/config';
import { useSlotBookingAuth } from '../auth/slot-booking-auth';
import { useSlotBookingStore } from '../store/use-slot-booking-store';

export function SlotBookingOpsPage() {
  const { user } = useSlotBookingAuth();
  const store = useSlotBookingStore(user);
  const [statusMessage, setStatusMessage] = useState('');

  const venueCount = store.venues.length;
  const importCount = store.lastImport?.rows.length ?? 0;
  const publishedSlots = useMemo(() => store.slots.filter((slot) => slot.isPublished), [store.slots]);
  const panelClass = 'border border-border bg-card p-5 text-card-foreground shadow-sm';
  const subPanelClass = 'rounded-2xl border border-border bg-muted/30 p-4';

  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className={panelClass}>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Operations lane</p>
        <h2 className="mt-1 text-2xl font-semibold">Venue control panel</h2>
        <p className="mt-2 text-sm text-muted-foreground">Ops manages venue data, lockouts, and approvals without touching lecturer or tutor screens.</p>

        <div className="mt-6 space-y-4">
          <div className={subPanelClass}>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Lock className="h-4 w-4 text-primary" />
              {getLockoutCopy()}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldAlert className="h-4 w-4 text-primary" />
              Ops can override restrictions when the emergency workflow requires it.
            </div>
          </div>

          <div className={subPanelClass}>
            <Label className="text-foreground">Venue spreadsheet</Label>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="border-border bg-background text-foreground"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }

                await store.loadSpreadsheet(file);
                setStatusMessage(`Loaded ${file.name}. Auto-mapping is ready.`);
              }}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Venues</p>
                <p className="mt-2 text-2xl font-bold">{venueCount}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Preview rows</p>
                <p className="mt-2 text-2xl font-bold">{importCount || '0'}</p>
              </div>
            </div>
            <Button
              type="button"
              className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={async () => {
                if (!store.lastMapping) {
                  setStatusMessage('Load a spreadsheet first so AFDA can auto-map the columns.');
                  return;
                }

                const result = await store.importVenues(store.lastMapping);
                setStatusMessage(`Imported ${result.imported} venues into the Ops lane.`);
              }}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Import venues
            </Button>
            {statusMessage && <p className="text-sm text-emerald-600 dark:text-emerald-300">{statusMessage}</p>}
          </div>
        </div>
      </Card>

      <Card className={panelClass}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Approvals and schedule</p>
            <h3 className="text-xl font-semibold">Ops queue</h3>
          </div>
          <Badge className="rounded-full bg-amber-600 px-3 py-1 text-white hover:bg-amber-600">{publishedSlots.length} published slots</Badge>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className={subPanelClass}>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Published slots</p>
            <p className="mt-2 text-2xl font-bold">{publishedSlots.length}</p>
          </div>
          <div className={subPanelClass}>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Audits</p>
            <p className="mt-2 text-2xl font-bold">{store.audits.length}</p>
          </div>
        </div>

        <ScrollArea className="mt-6 h-[330px] pr-3">
          <div className="space-y-3">
            {store.audits.slice(0, 6).map((audit) => (
              <div key={audit.id} className={subPanelClass}>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Table2 className="h-4 w-4 text-primary" />
                  <span className="font-bold">{audit.action}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{audit.message}</p>
              </div>
            ))}
            {!store.audits.length && <p className="text-sm text-muted-foreground">Audit rows will show here once OPS actions begin.</p>}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}