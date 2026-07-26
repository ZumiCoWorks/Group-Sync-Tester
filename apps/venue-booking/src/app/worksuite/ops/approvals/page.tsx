'use client';

import React, { useEffect, useState } from 'react';
import { venueSupabase } from '../../../../utils/supabase';
import { useRouter } from 'next/navigation';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

type Request = {
  id: string;
  start_time: string;
  end_time: string;
  request_reason: string;
  requester_department: string;
  status: 'pending' | 'approved' | 'declined';
  venues: {
    name: string;
    owning_department: string;
  };
};

export default function ApprovalsQueue() {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [authToken, setAuthToken] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [resolvingId, setResolvingId] = useState('');
  const [error, setError] = useState('');

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
      const response = await fetch(`${backendUrl}/api/worksuite/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const resolveRequest = async (id: string, action: 'approve' | 'decline') => {
    setResolvingId(id);
    setError('');

    try {
      const response = await fetch(`${backendUrl}/api/worksuite/requests/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(action === 'decline' ? { decline_reason: 'Declined by Ops' } : {})
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || `Failed to ${action} request`);
      }

      // Remove from pending list
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResolvingId('');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ops Approvals Queue</h1>
        <button className="px-4 py-2 bg-green-600 text-white rounded font-medium">Export CARS (CSV/XLSX)</button>
      </div>
      
      <p className="mb-8 text-gray-400">Review pending requests for venues owned by your department. Approving or declining will send a notification to the requester's department.</p>

      {error && <div className="mb-4 p-4 bg-red-900/30 text-red-300 rounded">{error}</div>}

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-gray-400 bg-white/5 rounded">No pending requests found.</div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="p-6 bg-white/10 rounded border border-white/20 flex flex-col md:flex-row justify-between gap-4">
              <div>
                <h3 className="font-bold text-xl">{req.venues?.name}</h3>
                <p className="text-sm text-gray-300">Requested by: {req.requester_department}</p>
                <div className="my-2 p-3 bg-black/20 rounded">
                  <p className="text-sm"><span className="font-semibold text-gray-400">Start:</span> {new Date(req.start_time).toLocaleString()}</p>
                  <p className="text-sm"><span className="font-semibold text-gray-400">End:</span> {new Date(req.end_time).toLocaleString()}</p>
                </div>
                <p className="text-sm"><span className="font-semibold text-gray-400">Reason:</span> {req.request_reason}</p>
              </div>
              <div className="flex items-start gap-3">
                <button 
                  onClick={() => resolveRequest(req.id, 'approve')}
                  disabled={resolvingId === req.id}
                  className="px-4 py-2 bg-blue-600 text-white rounded font-medium disabled:opacity-50"
                >
                  Approve
                </button>
                <button 
                  onClick={() => resolveRequest(req.id, 'decline')}
                  disabled={resolvingId === req.id}
                  className="px-4 py-2 bg-red-600 text-white rounded font-medium disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
