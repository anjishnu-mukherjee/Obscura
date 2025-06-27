import { NextRequest, NextResponse } from "next/server";
import { addInvestigationFinding } from "@/lib/gameDb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, source, sourceDetails, finding, importance, isNew } = body;

    if (!caseId || !source || !sourceDetails || !finding || !importance) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Adding investigation finding for case:", caseId);

    const result = await addInvestigationFinding(caseId, {
      source,
      sourceDetails,
      finding,
      importance,
      isNew
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      findingId: result.findingId
    });

  } catch (error) {
    console.error("Error adding investigation finding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
