import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(request: NextRequest) {
   const { searchParams } = new URL(request.url);
   const id = searchParams.get("id");

   if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
   }

   try {
      const filePath = path.join(process.cwd(), "temp", `output-${id}.wav`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
         return NextResponse.json({ error: "Audio file not found" }, { status: 404 });
      }

      const audioBuffer = fs.readFileSync(filePath);

      // Return the audio file directly with proper headers
      return new NextResponse(audioBuffer, {
         headers: {
            "Content-Type": "audio/wav",
            "Content-Length": audioBuffer.length.toString(),
            "Cache-Control": "public, max-age=3600", // Cache for 1 hour
         },
      });
   } catch (error) {
      console.error("Error serving audio file:", error);
      return NextResponse.json({ error: "Failed to serve audio file" }, { status: 500 });
   }
}