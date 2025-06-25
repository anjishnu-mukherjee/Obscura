// Case generation and storage helper
import { createCase, CaseData } from './gameDb';
import { 
  StoryStructure, 
  CaseIntro, 
  ProcessedClues, 
  MapStructure 
} from '@/functions/types';

// Import your generation functions (you'll need to adjust these paths based on your actual file structure)
// import { generateStory } from '@/functions/storyGenerator';
// import { generateCaseIntro } from '@/functions/caseIntroComposer';
// import { generateClues } from '@/functions/clueGenerator';
// import { generateMap } from '@/functions/mapGenerator';

export interface CaseGenerationOptions {
  userId: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDuration: number;
  tags: string[];
}

export interface GeneratedCaseData {
  story: StoryStructure;
  caseIntro: CaseIntro;
  clues: ProcessedClues;
  map: MapStructure;
  mapImageUrl?: string;
  mapImagePublicId?: string;
}

// Generate and store a complete case
export const generateAndStoreCase = async (
  options: CaseGenerationOptions,
  generatedData: GeneratedCaseData
): Promise<{ caseId: string | null; error: string | null }> => {
  try {
    console.log('Starting case generation and storage for user:', options.userId);
    
    // Create the case data object
    console.log(JSON.stringify(generatedData, null, 4));
    const caseData: Omit<CaseData, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: options.userId,
      title: options.title,
      story: generatedData.story,
      caseIntro: generatedData.caseIntro,
      clues: generatedData.clues,
      map: generatedData.map,
      mapImageUrl: generatedData.mapImageUrl,
      mapImagePublicId: generatedData.mapImagePublicId,
      status: 'active',
      difficulty: options.difficulty,
      estimatedDuration: options.estimatedDuration,
      tags: options.tags
    };
    
    // Store the case in Firebase
    const result = await createCase(caseData);
    
    if (result.error) {
      console.error('Failed to store case:', result.error);
      return { caseId: null, error: result.error };
    }
    
    console.log('Case generated and stored successfully with ID:', result.caseId);
    return { caseId: result.caseId, error: null };
    
  } catch (error) {
    console.error('Error in generateAndStoreCase:', error);
    return { caseId: null, error: 'Failed to generate and store case' };
  }
};

// Helper function to generate a case title based on the story
export const generateCaseTitle = (story: StoryStructure): string => {
  const victimName = story.victim.name;
  const location = story.setting.split(',')[0]; // Get the main location
  const profession = story.victim.profession;
  
  return `The ${profession} of ${location}: ${victimName}'s Case`;
};

// Helper function to estimate case duration based on complexity
export const estimateCaseDuration = (
  difficulty: 'easy' | 'medium' | 'hard',
  clueCount: number,
  suspectCount: number
): number => {
  const baseTime = {
    easy: 15,
    medium: 30,
    hard: 45
  };
  
  const clueMultiplier = 2; // 2 minutes per clue
  const suspectMultiplier = 3; // 3 minutes per suspect
  
  return baseTime[difficulty] + (clueCount * clueMultiplier) + (suspectCount * suspectMultiplier);
};

// Helper function to generate tags based on case content
export const generateCaseTags = (story: StoryStructure): string[] => {
  const tags: string[] = [];
  
  // Add profession-based tags
  tags.push(story.victim.profession.toLowerCase());
  
  // Add location-based tags
  const location = story.setting.split(',')[0].toLowerCase();
  tags.push(location);
  
  // Add cause of death tags
  const cause = story.victim.causeOfDeath.toLowerCase();
  if (cause.includes('poison')) tags.push('poisoning');
  if (cause.includes('gun')) tags.push('firearms');
  if (cause.includes('knife') || cause.includes('stab')) tags.push('stabbing');
  if (cause.includes('blunt')) tags.push('blunt-force');
  if (cause.includes('strangulation')) tags.push('strangulation');
  
  // Add difficulty tags
  tags.push(story.suspects.length > 3 ? 'complex' : 'simple');
  
  // Add unique tags
  tags.push('mystery', 'investigation', 'detective');
  
  return [...new Set(tags)]; // Remove duplicates
}; 