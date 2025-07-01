import { NextRequest, NextResponse } from "next/server";
import {
  estimateCaseDuration,
  generateCaseTags,
} from "@/lib/caseGenerator";
import { getUserData } from "@/lib/auth";
import { createCase, updateCase } from "@/lib/gameDb";
import {
  uploadImageFromArrayBuffer,
  generateMapFileName,
} from "@/lib/cloudinary";
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

    // Validate difficulty type
    const validDifficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    const validatedDifficulty: 'easy' | 'medium' | 'hard' = validDifficulties.includes(difficulty as any) ? (difficulty as 'easy' | 'medium' | 'hard') : 'medium';

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

    // Create case immediately with generating status and placeholder data
    const placeholderCaseData = {
      userId,
      title: "Brewing the Perfect Mystery...",
      story: {} as any, // Empty placeholder
      caseIntro: {} as any, // Empty placeholder
      clues: {} as any, // Empty placeholder
      map: {} as any, // Empty placeholder
      mapImageUrl: "",
      mapImagePublicId: "",
      status: 'generating' as const,
      difficulty: validatedDifficulty,
      estimatedDuration: 45, // Default estimate
      tags: ['mystery', 'detective']
    };

    console.log("Creating case with generating status...");
    const createResult = await createCase(placeholderCaseData);
    
    if (createResult.error || !createResult.caseId) {
      console.error("Failed to create initial case:", createResult.error);
      return NextResponse.json({ error: createResult.error }, { status: 500 });
    }

    const caseId = createResult.caseId;
    console.log("Case created with ID:", caseId, "- Starting background generation...");

    // Return immediately with the case ID
    const response = NextResponse.json({
      success: true,
      caseId,
      status: 'generating',
      message: "Case is being generated. Please wait..."
    });

    // Start background generation (don't await)
    generateCaseContent(caseId, userId, validatedDifficulty, userResult.data.name).catch(error => {
      console.error("Background generation failed for case:", caseId, error);
      // Update case with error status
      updateCase(caseId, { 
        status: 'archived' as const,
        title: "Generation Failed - Please Try Again"
      }).catch(updateError => {
        console.error("Failed to update case with error status:", updateError);
      });
    });

    return response;
  } catch (error) {
    console.error("Error initializing case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Background generation function
async function generateCaseContent(caseId: string, userId: string, difficulty: 'easy' | 'medium' | 'hard', userName: string) {
  try {
    console.log(`Starting background generation for case ${caseId}...`);

    // Generate all case content
    console.log("Generating basic story...");
    const basicStory = await generateStory();
    
    console.log("Enhancing story with AI-generated clue triggers...");
    const story = await generateEnhancedStoryWithTriggers(basicStory);
    
    const caseIntro = await composeCaseIntro(
      story,
      userName,
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
          const locationImageFileName = `location_${caseId}_${location.id}_${Date.now()}`;
          
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
    const mapFileName = generateMapFileName(caseId);

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
      mapImageUrl = undefined;
      mapImagePublicId = undefined;
    }

    // Generate case title
    const title = story.title;

    // Calculate estimated duration
    const clueCount = Object.values(clues).flat().length;
    const suspectCount = story.suspects.length;
    const estimatedDuration = estimateCaseDuration(
      difficulty,
      clueCount,
      suspectCount
    );

    // Generate tags
    const tags = generateCaseTags(story);

    // Update the case with all generated content
    const updateResult = await updateCase(caseId, {
      title,
      story,
      caseIntro,
      clues,
      map: updatedMap,
      mapImageUrl: mapImageUrl || "",
      mapImagePublicId: mapImagePublicId || "",
      status: 'active' as const,
      estimatedDuration,
      tags
    });

    if (updateResult.error) {
      console.error("Failed to update case with generated content:", updateResult.error);
      throw new Error("Failed to update case");
    }

    console.log(`Case ${caseId} generation completed successfully!`);
  } catch (error) {
    console.error(`Background generation failed for case ${caseId}:`, error);
    throw error;
  }
}
