import { NextRequest, NextResponse } from "next/server";
import { getLocationDiscoveredClues, getLocationImages } from "@/lib/gameDb";

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

    console.log("Getting location data for:", { caseId, locationId });

    // Get discovered clues for this location
    const cluesResult = await getLocationDiscoveredClues(caseId, locationId);
    if (cluesResult.error) {
      console.error("Error getting discovered clues:", cluesResult.error);
    }

    // Get generated images for this location
    const imagesResult = await getLocationImages(caseId, locationId);
    if (imagesResult.error) {
      console.error("Error getting location images:", imagesResult.error);
    }

    return NextResponse.json({
      success: true,
      discoveredClues: cluesResult.clues || [],
      savedImages: imagesResult.images || []
    });

  } catch (error) {
    console.error("Error getting location data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 