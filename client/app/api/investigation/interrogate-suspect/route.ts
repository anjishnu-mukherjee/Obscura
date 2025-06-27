import { NextRequest, NextResponse } from "next/server";
import { interrogateSuspect, getCase, addInvestigationFinding } from "@/lib/gameDb";
import { generate, generateAudio } from "@/functions/generate";
import { uploadAudioFromArrayBuffer } from "@/lib/cloudinary";
import { analyzeInterrogationTranscript, convertToInvestigationFindings, checkClueRevealedTriggers } from "@/functions/transcriptAnalyzer";

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
      // Default fallback if response is unclear
      return Math.random() > 0.5 ? 'male' : 'female';
    }
  } catch (error) {
    console.error('Error detecting gender from name:', error);
    // Fallback to random if LLM fails
    return Math.random() > 0.5 ? 'male' : 'female';
  }
}

// Helper function to upload audio to Cloudinary
async function uploadAudioToCloudinary(audioBuffer: Buffer, caseId: string, suspectName: string): Promise<string> {
  try {
    // Upload to Cloudinary as audio file
    const result = await uploadAudioFromArrayBuffer(
      audioBuffer.buffer as ArrayBuffer,
      `interrogation_${caseId}_${suspectName.replace(/\s+/g, '_')}_${Date.now()}`,
      'obscura/audio'
    );
    
    return result.secureUrl;
  } catch (error) {
    console.error('Error uploading audio to Cloudinary:', error);
    // For now, return a placeholder URL if upload fails
    return `/audio/placeholder_${Date.now()}.wav`;
  }
}

// Helper function to get current IST date string
const getCurrentISTDate = (): string => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

// Helper function to check if a suspect can be interrogated today
const canInterrogateSuspect = (progress: any, suspectName: string): boolean => {
  const today = getCurrentISTDate();
  const suspectInterrogation = progress.interrogatedSuspects[suspectName];
  
  if (!suspectInterrogation) return true; // Never interrogated
  return suspectInterrogation.lastInterrogationDate !== today; // Can interrogate if not done today
};

