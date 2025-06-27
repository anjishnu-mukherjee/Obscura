import { NextRequest, NextResponse } from "next/server";
import { getCase, getInvestigationFindings, getNotepadEntries } from "@/lib/gameDb";
import { generate } from "@/functions/generate";

export async function POST(request: NextRequest) {
  try {
    const { caseId, userQuery } = await request.json();

    if (!caseId) {
      return NextResponse.json(
        { error: "Case ID is required" },
        { status: 400 }
      );
    }

    console.log("Watson analyzing case:", caseId);

    // Gather all case information
    const [caseResult, findingsResult, notesResult] = await Promise.all([
      getCase(caseId),
      getInvestigationFindings(caseId),
      getNotepadEntries(caseId)
    ]);

    if (caseResult.error || !caseResult.data) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    const caseData = caseResult.data;
    const findings = findingsResult.findings || [];
    const notes = notesResult.entries || [];

    const overallFindings = await getInvestigationFindings(caseId);

    const revealedClues = caseData.story.suspects.flatMap(suspect => 
      suspect.cluesTriggers
        ?.filter(clue => clue.revealed === true)
        .map(clue => `${suspect.name} revaled the following clue which may be useful: ${clue.clue}`) || []
    ).join(', ');

    // Prepare context for AI
    const context = {
      case: {
        title: caseData.title,
        victim: caseData.story.victim,
        suspects: caseData.story.suspects,
        witnesses: caseData.story.witnesses,
        locations: caseData.story.locations,
        killer: caseData.story.killer // Watson knows this but won't reveal it directly
      },
      progress: caseData.investigationProgress || {
        visitedLocations: {},
        interrogatedSuspects: {},
        discoveredClues: [],
        investigationFindings: []
      },
      findings: findings,
      overallFindings: overallFindings.findings,
      userNotes: notes.map(note => note.content).join('\n\n'),
      revealedClues: revealedClues
    };

    // Create AI prompt for Watson
    const prompt = `You are Watson, a brilliant AI detective assistant helping solve a murder mystery. You are sharp, observant, and catch details others might miss.

CASE CONTEXT:
Title: ${context.case.title}
Victim: ${context.case.victim.name} (${context.case.victim.profession})
Cause of Death: ${context.case.victim.causeOfDeath}
Last Known Location: ${context.case.victim.lastKnownLocation}

SUSPECTS:
${context.case.suspects.map(s => `- ${s.name} (${s.role}): Alibi - ${s.alibi}, Motives - ${s.motives.join(', ')}`).join('\n')}

LOCATIONS: ${context.case.locations.join(', ')}

INVESTIGATION PROGRESS:
Visited Locations: ${Object.keys(context.progress.visitedLocations).join(', ') || 'None'}
Interrogated Suspects: ${Object.keys(context.progress.interrogatedSuspects).join(', ') || 'None'}
Discovered Clues: ${context.progress.discoveredClues.join(', ') || 'None'}

INVESTIGATION FINDINGS:
${findings.map(f => `- ${f.finding} (from ${f.source}: ${f.sourceDetails})`).join('\n') || 'No findings yet'}

OVERALL FINDINGS:
${Array.isArray(context.overallFindings) ? context.overallFindings.map((f: any) => `- ${f.finding} (from ${f.source}: ${f.sourceDetails})`).join('\n') : 'No findings yet'}

USER'S NOTES:
${context.userNotes || 'No notes yet'}

REVEALED CLUES:
${context.revealedClues || 'No clues revealed yet'}

${userQuery ? `USER QUESTION: ${userQuery}` : 'The detective seems lost and needs guidance.'}

As Watson, provide helpful analysis and suggestions. But also remember to answer what the user has asked or said appropriately. Focus on:
1. Patterns you notice that the detective might have missed
2. Inconsistencies in alibis or testimonies
3. Clues that need follow-up
4. Suspects or locations that deserve more attention
5. Next logical steps in the investigation


DO NOT GIVE YOUR OBSERVATIONS OR THOUGHTS TO THE USER UNLESS THE USER HAS ASKED FOR THEM OR ARE REQUESTING FOR YOUR HELP OR ARE FEELING STUCK OR CONFUSED.

The possible actions that the detective can take are:
- Interrogate a suspect
- Visit a location
- Interrogate a witness in any location

Be encouraging but sharp. Point out overlooked details. Suggest specific actions like "You should interrogate [suspect] about [specific topic]" or "Visit [location] to look for [specific evidence]".

Keep your response conversational and friendly, like Sherlock Holmes' Watson but with modern detective knowledge. Limit to short responses, unless the user has asked something that would require a longer response.

YOUR RESPONSE SHOULD BE IN PLAINTEXT CONVERSATIONAL FORMAT. NO HUGE ASS PARAGRAPHS. YOU ARE CONVERSING WITH A PERSON. REMEMBER THAT.`;

    // Generate Watson's response
    const watsonResponse = await generate(prompt);

    return NextResponse.json({
      success: true,
      response: watsonResponse,
      context: {
        visitedLocations: Object.keys(context.progress.visitedLocations).length,
        interrogatedSuspects: Object.keys(context.progress.interrogatedSuspects).length,
        findingsCount: findings.length,
        notesCount: notes.length
      }
    });

  } catch (error) {
    console.error("Error generating Watson response:", error);
    return NextResponse.json(
      { error: "Failed to generate Watson response" },
      { status: 500 }
    );
  }
} 