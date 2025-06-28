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
import { generateGameClues, generateEnhancedStoryWithTriggers } from "@/functions/clueGenerator";
import { generateLocationMap } from "@/functions/mapGenerator";
import { generateImage } from "@/functions/generate";

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
    console.log("Generating basic story...");
    const basicStory = await generateStory();
    
    console.log("Enhancing story with AI-generated clue triggers...");
    const story = await generateEnhancedStoryWithTriggers(basicStory);
    
    const caseIntro = await composeCaseIntro(
      story,
      userResult.data.name,
      difficulty
    );
    const clues = await generateGameClues(story);
    const map = await generateLocationMap(story);

    // Generate crime scene images for each location
    console.log("Generating crime scene images for locations...");
    
    const locationsWithImages = await Promise.all(
      map.nodes.map(async (location) => {
        try {
          console.log(`Generating image for location: ${location.fullName}`);
          
          // Create a detailed prompt for the crime scene image
          const imagePrompt = `Crime scene investigation at ${location.fullName} in ${story.setting}, India. 
          Professional forensic photography style. 
          Location: ${location.fullName}. 
          Investigation scene with evidence markers, police tape, forensic equipment. 
          Realistic, professional crime scene documentation. 
          High detail, photographic quality, investigative atmosphere. 
          Indian setting and context. 
          No people visible, focus on the location and investigation setup.
          Context: This is related to the murder of ${story.victim.name} (${story.victim.profession}).`;

          // Generate the image
          const imageBlob = await generateImage(imagePrompt);
          
          // Convert blob to ArrayBuffer for Cloudinary upload
          const imageArrayBuffer = await imageBlob.arrayBuffer();
          
          // Generate filename for the location image
          const locationImageFileName = `location_${tempCaseId}_${location.id}_${Date.now()}`;
          
          // Upload to Cloudinary
          const uploadResult = await uploadImageFromArrayBuffer(
            imageArrayBuffer,
            locationImageFileName,
            "obscura/locations"
          );
          
          console.log(`Image uploaded for ${location.fullName}:`, uploadResult.secureUrl);
          
          return {
            ...location,
            imageUrl: uploadResult.secureUrl,
            imagePublicId: uploadResult.publicId
          };
        } catch (error) {
          console.error(`Failed to generate/upload image for ${location.fullName}:`, error);
          // Return location without image if generation fails
          return location;
        }
      })
    );

    // Update the map with the locations that now have images
    const updatedMap = {
      ...map,
      nodes: locationsWithImages
    };

    // Convert map image to ArrayBuffer
    const mapImage = await updatedMap.mapImage.arrayBuffer();

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
      map: updatedMap,
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
