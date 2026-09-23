import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Sync user profile to Firestore
        try {
          const userRef = doc(db, "users", currentUser.uid);
          await setDoc(
            userRef,
            {
              uid: currentUser.uid,
              displayName: currentUser.displayName || "นักเรียนนักสำรวจ",
              email: currentUser.email || "",
              photoURL: currentUser.photoURL || "",
              lastActive: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (error) {
          console.error("Error updating user document in Firestore:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (error) {
      console.error("Sign-Out Error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
