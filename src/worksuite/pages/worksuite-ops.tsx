'use client';

import { useMemo, useState } from 'react';
import { Upload, Lock, DatabaseZap, RotateCcw, CalendarRange, MapPinned } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/ui/file-upload';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getLockoutCopy, isScheduleLocked } from '../config';
import { useWorksuiteStore } from '../store/use-worksuite-store';
import { VenueColumnKey } from '../types';
import { autoMapVenueColumns } from '../services/spreadsheet';

const fieldOptions: Array<{ key: VenueColumnKey; label: string }> = [
  { key: 'venueId', label: 'Room / Venue ID' },
  { key: 'roomName', label: 'Room Name' },
  { key: 'building', label: 'Building' },
  { key: 'campus', label: 'Campus' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'notes', label: 'Notes' },
];

export function WorksuiteOpsPage() {
  const store = useWorksuiteStore();
  const locked = isScheduleLocked();
  const [previewRows, setPreviewRows] = useState(0);
  const [importing, setImporting] = useState(false);
  const [mapping, setMapping] = useState(store.lastMapping ?? { venueId: '', roomName: '', building: '', campus: '', capacity: '', notes: '' });
  const [selectedVenueId, setSelectedVenueId] = useState(store.venues[0]?.id || '');

  const preview = store.lastImport;

  const venueTimeline = useMemo(() => {
    return [...store.venues].sort((a, b) => b.importedAt - a.importedAt);
  }, [store.venues]);

  const handleImport = async () => {
    setImporting(true);
    try {
      const result = await store.importVenues(mapping);
      setPreviewRows(result.imported);
    } finally {
      setImporting(false);
    }
  };

  const refreshMapping = (field: VenueColumnKey, value: string) => {
    setMapping((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-white/10 bg-white/5 p-6 text-white backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">Operations & Venue Manager</p>
            <h2 className="mt-2 text-3xl font-black">Smart Excel Importer</h2>
            <p className="mt-3 max-w-2xl text-sm text-white/70">
              Upload a legacy spreadsheet, map columns to venue fields, and populate the isolated <strong>ws_venues</strong> collection.
            </p>
          </div>
          <Badge className="rounded-full bg-[#ff6f4d] px-3 py-1 text-black hover:bg-[#ff6f4d]">{store.summary.venueCount} venues</Badge>
        </div>

        <div className="mt-6 grid gap-4">
          <FileUpload onFileSelect={async (file) => {
            const spreadsheet = await store.loadSpreadsheet(file);
            setPreviewRows(spreadsheet.rows.length);
            setMapping(autoMapVenueColumns(spreadsheet.headers));
          }} accept=".xlsx,.xls,.csv" maxSizeMB={8} />

          {preview && (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">Spreadsheet detected</p>
                  <p className="text-xs text-white/55">{preview.sourceName} · {previewRows || preview.rows.length} data rows</p>
                </div>
                <Badge variant="outline" className="rounded-full border-white/15 text-white/75">Header row {preview.headerRowIndex + 1}</Badge>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {fieldOptions.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label className="text-white/80">{field.label}</Label>
                    <select
                      value={mapping[field.key] || ''}
                      onChange={(event) => refreshMapping(field.key, event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none ring-0"
                    >
                      <option value="">Select column</option>
                      {preview.headers.map((header) => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  onClick={handleImport}
                  disabled={importing || locked || !mapping.roomName || !mapping.venueId}
                  className="rounded-full bg-[#ff6f4d] px-6 text-black hover:bg-[#ff8a68] disabled:opacity-50"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {importing ? 'Importing...' : locked ? 'Locked by Thursday rule' : 'Import Venues'}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"
                  onClick={() => store.resetToSeed()}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset demo data
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Venues" value={store.summary.venueCount} />
            <Metric label="Open slots" value={store.summary.openSlotCount} />
            <Metric label="Bookings" value={store.summary.bookingCount} />
            <Metric label="Lockout" value={locked ? 'Active' : 'Open'} />
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <Lock className="h-4 w-4 text-[#ff6f4d]" />
            {getLockoutCopy()}
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        <Card className="border-white/10 bg-white/5 p-5 text-white backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <MapPinned className="h-5 w-5 text-[#ff6f4d]" />
            <div>
              <h3 className="text-lg font-bold">Venue Timeline</h3>
              <p className="text-sm text-white/60">Read-only dashboard for staff to see occupied rooms.</p>
            </div>
          </div>

          <ScrollArea className="mt-4 h-[460px] pr-3">
            <div className="space-y-3">
              {venueTimeline.map((venue) => (
                <div key={venue.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{venue.roomName}</p>
                      <p className="text-xs text-white/60">{venue.building} · {venue.campus}</p>
                    </div>
                    <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">{venue.capacity || '—'} seats</Badge>
                  </div>
                  <p className="mt-2 text-xs text-white/55">Venue ID: {venue.venueId}</p>
                  {venue.notes && <p className="mt-2 text-xs text-white/70">{venue.notes}</p>}
                </div>
              ))}
              {!venueTimeline.length && <p className="text-sm text-white/55">No venues imported yet.</p>}
            </div>
          </ScrollArea>
        </Card>

        <Card className="border-white/10 bg-white/5 p-5 text-white backdrop-blur-xl">
          <p className="text-sm font-bold">Firestore namespace</p>
          <p className="mt-2 text-sm text-white/70">
            All new Worksuite data lives under <code className="rounded bg-white/10 px-1 py-0.5">worksuite_v1 / ws_*</code> only.
          </p>
          <p className="mt-3 text-xs text-white/50">Mock mode stays local-first and is safe to demo without Microsoft sign-in.</p>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
