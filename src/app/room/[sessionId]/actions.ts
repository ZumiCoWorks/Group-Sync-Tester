"use server";

import { db, appId } from "@/lib/firebase";
import { Participant } from "@/lib/types";
import { collection, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function joinSession(sessionId: string, userId: string, name: string, avatar: string) {
  if (!sessionId || !userId || !name || !avatar) {
    throw new Error("Missing required fields for joining session.");
  }
  const participantRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId, 'participants', userId);
  await setDoc(participantRef, {
    name,
    avatar,
    joinedAt: Date.now(),
  });
  revalidatePath(`/room/${sessionId}`);
}

export async function shuffleGroups(sessionId: string, groupCount: number) {
  if (!sessionId || !groupCount) {
    throw new Error("Missing sessionId or groupCount");
  }

  const participantsRef = collection(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId, 'participants');
  const participantsSnapshot = await getDocs(participantsRef);
  const participants = participantsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Participant[];

  if (participants.length < groupCount) {
    throw new Error("Not enough participants to form the desired number of groups.");
  }

  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  const newGroups = Array.from({ length: groupCount }, (): { name: string; avatar: string }[] => []);
  
  shuffled.forEach((p, index) => {
    newGroups[index % groupCount].push({ name: p.name, avatar: p.avatar });
  });

  const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId);
  await updateDoc(sessionRef, {
    status: 'grouped',
    groups: newGroups,
  });

  revalidatePath(`/room/${sessionId}`);
}

export async function resetToLobby(sessionId: string) {
    if (!sessionId) {
        throw new Error("Missing sessionId");
    }
    const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', sessionId);
    await updateDoc(sessionRef, {
        status: 'lobby',
        groups: []
    });
    revalidatePath(`/room/${sessionId}`);
}
