"use client";

import type { AcademyCourse } from "@/lib/tutor-academy";

const DATABASE = "sciencedojo-academy-editor";
const STORE = "drafts";

export type AcademyRecoveryDraft = { courseId: string; baseRevision: number; savedAt: string; document: AcademyCourse };

function openRecoveryDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "courseId" }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function writeAcademyRecoveryDraft(draft: AcademyRecoveryDraft) {
  const database = await openRecoveryDatabase();
  await new Promise<void>((resolve, reject) => { const transaction = database.transaction(STORE, "readwrite"); transaction.objectStore(STORE).put(draft); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); });
  database.close();
}

export async function readAcademyRecoveryDraft(courseId: string) {
  const database = await openRecoveryDatabase();
  const value = await new Promise<AcademyRecoveryDraft | undefined>((resolve, reject) => { const request = database.transaction(STORE).objectStore(STORE).get(courseId); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  database.close(); return value;
}

export async function deleteAcademyRecoveryDraft(courseId: string) {
  const database = await openRecoveryDatabase();
  await new Promise<void>((resolve, reject) => { const transaction = database.transaction(STORE, "readwrite"); transaction.objectStore(STORE).delete(courseId); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); });
  database.close();
}
