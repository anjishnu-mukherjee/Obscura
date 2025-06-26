// Game database operations for storing generated content
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit as firestoreLimit,
  serverTimestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  StoryStructure, 
  CaseIntro, 
  ProcessedClues, 
  MapStructure 
} from '@/functions/types';
import { deleteImageFromCloudinary } from './cloudinary';

// Interface for tracking daily investigation progress
export interface InvestigationProgress {
  visitedLocations: {
    [locationId: string]: {
      visitedAt: any; // Firestore timestamp
      lastVisitDate: string; // ISO date string for IST
    };
  };
  interrogatedSuspects: {
    [suspectName: string]: {
      interrogatedAt: any; // Firestore timestamp
      lastInterrogationDate: string; // ISO date string for IST
      questionsAsked: string[];
      responses: string[];
    };
  };
  discoveredClues: string[];
  currentDay: number; // Days since case started
}

// Interface for storing complete case data
export interface CaseData {
  id?: string;
  userId: string;
  title: string;
  story: StoryStructure;
  caseIntro: CaseIntro;
  clues: ProcessedClues;
  map: MapStructure;
  mapImageUrl?: string;
  mapImagePublicId?: string; // Cloudinary public ID for deletion
  status: 'active' | 'completed' | 'archived';
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDuration: number; // in minutes
  tags: string[];
  investigationProgress?: InvestigationProgress;
}

// Helper function to get current IST date string (server-side only)
const getCurrentISTDate = (): string => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

// Helper function to check if a location can be visited today (server-side only)
const canVisitLocation = (progress: InvestigationProgress, locationId: string): boolean => {
  const today = getCurrentISTDate();
  const locationVisit = progress.visitedLocations[locationId];
  
  if (!locationVisit) return true; // Never visited
  return locationVisit.lastVisitDate !== today; // Can visit if not visited today
};

// Helper function to check if a suspect can be interrogated today (server-side only)
const canInterrogateSuspect = (progress: InvestigationProgress, suspectName: string): boolean => {
  const today = getCurrentISTDate();
  const suspectInterrogation = progress.interrogatedSuspects[suspectName];
  
  if (!suspectInterrogation) return true; // Never interrogated
  return suspectInterrogation.lastInterrogationDate !== today; // Can interrogate if not done today
};

