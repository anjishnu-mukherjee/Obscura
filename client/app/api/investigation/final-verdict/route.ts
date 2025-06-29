import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { generate } from '@/functions/generate';
import { Suspect } from '@/functions/types';
import { parseUntilJson } from '@/functions/parseUntilJson';

interface VerdictRequest {
  caseId: string;
  suspectName: string;
  reasoning: string;
}

interface VerdictResponse {
  correct: boolean;
  score: number;
  correctSuspect?: string;
  explanation?: string;
  error?: string;
  aiAnalysis?: {
    explanation: string;
    nameCorrect: boolean;
    motiveAccuracy: number;
    evidenceQuality: number;
    detailScore: number;
    totalScore: number;
    feedback: string;
    keyInsights: string[];
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<VerdictResponse>> {
  try {
    const body: VerdictRequest = await request.json();
    const { caseId, suspectName, reasoning } = body;

    if (!caseId || !suspectName || !reasoning) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        correct: false, 
        score: 0 
      }, { status: 400 });
    }

    // Get the case data
    const caseRef = doc(db, 'cases', caseId);
    const caseDoc = await getDoc(caseRef);

    if (!caseDoc.exists()) {
      return NextResponse.json({ 
        error: 'Case not found', 
        correct: false, 
        score: 0 
      }, { status: 404 });
    }

    const caseData = caseDoc.data();

    // Check if verdict already submitted
    if (caseData.verdictSubmitted) {
      return NextResponse.json({ 
        error: 'Verdict already submitted for this case', 
        correct: false, 
        score: 0 
      }, { status: 400 });
    }

    const correctSuspect = caseData.story?.killer;
    const suspects: Suspect[] = caseData.story?.suspects || [];
    
    // Find the killer suspect to get their motives
    const killerSuspect = suspects.find((suspect: Suspect) => 
      suspect.name.toLowerCase().trim() === correctSuspect?.toLowerCase().trim()
    );

    if (!killerSuspect) {
      return NextResponse.json({ 
        error: 'Killer suspect data not found', 
        correct: false, 
        score: 0 
      }, { status: 500 });
    }

    // Use AI to analyze the verdict
    const analysisPrompt = `
You are an expert detective analyzing a murder case verdict. You need to evaluate whether the suspect identification and reasoning are correct.

CASE INFORMATION:
- Correct Killer: ${correctSuspect}
- Killer's Actual Motives: ${killerSuspect.motives.join(', ')}
- Killer's Role: ${killerSuspect.role}
- Killer's Personality: ${killerSuspect.personality}

PLAYER'S VERDICT:
- Selected Suspect: ${suspectName}
- Player's Reasoning: ${reasoning}

EVALUATION CRITERIA:
1. Name Accuracy: Did they identify the correct suspect? (40 points)
2. Motive Understanding: How well does their reasoning align with the killer's actual motives? (30 points)
3. Evidence Quality: How well-supported is their reasoning with logical deduction? (20 points)
4. Detail and Insight: How thorough and insightful is their analysis? (10 points)

Also provide individual scores for each of the above criteria, and a total score which is an overall performance score.

Please provide a JSON response with the following structure:
{
  "nameCorrect": boolean,
  "motiveAccuracy": number (0-100),
  "evidenceQuality": number (0-100),
  "detailScore": number (0-100),
  "totalScore": number (0-100),
  "explanation": "a short encouraging explanation of your analysis addressed to the detective",
  "feedback": "detailed explanation of the analysis",
  "keyInsights": ["array of key insights they got right or wrong"]
}

Be fair but thorough in your analysis. Even if they got the name wrong, they can still score points for good reasoning and understanding of motives.

If you are using special characters in any of the fields, make sure to escape them. For example, if you are using a quote, you should escape it with a backslash.

There should be no other text or backticks in the response before or after the JSON.`;

    let aiAnalysis;
    try {
      const aiResponse = await generate(analysisPrompt);
      // Extract JSON from the response
      aiAnalysis = parseUntilJson(aiResponse);
      console.log("AI Response: ", aiAnalysis);
    } catch (error) {
      console.error('Error analyzing verdict with AI:', error);
      // Fallback to simple name checking
      const isCorrect = suspectName.toLowerCase().trim() === correctSuspect?.toLowerCase().trim();
      aiAnalysis = {
        nameCorrect: isCorrect,
        motiveAccuracy: isCorrect ? 70 : 0,
        evidenceQuality: reasoning.length > 100 ? 50 : 20,
        detailScore: reasoning.length > 200 ? 60 : 30,
        totalScore: isCorrect ? 70 : 20,
        feedback: isCorrect ? "Correct suspect identified but detailed analysis unavailable." : "Incorrect suspect. AI analysis unavailable.",
        explanation: isCorrect ? "Correct suspect identified but detailed analysis unavailable." : "Incorrect suspect. AI analysis unavailable.",
        keyInsights: []
      };
    }

