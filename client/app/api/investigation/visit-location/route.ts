import { NextRequest, NextResponse } from "next/server";
import { visitLocation, getCase } from "@/lib/gameDb";

// Helper function to get current IST date string
const getCurrentISTDate = (): string => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

// Helper function to check if a location can be visited today
const canVisitLocation = (progress: any, locationId: string): boolean => {
  const today = getCurrentISTDate();
  const locationVisit = progress.visitedLocations[locationId];
  
  if (!locationVisit) return true; // Never visited
  return locationVisit.lastVisitDate !== today; // Can visit if not visited today
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, locationId } = body;

    if (!caseId || !locationId) {
      return NextResponse.json(
        { error: "Case ID and Location ID are required" },
        { status: 400 }
      );
    }

    console.log("Processing location visit:", { caseId, locationId });

    // Get current case data to check cooldown
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

    // Check if location can be visited today
    if (!canVisitLocation(progress, locationId)) {
      return NextResponse.json(
        { error: "You have already visited a location today. Try again tomorrow at 12 AM IST." },
        { status: 429 }
      );
    }

    // Visit the location
    const result = await visitLocation(caseId, locationId);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    console.log("Location visit successful");
    
    return NextResponse.json({
      success: true,
      message: "Location visited successfully",
      progress: result.progress,
      redirectTo: `/dashboard/investigate/${caseId}/location/${locationId}`
    });

  } catch (error) {
    console.error("Error processing location visit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 