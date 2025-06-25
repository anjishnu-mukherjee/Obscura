import { StoryStructure, CaseIntro, DisplayData } from './types';
import { generate } from './generate';


function determineNarrativeStyle(setting: string): string {
    const lowerSetting = setting.toLowerCase();
    if (lowerSetting.includes('space') || lowerSetting.includes('mars') || lowerSetting.includes('colony')) {
        return 'sci-fi';
    }
    if (lowerSetting.includes('manor') || lowerSetting.includes('mansion') || lowerSetting.includes('estate')) {
        return 'gothic';
    }
    if (lowerSetting.includes('island') || lowerSetting.includes('resort')) {
        return 'tropical noir';
    }
    return 'noir';
}

function selectInitialSuspects(suspects: StoryStructure['suspects'], killer: string): string[] {
    // Always include the killer
    const killerSuspect = suspects.find(s => s.name === killer)!;
    
    // Select 2 more suspects with strong motives
    const otherSuspects = suspects
        .filter(s => s.name !== killer)
        .sort((a, b) => b.motives.length - a.motives.length)
        .slice(0, 2);

    console.log()

    return [killerSuspect, ...otherSuspects].map(s => s.name);
}

async function generateIntroNarrative(
    story: StoryStructure,
    style: string,
    initialSuspects: string[],
    playerName?: string,
    gameDifficulty?: string
): Promise<string> {
    const suspectDetails = initialSuspects.map(name => {
        const suspect = story.suspects.find(s => s.name === name)!;
        return {
            name: suspect.name,
            role: suspect.role,
            alibi: suspect.alibi,
            personality: suspect.personality
        };
    });

    const earlyEvents = story.timeline
        .filter(event => event.time < story.victim.deathTimeEstimate)
        .slice(-2);

    // Adjust complexity based on difficulty
    const complexityLevel = gameDifficulty ? {
        easy: "Keep language straightforward and clues obvious. Focus on clear connections.",
        medium: "Use moderate complexity in language and clue presentation. Balance obvious and subtle hints.",
        hard: "Use sophisticated language and complex narrative layers. Embed subtle clues and misdirections."
    }[gameDifficulty.toLowerCase()] : "Use moderate complexity in language and clue presentation.";

    const prompt = `Create a compelling ${style} detective story introduction for a murder mystery with these details:

Setting: ${story.setting}
Victim: ${story.victim.name}, a ${story.victim.profession}
Time of Death: ${story.victim.deathTimeEstimate}
Cause of Death: ${story.victim.causeOfDeath}
Last Known Location: ${story.victim.lastKnownLocation}
${playerName ? `Investigator: Detective ${playerName}` : ''}

Key Suspects:
${suspectDetails.map(s => `- ${s.name} (${s.role}): ${s.personality}. Claims: ${s.alibi}`).join('\n')}

Important Earlier Events:
${earlyEvents.map(e => `${e.time}: ${e.event}`).join('\n')}

Requirements:
1. Write 3-5 paragraphs in ${style} style
2. Start with a strong atmospheric opening about the setting and crime
3. Introduce the victim's death with intrigue (hint at their work or secrets)
4. Mention the key suspects with subtle hints about their possible involvement
5. End with a sense of urgency or impending complications
6. Use rich, sensory language appropriate to the setting
7. Don't reveal who the killer is
8. Include specific details from the timeline and setting
${playerName ? `9. Address the narrative to Detective ${playerName} where appropriate` : ''}

Complexity Level: ${complexityLevel}

The narrative should be gripping and cinematic, like an opening cutscene in a detective game.`;

    return await generate(prompt);
}

async function generateJournalEntry(
    story: StoryStructure,
    style: string,
    playerName?: string,
    gameDifficulty?: string
): Promise<string> {
    // Adjust urgency and complexity based on difficulty
    const difficultyModifier = gameDifficulty ? {
        easy: "You have plenty of time to investigate thoroughly.",
        medium: "Time is limited, but manageable.",
        hard: "Time is critically short, and the pressure is intense."
    }[gameDifficulty.toLowerCase()] : "Time is limited, but manageable.";

    const prompt = `Create a concise two-sentence mission briefing for a ${style} detective case with these details:

Victim: ${story.victim.name} (${story.victim.profession})
Setting: ${story.setting}
Circumstances: Found dead at ${story.victim.lastKnownLocation}, killed by ${story.victim.causeOfDeath}
${playerName ? `Assigned Detective: ${playerName}` : ''}

Case Urgency: ${difficultyModifier}

Requirements:
1. First sentence: State the core fact of the murder and any key circumstance
2. Second sentence: State the investigative challenge or time pressure
3. Use ${style} genre-appropriate language
4. Be direct and impactful
5. Create a sense of urgency appropriate to the difficulty level
${playerName ? `6. Make it personal to Detective ${playerName}` : ''}

Format as two clear sentences that would appear in a detective's journal.`;

    return await generate(prompt);
}

export async function composeCaseIntro(
    story: StoryStructure,
    playerName?: string,
    gameDifficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<CaseIntro> {
    // Determine narrative style based on setting
    const style = determineNarrativeStyle(story.setting);

    // Select initial suspects to focus on
    // const initialSuspects = selectInitialSuspects(story.suspects, story.killer);
    const initialSuspects = story.suspects.map(s => s.name);

    // Generate narrative components
    const [introNarrative, journalEntry] = await Promise.all([
        generateIntroNarrative(story, style, initialSuspects, playerName, gameDifficulty),
        generateJournalEntry(story, style, playerName, gameDifficulty)
    ]);

    // Create display data
    const displayData: DisplayData = {
        victimName: story.victim.name,
        lastKnownLocation: story.victim.lastKnownLocation,
        causeOfDeath: story.victim.causeOfDeath,
        initialSuspects,
        mainLocation: story.setting
    };

    return {
        introNarrative,
        journalEntry,
        displayData
    };
}

// Example usage:
// import { generateStory } from './storyGenerator';
// const story = await generateStory();
// import * as fs from 'fs';
// const story = JSON.parse(fs.readFileSync('story.json', 'utf8'));
// const caseIntro = await composeCaseIntro(story, "Detective Sengupta", "hard");
// fs.writeFileSync('caseIntro.json', JSON.stringify(caseIntro, null, 2));