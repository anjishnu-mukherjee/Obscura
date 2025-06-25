import { NextRequest, NextResponse } from "next/server";
import {
  generateAndStoreCase,
  estimateCaseDuration,
  generateCaseTags,
} from "@/lib/caseGenerator";
import { getUserData } from "@/lib/auth";
import {
  ClueType,
  DiscoveryRequirement,
  ClueCategory,
} from "@/functions/types";
import {
  uploadImageFromArrayBuffer,
  generateMapFileName,
} from "@/lib/cloudinary";

// Import your generation functions (adjust paths as needed)
import { generateStory } from "@/functions/storyGenerator";
import { composeCaseIntro } from "@/functions/caseIntroComposer";
import { generateGameClues } from "@/functions/clueGenerator";
import { generateLocationMap } from "@/functions/mapGenerator";

export async function POST(request: NextRequest) {
  try {
    console.log("Initializing new case...");

    // Parse request body
    const body = await request.json();
    const { userId, difficulty = "medium" } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const userResult = await getUserData(userId);
    if (userResult.error || !userResult.data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Generating case content...");

    // Generate all case content
    const story = await generateStory();
    const caseIntro = await composeCaseIntro(
      story,
      userResult.data.name,
      difficulty
    );
    const clues = await generateGameClues(story);
    const map = await generateLocationMap(story);

    // Convert map image to ArrayBuffer
    const mapImage = await map.mapImage.arrayBuffer();

    // Generate a temporary case ID for the filename
    const tempCaseId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const mapFileName = generateMapFileName(tempCaseId);

    console.log("Uploading map image to Cloudinary...");

    // Upload map image to Cloudinary
    let mapImageUrl: string | undefined;
    let mapImagePublicId: string | undefined;
    try {
      const uploadResult = await uploadImageFromArrayBuffer(
        mapImage,
        mapFileName,
        "obscura/maps"
      );
      mapImageUrl = uploadResult.secureUrl;
      mapImagePublicId = uploadResult.publicId;
      console.log("Map image uploaded successfully:", mapImageUrl);
    } catch (uploadError) {
      console.error("Failed to upload map image:", uploadError);
      // Continue without the map image - it's not critical for case creation
      mapImageUrl = undefined;
      mapImagePublicId = undefined;
    }

    const generatedData = {
      story,
      caseIntro,
      clues,
      map,
      mapImageUrl: mapImageUrl ?? "No map image",
      mapImagePublicId: mapImagePublicId ?? "No map image",
    };

    // Generate case title if not provided
    const title = story.title;

    // Calculate estimated duration
    const clueCount = Object.values(generatedData.clues).flat().length;
    const suspectCount = generatedData.story.suspects.length;
    const estimatedDuration = estimateCaseDuration(
      difficulty,
      clueCount,
      suspectCount
    );

    // Generate tags
    const tags = generateCaseTags(generatedData.story);

    console.log("Storing case in database...");

    // console.log(JSON.stringify(generatedData, null, 4));
    console.log("User ID: ", userId);
    console.log("Title: ", title);
    console.log("Difficulty: ", difficulty);
    console.log("Estimated Duration: ", estimatedDuration);
    console.log("Tags: ", tags);

    // Store the case in Firebase
    const result = await generateAndStoreCase(
      {
        userId,
        title,
        difficulty,
        estimatedDuration,
        tags,
      },
      generatedData
    );

    if (result.error) {
      console.error("Failed to store case:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // If we have a case ID and map image URL, update the Cloudinary filename with the real case ID
    if (result.caseId && mapImageUrl) {
      try {
        console.log("Case created with map image:", result.caseId);
      } catch (error) {
        console.error("Failed to update map filename:", error);
      }
    }

    console.log("Case initialized successfully:", result.caseId);

    return NextResponse.json({
      success: true,
      caseId: result.caseId,
      generatedData,
      title,
      estimatedDuration,
      tags,
      mapImageUrl,
    });
  } catch (error) {
    console.error("Error initializing case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
