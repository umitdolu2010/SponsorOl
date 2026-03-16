import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

export type UserRole = 'admin' | 'sponsor' | null;

interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  referenceId?: string | null;
  sponsorStatus?: string | null;
  createdAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (user: User) => {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    let assignedRole: UserRole = null;
    let referenceId: string | null = null;
    let sponsorStatus: string | null = null;

    // Check if user is the default admin
    const isDefaultAdmin = user.email === 'umitdolu2010@gmail.com' && user.emailVerified;
    assignedRole = isDefaultAdmin ? 'admin' : null;

    // If not admin, check if email exists in sponsors
    if (!assignedRole && user.email) {
      const sponsorQuery = query(collection(db, 'sponsors'), where('contactEmail', '==', user.email));
      const sponsorSnapshot = await getDocs(sponsorQuery);
      if (!sponsorSnapshot.empty) {
        const sponsorData = sponsorSnapshot.docs[0].data();
        referenceId = sponsorSnapshot.docs[0].id;
        sponsorStatus = sponsorData.status || null;
        
        if (sponsorStatus === 'active') {
          assignedRole = 'sponsor';
        }
      }
    }

    if (userDoc.exists()) {
      const existingProfile = userDoc.data() as UserProfile;
      // Update role and referenceId in case it changed in the background
      const updatedProfile: UserProfile = {
        ...existingProfile,
        role: assignedRole,
      };
      
      // Only add these fields if they are not null, or explicitly set them to null if they were previously set
      if (referenceId !== null) updatedProfile.referenceId = referenceId;
      else if (existingProfile.referenceId) updatedProfile.referenceId = null;
      
      if (sponsorStatus !== null) updatedProfile.sponsorStatus = sponsorStatus;
      else if (existingProfile.sponsorStatus) updatedProfile.sponsorStatus = null;

      await setDoc(userDocRef, updatedProfile);
      setUserProfile(updatedProfile);
    } else {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        role: assignedRole,
        name: user.displayName || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      
      if (referenceId !== null) newProfile.referenceId = referenceId;
      if (sponsorStatus !== null) newProfile.sponsorStatus = sponsorStatus;

      await setDoc(userDocRef, newProfile);
      setUserProfile(newProfile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser);
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    loginWithGoogle,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
