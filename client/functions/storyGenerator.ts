import { uploadImageFromArrayBuffer } from '@/lib/cloudinary';
import { generate, generateImage } from './generate';
import { parseUntilJson } from './parseUntilJson';
import { StoryStructure, Victim, Suspect, Witness, TimelineEvent } from './types';


const SETTINGS = [
    "Indian Express Train",
    "Old Indian Victorian Manor",
    "Shady Indian Village",
    "Tropical Indian Island Resort",
    "Underground Indian Research Facility",
    "Luxury Indian Cruise Ship",
    "Ancient Indian Archaeological Site",
    "High-Tech Indian Corporate Tower",
    "Remote Indian Mountain Lodge",
    "Desert Oasis Goa Casino"
];

const STORY_ARCHETYPES = [
    "Love Triangle Gone Wrong",
    "Corporate Espionage",
    "Revenge Plot",
    "Inheritance Dispute",
    "Scientific Discovery Cover-up",
    "Political Conspiracy",
    "Personal Vendetta",
    "Blackmail Gone Wrong",
    "Identity Theft Scheme",
    "Whistleblower Silencing",
    "Cult Ritual Gone Wrong",
    "Political Assassination",
    "Family Feud"
];

async function generateSetting(seed: string): Promise<string> {
    // Use a seeded random function to select a setting deterministically based on the seed
    function seededRandom(seed: string): number {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }
        // Use a simple LCG for more randomness
        let value = Math.abs(hash);
        value = (value * 9301 + 49297) % 233280;
        return value / 233280;
    }

    const index = Math.floor(seededRandom(seed) * SETTINGS.length);
    return SETTINGS[index];
}

async function generateVictim(setting: string, archetype: string): Promise<Victim> {
    const prompt = `Create an Indian murder victim profile for a ${setting} with a ${archetype} storyline.
                   Include: full name, profession relevant to the setting, a location where they were last seen,
                   time of death (in HH:MM format), and cause of death.
                   Format as JSON with keys: name, profession, lastKnownLocation, deathTimeEstimate, causeOfDeath.

                   The response should be a valid JSON object like this:
                   {
                    "name": "<name of victim>",
                    "profession": "<profession of victim>",
                    "lastKnownLocation": "<location of last known sighting>",
                    "deathTimeEstimate": "<time of death>",
                    "causeOfDeath": "<cause of death>"
                   }

                   There should be no other text before or after the JSON in the response.
                   If you are using special characters in any of the fields, make sure to escape them. For example, if you are using a quote, you should escape it with a backslash.
                   Make it creative but believable within the setting.`;
    
    let attempts = 0;
    const maxAttempts = 3;
    let victim: any;
    
    while (attempts < maxAttempts) {
        const response = await generate(prompt);
        victim = parseUntilJson(response);
        
        const requiredFields = ['name', 'profession', 'lastKnownLocation', 'deathTimeEstimate', 'causeOfDeath'];
        const hasAllFields = requiredFields.every(field => victim && victim[field] && typeof victim[field] === 'string');
        
        if (hasAllFields) {
            break;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
            console.log(`Attempt ${attempts}: Missing required fields in victim data, retrying...`);
        }
    }
    
    return victim as Victim;
}

