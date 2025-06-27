import { NextRequest, NextResponse } from "next/server";
import { getInvestigationFindings } from "@/lib/gameDb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json(
        { error: "Case ID is required" },
        { status: 400 }
      );
    }

    console.log("Fetching investigation findings for case:", caseId);

    const result = await getInvestigationFindings(caseId);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      findings: result.findings
    });

  } catch (error) {
    console.error("Error fetching investigation findings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 