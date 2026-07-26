'use client';

import React, { useEffect, useState } from 'react';
import { venueSupabase } from '../../../../../utils/supabase';
import { useRouter } from 'next/navigation';

export default function MasterTimetableImporter() {
  const router = useRouter();
  const [authToken, setAuthToken] = useState('');
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold mb-6">Master Timetable Importer</h1>
      <p className="mb-8 text-gray-400">Upload an Excel (.xlsx) or CSV file containing the master timetable to pre-approve venue bookings or set blackout windows.</p>
      
      <div className="p-8 border-2 border-dashed border-white/20 rounded-lg text-center bg-white/5">
        <p className="mb-4">Drag and drop your CARS export file here, or click to browse.</p>
        <input type="file" className="hidden" id="file-upload" accept=".xlsx,.csv" />
        <label htmlFor="file-upload" className="px-6 py-3 bg-blue-600 text-white rounded font-medium cursor-pointer">
          Select File
        </label>
      </div>

      <div className="mt-8 p-6 bg-white/10 rounded">
        <h3 className="font-bold mb-2">Instructions for Import</h3>
        <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2">
          <li>Ensure the file contains <strong>Venue Name</strong>, <strong>Start Time</strong>, and <strong>End Time</strong> columns.</li>
          <li>Rows mapped to valid venues will be inserted as pre-approved requests.</li>
          <li>Conflicts with existing approved requests will be highlighted for manual review before commit.</li>
        </ul>
      </div>
    </main>
  );
}
