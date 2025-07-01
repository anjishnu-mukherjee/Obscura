import { NextRequest, NextResponse } from "next/server";
import { 
  getCase, 
  addInvestigationFinding, 
  saveLocationImages, 
  getLocationImages, 
  saveLocationDiscoveredClues, 
  getLocationDiscoveredClues 
} from "@/lib/gameDb";
import { generate, generateImage, generateAudio, generateWithImage } from "@/functions/generate";
import { uploadImageFromArrayBuffer, uploadAudioFromArrayBuffer } from "@/lib/cloudinary";
import { ProcessedClue, Witness } from "@/functions/types";
import { operationStatusManager } from "@/lib/operationStatus";

// Helper function to detect gender from name using LLM
async function detectGenderFromName(name: string): Promise<'male' | 'female'> {
  try {
    const prompt = `Based on the name "${name}", determine if this is typically a male or female name. 
    
Consider:
- Common gender associations with the name
- Cultural and linguistic patterns
- If the name is ambiguous or uncommon, make your best guess based on typical naming conventions

Respond with only one word: "male" or "female"`;

    const response = await generate(prompt);
    const gender = response.toLowerCase().trim();
    
    if (gender.includes('male') && !gender.includes('female')) {
      return 'male';
    } else if (gender.includes('female')) {
      return 'female';
    } else {
      return Math.random() > 0.5 ? 'male' : 'female';
    }
  } catch (error) {
    console.error('Error detecting gender from name:', error);
    return Math.random() > 0.5 ? 'male' : 'female';
  }
}

