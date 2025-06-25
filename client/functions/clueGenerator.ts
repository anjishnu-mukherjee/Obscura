import { StoryStructure, ClueCategory, ClueType, DiscoveryRequirement, ProcessedClues } from './types';

class ClueGenerator {
    private story: StoryStructure;
    private killer: string;

    constructor(story: StoryStructure) {
        this.story = story;
        this.killer = story.killer;
    }

    private categorizeClue(
        clue: string,
        location: string,
        suspects: string[]
    ): ClueCategory {
        // Check if clue directly mentions the killer or their unique attributes
        if (clue.toLowerCase().includes(this.killer.toLowerCase())) {
            return 'direct';
        }

        // Check if clue mentions other suspects (potential red herrings)
        const mentionsOtherSuspects = suspects.some(suspect => 
            suspect !== this.killer && clue.toLowerCase().includes(suspect.toLowerCase())
        );
        if (mentionsOtherSuspects) {
            return 'red_herring';
        }

        // Default to indirect if no clear categorization
        return 'indirect';
    }

    private determineClueType(clue: string): ClueType {
        const lowerClue = clue.toLowerCase();
        
        if (lowerClue.includes('blood') || lowerClue.includes('dna') || lowerClue.includes('fingerprint')) {
            return 'Biological Trace';
        }
        if (lowerClue.includes('computer') || lowerClue.includes('log') || lowerClue.includes('camera') || lowerClue.includes('footage')) {
            return 'Digital Record';
        }
        if (lowerClue.includes('witness') || lowerClue.includes('saw') || lowerClue.includes('heard')) {
            return 'Witness Testimony';
        }
        if (lowerClue.includes('weather') || lowerClue.includes('temperature') || lowerClue.includes('marks')) {
            return 'Environmental Anomaly';
        }
        return 'Physical Object';
    }

    private assignDiscoveryRequirements(
        clue: string,
        category: ClueCategory,
        type: ClueType
    ): {
        requires: DiscoveryRequirement;
        difficulty: number;
        requiresItem?: string;
        requiresAction?: string;
        requiresWitnessHelp?: string;
    } {
        let difficulty = 1;
        let requires: DiscoveryRequirement = 'observation';

        // Base difficulty on category
        switch (category) {
            case 'direct':
                difficulty += 4;
                break;
            case 'indirect':
                difficulty += 2;
                break;
            case 'red_herring':
                difficulty += 1;
                break;
        }

        // Adjust requirements based on type
        switch (type) {
            case 'Biological Trace':
                requires = 'forensic_kit';
                difficulty = Math.min(difficulty + 1, 5);
                return {
                    requires,
                    difficulty,
                    requiresItem: 'UV Light and Sample Kit'
                };
            case 'Digital Record':
                requires = 'hack';
                return {
                    requires,
                    difficulty,
                    requiresAction: 'Bypass Security'
                };
            case 'Witness Testimony':
                requires = 'witness_help';
                return {
                    requires,
                    difficulty,
                    requiresWitnessHelp: 'Build Trust'
                };
            case 'Environmental Anomaly':
                requires = 'observation';
                return {
                    requires,
                    difficulty,
                    requiresItem: 'Environmental Scanner'
                };
            default:
                requires = 'deep_search';
                return {
                    requires,
                    difficulty
                };
        }
    }

    private findRelatedSuspects(clue: string): string[] {
        return this.story.suspects
            .filter(suspect => clue.toLowerCase().includes(suspect.name.toLowerCase()))
            .map(suspect => suspect.name);
    }

    private findTimeRelevance(clue: string): string | undefined {
        const timeEvent = this.story.timeline.find(event => 
            clue.toLowerCase().includes(event.event.toLowerCase())
        );
        return timeEvent?.time;
    }

    public generateProcessedClues(): ProcessedClues {
        const processedClues: ProcessedClues = {};
        const suspectNames = this.story.suspects.map(s => s.name);

        // Process location-based clues
        for (const location of this.story.locations) {
            const locationClues = this.story.clues[location] || [];
            
            processedClues[location] = locationClues.map(clue => {
                const category = this.categorizeClue(clue, location, suspectNames);
                const type = this.determineClueType(clue);
                const discovery = this.assignDiscoveryRequirements(clue, category, type);
                const relatedSuspects = this.findRelatedSuspects(clue);
                const timeRelevance = this.findTimeRelevance(clue);

                return {
                    type,
                    content: clue,
                    discovery,
                    category,
                    relatedSuspects,
                    timeRelevance,
                    locationContext: location
                };
            });

            // Add witness testimonies as clues if available
            const locationWitnesses = this.story.witnesses?.[location] || [];
            const witnessClues = locationWitnesses.map(witness => {
                const category = this.categorizeClue(witness.testimony, location, suspectNames);
                return {
                    type: 'Witness Testimony' as ClueType,
                    content: witness.testimony,
                    discovery: {
                        requires: 'witness_help' as DiscoveryRequirement,
                        difficulty: category === 'direct' ? 5 : 3,
                        requiresWitnessHelp: `Gain ${witness.name}'s trust (${witness.reliability})`
                    },
                    category,
                    relatedSuspects: this.findRelatedSuspects(witness.testimony),
                    timeRelevance: this.findTimeRelevance(witness.testimony),
                    locationContext: location,
                    witnessInfo: {
                        name: witness.name,
                        reliability: witness.reliability,
                        hiddenAgenda: witness.hiddenAgenda
                    }
                };
            });

            processedClues[location] = [...processedClues[location], ...witnessClues];
        }

        return processedClues;
    }
}

export async function generateGameClues(story: StoryStructure): Promise<ProcessedClues> {
    const generator = new ClueGenerator(story);
    return generator.generateProcessedClues();
}

// Example usage:
// import { generateStory } from './storyGenerator';
// const story = await generateStory();
// import * as fs from 'fs';   
// const story = JSON.parse(fs.readFileSync('story.json', 'utf8'));
// const gameClues = generateGameClues(story as StoryStructure);
// console.log(JSON.stringify(gameClues, null, 2)); 