async function generateSuspects(
    setting: string, 
    victim: Victim, 
    archetype: string, 
    numSuspects: number
): Promise<Suspect[]> {
    const prompt = `Create ${numSuspects} detailed suspects for a murder mystery in ${setting} where ${victim.name} (${victim.profession}) was killed at ${victim.deathTimeEstimate} by ${victim.causeOfDeath}. Story archetype: ${archetype}.

For each suspect, provide a detailed profile with the following structure:
{
  "name": "<full name>",
  "role": "<their role/position in the setting>",
  "alibi": "<detailed alibi for the time of death - be specific about times and locations>",
  "motives": [
    "<primary motive - the main reason they might want the victim dead>",
    "<secondary motive - additional reason or circumstance>",
    "<tertiary motive - deeper psychological or circumstantial factor>"
  ],
  "isKiller": <boolean - exactly one should be true>,
  "personality": "<detailed personality description including quirks, mannerisms, and psychological traits>"
}

Requirements:
- Make sure the suspects are Indian and the setting is Indian.
- Make each character distinct with unique personalities, backgrounds, and motivations
- Any suspect may or may not have more than one motive, but they should have at least one, because of which they are a suspect.
- Create interconnected relationships between suspects and the victim
- Ensure motives are complex and multi-layered, not just simple greed or jealousy
- Include psychological depth and character flaws
- Make alibis detailed but potentially flawed or suspicious
- Ensure exactly one killer with the most compelling motive
- Consider how each character's personality would influence their behavior and alibi

If you are using special characters in any of the fields, make sure to escape them. For example, if you are using a quote, you should escape it with a backslash.
Format the response as a valid JSON array with no additional text before or after.`;
    
    let attempts = 0;
    const maxAttempts = 3;
    let suspects: Suspect[] = [];
    
    while (attempts < maxAttempts) {
        const response = await generate(prompt);
        const parsedSuspects = parseUntilJson(response) as Suspect[];
        
        // Check if all required fields are present for each suspect
        const hasAllFields = parsedSuspects.every(suspect => 
            suspect.name && 
            suspect.role && 
            suspect.alibi && 
            suspect.motives && 
            Array.isArray(suspect.motives) && 
            suspect.motives.length > 0 &&
            typeof suspect.isKiller === 'boolean' &&
            suspect.personality
        );
        
        if (hasAllFields) {
            suspects = parsedSuspects;
            break;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
            console.log(`Attempt ${attempts}: Missing required fields in suspects data, retrying...`);
        }
    }
    
    return suspects;
}

