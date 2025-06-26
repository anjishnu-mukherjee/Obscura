import { NextRequest, NextResponse } from "next/server";
import { getCase } from "@/lib/gameDb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    
    if (!caseId) {
      return NextResponse.json(
        { error: "Case ID is required" },
        { status: 400 }
      );
    }

    console.log("Fetching case:", caseId);

    const result = await getCase(caseId);

    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error || "Case not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      case: result.data
    });

  } catch (error) {
    console.error("Error fetching case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 