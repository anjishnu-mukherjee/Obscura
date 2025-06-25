// Client-safe investigation utility functions

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

// Helper function to get current IST date string
export const getCurrentISTDate = (): string => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

// Helper function to check if a location can be visited today
export const canVisitLocation = (progress: InvestigationProgress, locationId: string): boolean => {
  const today = getCurrentISTDate();
  const locationVisit = progress.visitedLocations[locationId];
  
  if (!locationVisit) return true; // Never visited
  return locationVisit.lastVisitDate !== today; // Can visit if not visited today
};

// Helper function to check if a suspect can be interrogated today
export const canInterrogateSuspect = (progress: InvestigationProgress, suspectName: string): boolean => {
  const today = getCurrentISTDate();
  const suspectInterrogation = progress.interrogatedSuspects[suspectName];
  
  if (!suspectInterrogation) return true; // Never interrogated
  return suspectInterrogation.lastInterrogationDate !== today; // Can interrogate if not done today
}; 