// Generate location images with embedded clues - one image per clue
async function generateLocationImages(
  locationName: string, 
  setting: string, 
  clues: ProcessedClue[],
  caseId: string,
  locationId: string
): Promise<{ images: Array<{url: string, description: string, clueHints: string[]}>, error?: string }> {
  try {
    console.log(`Generating images for location: ${locationName} (${clues.length} clues)`);
    
    // Check if images already exist in database
    const existingImagesResult = await getLocationImages(caseId, locationId);
    if (!existingImagesResult.error && existingImagesResult.images.length > 0) {
      console.log(`Using existing images for ${locationName}`);
      return { 
        images: existingImagesResult.images.map(img => ({
          url: img.url,
          description: img.description,
          clueHints: img.clueHints
        }))
      };
    }
    
    const images = [];
    
    // Filter out witness testimony - only generate images for physical/visual evidence
    const visualClues = clues.filter(clue => 
      clue.type !== 'Witness Testimony'
    );
    
    console.log(`Filtered to ${visualClues.length} visual clues (excluded ${clues.length - visualClues.length} witness testimonies)`);
    
    // Generate one focused image for each visual clue
    for (let i = 0; i < visualClues.length; i++) {
      const clue = visualClues[i];
      
      // Create a focused prompt for this specific clue
      const cluePrompt = `Create a detailed forensic crime scene photograph focusing specifically on this evidence at "${locationName}" in ${setting}.

SPECIFIC EVIDENCE TO HIGHLIGHT:
${clue.content}

PHOTOGRAPHY REQUIREMENTS:
- Make this evidence the CENTRAL FOCUS of the photograph
- Use professional forensic photography lighting to clearly show details
- Include enough environmental context to show where this evidence is located
- Make the evidence clearly visible and prominent in the frame
- Style: Professional crime scene documentation photo
- Lighting: Good contrast to show evidence details clearly
- Setting details: Include appropriate ${setting} environmental elements

EVIDENCE TYPE: ${clue.type}
IMPORTANCE: This is ${clue.category} evidence

The photograph should look like it was taken by a forensic photographer specifically to document this piece of evidence for investigation purposes.`;

      try {
        const clueBlob = await generateImage(cluePrompt);
        const clueBuffer = Buffer.from(await clueBlob.arrayBuffer());
        
        const clueUpload = await uploadImageFromArrayBuffer(
          clueBuffer.buffer as ArrayBuffer,
          `location_${caseId}_${locationName.replace(/\s+/g, '_')}_clue${i + 1}_${Date.now()}`,
          'obscura/locations'
        );

        // Create a descriptive name for the image based on clue type
        let imageDescription = '';
        switch (clue.type) {
          case 'Physical Object':
            imageDescription = `Physical Evidence #${i + 1} at ${locationName}`;
            break;
          case 'Biological Trace':
            imageDescription = `Biological Evidence at ${locationName}`;
            break;
          case 'Environmental Anomaly':
            imageDescription = `Environmental Disturbance at ${locationName}`;
            break;
          case 'Digital Record':
            imageDescription = `Digital Evidence at ${locationName}`;
            break;
          default:
            imageDescription = `Evidence #${i + 1} at ${locationName}`;
        }

        images.push({
          url: clueUpload.secureUrl,
          description: imageDescription,
          clueHints: [`Focus on: ${clue.content.substring(0, 120)}...`],
          publicId: clueUpload.publicId
        });

                 console.log(`Generated image ${i + 1}/${visualClues.length} for clue: ${clue.type}`);
        
        // Add a small delay to avoid overwhelming the image generation API
        if (i < clues.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`Error generating image for clue ${i + 1}:`, error);
        // Continue with other clues even if one fails
      }
    }

    // Generate one overview image showing the general scene
    if (images.length > 0) {
      try {
        const overviewPrompt = `Create a general overview crime scene photograph of "${locationName}" in ${setting}.

SCENE OVERVIEW:
- Show the general layout and context of the crime scene
- Include environmental details that set the scene
- Professional forensic photography style
- Good lighting to show the overall area
- Indian setting details appropriate to: ${setting}

This should be a wide-angle view that gives context to where the specific evidence was found, without focusing on any particular piece of evidence.`;

        const overviewBlob = await generateImage(overviewPrompt);
        const overviewBuffer = Buffer.from(await overviewBlob.arrayBuffer());
        
        const overviewUpload = await uploadImageFromArrayBuffer(
          overviewBuffer.buffer as ArrayBuffer,
          `location_${caseId}_${locationName.replace(/\s+/g, '_')}_overview_${Date.now()}`,
          'obscura/locations'
        );

        // Insert overview at the beginning
        images.unshift({
          url: overviewUpload.secureUrl,
          description: `General Overview of ${locationName}`,
                     clueHints: [`Scene context - ${visualClues.length} pieces of visual evidence present`],
          publicId: overviewUpload.publicId
        });
        
        console.log(`Generated overview image for ${locationName}`);
      } catch (error) {
        console.error('Error generating overview image:', error);
      }
    }

    // Save images to database for future use
    await saveLocationImages(caseId, locationId, images);

    console.log(`Generated and saved ${images.length} images for ${locationName} (${visualClues.length} visual clues + overview)`);
    return { 
      images: images.map(img => ({
        url: img.url,
        description: img.description,
        clueHints: img.clueHints
      }))
    };
    
  } catch (error) {
    console.error('Error generating location images:', error);
    return { images: [], error: 'Failed to generate location images' };
  }
}