async function generateLocationsAndClues(
    setting: string,
    archetype: string,
    victim: Victim,
    suspects: Suspect[],
    killer: string
): Promise<{ locations: string[], clues: Record<string, string[]>, witnesses: Record<string, Witness[]> }> {
    const prompt = `Create a detailed set of locations and clues for a murder mystery in ${setting} with a story archetype of ${archetype}.
                   The victim is ${victim.name} (${victim.profession}) and the killer is ${killer}.

                   Victim details are: 
                   ${JSON.stringify(victim)}

                   Suspects details are:
                   ${JSON.stringify(suspects)}

                   Create 4-6 locations that are:
                   - Relevant within the Indian context
                   - Authentic to the setting and story archetype
                   - Logically connected to the victim's life and work
                   - Places where suspects would naturally be found
                   - Locations that could realistically contain evidence
                   
                   For each location, provide 2-4 detailed clues that are:
                   - VISUALLY DISTINCT and easily photographable (suitable for AI-generated forensic images)
                   - Large enough to be clearly visible in crime scene photos
                   - Relevant within the Indian context
                   - Specific and descriptive physical objects or environmental disturbances
                   - Realistic within the setting's technology and capabilities
                   - A mix of direct evidence and circumstantial evidence
                   - Some pointing clearly to the killer, others creating red herrings
                   
                   FOCUS ON VISUAL CLUES THAT PHOTOGRAPH WELL:
                   - Broken or displaced objects (overturned chairs, shattered glass, damaged items)
                   - Stains and marks (bloodstains, mud tracks, spilled liquids, burn marks)
                   - Personal items (clothing, jewelry, shoes, bags, dropped objects)
                   - Food and drink items (half-eaten meals, spilled tea, cigarette butts, bottles)
                   - Tools and weapons (knives, ropes, blunt objects, improvised weapons)
                   - Footprints, tire tracks, handprints on surfaces
                   - Disturbed environments (trampled plants, moved furniture, open/broken locks)
                   - Electronic devices (phones, cameras, radios) that are clearly visible
                   - Containers and packages (boxes, bags, jars, papers that are readable in photos)
                   
                   AVOID TINY OR DELICATE DETAILS:
                   - Small handwriting or tiny text that requires magnification
                   - Microscopic evidence like individual fibers or DNA traces
                   - Very subtle scratches or minute marks
                   - Fine details that would be invisible in standard crime scene photos
                   - Anything requiring close-up examination of small surfaces
                   
                   Ensure clues are:
                   - Clearly visible in wide and medium crime scene photography
                   - Photographable with standard forensic equipment
                   - Distinct enough for AI image generation to render accurately
                   - Require detective interpretation but are visually obvious once spotted
                   - Create a coherent visual narrative of what happened at the scene

                   For each location, introduce 0-2 random characters with their backgrounds who may or may not know something relevant to the story and ultimately point to the killer in a complex way. These characters should be:
                   - Relevant within the Indian context
                   - Distinct from the main suspects
                   - Have their own motivations and secrets
                   - Provide information that requires interpretation
                   - Create additional layers of complexity to the investigation
                   - Some may be intentionally misleading while others provide genuine insights
                   
                   Format the response as a valid JSON object with the following structure:
                   {
                     "locations": ["location1", "location2", "location3", "location4"],
                     "clues": {
                       "location1": [
                         "detailed clue description 1",
                         "detailed clue description 2",
                         "detailed clue description 3"
                       ],
                       "location2": [
                         "detailed clue description 1",
                         "detailed clue description 2"
                       ],
                       ...
                     },
                     "witnesses": {
                       "location1": [
                         {
                           "name": "Character Name",
                           "role": "Their role/occupation",
                           "background": "Brief background story",
                           "testimony": "What they claim to know or have seen",
                           "reliability": "How reliable their information might be",
                           "hiddenAgenda": "Any hidden motives or secrets they might have"
                         }
                       ],
                       "location2": [],
                       ...
                     }
                   }

                   If you are using special characters in any of the fields, make sure to escape them. For example, if you are using a quote, you should escape it with a backslash.
                   
                   Each clue should be a detailed, specific description that could be found at that location.`;
    let response = await generate(prompt);
    let parsedResponse = parseUntilJson(response) as { locations: string[], clues: Record<string, string[]>, witnesses: Record<string, Witness[]> };
    
    // Check if all required fields are present
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
        const hasLocations = Array.isArray(parsedResponse.locations) && parsedResponse.locations.length > 0;
        const hasClues = parsedResponse.clues && typeof parsedResponse.clues === 'object';
        const hasWitnesses = parsedResponse.witnesses && typeof parsedResponse.witnesses === 'object';
        
        const locationsWithClues = hasLocations && hasClues ? 
            parsedResponse.locations.filter(location => 
                Array.isArray(parsedResponse.clues[location]) && parsedResponse.clues[location].length > 0
            ).length : 0;
        
        const moreThanHalfHaveClues = hasLocations && 
            locationsWithClues >= Math.ceil(parsedResponse.locations.length / 2);
        
        const allLocationsHaveWitnesses = hasLocations && hasWitnesses && 
            parsedResponse.locations.every(location => 
                Array.isArray(parsedResponse.witnesses[location])
            );
        
        if (hasLocations && hasClues && hasWitnesses && moreThanHalfHaveClues && allLocationsHaveWitnesses) {
            break;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
            response = await generate(prompt);
            parsedResponse = parseUntilJson(response) as { locations: string[], clues: Record<string, string[]>, witnesses: Record<string, Witness[]> };
        }
    }
    
    return parsedResponse;
}

