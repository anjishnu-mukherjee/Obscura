import {
  StoryStructure,
  ClueCategory,
  ClueType,
  DiscoveryRequirement,
  ProcessedClues,
  ClueWithTrigger,
  Suspect,
  Witness,
} from "./types";
import { generate } from "./generate";
import { parseUntilJson } from "./parseUntilJson";
import fs from "fs";

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
      return "direct";
    }

    // Check if clue mentions other suspects (potential red herrings)
    const mentionsOtherSuspects = suspects.some(
      (suspect) =>
        suspect !== this.killer &&
        clue.toLowerCase().includes(suspect.toLowerCase())
    );
    if (mentionsOtherSuspects) {
      return "red_herring";
    }

    // Default to indirect if no clear categorization
    return "indirect";
  }

  private determineClueType(clue: string): ClueType {
    const lowerClue = clue.toLowerCase();

    if (
      lowerClue.includes("blood") ||
      lowerClue.includes("dna") ||
      lowerClue.includes("fingerprint")
    ) {
      return "Biological Trace";
    }
    if (
      lowerClue.includes("computer") ||
      lowerClue.includes("log") ||
      lowerClue.includes("camera") ||
      lowerClue.includes("footage")
    ) {
      return "Digital Record";
    }
    if (
      lowerClue.includes("witness") ||
      lowerClue.includes("saw") ||
      lowerClue.includes("heard")
    ) {
      return "Witness Testimony";
    }
    if (
      lowerClue.includes("weather") ||
      lowerClue.includes("temperature") ||
      lowerClue.includes("marks")
    ) {
      return "Environmental Anomaly";
    }
    return "Physical Object";
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
    let requires: DiscoveryRequirement = "observation";

    // Base difficulty on category
    switch (category) {
      case "direct":
        difficulty += 4;
        break;
      case "indirect":
        difficulty += 2;
        break;
      case "red_herring":
        difficulty += 1;
        break;
    }

    // Adjust requirements based on type
    switch (type) {
      case "Biological Trace":
        requires = "forensic_kit";
        difficulty = Math.min(difficulty + 1, 5);
        return {
          requires,
          difficulty,
          requiresItem: "UV Light and Sample Kit",
        };
      case "Digital Record":
        requires = "hack";
        return {
          requires,
          difficulty,
          requiresAction: "Bypass Security",
        };
      case "Witness Testimony":
        requires = "witness_help";
        return {
          requires,
          difficulty,
          requiresWitnessHelp: "Build Trust",
        };
      case "Environmental Anomaly":
        requires = "observation";
        return {
          requires,
          difficulty,
          requiresItem: "Environmental Scanner",
        };
      default:
        requires = "deep_search";
        return {
          requires,
          difficulty,
        };
    }
  }

  private findRelatedSuspects(clue: string): string[] {
    return this.story.suspects
      .filter((suspect) =>
        clue.toLowerCase().includes(suspect.name.toLowerCase())
      )
      .map((suspect) => suspect.name);
  }

  private findTimeRelevance(clue: string): string | undefined {
    const timeEvent = this.story.timeline.find((event) =>
      clue.toLowerCase().includes(event.event.toLowerCase())
    );
    return timeEvent?.time;
  }

  private async generateSuspectClues(
    suspect: Suspect
  ): Promise<ClueWithTrigger[]> {
    const prompt = `You are generating clue triggers for a suspect in a murder investigation. Based on their profile, create 3-5 clues they might reveal during interrogation.

SUSPECT PROFILE:
- Name: ${suspect.name}
- Role: ${suspect.role}
- Personality: ${suspect.personality}
- Alibi: ${suspect.alibi}
- Motives: ${suspect.motives.join(", ")}
- Is Killer: ${suspect.isKiller ? "YES" : "NO"}

CASE CONTEXT:
- Victim: ${this.story.victim.name}
- Setting: ${this.story.setting}
- Other Suspects: ${this.story.suspects
      .filter((s) => s.name !== suspect.name)
      .map((s) => s.name)
      .join(", ")}

INSTRUCTIONS:
Generate clues this suspect might reveal based on different interrogation approaches. Consider:
- If they're the killer: Include some misleading clues (red herrings) and make critical clues very hard to get
- If they're innocent: Include helpful clues but also some nervous/defensive responses
- Personality should affect how they respond to different approaches
- Some clues should be easier to get (gentle approach) while others need pressure

Return ONLY a valid JSON array of clue objects:
[
  {
    "clue": "Specific information they might reveal",
    "triggerType": "pressing" | "gentle" | "aggressive" | "sympathetic" | "specific_question",
    "triggerLevel": 1-5,
    "triggerDescription": "What exactly needs to be done to trigger this",
    "isRedHerring": true/false,
    "importance": "critical" | "important" | "minor"
  }
]

If you are using special characters in any of the fields, make sure to escape them. For example, if you are using a quote, you should escape it with a backslash.

Generate 3-5 varied clues with different trigger types and levels.`;

    try {
      const result = await generate(prompt);
      const cleanedResult = result.trim();
      const clues: Omit<ClueWithTrigger, "revealed">[] = parseUntilJson(
        cleanedResult
      ) as Omit<ClueWithTrigger, "revealed">[];

      return clues.map((clue) => ({
        ...clue,
        revealed: false,
      }));
    } catch (error) {
      console.error("Error generating suspect clues:", error);
      // Fallback clues
      return [
        {
          clue: `${suspect.name} mentioned something during questioning`,
          triggerType: "pressing" as const,
          triggerLevel: 3,
          triggerDescription: "Ask direct questions about their whereabouts",
          isRedHerring: suspect.isKiller,
          importance: "minor" as const,
          revealed: false,
        },
      ];
    }
  }

  private async generateWitnessClues(
    witness: Witness,
    location: string
  ): Promise<ClueWithTrigger[]> {
    const prompt = `You are generating clue triggers for a witness in a murder investigation. Based on their profile, create 2-4 clues they might reveal during questioning.

WITNESS PROFILE:
- Name: ${witness.name}
- Role: ${witness.role}
- Background: ${witness.background}
- Reliability: ${witness.reliability}
- Hidden Agenda: ${witness.hiddenAgenda}
- Location: ${location}

CASE CONTEXT:
- Victim: ${this.story.victim.name}
- Setting: ${this.story.setting}
- Suspects: ${this.story.suspects.map((s) => s.name).join(", ")}

INSTRUCTIONS:
Generate clues this witness might reveal based on different approaches. Consider:
- Their reliability affects clue quality
- Hidden agenda might make them withhold or distort information
- Some witnesses need sympathy, others respond to authority
- Location context should influence what they might have seen/heard

Return ONLY a valid JSON array of clue objects:
[
  {
    "clue": "Specific information they might reveal",
    "triggerType": "pressing" | "gentle" | "aggressive" | "sympathetic" | "specific_question",
    "triggerLevel": 1-5,
    "triggerDescription": "What exactly needs to be done to trigger this",
    "isRedHerring": true/false,
    "importance": "critical" | "important" | "minor"
  }
]

If you are using special characters in any of the fields, make sure to escape them. For example, if you are using a quote, you should escape it with a backslash.

Generate 2-4 varied clues with different trigger types and levels.`;

    try {
      const result = await generate(prompt);
      const cleanedResult = result.trim();

      const clues: Omit<ClueWithTrigger, "revealed">[] = parseUntilJson(
        cleanedResult
      ) as Omit<ClueWithTrigger, "revealed">[];

      return clues.map((clue) => ({
        ...clue,
        revealed: false,
      }));
    } catch (error) {
      console.error("Error generating witness clues:", error);
      // Fallback clues
      return [
        {
          clue: `${witness.name} saw something at ${location}`,
          triggerType: "sympathetic" as const,
          triggerLevel: 2,
          triggerDescription:
            "Build trust and ask gently about what they witnessed",
          isRedHerring: false,
          importance: "minor" as const,
          revealed: false,
        },
      ];
    }
  }

  public async generateProcessedClues(): Promise<ProcessedClues> {
    const processedClues: ProcessedClues = {};
    const suspectNames = this.story.suspects.map((s) => s.name);

    // Process location-based clues
    for (const location of this.story.locations) {
      const locationClues = this.story.clues[location] || [];

      processedClues[location] = locationClues.map((clue) => {
        const category = this.categorizeClue(clue, location, suspectNames);
        const type = this.determineClueType(clue);
        const discovery = this.assignDiscoveryRequirements(
          clue,
          category,
          type
        );
        const relatedSuspects = this.findRelatedSuspects(clue);
        const timeRelevance = this.findTimeRelevance(clue);

        return {
          type,
          content: clue,
          discovery,
          category,
          relatedSuspects,
          timeRelevance,
          locationContext: location,
        };
      });

      // Add witness testimonies as clues if available
      const locationWitnesses = this.story.witnesses?.[location] || [];
      const witnessClues = locationWitnesses.map((witness) => {
        const category = this.categorizeClue(
          witness.testimony,
          location,
          suspectNames
        );
        return {
          type: "Witness Testimony" as ClueType,
          content: witness.testimony,
          discovery: {
            requires: "witness_help" as DiscoveryRequirement,
            difficulty: category === "direct" ? 5 : 3,
            requiresWitnessHelp: `Gain ${witness.name}'s trust (${witness.reliability})`,
          },
          category,
          relatedSuspects: this.findRelatedSuspects(witness.testimony),
          timeRelevance: this.findTimeRelevance(witness.testimony),
          locationContext: location,
          witnessInfo: {
            name: witness.name,
            reliability: witness.reliability,
            hiddenAgenda: witness.hiddenAgenda,
          },
        };
      });

      processedClues[location] = [...processedClues[location], ...witnessClues];
    }

    return processedClues;
  }

  /**
   * Generates an enhanced story with clue triggers for suspects and witnesses
   */
  public async generateEnhancedStory(): Promise<StoryStructure> {
    const enhancedStory = { ...this.story };

    // Generate clue triggers for each suspect
    console.log("Generating clue triggers for suspects...");
    for (let i = 0; i < enhancedStory.suspects.length; i++) {
      try {
        const cluesTriggers = await this.generateSuspectClues(
          enhancedStory.suspects[i]
        );
        enhancedStory.suspects[i] = {
          ...enhancedStory.suspects[i],
          cluesTriggers,
        };
        console.log(
          `Generated ${cluesTriggers.length} clue triggers for ${enhancedStory.suspects[i].name}`
        );
      } catch (error) {
        console.error(
          `Error generating clues for suspect ${enhancedStory.suspects[i].name}:`,
          error
        );
      }
    }

    // Generate clue triggers for each witness
    console.log("Generating clue triggers for witnesses...");
    fs.writeFileSync("enhancedStory.json", JSON.stringify(enhancedStory, null, 2));
    if (
      enhancedStory.witnesses &&
      Object.keys(enhancedStory.witnesses).length > 0
    ) {
      for (const location of Object.keys(enhancedStory.witnesses)) {
        const witnesses = enhancedStory.witnesses[location];
        for (let i = 0; i < witnesses.length; i++) {
          try {
            const cluesTriggers = await this.generateWitnessClues(
              witnesses[i],
              location
            );
            enhancedStory.witnesses[location][i] = {
              ...witnesses[i],
              cluesTriggers,
            };
            console.log(
              `Generated ${cluesTriggers.length} clue triggers for witness ${witnesses[i].name} at ${location}`
            );
          } catch (error) {
            console.error(
              `Error generating clues for witness ${witnesses[i].name}:`,
              error
            );
          }
        }
      }
    }

    return enhancedStory;
  }
}

export async function generateGameClues(
  story: StoryStructure
): Promise<ProcessedClues> {
  const generator = new ClueGenerator(story);
  return generator.generateProcessedClues();
}

/**
 * Generates an enhanced story with AI-generated clue triggers for suspects and witnesses
 */
export async function generateEnhancedStoryWithTriggers(
  story: StoryStructure
): Promise<StoryStructure> {
  const generator = new ClueGenerator(story);
  return generator.generateEnhancedStory();
}

// Example usage:
// import { generateStory } from './storyGenerator';
// const story = await generateStory();
// import * as fs from 'fs';
// const story = JSON.parse(fs.readFileSync('story.json', 'utf8'));
// const gameClues = generateGameClues(story as StoryStructure);
// console.log(JSON.stringify(gameClues, null, 2));