// Interrogate witness functionality
async function interrogateWitness(
  witness: Witness,
  questions: string[],
  caseContext: any,
  detectiveName: string
): Promise<{ conversation: string, audioId?: string, revealedClues: ProcessedClue[] }> {
  try {
    console.log(`Interrogating witness: ${witness.name}`);
    
    const conversationPrompt = `You are creating a realistic witness interview between Detective ${detectiveName} and ${witness.name}, a witness in a murder investigation.

CASE CONTEXT:
- Victim: ${caseContext.victimName}
- Setting: ${caseContext.setting}
- Location: ${caseContext.locationName}

WITNESS INFORMATION:
- Name: ${witness.name}
- Role: ${witness.role}
- Background: ${witness.background}
- Reliability: ${witness.reliability}
- Hidden Agenda: ${witness.hiddenAgenda}
- Prepared Testimony: ${witness.testimony}

DETECTIVE'S QUESTIONS:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

IMPORTANT INSTRUCTIONS:
1. ${witness.name} is a WITNESS (not a suspect), so they are generally cooperative and willing to help
2. Witnesses are MUCH MORE LIKELY to reveal information than suspects 
3. They should provide useful information, clues, and observations they've witnessed
4. Include their hidden agenda subtly but don't make them completely untrustworthy
5. The conversation should be in Hindi/Hinglish as appropriate for the Indian setting
6. ${witness.name} should answer questions directly but may add personal opinions or observations
7. Make the witness feel realistic with personality quirks from their background
8. Include natural conversation flow with follow-ups
9. The witness should reveal important details they've seen or heard

FORMAT:
${detectiveName}: [question in Hindi/Hinglish]
${witness.name}: [helpful response with details in Hindi/Hinglish]
${detectiveName}: [follow-up in Hindi/Hinglish]
${witness.name}: [more information in Hindi/Hinglish]
...

Generate the complete witness interview:`;

    const conversation = await generate(conversationPrompt);
    
    // Generate audio for the conversation
    let audioId: string = "";
    try {
      console.log(`Generating audio for witness conversation with ${witness.name}...`);
      
      const maleVoices = ["Puck", "Enceladus", "Iapetus", "Algieba", "Algenib", "Zubenelgenubi"];
      const femaleVoices = ["Zephyr", "Kore", "Gacrux", "Sulafat", "Leda", "Aoede"];
      
      const detectiveGender = await detectGenderFromName(detectiveName);
      const witnessGender = await detectGenderFromName(witness.name);
      
      console.log(`Detective ${detectiveName} gender: ${detectiveGender}, Witness ${witness.name} gender: ${witnessGender}`);
      
      const witnessVoice = witnessGender === 'male' 
        ? maleVoices[Math.floor(Math.random() * maleVoices.length)]
        : femaleVoices[Math.floor(Math.random() * femaleVoices.length)];
        
      const detectiveVoice = detectiveGender === 'male' ? "Charon" : "Pulcherrima";

      const characters = [
        { name: detectiveName, voice: detectiveVoice },
        { name: witness.name, voice: witnessVoice }
      ];

      console.log(`Using voices - Detective: ${detectiveVoice}, Witness: ${witnessVoice}`);
      console.log(`Conversation length: ${conversation.length} characters`);

      audioId = await generateAudio(conversation, characters);
      
      if (audioId && audioId.trim()) {
        console.log(`Audio generated successfully for witness ${witness.name}: ${audioId}`);
      } else {
        console.warn(`Audio generation returned empty/invalid ID for witness ${witness.name}`);
      }
    } catch (error: any) {
      console.error('Error generating witness audio:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        detectiveName,
        witnessName: witness.name
      });
    }

    // Analyze conversation for revealed clues
    const clueTriggers = witness.cluesTriggers || [];
    const revealedClues: ProcessedClue[] = [];
    
    for (const clueInfo of clueTriggers) {
      // Since witnesses are more cooperative, they have higher chance of revealing clues
      if (Math.random() < 0.8) { // 80% chance for witnesses vs lower for suspects
        revealedClues.push({
          type: 'Witness Testimony',
          content: clueInfo.clue,
          discovery: {
            requires: 'witness_help',
            difficulty: clueInfo.triggerLevel
          },
          category: clueInfo.isRedHerring ? 'red_herring' : 'direct',
          relatedSuspects: [],
          locationContext: caseContext.locationName
        });
      }
    }

    return { conversation, audioId, revealedClues };
    
  } catch (error) {
    console.error('Error interrogating witness:', error);
    return { 
      conversation: `${detectiveName}: Thank you for your time.\n${witness.name}: I wish I could help more with the investigation.`,
      revealedClues: []
    };
  }
}