async function generateTimeline(
    setting: string,
    archetype: string,
    victim: Victim,
    suspects: Suspect[],
    killer: string,
    locations: string[],
    witnesses: Record<string, Witness[]>
): Promise<TimelineEvent[]> {
    const prompt = `Create a detailed timeline of events leading up to and including the murder in ${setting}, following the ${archetype} story archetype.

Key Information:
Victim: ${JSON.stringify(victim)}
Suspects: ${JSON.stringify(suspects)}
Killer: ${killer}
Locations: ${JSON.stringify(locations)}
Witnesses: ${JSON.stringify(witnesses)}

Requirements for the timeline:
- Make sure the timeline is Indian and the setting is Indian.

1. Time Span and Structure:
   - Start the timeline 24-48 hours before the murder
   - Include at least 15-20 significant events
   - End with the discovery of the body
   - Use precise timestamps (HH:MM format)
   - Events should build tension progressively

2. Character Integration:
   - Show interactions between the victim and all suspects
   - Include the killer's preparation and execution of the murder
   - Incorporate witness sightings and testimonies
   - Show suspects' movements that establish their alibis
   - Include red herring events that could implicate innocent suspects

3. Location Usage:
   - Events should occur across all available locations
   - Show how and when evidence was left behind
   - Include surveillance footage timings
   - Account for travel time between locations
   - Include weather or environmental factors that affect the crime

4. Psychological Elements:
   - Show escalating tensions between characters
   - Include seemingly insignificant events that later become crucial
   - Demonstrate the killer's careful planning
   - Show moments of conflict or confrontation
   - Include emotional states or behavioral changes

5. Evidence Trail:
   - Show exactly when and how each piece of evidence was created
   - Include digital footprints (phone calls, messages, computer usage)
   - Account for physical evidence placement
   - Show witness movements and observations
   - Include security system activations/deactivations

Format each event as part of a JSON array with this structure:
[
  {
    "time": "HH:MM",
    "event": "Detailed description of what happened, who was involved, and where it occurred"
  }
]

The timeline should be chronological and create a coherent narrative that explains how all the evidence came to be, while maintaining suspense and multiple possible interpretations. Include both significant and subtle events that investigators would need to piece together.

If you are using special characters in any of the fields, make sure to escape them. For example, if you are using a quote, you should escape it with a backslash.
Format the response as a valid JSON array with no additional text before or after.`;

    let response = await generate(prompt);
    let parsedResponse = parseUntilJson(response) as TimelineEvent[];
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        const hasValidStructure = parsedResponse.every(event => 
            event.time && 
            event.event && 
            typeof event.time === 'string' && 
            typeof event.event === 'string'
        );

        if (hasValidStructure && parsedResponse.length > 0) {
            return parsedResponse;
        }

        attempts++;
        if (attempts < maxAttempts) {
            response = await generate(prompt);
            parsedResponse = parseUntilJson(response) as TimelineEvent[];
        }
    }

    return parsedResponse;
}

async function generateTitle(
    setting: string,
    archetype: string,
    victim: Victim,
    killer: string,
    locations: string[],
    witnesses: Record<string, Witness[]>,
    timeline: TimelineEvent[]
): Promise<string> {
    const prompt = `Create a title for a murder mystery in ${setting} with a story archetype of ${archetype}. The story is set in an Indian setting.
    The victim is ${victim.name} (${victim.profession}) and the killer is ${killer}.
    The locations are ${locations.join(', ')} and the witnesses are ${JSON.stringify(witnesses)}.
    The timeline is ${JSON.stringify(timeline)}.

    Your output should be in the following format:
    {
        "title": "<title of the story>"
    }

    Format the response as a valid JSON object with no additional text before or after.`;
    let response = await generate(prompt);
    let parsedResponse = parseUntilJson(response) as { title: string };
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        const hasValidStructure = parsedResponse.title && 
            typeof parsedResponse.title === 'string';

        if (hasValidStructure) {
            return parsedResponse.title;
        }

        attempts++;
        if (attempts < maxAttempts) {
            response = await generate(prompt);
            parsedResponse = parseUntilJson(response) as { title: string };
        }
    }

    return parsedResponse.title;
}

