import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/types';
import { auth, db } from '../lib/firebase';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  googleLogin: () => Promise<boolean>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  isLoading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  location: string;
  preferences: Partial<User['preferences']>;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const mapFirebaseToAppUser = async (firebaseUser: FirebaseUser): Promise<User> => {
      // Try Firestore users/{uid}
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        // Create default doc if missing
        await setDoc(userRef, {
          name: firebaseUser.displayName || 'Anonymous User',
          email: firebaseUser.email || `${firebaseUser.uid}@example.com`,
          createdAt: serverTimestamp(),
          preferences: { cuisines: [], spiceLevel: '', budgetRange: '' }
        });
      }
      const data = (await getDoc(userRef)).data() as any;
      const nameFromDoc = data?.name as string | undefined;
      const cuisines: string[] = Array.isArray(data?.preferences?.cuisines) ? data.preferences.cuisines : [];
      const spiceLevelRaw = (data?.preferences?.spiceLevel || 'medium') as string;
      const spiceLevel = ['mild','medium','hot','extra-hot'].includes(spiceLevelRaw) ? spiceLevelRaw as any : 'medium';
      const mappedUser: User = {
        id: firebaseUser.uid,
        name: nameFromDoc || firebaseUser.displayName || 'Anonymous User',
        email: data?.email || firebaseUser.email || `${firebaseUser.uid}@example.com`,
        avatar: firebaseUser.photoURL || undefined,
        preferences: {
          cuisines,
          dietaryRestrictions: [],
          spiceLevel,
          budgetRange: [100, 500],
          mealTimes: ['lunch', 'dinner'],
          allergies: [],
          preferredLanguage: 'en'
        },
        trustScore: 80,
        reviewCount: 0,
        joinDate: new Date().toISOString().split('T')[0],
        location: '',
        favoriteRestaurants: [],
        favoriteDishes: [],
        reviewHistory: [],
        isVerified: true,
        loginMethod: 'google',
        lastActive: new Date().toISOString(),
        engagementScore: 0,
        helpfulVotes: 0,
        photosUploaded: 0,
        followersCount: 0,
        followingCount: 0,
      };
      return mappedUser;
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const mapped = await mapFirebaseToAppUser(firebaseUser);
          setUser(mapped);
          localStorage.setItem('foodietrust_user', JSON.stringify(mapped));
        } else {
          const savedUser = localStorage.getItem('foodietrust_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else {
            setUser(null);
          }
        }
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Ensure users/{uid} exists
      const userRef = doc(db, 'users', cred.user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          name: email.split('@')[0],
          email,
          createdAt: serverTimestamp(),
          preferences: { cuisines: [], spiceLevel: '', budgetRange: '' }
        });
      }
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          name: firebaseUser.displayName || 'Anonymous User',
          email: firebaseUser.email || `${firebaseUser.uid}@example.com`,
          createdAt: serverTimestamp(),
          preferences: { cuisines: [], spiceLevel: '', budgetRange: '' }
        });
      }
      return true;
    } catch (error) {
      console.error('Google login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const userRef = doc(db, 'users', cred.user.uid);
      await setDoc(userRef, {
        name: userData.name,
        email: userData.email,
        createdAt: serverTimestamp(),
        preferences: { cuisines: [], spiceLevel: '', budgetRange: '' }
      });
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    signOut(auth).catch(() => void 0).finally(() => {
      setUser(null);
      localStorage.removeItem('foodietrust_user');
    });
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('foodietrust_user', JSON.stringify(updatedUser));
      return true;
    } catch (error) {
      console.error('Profile update failed:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      googleLogin,
      updateProfile,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};