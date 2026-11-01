'use client';

import React, { useEffect, useState } from 'react';
import { venueSupabase } from '../../../../utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RequestModel {
  id: string;
  venue_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'approved' | 'declined';
  request_reason: string;
  decline_reason?: string;
  venues: {
    name: string;
    building: string;
    owning_department: string;
  };
}

export default function MyRequestsPage() {
  const router = useRouter();
  const [authToken, setAuthToken] = useState('');
  const [requests, setRequests] = useState<RequestModel[]>([]);
  const [loading, setLoading] = useState(true);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  useEffect(() => {
    venueSupabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/');
        return;
      }
      setAuthToken(session.access_token);
      fetchRequests(session.access_token);
    });
  }, [router]);

  const fetchRequests = async (token: string) => {
    try {
      const response = await fetch(`${backendUrl}/api/worksuite/my-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setRequests(result.data);
      }
    } catch (e) {
      console.error('Failed to fetch requests', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Requests</h1>
        <Link href="/worksuite/registry/request" className="px-4 py-2 bg-blue-600 text-white rounded font-medium">
          New Request
        </Link>
      </div>

      <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            You have no pending or historical venue requests.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5">
              <tr>
                <th className="p-4 font-semibold text-gray-300">Venue</th>
                <th className="p-4 font-semibold text-gray-300">Date & Time</th>
                <th className="p-4 font-semibold text-gray-300">Status</th>
                <th className="p-4 font-semibold text-gray-300">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {requests.map(req => (
                <tr key={req.id}>
                  <td className="p-4">
                    <div className="font-bold">{req.venues?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-400">{req.venues?.building || 'Main Campus'}</div>
                  </td>
                  <td className="p-4 text-sm">
                    {new Date(req.start_time).toLocaleString()} - <br/>
                    {new Date(req.end_time).toLocaleTimeString()}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase
                      ${req.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        req.status === 'declined' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    <div className="text-gray-300 mb-1">{req.request_reason}</div>
                    {req.status === 'declined' && req.decline_reason && (
                      <div className="text-red-400 font-medium">Decline reason: {req.decline_reason}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
