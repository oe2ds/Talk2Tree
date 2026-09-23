import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { ChatMessage, TreeNote } from "../types";

/**
 * Listen to chat messages for a specific tree for the current user
 */
export function subscribeToTreeMessages(
  userId: string,
  treeId: string,
  callback: (messages: ChatMessage[]) => void
) {
  const messagesCol = collection(db, "users", userId, "messages");
  const q = query(
    messagesCol,
    where("treeId", "==", treeId),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: ChatMessage[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp,
          treeId: data.treeId,
          userId: data.userId,
        };
      });
      callback(msgs);
    },
    (err) => {
      console.error(`Error subscribing to messages for tree ${treeId}:`, err);
    }
  );
}

/**
 * Save a chat message to Firestore
 */
export async function saveChatMessage(
  userId: string,
  message: Omit<ChatMessage, "id">
) {
  try {
    const messagesCol = collection(db, "users", userId, "messages");
    await addDoc(messagesCol, {
      ...message,
      userId,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving chat message to Firestore:", error);
  }
}

/**
 * Clear all messages for a specific tree
 */
export async function clearTreeMessages(userId: string, treeId: string) {
  // We can delete messages or start fresh; typically we query them and batch/individual delete
  // Or in chat, resetting just lets new ones flow
}

/**
 * Listen to user's botanical notes
 */
export function subscribeToUserNotes(
  userId: string,
  callback: (notes: TreeNote[]) => void
) {
  const notesCol = collection(db, "users", userId, "notes");
  const q = query(notesCol, orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const notes: TreeNote[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          treeId: data.treeId,
          treeName: data.treeName,
          treeIcon: data.treeIcon,
          note: data.note,
          createdAt: data.createdAt?.toDate?.()?.toLocaleString("th-TH") || new Date().toLocaleString("th-TH"),
        };
      });
      callback(notes);
    },
    (err) => {
      console.error("Error subscribing to user notes:", err);
    }
  );
}

/**
 * Save a field note for a tree
 */
export async function saveTreeNote(
  userId: string,
  treeId: string,
  treeName: string,
  treeIcon: string,
  noteText: string
) {
  const notesCol = collection(db, "users", userId, "notes");
  await addDoc(notesCol, {
    userId,
    treeId,
    treeName,
    treeIcon,
    note: noteText,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a field note
 */
export async function deleteTreeNote(userId: string, noteId: string) {
  const noteRef = doc(db, "users", userId, "notes", noteId);
  await deleteDoc(noteRef);
}

/**
 * Subscribe to favorite trees
 */
export function subscribeToFavorites(
  userId: string,
  callback: (favoriteTreeIds: string[]) => void
) {
  const favsCol = collection(db, "users", userId, "favorites");
  return onSnapshot(
    favsCol,
    (snapshot) => {
      const ids = snapshot.docs.map((d) => d.id);
      callback(ids);
    },
    (err) => {
      console.error("Error subscribing to favorites:", err);
    }
  );
}

/**
 * Toggle favorite tree
 */
export async function toggleFavoriteTree(
  userId: string,
  treeId: string,
  isFavorite: boolean
) {
  const favRef = doc(db, "users", userId, "favorites", treeId);
  if (isFavorite) {
    await deleteDoc(favRef);
  } else {
    await setDoc(favRef, {
      userId,
      treeId,
      favoritedAt: serverTimestamp(),
    });
  }
}

/**
 * Save user's preferred conversational name to Firestore profile
 */
export async function saveUserPreferredName(
  userId: string,
  preferredName: string
) {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        preferredName,
        lastActive: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Error saving preferred name to Firestore:", err);
  }
}

/**
 * Retrieve user's preferred conversational name from Firestore profile
 */
export async function getUserPreferredName(
  userId: string
): Promise<string | null> {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data()?.preferredName || null;
    }
  } catch (err) {
    console.error("Error getting preferred name from Firestore:", err);
  }
  return null;
}