// Analyze image for clues using AI vision
async function analyzeImageForClues(
  imageUrl: string,
  userObservation: string,
  expectedClues: ProcessedClue[]
): Promise<{ matches: ProcessedClue[], analysis: string }> {
  try {
    console.log('Analyzing image for clues...');
    
    // Use LLM to match user observation with actual clues
    const analysisPrompt = `You are a forensic analyst helping a detective analyze a crime scene image.

DETECTIVE'S OBSERVATION: "${userObservation}"

POSSIBLE CLUES AT THIS LOCATION:
${expectedClues.map((clue, i) => `${i + 1}. ${clue.content}`).join('\n')}

TASK:
1. Analyze if the detective's observation matches any of the listed clues
2. Determine which clues (if any) the detective has successfully identified
3. Provide feedback on their observation skills

Return a JSON response with:
{
  "matchedClueIndexes": [array of indexes of matched clues (0-based)],
  "analysis": "Detailed feedback on what the detective observed and how it relates to the evidence",
  "discoverySuccess": true/false
}`;

    const response = await generate(analysisPrompt);
    
    // Parse the response
    let analysisResult;
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback if JSON parsing fails
      const keywords = userObservation.toLowerCase();
      const matches: ProcessedClue[] = [];
      
      expectedClues.forEach(clue => {
        const clueWords = clue.content.toLowerCase();
        if (keywords.split(' ').some(word => clueWords.includes(word) && word.length > 3)) {
          matches.push(clue);
        }
      });
      
      return {
        matches,
        analysis: `Your observation "${userObservation}" has been noted. ${matches.length > 0 ? 'You may have identified some evidence!' : 'Keep looking for more details.'}`
      };
    }

    // Extract matched clues
    const matches: ProcessedClue[] = [];
    if (analysisResult.matchedClueIndexes && Array.isArray(analysisResult.matchedClueIndexes)) {
      analysisResult.matchedClueIndexes.forEach((index: number) => {
        if (index >= 0 && index < expectedClues.length) {
          matches.push(expectedClues[index]);
        }
      });
    }

    return {
      matches,
      analysis: analysisResult.analysis || 'Analysis completed.'
    };
    
  } catch (error) {
    console.error('Error analyzing image for clues:', error);
    return {
      matches: [],
      analysis: 'Unable to analyze the observation at this time.'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      caseId, 
      locationId, 
      action, // 'generate_images', 'interrogate_witness', 'analyze_image'
      detectiveName,
      // For witness interrogation
      witnessName,
      questions,
      // For image analysis
      imageUrl,
      userObservation
    } = body;

    if (!caseId || !locationId || !action) {
      return NextResponse.json(
        { error: "Case ID, Location ID, and action are required" },
        { status: 400 }
      );
    }

    console.log(`Processing location investigation: ${action} for ${locationId}`);

    // Get case data
    const caseResult = await getCase(caseId);
    if (caseResult.error || !caseResult.data) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    const caseData = caseResult.data;
    const location = caseData.map.nodes.find(n => n.id === locationId);
    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    const locationName = location.fullName;
    const cluesAtLocation = caseData.clues[locationName] || [];
    const witnessesAtLocation = caseData.story.witnesses[locationName] || [];

    // For analyze_image action, we can process it immediately since it's quick
    if (action === 'analyze_image') {
      if (!imageUrl || !userObservation) {
        return NextResponse.json(
          { error: "Image URL and user observation are required for image analysis" },
          { status: 400 }
        );
      }

      const analysisResult = await analyzeImageForClues(imageUrl, userObservation, cluesAtLocation);
      
      // Save discovered clues if any
      if (analysisResult.matches.length > 0) {
        try {
          await saveLocationDiscoveredClues(caseId, locationId, analysisResult.matches);
        } catch (error: any) {
          console.error('Error saving discovered clues:', error);
        }
      }

      return NextResponse.json({
        success: true,
        action: 'analyze_image',
        analysis: analysisResult.analysis,
        discoveredClues: analysisResult.matches,
        clueCount: analysisResult.matches.length
      });
    }

    // For time-consuming operations, use background processing
    const operationId = operationStatusManager.createOperation(
      'investigate-location',
      action === 'generate_images' ? 'Preparing to generate location images...' : 'Preparing witness interrogation...'
    );

    console.log("Created location investigation operation:", operationId);

    // Return immediately with operation ID
    const response = NextResponse.json({
      success: true,
      operationId,
      status: 'processing',
      action,
      message: action === 'generate_images' ? "Generating crime scene images..." : "Starting witness interrogation..."
    });

    // Start background processing (don't await)
    processLocationInvestigation(operationId, {
      caseId,
      locationId,
      action,
      detectiveName,
      witnessName,
      questions,
      caseData,
      location,
      locationName,
      cluesAtLocation,
      witnessesAtLocation
    }).catch((error: any) => {
      console.error("Background location investigation failed:", operationId, error);
      operationStatusManager.updateOperation(operationId, {
        status: 'failed',
        error: error.message || 'Location investigation failed'
      });
    });

    return response;

  } catch (error: any) {
    console.error("Error processing location investigation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Background processing function
async function processLocationInvestigation(
  operationId: string,
  data: {
    caseId: string;
    locationId: string;
    action: string;
    detectiveName?: string;
    witnessName?: string;
    questions?: string[];
    caseData: any;
    location: any;
    locationName: string;
    cluesAtLocation: any[];
    witnessesAtLocation: any[];
  }
) {
  const { 
    caseId, 
    locationId, 
    action, 
    detectiveName, 
    witnessName, 
    questions, 
    caseData, 
    location, 
    locationName, 
    cluesAtLocation, 
    witnessesAtLocation 
  } = data;

  try {
    if (action === 'generate_images') {
      operationStatusManager.updateOperation(operationId, {
        progress: 20,
        message: 'Analyzing location clues...'
      });

      const imageResult = await generateLocationImages(
        locationName,
        caseData.story.setting,
        cluesAtLocation,
        caseId,
        locationId
      );

      operationStatusManager.updateOperation(operationId, {
        status: 'completed',
        progress: 100,
        message: 'Crime scene images generated successfully!',
        result: {
          success: true,
          images: imageResult.images,
          clueCount: cluesAtLocation.length,
          witnessCount: witnessesAtLocation.length,
          error: imageResult.error
        }
      });

    } else if (action === 'interrogate_witness') {
      if (!witnessName || !questions || !detectiveName) {
        throw new Error("Witness name, questions, and detective name are required");
      }

      operationStatusManager.updateOperation(operationId, {
        progress: 20,
        message: 'Finding witness for interrogation...'
      });

      const witness = witnessesAtLocation.find(w => w.name === witnessName);
      if (!witness) {
        throw new Error("Witness not found at this location");
      }

      operationStatusManager.updateOperation(operationId, {
        progress: 40,
        message: 'Conducting witness interrogation...'
      });

      const interrogationResult = await interrogateWitness(
        witness,
        questions,
        {
          victimName: caseData.story.victim.name,
          setting: caseData.story.setting,
          locationName
        },
        detectiveName
      );

      operationStatusManager.updateOperation(operationId, {
        progress: 80,
        message: 'Recording testimony and findings...'
      });

      // Save revealed clues to location and add findings
      if (interrogationResult.revealedClues.length > 0) {
        try {
          await saveLocationDiscoveredClues(caseId, locationId, interrogationResult.revealedClues);
        } catch (error: any) {
          console.error('Error saving witness revealed clues:', error);
        }
      }

      // Add findings for revealed clues
      for (const clue of interrogationResult.revealedClues) {
        try {
          await addInvestigationFinding(caseId, {
            source: 'location_visit',
            sourceDetails: `Witness testimony from ${witness.name} at ${locationName}`,
            finding: clue.content,
            importance: clue.category === 'direct' ? 'important' : 'minor'
          });
        } catch (error: any) {
          console.error('Error adding witness finding:', error);
        }
      }

      operationStatusManager.updateOperation(operationId, {
        status: 'completed',
        progress: 100,
        message: 'Witness interrogation completed successfully!',
        result: {
          success: true,
          message: "Witness interrogated successfully",
          conversation: interrogationResult.conversation,
          audioId: interrogationResult.audioId,
          revealedClues: interrogationResult.revealedClues,
          witness: {
            name: witness.name,
            role: witness.role,
            reliability: witness.reliability
          }
        }
      });
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Location investigation operation ${operationId} completed successfully`);

  } catch (error: any) {
    console.error(`Background location investigation failed for operation ${operationId}:`, error);
    operationStatusManager.updateOperation(operationId, {
      status: 'failed',
      error: error.message || 'Location investigation processing failed'
    });
    throw error;
  }
} 