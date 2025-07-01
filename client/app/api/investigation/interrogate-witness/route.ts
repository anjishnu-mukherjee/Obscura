import { NextRequest, NextResponse } from "next/server";
import { getCase, addInvestigationFinding } from "@/lib/gameDb";
import { generate, generateAudio } from "@/functions/generate";
import { Witness } from "@/functions/types";
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

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, witnessName, questions, detectiveName, locationName } = body;

    if (!caseId || !witnessName || !questions || !Array.isArray(questions) || questions.length === 0 || !detectiveName) {
      return NextResponse.json(
        { error: "Case ID, witness name, questions array, and detective name are required" },
        { status: 400 }
      );
    }

    console.log("Processing witness interrogation:", { caseId, witnessName, locationName });

    // Get current case data
    const caseResult = await getCase(caseId);
    if (caseResult.error || !caseResult.data) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    // Find the witness in the story
    const allWitnesses: Witness[] = [];
    Object.values(caseResult.data.story.witnesses).forEach((locationWitnesses: any) => {
      allWitnesses.push(...locationWitnesses);
    });
    
    const witness = allWitnesses.find((w: Witness) => w.name === witnessName);
    if (!witness) {
      return NextResponse.json(
        { error: "Witness not found" },
        { status: 404 }
      );
    }

    // Create operation and return immediately
    const operationId = operationStatusManager.createOperation(
      'interrogate-witness',
      'Preparing witness interview...'
    );

    console.log("Created witness interview operation:", operationId);

    // Return immediately with operation ID
    const response = NextResponse.json({
      success: true,
      operationId,
      status: 'processing',
      message: "Witness interview in progress..."
    });

    // Start background processing (don't await)
    processWitnessInterrogation(operationId, {
      caseId,
      witnessName,
      questions,
      detectiveName,
      locationName,
      caseData: caseResult.data,
      witness
    }).catch((error: any) => {
      console.error("Background witness interview failed:", operationId, error);
      operationStatusManager.updateOperation(operationId, {
        status: 'failed',
        error: error.message || 'Witness interview failed'
      });
    });

    return response;

  } catch (error: any) {
    console.error("Error processing witness interrogation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Background processing function
async function processWitnessInterrogation(
  operationId: string,
  data: {
    caseId: string;
    witnessName: string;
    questions: string[];
    detectiveName: string;
    locationName?: string;
    caseData: any;
    witness: Witness;
  }
) {
  const { caseId, witnessName, questions, detectiveName, locationName, caseData, witness } = data;

  try {
    operationStatusManager.updateOperation(operationId, {
      progress: 20,
      message: 'Preparing witness interview context...'
    });

    console.log("Generating witness conversation...");

    operationStatusManager.updateOperation(operationId, {
      progress: 40,
      message: 'Generating interview conversation...'
    });

    // Generate conversation flow - witnesses are more cooperative
    const conversationPrompt = `You are creating a realistic witness interview between Detective ${detectiveName} and ${witness.name}, a witness in a murder investigation.

CASE CONTEXT:
- Victim: ${caseData.story.victim.name} (${caseData.story.victim.profession})
- Setting: ${caseData.story.setting}
- Location: ${locationName || 'Investigation site'}

WITNESS INFORMATION:
- Name: ${witness.name}
- Role: ${witness.role}
- Background: ${witness.background}
- Reliability: ${witness.reliability}
- Hidden Agenda: ${witness.hiddenAgenda}
- Prepared Testimony: ${witness.testimony}

DETECTIVE'S PLANNED QUESTIONS:
${questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

INSTRUCTIONS:
1. ${witness.name} is a WITNESS (not a suspect), so they are generally cooperative and helpful
2. Witnesses are MUCH MORE LIKELY to reveal information and clues than suspects
3. They should provide useful information, observations, and details they've witnessed
4. Include their hidden agenda subtly but don't make them completely untrustworthy
5. The conversation should be in Hindi/Hinglish as appropriate for the Indian setting
6. ${witness.name} should answer questions directly and may volunteer additional information
7. Make the witness feel realistic with personality quirks from their background
8. Include natural conversation flow with follow-ups and clarifications
9. The witness should reveal important details they've seen, heard, or know about
10. Show some nervousness or emotion if the topic is sensitive, but remain cooperative

FORMAT:
${detectiveName}: [question in Hindi/Hinglish]
${witness.name}: [helpful, detailed response in Hindi/Hinglish]
${detectiveName}: [follow-up in Hindi/Hinglish]
${witness.name}: [more information and observations in Hindi/Hinglish]
...

Generate the complete witness interview:`;

    let conversation: string;
    try {
      conversation = await generate(conversationPrompt);
      conversation = conversation.trim();
      console.log("Witness conversation generated for operation:", operationId);
    } catch (error: any) {
      console.error('Error generating witness conversation:', error);
      
      // Fallback conversation
      conversation = `${detectiveName}: ${questions[0]}\n${witness.name}: Haan, main aapko jo dekha hai sab bata deta hun. ${witness.testimony}\n${detectiveName}: Aur kuch yaad hai aapko?\n${witness.name}: Ji haan, aur bhi kuch details hain jo helpful ho sakti hain.`;
    }

    operationStatusManager.updateOperation(operationId, {
      progress: 60,
      message: 'Generating interview audio...'
    });

    console.log("Generating witness interview audio...");

    // Generate audio
    let audioId: string = "";
    try {
      const maleVoices = ["Puck", "Enceladus", "Iapetus", "Algieba", "Algenib", "Zubenelgenubi"];
      const femaleVoices = ["Zephyr", "Kore", "Gacrux", "Sulafat", "Leda", "Aoede"];
      
      // Detect genders using LLM
      const detectiveGender = await detectGenderFromName(detectiveName);
      const witnessGender = await detectGenderFromName(witness.name);
      
      // Assign voices based on detected genders
      const witnessVoice = witnessGender === 'male' 
        ? maleVoices[Math.floor(Math.random() * maleVoices.length)]
        : femaleVoices[Math.floor(Math.random() * femaleVoices.length)];
        
      const detectiveVoice = detectiveGender === 'male' ? "Charon" : "Pulcherrima";

      const characters = [
        { name: detectiveName, voice: detectiveVoice },
        { name: witness.name, voice: witnessVoice }
      ];
      
      console.log(`Voice assignments: ${detectiveName} (${detectiveGender}) -> ${detectiveVoice}, ${witness.name} (${witnessGender}) -> ${witnessVoice}`);

      // Generate audio file
      audioId = await generateAudio(conversation, characters);
      
    } catch (error: any) {
      console.error('Error generating witness audio:', error);
      // Continue without audio - it's not critical
    }

    operationStatusManager.updateOperation(operationId, {
      progress: 80,
      message: 'Analyzing interview findings...'
    });

    // Analyze witness interview for automatic findings
    try {
      console.log("Analyzing witness interview for findings...");
      
      const findingsPrompt = `Analyze this witness interview and extract key findings that would be important for a murder investigation.

WITNESS INTERVIEW TRANSCRIPT:
${conversation}

CONTEXT:
- Witness: ${witness.name} (${witness.role})
- Reliability: ${witness.reliability}
- Victim: ${caseData.story.victim.name}
- Setting: ${caseData.story.setting}

Extract 1-3 key findings from this interview. For each finding, determine:
1. The specific information revealed
2. Its importance level (critical/important/minor)
3. Whether it's reliable based on the witness's credibility

Return a JSON array of findings:
[
  {
    "finding": "specific information revealed",
    "importance": "critical|important|minor",
    "source": "witness interview with ${witness.name}"
  }
]`;

      const findingsResponse = await generate(findingsPrompt);
      
      // Parse findings and add to database
      try {
        const jsonMatch = findingsResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const findings = JSON.parse(jsonMatch[0]);
          
          for (const finding of findings) {
            await addInvestigationFinding(caseId, {
              source: 'location_visit',
              sourceDetails: `Witness interview with ${witness.name}${locationName ? ` at ${locationName}` : ''}`,
              finding: finding.finding,
              importance: finding.importance || 'minor'
            });
          }
          
          console.log(`Added ${findings.length} findings from witness interview`);
        }
      } catch (error: any) {
        console.error('Error parsing or saving witness findings:', error);
      }
      
    } catch (error: any) {
      console.error("Error analyzing witness interview:", error);
    }

    // Complete the operation
    operationStatusManager.updateOperation(operationId, {
      status: 'completed',
      progress: 100,
      message: 'Witness interview completed successfully!',
      result: {
        success: true,
        message: "Witness interviewed successfully",
        conversation,
        audioId,
        witness: {
          name: witness.name,
          role: witness.role,
          reliability: witness.reliability
        }
      }
    });

    console.log(`Witness interview operation ${operationId} completed successfully`);

  } catch (error: any) {
    console.error(`Background witness interview failed for operation ${operationId}:`, error);
    operationStatusManager.updateOperation(operationId, {
      status: 'failed',
      error: error.message || 'Witness interview processing failed'
    });
    throw error;
  }
}

export const POST = handlePOST; 