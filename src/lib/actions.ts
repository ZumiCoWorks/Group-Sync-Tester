'use server';

import { getAuth } from 'firebase/auth/';
import { doc, setDoc } from 'firebase/firestore';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { db, appId } from './firebase';

// This is a workaround for server components to get the auth instance
const getAuthInstance = () => {
    try {
        return getAuth();
    } catch (e) {
        // This will fail in server components, which is expected.
        // We don't need auth for creating a session ID, just for the hostId,
        // which we can't get reliably on the server without a user being passed in.
        // For this app, anonymous auth handles this on the client.
        // The hostId will be added on the first client-side interaction if needed.
        return null;
    }
}


export async function createSession() {
  const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', newId);

  await setDoc(sessionRef, {
    // hostId will be set on client connection if needed, UID not available in server action for anon users
    hostId: 'pending',
    status: 'lobby',
    createdAt: Date.now(),
    groups: [],
  });

  redirect(`/room/${newId}?host=true`);
}
