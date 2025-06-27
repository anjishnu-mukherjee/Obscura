import { NextRequest, NextResponse } from "next/server";
import { saveNotepadEntry, updateNotepadEntry, deleteNotepadEntry } from "@/lib/gameDb";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// GET - Fetch notepad entries for a case
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const page = searchParams.get('page');

    if (!caseId) {
      return NextResponse.json(
        { error: "Case ID is required" },
        { status: 400 }
      );
    }

    console.log("Fetching notepad entries for case:", caseId);

    // Simple query without orderBy to avoid index requirement
    const q = query(
      collection(db, 'notepad'),
      where('caseId', '==', caseId)
    );
    
    const querySnapshot = await getDocs(q);
    const entries: any[] = [];
    
    querySnapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() });
    });

    // Sort client-side by createdAt (most recent first)
    entries.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    return NextResponse.json({
      success: true,
      entries: entries
    });

  } catch (error) {
    console.error("Error fetching notepad entries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new notepad entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, content } = body;

    if (!caseId || !content) {
      return NextResponse.json(
        { error: "Case ID and content are required" },
        { status: 400 }
      );
    }

    console.log("Creating notepad entry for case:", caseId);

    const result = await saveNotepadEntry({
      caseId,
      content: content.trim(),
      page: 1
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entryId: result.entryId
    });

  } catch (error) {
    console.error("Error creating notepad entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update existing notepad entry
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { entryId, content } = body;

    if (!entryId || !content) {
      return NextResponse.json(
        { error: "Entry ID and content are required" },
        { status: 400 }
      );
    }

    console.log("Updating notepad entry:", entryId);

    const result = await updateNotepadEntry(entryId, content.trim());

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error("Error updating notepad entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete notepad entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entryId');

    if (!entryId) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    console.log("Deleting notepad entry:", entryId);

    const result = await deleteNotepadEntry(entryId);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error("Error deleting notepad entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 