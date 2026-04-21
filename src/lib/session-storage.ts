import { doc, collection, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { Session, SavedSession, Participant, Group } from './types';

const appId = process.env.NEXT_PUBLIC_APP_ID || 'varsity-group-pro';

/**
 * Save a session to the user's history
 */
export async function saveSession(
    db: Firestore,
    userId: string,
    sessionId: string,
    sessionData: Session,
    participants: Participant[]
): Promise<void> {
    const savedSessionRef = doc(db, 'artifacts', appId, 'private', userId, 'saved-sessions', sessionId);

    const savedSession: SavedSession = {
        id: sessionId,
        name: sessionData.name || `Session ${sessionId}`,
        hostId: userId,
        createdAt: sessionData.createdAt,
        savedAt: Date.now(),
        endedAt: sessionData.endedAt,
        participantCount: participants.length,
        groups: sessionData.groups,
        participants: participants,
    };

    await setDoc(savedSessionRef, savedSession);
}

/**
 * Get all saved sessions for a user
 */
export async function getSavedSessions(db: Firestore, userId: string): Promise<SavedSession[]> {
    const savedSessionsRef = collection(db, 'artifacts', appId, 'private', userId, 'saved-sessions');
    const q = query(savedSessionsRef, orderBy('savedAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => doc.data() as SavedSession);
}

/**
 * Get a specific saved session
 */
export async function getSavedSession(db: Firestore, userId: string, sessionId: string): Promise<SavedSession | null> {
    const savedSessionRef = doc(db, 'artifacts', appId, 'private', userId, 'saved-sessions', sessionId);
    const snapshot = await getDoc(savedSessionRef);

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data() as SavedSession;
}

/**
 * Update a saved session's name
 */
export async function updateSessionName(
    db: Firestore,
    userId: string,
    sessionId: string,
    newName: string
): Promise<void> {
    const savedSessionRef = doc(db, 'artifacts', appId, 'private', userId, 'saved-sessions', sessionId);
    await updateDoc(savedSessionRef, { name: newName });
}

/**
 * Delete a saved session
 */
export async function deleteSavedSession(db: Firestore, userId: string, sessionId: string): Promise<void> {
    const savedSessionRef = doc(db, 'artifacts', appId, 'private', userId, 'saved-sessions', sessionId);
    await deleteDoc(savedSessionRef);
}

/**
 * Update session name in the active session
 */
export async function updateActiveSessionName(
    db: Firestore,
    sessionId: string,
    name: string
): Promise<void> {
    const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId);
    await updateDoc(sessionRef, { name });
}
