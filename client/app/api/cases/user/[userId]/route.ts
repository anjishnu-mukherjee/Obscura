import { NextRequest, NextResponse } from "next/server";
import { getUserCases } from "@/lib/gameDb";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'active' | 'completed' | 'archived' | undefined;
    const limit = searchParams.get('limit');
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log("Fetching cases for user:", userId);

    const result = await getUserCases(userId, status);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    let cases = result.cases;
    
    // Apply limit if specified
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        cases = cases.slice(0, limitNum);
      }
    }

    return NextResponse.json({
      success: true,
      cases
    });

  } catch (error) {
    console.error("Error fetching user cases:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 