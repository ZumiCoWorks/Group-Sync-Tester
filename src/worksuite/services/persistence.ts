import { addDoc, collection, doc, Firestore, setDoc, writeBatch } from 'firebase/firestore';
import { WORKSUITE_ROOT_COLLECTION, WORKSUITE_ROOT_DOC, WORKSUITE_PREFIX, WORKSUITE_STORAGE_KEY } from '../config';
import { AuditRecord, BookingRecord, DelegationRecord, SlotBatch, SlotRecord, VenueRecord, WorksuiteSnapshot } from '../types';

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => stripUndefined(entry)) as T;
  }

  if (value && typeof value === 'object') {
    const cleaned = Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, entry]) => {
      if (entry !== undefined) {
        acc[key] = stripUndefined(entry);
      }
      return acc;
    }, {});
    return cleaned as T;
  }

  return value;
}

export function loadWorksuiteSnapshot(): WorksuiteSnapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(WORKSUITE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as WorksuiteSnapshot;
  } catch {
    return null;
  }
}

export function saveWorksuiteSnapshot(snapshot: WorksuiteSnapshot) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(WORKSUITE_STORAGE_KEY, JSON.stringify(snapshot));
}

export function worksuiteRootRef(db: Firestore) {
  return doc(db, WORKSUITE_ROOT_COLLECTION, WORKSUITE_ROOT_DOC);
}

export function worksuiteCollectionRef(db: Firestore, collectionName: string) {
  return collection(db, WORKSUITE_ROOT_COLLECTION, WORKSUITE_ROOT_DOC, `${WORKSUITE_PREFIX}${collectionName}`);
}

export function worksuiteVenuesRef(db: Firestore) {
  return worksuiteCollectionRef(db, 'venues');
}

export function worksuiteSlotsRef(db: Firestore) {
  return worksuiteCollectionRef(db, 'slots');
}

export function worksuiteSlotBatchesRef(db: Firestore) {
  return worksuiteCollectionRef(db, 'slotBatches');
}

export function worksuiteDelegationsRef(db: Firestore) {
  return worksuiteCollectionRef(db, 'delegations');
}

export function worksuiteBookingsRef(db: Firestore) {
  return worksuiteCollectionRef(db, 'bookings');
}

export function worksuiteAuditsRef(db: Firestore) {
  return worksuiteCollectionRef(db, 'audits');
}

export async function syncSnapshotToFirestore(db: Firestore, snapshot: WorksuiteSnapshot) {
  const batch = writeBatch(db);
  const rootRef = worksuiteRootRef(db);

  batch.set(rootRef, {
    updatedAt: Date.now(),
    namespace: WORKSUITE_PREFIX,
    module: 'worksuite',
  }, { merge: true });

  const collections: Array<[string, Array<VenueRecord | SlotBatch | SlotRecord | BookingRecord | DelegationRecord | AuditRecord>]> = [
    ['venues', snapshot.venues],
    ['slotBatches', snapshot.slotBatches as SlotBatch[]],
    ['slots', snapshot.slots],
    ['bookings', snapshot.bookings],
    ['delegations', snapshot.delegations as DelegationRecord[]],
    ['audits', snapshot.audits],
  ];

  collections.forEach(([name, records]) => {
    records.forEach((record) => {
      const ref = doc(worksuiteCollectionRef(db, name), record.id);
      batch.set(ref, stripUndefined(record), { merge: true });
    });
  });

  await batch.commit();
}

export async function appendAuditEntry(db: Firestore | null | undefined, audit: AuditRecord) {
  if (!db) return;
  await addDoc(worksuiteCollectionRef(db, 'audits'), audit);
}