const generateSuspectPortait = async (suspect: Suspect, setting: string, archetype: string) => {
    const prompt = `Create a hyperrealistic portrait of ${suspect.name} for a murder mystery story. 

Setting: ${setting}
Story Archetype: ${archetype}

Suspect Details:
- Name: ${suspect.name || ''}
- Role: ${suspect.role || ''}
- Personality: ${suspect.personality || ''}
- Motives: ${suspect.motives?.join(', ') || ''}
- Alibi: ${suspect.alibi || ''}
- Is Killer: ${suspect.isKiller || ''}

Style Requirements:
- Hyperrealistic portrait photography style
- Indian setting
- Professional lighting and composition
- Character should reflect the ${setting} environment and ${archetype} theme
- Facial expression should hint at their personality and potential involvement
- High quality, detailed features
- Appropriate clothing and styling for the setting
- Dramatic but realistic atmosphere that fits a murder mystery`;
    const response = await generateImage(prompt);
    const imageBuffer = await response.arrayBuffer();
    const uploadResult = await uploadImageFromArrayBuffer(
        imageBuffer,
        `${suspect.name}_portrait`,
        "obscura/suspects"
    );
    return uploadResult.secureUrl;
}

const generateVictimPortrait = async (victim: Victim, setting: string, archetype: string) => {
    const prompt = `Create a hyperrealistic portrait of ${victim.name} for a murder mystery story. 

Setting: ${setting}
Story Archetype: ${archetype}

Victim Details:
- Name: ${victim.name}
- Profession: ${victim.profession}
- Last Known Location: ${victim.lastKnownLocation}
- Death Time Estimate: ${victim.deathTimeEstimate}
- Cause of Death: ${victim.causeOfDeath}

Style Requirements:
- Hyperrealistic portrait photography style
- Indian setting
- Professional lighting and composition
- Character should reflect the ${setting} environment and ${archetype} theme
- Facial expression should convey their personality and circumstances before death
- High quality, detailed features
- Appropriate clothing and styling for their profession and the setting
- Dignified but somber atmosphere appropriate for a murder victim
- Should evoke sympathy and humanity for the victim`;
    
    const response = await generateImage(prompt);
    const imageBuffer = await response.arrayBuffer();
    const uploadResult = await uploadImageFromArrayBuffer(
        imageBuffer,
        `${victim.name}_portrait`,
        "obscura/victims"
    );
    return uploadResult.secureUrl;
}

export async function generateStory(
    seed: string = Date.now().toString()
): Promise<StoryStructure> {
    try {
        // Use playerId and seedx to influence randomness if needed
        const setting = await generateSetting(seed);
        const archetype = STORY_ARCHETYPES[Math.floor(Math.random() * STORY_ARCHETYPES.length)];
        const victim = await generateVictim(setting, archetype);
        const victimPortrait = await generateVictimPortrait(victim, setting, archetype);
        victim.portrait = victimPortrait;
        const suspectsWithoutPortraits = await generateSuspects(setting, victim, archetype, 4);
        const suspectPortraits = await Promise.all(suspectsWithoutPortraits.map(suspect => generateSuspectPortait(suspect, setting, archetype)));
        const suspects = suspectsWithoutPortraits.map((suspect, index) => ({
            ...suspect,
            portrait: suspectPortraits[index]
        }));


        const killer = suspects.find(s => s.isKiller)?.name || '';
        if (killer === '') {
            throw new Error('No killer found');
        }
        
        const { locations, clues, witnesses } = await generateLocationsAndClues(setting, archetype, victim, suspects, killer);

        const timeline = await generateTimeline(setting, archetype, victim, suspects, killer, locations, witnesses);

        const title = await generateTitle(setting, archetype, victim, killer, locations, witnesses, timeline);

        return {
            title,
            setting,
            victim,
            suspects,
            killer,
            locations,
            clues,
            witnesses,
            timeline
        };
    } catch (error) {
        console.error('Error generating story:', error);
        throw error;
    }
} 

// Example usage:
// const story = await generateStory();
// fs.writeFileSync('story.json', JSON.stringify(story, null, 2));