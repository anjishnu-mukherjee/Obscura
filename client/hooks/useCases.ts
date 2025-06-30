import { useState, useEffect } from 'react';

// Define CaseData interface locally to avoid server imports
export interface CaseData {
  id?: string;
  userId: string;
  title: string;
  story: any;
  caseIntro: any;
  clues: any;
  map: any;
  mapImageUrl?: string;
  mapImagePublicId?: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDuration: number;
  tags: string[];
  investigationProgress?: any;
  verdictSubmitted?: boolean;
  verdict?: {
    selectedSuspect: string;
    reasoning: string;
    isCorrect: boolean;
    score: number;
    submittedAt: any;
    correctSuspect: string;
    aiAnalysis?: any;
  };
}

export interface UserStats {
  casesCompleted: number;
  evidenceFound: number;
  rank: string;
  totalCases: number;
  activeCases: number;
  locationsVisited: number;
  suspectsInterrogated: number;
  averageProgress: number;
}

export const useCases = (userId?: string, limit?: number) => {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = async () => {
    if (!userId) {
      console.log('useCases: No userId provided');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const url = `/api/cases/user/${userId}${limit ? `?limit=${limit}` : ''}`;
      console.log('useCases: Fetching from URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('useCases: API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch cases');
      }
      
      const result = await response.json();
      console.log('useCases: API result:', result);
      
      if (result.success) {
        console.log('useCases: Setting cases:', result.cases);
        setCases(result.cases);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cases';
      console.error('useCases: Error:', errorMessage, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useCases: useEffect triggered, userId:', userId, 'limit:', limit);
    if (userId) {
      fetchCases();
    }
  }, [userId, limit]);

  return {
    cases,
    loading,
    error,
    refetch: fetchCases
  };
};

export const useUserStats = (userId?: string) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateStats = (cases: CaseData[]): UserStats => {
    const totalCases = cases.length;
    const completedCases = cases.filter(c => c.status === 'completed').length;
    const activeCases = cases.filter(c => c.status === 'active').length;
    
    let totalEvidenceFound = 0;
    let totalLocationsVisited = 0;
    let totalSuspectsInterrogated = 0;
    let totalProgress = 0;
    
    cases.forEach(caseData => {
      const progress = caseData.investigationProgress;
      if (progress) {
        // Count evidence (discovered clues across all locations + general discovered clues)
        const locationClues = Object.values(progress.visitedLocations || {})
          .reduce((sum: number, loc: any) => sum + (loc.discoveredClues?.length || 0), 0);
        const generalClues = progress.discoveredClues?.length || 0;
        totalEvidenceFound += locationClues + generalClues;
        
        // Count locations visited
        totalLocationsVisited += Object.keys(progress.visitedLocations || {}).length;
        
        // Count suspects interrogated
        totalSuspectsInterrogated += Object.keys(progress.interrogatedSuspects || {}).length;
        
        // Calculate case progress (same logic as in dashboard)
        const caseProgress = calculateCaseProgress(caseData);
        totalProgress += caseProgress;
      }
    });
    
    const averageProgress = totalCases > 0 ? Math.round(totalProgress / totalCases) : 0;
    
    // Determine rank based on completed cases and evidence found
    let rank = 'Rookie Agent';
    if (completedCases >= 10 && totalEvidenceFound >= 100) {
      rank = 'Master Detective';
    } else if (completedCases >= 5 && totalEvidenceFound >= 50) {
      rank = 'Senior Detective';
    } else if (completedCases >= 3 && totalEvidenceFound >= 25) {
      rank = 'Detective';
    } else if (completedCases >= 1 && totalEvidenceFound >= 10) {
      rank = 'Junior Detective';
    }
    
    return {
      casesCompleted: completedCases,
      evidenceFound: totalEvidenceFound,
      rank,
      totalCases,
      activeCases,
      locationsVisited: totalLocationsVisited,
      suspectsInterrogated: totalSuspectsInterrogated,
      averageProgress
    };
  };

  const calculateCaseProgress = (caseData: CaseData): number => {
    if (caseData.status === 'completed') return 100;
    
    const progress = caseData.investigationProgress;
    if (!progress) return 0;
    
    // Calculate progress based on locations visited, suspects interrogated, and clues discovered
    const totalLocations = Object.keys(caseData.map?.locations || {}).length;
    const totalSuspects = caseData.story?.characters?.suspects?.length || caseData.story?.suspects?.length || 0;
    const totalClues = Object.keys(caseData.clues?.processed || caseData.clues || {}).length;
    
    const visitedLocations = Object.keys(progress.visitedLocations || {}).length;
    const interrogatedSuspects = Object.keys(progress.interrogatedSuspects || {}).length;
    const discoveredClues = progress.discoveredClues?.length || 0;
    
    const locationProgress = totalLocations > 0 ? (visitedLocations / totalLocations) * 40 : 0;
    const suspectProgress = totalSuspects > 0 ? (interrogatedSuspects / totalSuspects) * 40 : 0;
    const clueProgress = totalClues > 0 ? (discoveredClues / totalClues) * 20 : 0;
    
    return Math.min(100, Math.round(locationProgress + suspectProgress + clueProgress));
  };

  const fetchStats = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all cases for the user to calculate stats
      const response = await fetch(`/api/cases/user/${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch cases for stats');
      }
      
      const result = await response.json();
      
      if (result.success) {
        const calculatedStats = calculateStats(result.cases);
        setStats(calculatedStats);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate stats';
      setError(errorMessage);
      console.error('useUserStats: Error:', errorMessage, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

export const useCase = (caseId?: string) => {
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCase = async () => {
    if (!caseId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/case/${caseId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Case not found');
      }
      
      const result = await response.json();
      
      if (result.success && result.case) {
        setCaseData(result.case);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch case');
      console.error('Error fetching case:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      fetchCase();
    }
  }, [caseId]);

  return {
    caseData,
    loading,
    error,
    refetch: fetchCase
  };
}; 