// Custom hook for authentication state management
import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserData } from '@/lib/auth';

interface UserData {
  name: string;
  email: string;
  role: string;
  createdAt: any;
  updatedAt: any;
  lastLoginAt?: any;
  isActive: boolean;
  profile: {
    avatar: string | null;
    bio: string;
    location: string;
    preferences: {
      notifications: boolean;
      theme: string;
    };
  };
  stats: {
    casesCompleted: number;
    evidenceFound: number;
    rank: string;
  };
}

interface AuthState {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userData: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      
      if (user) {
        try {
          const result = await getUserData(user.uid);
          if (result.error) {
            console.error('Error fetching user data:', result.error);
            setAuthState({
              user,
              userData: null,
              loading: false,
              error: result.error
            });
          } else {
            console.log('User data loaded successfully');
            setAuthState({
              user,
              userData: result.data as UserData,
              loading: false,
              error: null
            });
          }
        } catch (error) {
          console.error('Auth state error:', error);
          setAuthState({
            user,
            userData: null,
            loading: false,
            error: 'Failed to load user data'
          });
        }
      } else {
        setAuthState({
          user: null,
          userData: null,
          loading: false,
          error: null
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return authState;
};