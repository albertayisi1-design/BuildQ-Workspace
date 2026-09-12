import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  Unsubscribe
} from 'firebase/firestore';
import { firestoreDb, auth, handleFirestoreError, OperationType } from './firebase';
import { ProjectDocument } from '../types';

const DOCUMENTS_COLLECTION = 'documents';

/**
 * Creates or overwrites a project document in Firestore.
 */
export async function saveDocumentToFirestore(document: ProjectDocument): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  const path = `${DOCUMENTS_COLLECTION}/${document.id}`;
  try {
    const docRef = doc(firestoreDb, DOCUMENTS_COLLECTION, document.id);
    const payload = {
      id: document.id,
      project_id: document.project_id,
      title: document.title,
      file_name: document.file_name,
      category: document.category,
      file_size: document.file_size || 0,
      file_type: document.file_type || 'application/octet-stream',
      version: document.version || 'v1.0',
      status: document.status || 'Under Review',
      uploaded_by: document.uploaded_by,
      uploaded_by_uid: document.uploaded_by_uid || auth.currentUser.uid,
      uploaded_at: document.uploaded_at,
      description: document.description || '',
      issuing_authority: document.issuing_authority || '',
      expiry_date: document.expiry_date || '',
      tags: document.tags || [],
      file_data: document.file_data || '',
      updated_at: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Updates an existing document in Firestore.
 */
export async function updateDocumentInFirestore(
  id: string,
  updates: Partial<ProjectDocument>
): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  const path = `${DOCUMENTS_COLLECTION}/${id}`;
  try {
    const docRef = doc(firestoreDb, DOCUMENTS_COLLECTION, id);
    const cleanUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.title !== undefined) cleanUpdates.title = updates.title;
    if (updates.category !== undefined) cleanUpdates.category = updates.category;
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    if (updates.description !== undefined) cleanUpdates.description = updates.description;
    if (updates.version !== undefined) cleanUpdates.version = updates.version;
    if (updates.issuing_authority !== undefined) cleanUpdates.issuing_authority = updates.issuing_authority;
    if (updates.expiry_date !== undefined) cleanUpdates.expiry_date = updates.expiry_date;
    if (updates.tags !== undefined) cleanUpdates.tags = updates.tags;
    if (updates.file_data !== undefined) cleanUpdates.file_data = updates.file_data;

    await updateDoc(docRef, cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Deletes a document from Firestore.
 */
export async function deleteDocumentFromFirestore(id: string): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  const path = `${DOCUMENTS_COLLECTION}/${id}`;
  try {
    const docRef = doc(firestoreDb, DOCUMENTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Attaches a real-time listener for documents.
 * Adheres strictly to Firebase skill: only attaches onSnapshot when user is authenticated.
 */
export function subscribeToDocuments(
  onUpdate: (docs: ProjectDocument[]) => void,
  projectId?: string
): Unsubscribe {
  if (!auth.currentUser) {
    return () => {};
  }
  const path = DOCUMENTS_COLLECTION;
  try {
    const colRef = collection(firestoreDb, DOCUMENTS_COLLECTION);
    const q = projectId ? query(colRef, where('project_id', '==', projectId)) : colRef;

    return onSnapshot(
      q,
      (snapshot) => {
        const docs: ProjectDocument[] = [];
        snapshot.forEach((snap) => {
          docs.push(snap.data() as ProjectDocument);
        });
        onUpdate(docs);
      },
      (error) => {
        if (!auth.currentUser) {
          console.warn('Firestore subscription closed or user unauthenticated');
          return;
        }
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    if (!auth.currentUser) {
      return () => {};
    }
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}
