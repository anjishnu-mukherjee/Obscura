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

    // Get case from database
    const result = await getCase(caseId);
    
    if (result.error || !result.data) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    // Return status and basic info
    return NextResponse.json({
      success: true,
      caseId: result.data.id,
      status: result.data.status,
      title: result.data.title,
      difficulty: result.data.difficulty,
      createdAt: result.data.createdAt,
      isComplete: result.data.status !== 'generating'
    });
  } catch (error) {
    console.error("Error checking case status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 