async function POSThandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, suspectName, questions, name } = body;

    if (!caseId || !suspectName || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Case ID, suspect name, and questions array are required" },
        { status: 400 }
      );
    }

    console.log("Processing suspect interrogation:", { caseId, suspectName });

    // Get current case data to check cooldown and get suspect info
    const caseResult = await getCase(caseId);
    if (caseResult.error || !caseResult.data) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    const progress = caseResult.data.investigationProgress || {
      visitedLocations: {},
      interrogatedSuspects: {},
      discoveredClues: [],
      currentDay: 1
    };

    // Check if suspect can be interrogated today
    if (!canInterrogateSuspect(progress, suspectName)) {
      return NextResponse.json(
        { error: "You have already interrogated a suspect today. Try again tomorrow at 12 AM IST." },
        { status: 429 }
      );
    }

    // Find the suspect in the story
    const suspect = caseResult.data.story.suspects.find(s => s.name === suspectName);
    if (!suspect) {
      return NextResponse.json(
        { error: "Suspect not found" },
        { status: 404 }
      );
    }

    console.log("Generating conversation flow...");

    // Generate conversation flow
    const suspectData = (progress.interrogatedSuspects as any)?.[suspectName];
    const previousQuestions: string[] = suspectData?.questionsAsked || [];
    const previousQuestionsText = previousQuestions.length > 0 
      ? `\n\nPrevious questions asked to this suspect:\n${previousQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`
      : '';

    const conversationPrompt = `You are creating a realistic interrogation conversation between ${name} and ${suspect.name}, a suspect in a murder investigation.

CASE CONTEXT:
- Victim: ${caseResult.data.story.victim.name} (${caseResult.data.story.victim.profession})
- Setting: ${caseResult.data.story.setting}
- Suspect role: ${suspect.role}
- Suspect personality: ${suspect.personality}
- Suspect alibi: ${suspect.alibi}
- Suspect motives: ${suspect.motives.join(', ')}
- Is suspect the killer: ${suspect.isKiller ? 'YES (but they will NOT confess and will be evasive)' : 'NO (they are innocent but may act nervous)'}
- Detective's name: ${name}

DETECTIVE'S PLANNED QUESTIONS:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}${previousQuestionsText}

INSTRUCTIONS:
1. Create a natural conversation flow using these questions as a guide
2. ${name} should ask the questions in a logical order, building on responses
3. ${suspect.name} should respond authentically based on their personality and guilt status
4. ${suspect.isKiller ? `${suspect.name} IS the killer but will NOT confess. They should be evasive, defensive, or misleading when pressed.` : `${suspect.name} is INNOCENT and should be helpful but may show nervousness or frustration.`}
5. Include natural conversation elements like follow-up questions, clarifications, etc.
6. Include audio cues, pauses and other natural conversation elements that can be conveyed via audio, but do not inclue actions or descriptions of actions.
7. Keep each response realistic (not too long or short)
8. End the conversation naturally when ${name} has gathered sufficient information

FORMAT:
${name}: [statement/question]
${suspect.name}: [response]
${name}: [follow-up]
${suspect.name}: [response]
...

There should be no other text before or after the conversation.
Generate the complete interrogation conversation:`;

    let conversation: string;
    try {
      conversation = await generate(conversationPrompt);
      conversation = conversation.trim();
    } catch (error) {
      console.error('Error generating conversation:', error);
      
      // Fallback conversation
      conversation = `${name}: ${questions[0]}\n${suspect.name}: I've already told you everything I know. ${suspect.alibi}\n${name}: Thank you for your cooperation.\n${suspect.name}: I just want to help find who did this.`;
    }

    console.log("Generating audio...");

    // Generate audio
    let audioId: string = "";
    try {
      // Determine voices based on gender detection using LLM
      const maleVoices = ["Puck", "Charon"];
      const femaleVoices = ["Zephyr", "Kore"];
      
      // Detect genders using LLM
      const detectiveGender = await detectGenderFromName(name); // Give detective a name
      const suspectGender = await detectGenderFromName(suspect.name);
      
      // Assign voices based on detected genders
      const suspectVoice = suspectGender === 'male' 
        ? maleVoices[Math.floor(Math.random() * maleVoices.length)]
        : femaleVoices[Math.floor(Math.random() * femaleVoices.length)];
        
      const detectiveVoice = detectiveGender === 'male'
        ? maleVoices[Math.floor(Math.random() * maleVoices.length)]
        : femaleVoices[Math.floor(Math.random() * femaleVoices.length)];

      const characters = [
        { name: name, voice: detectiveVoice },
        { name: suspect.name, voice: suspectVoice }
      ];
      
      console.log(`Voice assignments: ${name} (${detectiveGender}) -> ${detectiveVoice}, ${suspect.name} (${suspectGender}) -> ${suspectVoice}`);

      // Generate audio file
      audioId = await generateAudio(conversation, characters);
      
    } catch (error) {
      console.error('Error generating audio:', error);
      // Continue without audio - it's not critical
    }

    // Record the interrogation with the full conversation
    const result = await interrogateSuspect(caseId, suspectName, questions.join('\n'), conversation);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    console.log("Suspect interrogation successful");

    // Analyze the interrogation transcript for findings
    try {
      console.log("Analyzing interrogation transcript...");
      
      const caseContext = {
        victimName: caseResult.data.story.victim.name,
        setting: caseResult.data.story.setting,
        timelineEvents: caseResult.data.story.timeline.map((t: any) => `${t.time}: ${t.event}`),
        existingFindings: caseResult.data.investigationProgress?.investigationFindings?.map((f: any) => f.finding) || [],
        suspectRole: suspect.role,
        suspectIsKiller: suspect.isKiller
      };

      const analysisResult = await analyzeInterrogationTranscript(
        conversation,
        suspectName,
        caseContext
      );

      // Convert analysis to investigation findings
      const findings = convertToInvestigationFindings(analysisResult, suspectName, caseId);

      // Save findings to database
      for (const finding of findings) {
        try {
          await addInvestigationFinding(caseId, finding);
        } catch (error) {
          console.error('Error saving investigation finding:', error);
        }
      }

      // Check for clue triggers if suspect has clues
      if (suspect.cluesTriggers && suspect.cluesTriggers.length > 0) {
        console.log("Checking clue triggers...");
        const revealedClues = await checkClueRevealedTriggers(
          conversation,
          suspectName,
          suspect.cluesTriggers
        );

        if (revealedClues.length > 0) {
          console.log(`${revealedClues.length} clues revealed:`, revealedClues);
          // Mark clues as revealed (this would be implemented later)
        }
      }

      console.log(`Analysis complete. Found ${findings.length} new findings.`);
    } catch (error) {
      console.error("Error analyzing interrogation:", error);
      // Don't fail the whole request if analysis fails
    }

    // Fallback: no audio, return JSON
    return NextResponse.json({
      success: true,
      message: "Suspect interrogated successfully",
      conversation,
      audioId
    });

  } catch (error) {
    console.error("Error processing suspect interrogation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 

export {
  POSThandler as POST
}