// Create a new case
export const createCase = async (caseData: Omit<CaseData, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    console.log('Creating new case for user:', caseData.userId);
    console.log(JSON.stringify(caseData, null, 4));
    const caseDataToStore = JSON.parse(JSON.stringify(caseData));
    
    // Initialize investigation progress
    caseDataToStore.investigationProgress = {
      visitedLocations: {},
      interrogatedSuspects: {},
      discoveredClues: [],
      currentDay: 1
    };
    
    const caseRef = await addDoc(collection(db, 'cases'), {
      ...caseDataToStore,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('Case created with ID:', caseRef.id);
    return { caseId: caseRef.id, error: null };
  } catch (error) {
    console.error('Error creating case:', error);
    return { caseId: null, error: 'Failed to create case' };
  }
};

// Update investigation progress
export const updateInvestigationProgress = async (
  caseId: string, 
  progressUpdate: Partial<InvestigationProgress>
) => {
  try {
    console.log('Updating investigation progress for case:', caseId);
    
    const caseRef = doc(db, 'cases', caseId);
    const caseDoc = await getDoc(caseRef);
    
    if (!caseDoc.exists()) {
      return { error: 'Case not found' };
    }
    
    const currentData = caseDoc.data() as CaseData;
    const currentProgress = currentData.investigationProgress || {
      visitedLocations: {},
      interrogatedSuspects: {},
      discoveredClues: [],
      currentDay: 1
    };
    
    // Merge the progress update
    const updatedProgress: InvestigationProgress = {
      ...currentProgress,
      ...progressUpdate,
      visitedLocations: {
        ...currentProgress.visitedLocations,
        ...(progressUpdate.visitedLocations || {})
      },
      interrogatedSuspects: {
        ...currentProgress.interrogatedSuspects,
        ...(progressUpdate.interrogatedSuspects || {})
      },
      discoveredClues: [
        ...currentProgress.discoveredClues,
        ...(progressUpdate.discoveredClues || [])
      ].filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
    };
    
    await updateDoc(caseRef, {
      investigationProgress: updatedProgress,
      updatedAt: serverTimestamp()
    });
    
    console.log('Investigation progress updated successfully');
    return { error: null, progress: updatedProgress };
  } catch (error) {
    console.error('Error updating investigation progress:', error);
    return { error: 'Failed to update investigation progress' };
  }
};

// Visit a location
export const visitLocation = async (caseId: string, locationId: string) => {
  try {
    const today = getCurrentISTDate();
    
    const progressUpdate = {
      visitedLocations: {
        [locationId]: {
          visitedAt: serverTimestamp(),
          lastVisitDate: today
        }
      }
    };
    
    return await updateInvestigationProgress(caseId, progressUpdate);
  } catch (error) {
    console.error('Error visiting location:', error);
    return { error: 'Failed to visit location' };
  }
};

// Interrogate a suspect
export const interrogateSuspect = async (
  caseId: string, 
  suspectName: string, 
  question: string, 
  response: string
) => {
  try {
    const today = getCurrentISTDate();
    
    // Get current progress to append to existing questions/responses
    const caseResult = await getCase(caseId);
    if (caseResult.error || !caseResult.data) {
      return { error: 'Case not found' };
    }
    
    const currentProgress = caseResult.data.investigationProgress || {
      visitedLocations: {},
      interrogatedSuspects: {},
      discoveredClues: [],
      currentDay: 1
    };
    
    const existingInterrogation = currentProgress.interrogatedSuspects[suspectName] || {
      questionsAsked: [],
      responses: []
    };
    
    const progressUpdate = {
      interrogatedSuspects: {
        [suspectName]: {
          interrogatedAt: serverTimestamp(),
          lastInterrogationDate: today,
          questionsAsked: [...existingInterrogation.questionsAsked, question],
          responses: [...existingInterrogation.responses, response]
        }
      }
    };
    
    return await updateInvestigationProgress(caseId, progressUpdate);
  } catch (error) {
    console.error('Error interrogating suspect:', error);
    return { error: 'Failed to interrogate suspect' };
  }
};

// Get a specific case by ID
export const getCase = async (caseId: string) => {
  try {
    console.log('Fetching case:', caseId);
    const caseDoc = await getDoc(doc(db, 'cases', caseId));
    
    if (caseDoc.exists()) {
      console.log('Case found');
      return { data: { id: caseDoc.id, ...caseDoc.data() } as CaseData, error: null };
    }
    
    console.log('Case not found');
    return { data: null, error: 'Case not found' };
  } catch (error) {
    console.error('Error fetching case:', error);
    return { data: null, error: 'Failed to fetch case' };
  }
};

// Get all cases for a user
export const getUserCases = async (userId: string, status?: 'active' | 'completed' | 'archived') => {
  try {
    console.log('Fetching cases for user:', userId);
    console.log('Status filter:', status);
    
    // Build query step by step to handle potential composite index issues
    let q;
    
    if (status) {
      // If status is specified, use both filters
      q = query(
        collection(db, 'cases'),
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else {
      // If no status filter, just use userId and orderBy
      q = query(
        collection(db, 'cases'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }
    
    console.log('Executing query...');
    const querySnapshot = await getDocs(q);
    const cases: CaseData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Found case:', doc.id, 'title:', data.title, 'userId:', data.userId);
      cases.push({ id: doc.id, ...data } as CaseData);
    });
    
    console.log(`Found ${cases.length} cases for user ${userId}`);
    return { cases, error: null };
  } catch (error) {
    console.error('Error fetching user cases:', error);
    console.error('Error details:', error);
    
    // Try a simpler query as fallback
    try {
      console.log('Trying fallback query without orderBy...');
      const fallbackQuery = query(
        collection(db, 'cases'),
        where('userId', '==', userId)
      );
      
      const fallbackSnapshot = await getDocs(fallbackQuery);
      const fallbackCases: CaseData[] = [];
      
      fallbackSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Fallback found case:', doc.id, 'title:', data.title);
        fallbackCases.push({ id: doc.id, ...data } as CaseData);
      });
      
      // Sort manually by createdAt
      fallbackCases.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });
      
      console.log(`Fallback found ${fallbackCases.length} cases`);
      return { cases: fallbackCases, error: null };
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      return { cases: [], error: 'Failed to fetch cases' };
    }
  }
};

