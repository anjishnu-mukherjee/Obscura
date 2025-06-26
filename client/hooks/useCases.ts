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