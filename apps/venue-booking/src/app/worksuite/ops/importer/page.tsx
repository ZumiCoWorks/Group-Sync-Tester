'use client';

import React, { useEffect, useState } from 'react';
import { venueSupabase } from '../../../../utils/supabase';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

export default function MasterTimetableImporter() {
  const router = useRouter();
  const [authToken, setAuthToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState('Main Campus');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  useEffect(() => {
    venueSupabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/');
        return;
      }
      setAuthToken(session.access_token);
      setLoading(false);
    });
  }, [router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Map columns
        const rows = data.map((row: any) => ({
          venueName: row['Venue Name'] || row['Room'] || row['Venue'],
          startTime: row['Start Time'] || row['Start'],
          endTime: row['End Time'] || row['End']
        })).filter(r => r.venueName && r.startTime && r.endTime);

        if (rows.length === 0) {
          throw new Error('No valid rows found. Ensure Venue Name, Start Time, and End Time columns exist.');
        }

        // Send to preview endpoint
        const res = await fetch(`${backendUrl}/api/worksuite/importer/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ building, rows, preview: true })
        });

        const result = await res.json();
        if (!result.success) throw new Error(result.error?.message);

        setPreviewData(result.data);
      } catch (err: any) {
        setError(err.message || 'Error processing file');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCommit = async () => {
    setError('');
    setIsUploading(true);
    try {
      const rows = previewData.map(r => ({ venueName: r.venueName, startTime: r.startTime, endTime: r.endTime }));
      
      const res = await fetch(`${backendUrl}/api/worksuite/importer/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ building, rows, preview: false })
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message);

      setSuccess(`Successfully imported timetable and resolved ${previewData.filter(r => !r.hasConflict).length} bookings.`);
      setPreviewData([]);
    } catch (err: any) {
      setError(err.message || 'Error committing import');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  const validRows = previewData.filter(r => !r.hasConflict);
  const conflictRows = previewData.filter(r => r.hasConflict);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-3xl font-bold mb-6">Master Timetable Importer</h1>
      
      {error && <div className="mb-4 p-4 bg-red-500/20 text-red-400 rounded font-medium">{error}</div>}
      {success && <div className="mb-4 p-4 bg-green-500/20 text-green-400 rounded font-medium">{success}</div>}

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-semibold mb-2">Source Building</label>
          <select 
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            className="w-full p-3 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-blue-500"
            disabled={previewData.length > 0}
          >
            <option value="Main Campus">Main Campus</option>
            <option value="Atlas">Atlas</option>
          </select>
        </div>
      </div>

      {!previewData.length ? (
        <>
          <div className="p-8 border-2 border-dashed border-white/20 rounded-lg text-center bg-white/5 mb-8">
            <p className="mb-4">Select building, then drag and drop your CARS export file here, or click to browse.</p>
            <input type="file" className="hidden" id="file-upload" accept=".xlsx,.csv" onChange={handleFileUpload} />
            <label htmlFor="file-upload" className="px-6 py-3 bg-blue-600 text-white rounded font-medium cursor-pointer">
              {isUploading ? 'Parsing...' : 'Select File'}
            </label>
          </div>
          <div className="mt-8 p-6 bg-white/10 rounded">
            <h3 className="font-bold mb-2">Instructions for Import</h3>
            <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2">
              <li>Ensure the file contains <strong>Venue Name</strong>, <strong>Start Time</strong>, and <strong>End Time</strong> columns.</li>
              <li>Venues will be automatically created and tagged with the selected building if they don't exist.</li>
              <li>Conflicts with existing approved requests will be highlighted for manual review before commit.</li>
            </ul>
          </div>
        </>
      ) : (
        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">Preview Import ({building})</h2>
          
          <div className="flex gap-4 mb-6">
            <div className="p-4 bg-blue-500/20 rounded flex-1">
              <div className="text-sm text-gray-400">Ready to Import</div>
              <div className="text-2xl font-bold text-blue-400">{validRows.length}</div>
            </div>
            <div className="p-4 bg-red-500/20 rounded flex-1">
              <div className="text-sm text-gray-400">Conflicts Detected</div>
              <div className="text-2xl font-bold text-red-400">{conflictRows.length}</div>
            </div>
          </div>

          {conflictRows.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-red-400 mb-2">Conflicts (Will be skipped)</h3>
              <div className="max-h-60 overflow-y-auto rounded bg-black/20 border border-white/5">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 sticky top-0">
                    <tr>
                      <th className="p-2">Venue</th>
                      <th className="p-2">Start</th>
                      <th className="p-2">End</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {conflictRows.map((r, i) => (
                      <tr key={i}>
                        <td className="p-2">{r.venueName}</td>
                        <td className="p-2">{new Date(r.startTime).toLocaleString()}</td>
                        <td className="p-2">{new Date(r.endTime).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-white/10">
            <button 
              onClick={() => setPreviewData([])}
              className="px-6 py-2 border border-white/20 rounded font-medium"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button 
              onClick={handleCommit}
              className="px-6 py-2 bg-blue-600 text-white rounded font-medium disabled:opacity-50"
              disabled={isUploading || validRows.length === 0}
            >
              {isUploading ? 'Committing...' : `Commit ${validRows.length} Records`}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