// Update a case
export const updateCase = async (caseId: string, updates: Partial<CaseData>) => {
  try {
    console.log('Updating case:', caseId);
    
    await updateDoc(doc(db, 'cases', caseId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log('Case updated successfully');
    return { error: null };
  } catch (error) {
    console.error('Error updating case:', error);
    return { error: 'Failed to update case' };
  }
};

// Delete a case
export const deleteCase = async (caseId: string) => {
  try {
    console.log('Deleting case:', caseId);
    
    await deleteDoc(doc(db, 'cases', caseId));
    
    console.log('Case deleted successfully');
    return { error: null };
  } catch (error) {
    console.error('Error deleting case:', error);
    return { error: 'Failed to delete case' };
  }
};

// Mark case as completed
export const completeCase = async (caseId: string) => {
  try {
    console.log('Marking case as completed:', caseId);
    
    await updateDoc(doc(db, 'cases', caseId), {
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('Case marked as completed');
    return { error: null };
  } catch (error) {
    console.error('Error completing case:', error);
    return { error: 'Failed to complete case' };
  }
};

// Get recent cases (for dashboard)
export const getRecentCases = async (limitCount: number = 5) => {
  try {
    console.log('Fetching recent cases');
    
    const q = query(
      collection(db, 'cases'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const cases: CaseData[] = [];
    
    querySnapshot.forEach((doc) => {
      cases.push({ id: doc.id, ...doc.data() } as CaseData);
    });
    
    console.log(`Found ${cases.length} recent cases`);
    return { cases, error: null };
  } catch (error) {
    console.error('Error fetching recent cases:', error);
    return { cases: [], error: 'Failed to fetch recent cases' };
  }
};

// Search cases by title or tags
export const searchCases = async (userId: string, searchTerm: string) => {
  try {
    console.log('Searching cases with term:', searchTerm);
    
    // Note: Firestore doesn't support full-text search natively
    // This is a simple implementation - for production, consider using Algolia or similar
    const q = query(
      collection(db, 'cases'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const cases: CaseData[] = [];
    
    querySnapshot.forEach((doc) => {
      const caseData = { id: doc.id, ...doc.data() } as CaseData;
      
      // Simple search in title and tags
      const searchLower = searchTerm.toLowerCase();
      if (
        caseData.title.toLowerCase().includes(searchLower) ||
        caseData.tags.some(tag => tag.toLowerCase().includes(searchLower))
      ) {
        cases.push(caseData);
      }
    });
    
    console.log(`Found ${cases.length} matching cases`);
    return { cases, error: null };
  } catch (error) {
    console.error('Error searching cases:', error);
    return { cases: [], error: 'Failed to search cases' };
  }
};

// Get case statistics for a user
export const getUserCaseStats = async (userId: string) => {
  try {
    console.log('Fetching case statistics for user:', userId);
    
    const q = query(
      collection(db, 'cases'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    let totalCases = 0;
    let completedCases = 0;
    let activeCases = 0;
    let totalPlayTime = 0;
    
    querySnapshot.forEach((doc) => {
      const caseData = doc.data() as CaseData;
      totalCases++;
      
      if (caseData.status === 'completed') {
        completedCases++;
      } else if (caseData.status === 'active') {
        activeCases++;
      }
      
      // Add estimated duration to total play time
      totalPlayTime += caseData.estimatedDuration || 0;
    });
    
    const stats = {
      totalCases,
      completedCases,
      activeCases,
      totalPlayTime,
      completionRate: totalCases > 0 ? (completedCases / totalCases) * 100 : 0
    };
    
    console.log('Case statistics calculated:', stats);
    return { stats, error: null };
  } catch (error) {
    console.error('Error fetching case statistics:', error);
    return { stats: null, error: 'Failed to fetch case statistics' };
  }
};

// Delete a case and its associated map image
export const deleteCaseWithImage = async (caseId: string) => {
  try {
    console.log('Deleting case and associated image:', caseId);
    
    // First, get the case to check if it has a map image
    const caseResult = await getCase(caseId);
    if (caseResult.error || !caseResult.data) {
      return { error: 'Case not found' };
    }
    
    const caseData = caseResult.data;
    
    // Delete the map image from Cloudinary if it exists
    if (caseData.mapImagePublicId) {
      try {
        await deleteImageFromCloudinary(caseData.mapImagePublicId);
        console.log('Map image deleted from Cloudinary');
      } catch (imageError) {
        console.error('Failed to delete map image from Cloudinary:', imageError);
        // Continue with case deletion even if image deletion fails
      }
    }
    
    // Delete the case from Firestore
    const result = await deleteCase(caseId);
    
    if (result.error) {
      console.error('Failed to delete case:', result.error);
      return result;
    }
    
    console.log('Case and associated image deleted successfully');
    return { error: null };
    
  } catch (error) {
    console.error('Error deleting case with image:', error);
    return { error: 'Failed to delete case and image' };
  }
}; 