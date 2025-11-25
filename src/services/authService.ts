
import { auth, db } from "@/integrations/firebase/client";
import { GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

// Define a structure for our user profile
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: "admin" | "student" | "teacher" | "guardian";
  asaasCustomerId?: string; // Field to store the Asaas Customer ID
}

const googleProvider = new GoogleAuthProvider();

/**
 * Handles the Google Sign-In process.
 * After a successful sign-in, it creates a user profile in Firestore.
 */
export const signInWithGoogle = async (): Promise<UserProfile> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    } else {
      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: "student", 
      };
      await setDoc(userRef, newUserProfile);
      return newUserProfile;
    }
  } catch (error) {
    console.error("Error during Google sign-in:", error);
    throw new Error("Failed to sign in with Google.");
  }
};

/**
 * Handles the sign-out process.
 */
export const handleSignOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw new Error("Failed to sign out.");
  }
};

/**
 * Listens for authentication state changes.
 * @param callback - A function to be called whenever the auth state changes.
 * @returns An unsubscribe function.
 */
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};

/**
 * Fetches the user profile from Firestore.
 * @param uid - The user's unique ID.
 * @returns The user profile data or null if not found.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  } else {
    return null;
  }
};

/**
 * Updates the user's Asaas Customer ID in Firestore.
 * @param uid The user's unique ID.
 * @param customerId The Asaas Customer ID.
 */
export const updateUserAsaasId = async (uid: string, customerId: string): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { asaasCustomerId: customerId });
};
