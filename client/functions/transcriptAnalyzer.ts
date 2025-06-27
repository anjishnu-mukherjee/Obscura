import { generate } from './generate';
import { InvestigationFinding } from './types';

interface AnalysisResult {
  findings: Array<{
    finding: string;
    importance: 'critical' | 'important' | 'minor';
    isNew: boolean;
  }>;
  cluesRevealed: string[];
  suspiciousAnswers: string[];
  inconsistencies: string[];
}

/**
 * Analyzes an interrogation transcript to extract major findings
 */
export async function analyzeInterrogationTranscript(
  transcript: string,
  suspectName: string,
  caseContext: {
    victimName: string;
    setting: string;
    timelineEvents: string[];
    existingFindings: string[];
    suspectRole: string;
    suspectIsKiller: boolean;
  }
): Promise<AnalysisResult> {
  const analysisPrompt = `You are a detective AI analyzing an interrogation transcript for a murder investigation. Extract key findings, new information, and suspicious elements.

CASE CONTEXT:
- Victim: ${caseContext.victimName}
- Setting: ${caseContext.setting}
- Suspect: ${suspectName} (${caseContext.suspectRole})
- Timeline: ${caseContext.timelineEvents.join(', ')}
- Existing Findings: ${caseContext.existingFindings.join(', ') || 'None'}

INTERROGATION TRANSCRIPT:
${transcript}

IMPORTANT ANALYSIS GUIDELINES:
1. Focus on NEW information not previously known
2. Identify suspicious answers, evasions, or contradictions
3. Note any timeline inconsistencies
4. Look for potential clues revealed during conversation
5. Rate importance based on how helpful it is for solving the case

Please analyze and return ONLY a valid JSON object with this structure:
{
  "findings": [
    {
      "finding": "Description of what was discovered",
      "importance": "critical" | "important" | "minor",
      "isNew": true/false
    }
  ],
  "cluesRevealed": ["Any physical clues or evidence mentioned"],
  "suspiciousAnswers": ["Quotes that seemed evasive or suspicious"],
  "inconsistencies": ["Any contradictions with timeline or known facts"]
}

CRITICAL: Only include findings that are actually NEW information not already known. Be selective and focus on the most significant discoveries.`;

  try {
    const analysisResult = await generate(analysisPrompt);
    
    // Parse the JSON response
    const cleanedResult = analysisResult.trim();
    const jsonStart = cleanedResult.indexOf('{');
    const jsonEnd = cleanedResult.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No valid JSON found in analysis result');
    }
    
    const jsonString = cleanedResult.substring(jsonStart, jsonEnd);
    const parsed: AnalysisResult = JSON.parse(jsonString);
    
    // Validate the structure
    if (!parsed.findings || !Array.isArray(parsed.findings)) {
      throw new Error('Invalid analysis result structure');
    }
    
    return parsed;
  } catch (error) {
    console.error('Error analyzing interrogation transcript:', error);
    
    // Return fallback analysis
    return {
      findings: [{
        finding: `${suspectName} provided responses during interrogation - detailed analysis failed`,
        importance: 'minor' as const,
        isNew: true
      }],
      cluesRevealed: [],
      suspiciousAnswers: [],
      inconsistencies: []
    };
  }
}

/**
 * Extracts clues that may have been revealed based on trigger conditions
 */
export async function checkClueRevealedTriggers(
  transcript: string,
  suspectName: string,
  availableClues: Array<{
    clue: string;
    triggerType: 'pressing' | 'gentle' | 'aggressive' | 'sympathetic' | 'specific_question';
    triggerLevel: 1 | 2 | 3 | 4 | 5;
    triggerDescription: string;
    importance: 'critical' | 'important' | 'minor';
    isRedHerring: boolean;
  }>
): Promise<string[]> {
  if (!availableClues || availableClues.length === 0) {
    return [];
  }

  const triggerPrompt = `You are analyzing an interrogation to determine if any clues were revealed based on specific trigger conditions.

INTERROGATION TRANSCRIPT:
${transcript}

AVAILABLE CLUES WITH TRIGGERS:
${availableClues.map((clue, i) => 
  `${i + 1}. "${clue.clue}"
     Trigger: ${clue.triggerType} approach (level ${clue.triggerLevel})
     Required: ${clue.triggerDescription}
     Importance: ${clue.importance}`
).join('\n\n')}

Based on the interrogation style and responses, determine which clues (if any) would have been revealed. Consider:
- Was the approach aggressive, gentle, pressing, sympathetic, or specific questions?
- Did the interrogation meet the trigger requirements?
- Did the suspect seem pressured enough to reveal information?

Return ONLY a JSON array of clue texts that were revealed:
["clue text 1", "clue text 2"]

If no clues were revealed, return: []`;

  try {
    const result = await generate(triggerPrompt);
    const cleanedResult = result.trim();
    
    // Extract JSON array
    const arrayStart = cleanedResult.indexOf('[');
    const arrayEnd = cleanedResult.lastIndexOf(']') + 1;
    
    if (arrayStart === -1 || arrayEnd === 0) {
      return [];
    }
    
    const jsonString = cleanedResult.substring(arrayStart, arrayEnd);
    const revealedClues: string[] = JSON.parse(jsonString);
    
    return Array.isArray(revealedClues) ? revealedClues : [];
  } catch (error) {
    console.error('Error checking clue triggers:', error);
    return [];
  }
}

/**
 * Converts analysis results to InvestigationFinding format
 */
export function convertToInvestigationFindings(
  analysisResult: AnalysisResult,
  suspectName: string,
  caseId: string
): Array<Omit<InvestigationFinding, 'id' | 'timestamp'>> {
  const findings: Array<Omit<InvestigationFinding, 'id' | 'timestamp'>> = [];

  // Add main findings
  analysisResult.findings.forEach(finding => {
    if (finding.isNew) {
      findings.push({
        source: 'interrogation',
        sourceDetails: `Interrogation with ${suspectName}`,
        finding: finding.finding,
        importance: finding.importance,
        isNew: true
      });
    }
  });

  // Add suspicious answers as findings
  analysisResult.suspiciousAnswers.forEach(answer => {
    findings.push({
      source: 'interrogation',
      sourceDetails: `Suspicious response from ${suspectName}`,
      finding: `Suspicious answer: "${answer}"`,
      importance: 'important',
      isNew: true
    });
  });

  // Add inconsistencies as findings
  analysisResult.inconsistencies.forEach(inconsistency => {
    findings.push({
      source: 'interrogation',
      sourceDetails: `Timeline inconsistency - ${suspectName}`,
      finding: `Inconsistency detected: ${inconsistency}`,
      importance: 'critical',
      isNew: true
    });
  });

  return findings;
} 