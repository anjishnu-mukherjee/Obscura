// Authentication utilities and functions
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  AuthError
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

// Custom error messages for better UX
const getErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
};

// Sign up with email and password
export const signUp = async (email: string, password: string, name: string) => {
  try {
    console.log('Starting signup process...');
    
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('User account created:', user.uid);
    
    // Update user profile with name
    await updateProfile(user, {
      displayName: name
    });
    
    console.log('User profile updated');
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      role: 'agent',
      isActive: true,
      profile: {
        avatar: null,
        bio: '',
        location: '',
        preferences: {
          notifications: true,
          theme: 'dark'
        }
      },
      stats: {
        casesCompleted: 0,
        evidenceFound: 0,
        rank: 'Rookie Agent'
      }
    });
    
    console.log('User document created in Firestore');
    
    return { user, error: null };
  } catch (error) {
    console.error('Signup error:', error);
    return { 
      user: null, 
      error: getErrorMessage(error as AuthError) 
    };
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    console.log('Starting signin process...');
    
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      email.toLowerCase().trim(), 
      password
    );
    
    console.log('User signed in:', userCredential.user.uid);
    
    // Update last login timestamp
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log('Last login timestamp updated');
    
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error('Signin error:', error);
    return { 
      user: null, 
      error: getErrorMessage(error as AuthError) 
    };
  }
};

// Sign out
export const logOut = async () => {
  try {
    console.log('Starting logout process...');
    await signOut(auth);
    console.log('User signed out successfully');
    return { error: null };
  } catch (error) {
    console.error('Logout error:', error);
    return { 
      error: getErrorMessage(error as AuthError) 
    };
  }
};

// Reset password
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email.toLowerCase().trim());
    return { error: null };
  } catch (error) {
    console.error('Password reset error:', error);
    return { 
      error: getErrorMessage(error as AuthError) 
    };
  }
};

// Get user data from Firestore
export const getUserData = async (uid: string) => {
  try {
    console.log('Fetching user data for:', uid);
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      console.log('User data found');
      return { data: userDoc.data(), error: null };
    }
    console.log('User data not found');
    return { data: null, error: 'User data not found' };
  } catch (error) {
    console.error('Get user data error:', error);
    return { 
      data: null, 
      error: 'Failed to fetch user data' 
    };
  }
};

// Update user data in Firestore
export const updateUserData = async (uid: string, data: any) => {
  try {
    await setDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { error: null };
  } catch (error) {
    console.error('Update user data error:', error);
    return { 
      error: 'Failed to update user data' 
    };
  }
};

// Check if user exists by email
export const checkUserExists = async (email: string) => {
  try {
    // This is a workaround since Firebase doesn't provide a direct way to check if email exists
    // We'll try to send a password reset email and catch the error
    await sendPasswordResetEmail(auth, email.toLowerCase().trim());
    return { exists: true, error: null };
  } catch (error) {
    const authError = error as AuthError;
    if (authError.code === 'auth/user-not-found') {
      return { exists: false, error: null };
    }
    return { exists: false, error: getErrorMessage(authError) };
  }
};