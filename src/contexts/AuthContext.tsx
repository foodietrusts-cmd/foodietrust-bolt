import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/types';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

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
    // Prefer Firebase auth state; fall back to any stored session if present
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const mappedUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Anonymous User',
          email: firebaseUser.email || `${firebaseUser.uid}@example.com`,
          avatar: firebaseUser.photoURL || undefined,
          preferences: {
            cuisines: [],
            dietaryRestrictions: [],
            spiceLevel: 'medium',
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
        setUser(mappedUser);
        localStorage.setItem('foodietrust_user', JSON.stringify(mappedUser));
      } else {
        const savedUser = localStorage.getItem('foodietrust_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data - in real app, this would come from API
      const mockUser: User = {
        id: '1',
        name: 'Food Lover',
        email,
        trustScore: 85,
        reviewCount: 23,
        joinDate: '2024-01-15',
        location: 'Mumbai, India',
        favoriteRestaurants: [],
        favoriteDishes: [],
        reviewHistory: [],
        isVerified: true,
        preferences: {
          cuisines: ['Indian', 'Italian'],
          dietaryRestrictions: [],
          spiceLevel: 'medium',
          budgetRange: [100, 500],
          mealTimes: ['lunch', 'dinner'],
          allergies: [],
          preferredLanguage: 'en'
        }
      };

      setUser(mockUser);
      localStorage.setItem('foodietrust_user', JSON.stringify(mockUser));
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
      const mappedUser: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Anonymous User',
        email: firebaseUser.email || `${firebaseUser.uid}@example.com`,
        avatar: firebaseUser.photoURL || undefined,
        preferences: {
          cuisines: [],
          dietaryRestrictions: [],
          spiceLevel: 'medium',
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
      setUser(mappedUser);
      localStorage.setItem('foodietrust_user', JSON.stringify(mappedUser));
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        trustScore: 50, // Starting trust score
        reviewCount: 0,
        joinDate: new Date().toISOString().split('T')[0],
        location: userData.location,
        favoriteRestaurants: [],
        favoriteDishes: [],
        reviewHistory: [],
        isVerified: false,
        preferences: {
          cuisines: userData.preferences.cuisines || [],
          dietaryRestrictions: userData.preferences.dietaryRestrictions || [],
          spiceLevel: userData.preferences.spiceLevel || 'medium',
          budgetRange: userData.preferences.budgetRange || [100, 500],
          mealTimes: userData.preferences.mealTimes || ['lunch', 'dinner'],
          allergies: userData.preferences.allergies || [],
          preferredLanguage: userData.preferences.preferredLanguage || 'en'
        }
      };

      setUser(newUser);
      localStorage.setItem('foodietrust_user', JSON.stringify(newUser));
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