'use client';

import React, { useEffect, useState } from 'react';
import { venueSupabase } from '../../../../utils/supabase';
import { useRouter } from 'next/navigation';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

type Venue = {
  id: string;
  name: string;
  owning_department: string;
  visibility: 'shared' | 'exclusive';
};

export default function RequestPortal() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [authToken, setAuthToken] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [venueId, setVenueId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    venueSupabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/');
        return;
      }
      setAuthToken(session.access_token);
      fetchVenues(session.access_token);
    });
  }, [router]);

  const fetchVenues = async (token: string) => {
    try {
      const response = await fetch(`${backendUrl}/api/worksuite/venues`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setVenues(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${backendUrl}/api/worksuite/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          venue_id: venueId,
          start_time: startTime,
          end_time: endTime,
          request_reason: reason
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to submit request');
      }

      setSuccess('Request submitted successfully! It is now pending Ops approval.');
      setVenueId('');
      setStartTime('');
      setEndTime('');
      setReason('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold mb-6">Venue Request Portal</h1>
      <p className="mb-8 text-gray-400">Request a venue for your session. Shared venues are available to everyone, while exclusive venues are restricted to your department.</p>

      {success && <div className="mb-4 p-4 bg-green-900/30 text-green-300 rounded">{success}</div>}
      {error && <div className="mb-4 p-4 bg-red-900/30 text-red-300 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 font-medium">Select Venue</label>
          <select 
            required
            className="w-full p-3 rounded bg-white/10 text-white border border-white/20"
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
          >
            <option value="">-- Choose a venue --</option>
            {venues.map(v => (
              <option key={v.id} value={v.id}>{v.name} ({v.owning_department})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-medium">Start Time</label>
            <input 
              type="datetime-local" 
              required
              className="w-full p-3 rounded bg-white/10 text-white border border-white/20"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">End Time</label>
            <input 
              type="datetime-local" 
              required
              className="w-full p-3 rounded bg-white/10 text-white border border-white/20"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block mb-2 font-medium">Reason for Booking</label>
          <textarea 
            required
            rows={4}
            className="w-full p-3 rounded bg-white/10 text-white border border-white/20"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide details for Ops to review..."
          />
        </div>

        <button 
          type="submit" 
          disabled={submitting}
          className="px-6 py-3 bg-blue-600 text-white rounded font-semibold disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </main>
  );
}
