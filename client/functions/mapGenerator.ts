import { StoryStructure, LocationNode, MapStructure } from './types';
import { generate, generateImage } from './generate';
import { parseUntilJson } from './parseUntilJson';


function generateLocationId(index: number): string {
    // Create a short, reliable ID from the location name
    return `L${index + 1}`;
}

async function suggestConnections(
    locations: string[],
    story: StoryStructure
): Promise<LocationNode[]> {
    const locationIds = locations.map((_, index) => generateLocationId(index));
    
    const prompt = `Given these locations in a ${story.setting}:
${locations.map((loc, i) => `${locationIds[i]}: ${loc}`).join('\n')}

Suggest logical connections between these locations based on:
1. The story's timeline of events
2. The movement patterns in this timeline:
${story.timeline.map(t => `${t.time}: ${t.event}`).join('\n')}
3. The setting's layout (${story.setting})

Return ONLY a JSON array where each object has:
{
    "id": "L1",
    "fullName": "exact location name",
    "connections": ["L2", "L3"] // IDs of connected locations
}

Requirements:
1. Use ONLY the provided location IDs (L1, L2, etc.)
2. Each location should connect to at least one other location
3. Connections should be logical for the setting
4. Don't add any locations not in the list
5. Make connections that would make sense for character movement
6. Return valid JSON only, no other text

Example format:
[
    {
        "id": "L1",
        "fullName": "Main Lab",
        "connections": ["L2", "L4"]
    },
    ...
]
    
There should be no other text before or after the JSON in the response.`;

    const response = await generate(prompt);
    try {
        return parseUntilJson(response) as LocationNode[];
    } catch (e) {
        console.error('Failed to parse AI response for connections');
        // Fallback: create basic chain of connections
        return locations.map((loc, i) => ({
            id: locationIds[i],
            fullName: loc,
            connections: [locationIds[i + 1]].filter(Boolean)
        }));
    }
}

async function generateMermaidDiagram(nodes: LocationNode[]): Promise<string> {
    // Create a Mermaid graph diagram
    const prompt = `Create a Mermaid graph diagram for these connected locations:
${JSON.stringify(nodes, null, 2)}

Requirements:
1. Use graph TD for top-down layout
2. Each node should be formatted as: id["short name"]
3. Use -- to connect nodes
4. Make the layout clean and organized
5. Return ONLY the Mermaid diagram code
6. Use basic Mermaid syntax only
7. Don't use colors or styles
8. Don't use subgraphs
9. Use simple connection lines
10. Ensure all IDs match exactly

Example format:
graph TD
    L1["Lab"] -- o -- L2["Office"]
    L2 -- o -- L3["Storage"]

Return only the Mermaid code, no other text.

There should be no other text before or after the Mermaid code in the response.`;

    const response = await generate(prompt);
    
    // Clean up the response to ensure it's valid Mermaid syntax
    const cleanedResponse = response
        .replace(/```mermaid/g, '')
        .replace(/```/g, '')
        .trim();

    return cleanedResponse;
}

async function generateMapImage(
    story: StoryStructure,
    nodes: LocationNode[]
): Promise<Blob> {
    const settingType = story.setting.toLowerCase();
    let mapStyle = "modern";
    let colorScheme = "cool";
    let structureType = "buildings";
    let environmentType = "urban";
    
    // Determine setting-specific styles
    if (settingType.includes('mars') || settingType.includes('space')) {
        mapStyle = "futuristic";
        colorScheme = "red-tinted";
        structureType = "domes and modules";
        environmentType = "sci-fi";
    } else if (settingType.includes('manor') || settingType.includes('mansion')) {
        mapStyle = "vintage";
        colorScheme = "sepia";
        structureType = "Victorian rooms";
        environmentType = "historic";
    } else if (settingType.includes('island') || settingType.includes('resort')) {
        mapStyle = "tropical";
        colorScheme = "vibrant";
        structureType = "resort facilities";
        environmentType = "paradise";
    }

    // Count number of major and minor connection hubs
    const connectionCounts = nodes.map(node => node.connections.length);
    const majorHubs = connectionCounts.filter(count => count > 2).length;
    const minorHubs = connectionCounts.filter(count => count === 2).length;

    const prompt = `Create a ${mapStyle} architectural map or blueprint showing exactly ${nodes.length} distinct ${structureType} in a ${story.setting} setting. 

Layout specifications:
- Create ${majorHubs} major hub areas with multiple connections
- Include ${minorHubs} secondary hubs with dual pathways
- All structures should be connected by paths or corridors
- Arrange structures in a logical, flowing layout
- Include ${nodes.length - majorHubs - minorHubs} peripheral locations

Environmental elements:
${environmentType === 'sci-fi' ? `
- Add Martian landscape or space station features
- Include airlocks and life support structures
- Show technological and futuristic elements
- Add subtle red planet atmosphere effects` :
environmentType === 'historic' ? `
- Include Victorian architectural details
- Show grand halls and corridors
- Add period-appropriate decorative elements
- Suggest antique furnishings in layout` :
environmentType === 'paradise' ? `
- Add tropical vegetation and water features
- Include outdoor pathways and gardens
- Show beachfront or coastline elements
- Suggest resort-style amenities` : `
- Add modern architectural features
- Include contemporary design elements
- Show professional facility layout
- Add urban environment details`}

Style requirements:
- Use a ${colorScheme} color scheme
- Create a professional blueprint/architectural drawing style
- NO TEXT OR LABELS
- Include a simple compass rose
- Add coordinate grid lines
- Show clear pathways between structures
- Make each structure visually distinct
- Add subtle shadows for depth
- Keep the design clean and professional
- Focus on architectural accuracy

The map should look like an official facility blueprint or architectural plan, with each structure clearly defined and connected, but without any text or labels.`;

    return await generateImage(prompt);
}

export async function generateLocationMap(story: StoryStructure): Promise<MapStructure & { mapImage: Blob }> {
    // Generate short IDs and get connections
    const nodes = await suggestConnections(story.locations, story);
    
    // Generate the Mermaid diagram
    const mermaidDiagram = await generateMermaidDiagram(nodes);
    
    // Generate the map image
    const mapImage = await generateMapImage(story, nodes);
    
    return {
        nodes,
        mermaidDiagram,
        mapImage
    };
}

// Example usage:
// import * as fs from 'fs';
// const story = JSON.parse(fs.readFileSync('story.json', 'utf8')) as StoryStructure;
// const map = await generateLocationMap(story);

// // Save the map data
// fs.writeFileSync('map.json', JSON.stringify({
//     nodes: map.nodes,
//     mermaidDiagram: map.mermaidDiagram
// }, null, 2));

// // Save the map image
// const imageBuffer = await map.mapImage.arrayBuffer();
// fs.writeFileSync('map.png', Buffer.from(imageBuffer));