    // Ensure all required fields are present in aiAnalysis
    aiAnalysis = {
      nameCorrect: aiAnalysis.nameCorrect ?? false,
      motiveAccuracy: aiAnalysis.motiveAccuracy ?? 0,
      evidenceQuality: aiAnalysis.evidenceQuality ?? 0,
      detailScore: aiAnalysis.detailScore ?? 0,
      totalScore: aiAnalysis.totalScore ?? 0,
      feedback: aiAnalysis.feedback ?? "Analysis unavailable",
      explanation: aiAnalysis.explanation ?? "Analysis unavailable",
      keyInsights: aiAnalysis.keyInsights ?? []
    };

    // Calculate final score with investigation bonuses
    let baseScore = Math.round(aiAnalysis.totalScore * 4); // Convert 0-100 to 0-400 base points
    
    // Bonus points for thorough investigation
    const progress = caseData.investigationProgress || {};
    const visitedLocations = Object.keys(progress.visitedLocations || {}).length;
    const interrogatedSuspects = Object.keys(progress.interrogatedSuspects || {}).length;
    const discoveredClues = progress.discoveredClues?.length || 0;
    
    // Add bonus points for investigation thoroughness
    baseScore += visitedLocations * 10; // 10 points per location visited
    baseScore += interrogatedSuspects * 15; // 15 points per suspect interrogated
    baseScore += discoveredClues * 5; // 5 points per clue discovered
    
    // Time bonus (less time = more points)
    const caseCreatedAt = caseData.createdAt?.seconds || Date.now() / 1000;
    const currentTime = Date.now() / 1000;
    const timeTaken = currentTime - caseCreatedAt;
    const daysTaken = Math.ceil(timeTaken / (24 * 60 * 60));
    
    if (daysTaken <= 1) baseScore += 50;
    else if (daysTaken <= 3) baseScore += 30;
    else if (daysTaken <= 7) baseScore += 10;

    // Cap the maximum score
    const finalScore = Math.min(baseScore, 600);

    // Update the case with the verdict
    const verdictData = {
      verdictSubmitted: true,
      verdict: {
        selectedSuspect: suspectName,
        reasoning: reasoning,
        isCorrect: aiAnalysis.nameCorrect,
        score: Math.round(finalScore),
        submittedAt: serverTimestamp(),
        correctSuspect: correctSuspect,
        aiAnalysis: {
          nameCorrect: aiAnalysis.nameCorrect,
          motiveAccuracy: aiAnalysis.motiveAccuracy,
          evidenceQuality: aiAnalysis.evidenceQuality,
          detailScore: aiAnalysis.detailScore,
          totalScore: aiAnalysis.totalScore,
          feedback: aiAnalysis.feedback,
          explanation: aiAnalysis.explanation,
          keyInsights: aiAnalysis.keyInsights
        }
      },
      completedAt: serverTimestamp(),
      status: 'completed'
    };

    await updateDoc(caseRef, verdictData);

    // Prepare comprehensive response with all case data
    const response: VerdictResponse & {
      victim?: any;
      realKiller?: any;
      accusedSuspect?: string;
      caseSummary?: string;
    } = {
      correct: aiAnalysis.nameCorrect,
      score: Math.round(finalScore),
      correctSuspect: correctSuspect,
      explanation: aiAnalysis.explanation,
      // Add victim information
      victim: {
        name: caseData.story?.victim?.name,
        portrait: caseData.story?.victim?.portrait,
        profession: caseData.story?.victim?.profession || caseData.story?.victim?.role,
        causeOfDeath: caseData.story?.victim?.causeOfDeath || "Murder",
        deathTimeEstimate: caseData.story?.victim?.timeOfDeath || "Unknown"
      },
      // Add real killer information
      realKiller: {
        name: correctSuspect,
        portrait: killerSuspect?.portrait,
        role: killerSuspect?.role
      },
      // Add accused suspect
      accusedSuspect: suspectName,
      // Add case summary
      caseSummary: `In this case, ${caseData.story?.victim?.name} was murdered by ${correctSuspect}. ${
        aiAnalysis.nameCorrect 
          ? 'Your investigation successfully identified the correct perpetrator.' 
          : `You identified ${suspectName} as the killer, but the real murderer was ${correctSuspect}.`
      } ${aiAnalysis.feedback}`,
      aiAnalysis: {
        explanation: aiAnalysis.explanation,
        nameCorrect: aiAnalysis.nameCorrect,
        motiveAccuracy: aiAnalysis.motiveAccuracy,
        evidenceQuality: aiAnalysis.evidenceQuality,
        detailScore: aiAnalysis.detailScore,
        totalScore: aiAnalysis.totalScore,
        feedback: aiAnalysis.feedback,
        keyInsights: aiAnalysis.keyInsights
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error processing verdict:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      correct: false, 
      score: 0 
    }, { status: 500 });
  }
}
