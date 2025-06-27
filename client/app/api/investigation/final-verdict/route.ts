import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';

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

    // Determine the correct suspect (this should be defined in your case structure)
    // For now, I'll assume there's a 'solution' field in the case data
    const correctSuspect = caseData.story?.solution?.culprit || caseData.story?.suspects?.[0]?.name;
    const isCorrect = suspectName.toLowerCase().trim() === correctSuspect?.toLowerCase().trim();

    // Calculate score based on various factors
    let score = 0;
    const baseScore = 100;
    
    if (isCorrect) {
      score = baseScore;
      
      // Bonus points for thorough investigation
      const progress = caseData.investigationProgress || {};
      const visitedLocations = Object.keys(progress.visitedLocations || {}).length;
      const interrogatedSuspects = Object.keys(progress.interrogatedSuspects || {}).length;
      const discoveredClues = progress.discoveredClues?.length || 0;
      
      // Add bonus points for investigation thoroughness
      score += visitedLocations * 10; // 10 points per location visited
      score += interrogatedSuspects * 15; // 15 points per suspect interrogated
      score += discoveredClues * 5; // 5 points per clue discovered
      
      // Bonus for detailed reasoning
      if (reasoning.length > 200) score += 20;
      if (reasoning.length > 500) score += 30;
      
      // Time bonus (less time = more points)
      const caseCreatedAt = caseData.createdAt?.seconds || Date.now() / 1000;
      const currentTime = Date.now() / 1000;
      const timeTaken = currentTime - caseCreatedAt;
      const daysTaken = Math.ceil(timeTaken / (24 * 60 * 60));
      
      if (daysTaken <= 1) score += 50;
      else if (daysTaken <= 3) score += 30;
      else if (daysTaken <= 7) score += 10;
      
    } else {
      // Partial points for effort
      score = Math.max(10, baseScore * 0.2); // Minimum 10 points, or 20% of base score
      
      // Small bonus for detailed reasoning even if wrong
      if (reasoning.length > 200) score += 10;
    }

    // Cap the maximum score
    score = Math.min(score, 500);

    // Update the case with the verdict
    const verdictData = {
      verdictSubmitted: true,
      verdict: {
        selectedSuspect: suspectName,
        reasoning: reasoning,
        isCorrect: isCorrect,
        score: Math.round(score),
        submittedAt: serverTimestamp(),
        correctSuspect: correctSuspect
      },
      completedAt: serverTimestamp(),
      status: 'completed'
    };

    await updateDoc(caseRef, verdictData);

    // Prepare response
    const response: VerdictResponse = {
      correct: isCorrect,
      score: Math.round(score),
      correctSuspect: correctSuspect
    };

    if (!isCorrect) {
      response.explanation = `The correct suspect was ${correctSuspect}. Review the evidence and clues you may have missed.`;
    } else {
      response.explanation = `Excellent detective work! You correctly identified ${correctSuspect} as the culprit.`;
    }

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
