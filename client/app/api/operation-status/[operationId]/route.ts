import { NextRequest, NextResponse } from "next/server";
import { operationStatusManager } from "@/lib/operationStatus";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ operationId: string }> }
) {
  try {
    const { operationId } = await params;
    
    console.log('Operation status endpoint called for:', operationId);
    
    if (!operationId) {
      return NextResponse.json(
        { error: "Operation ID is required" },
        { status: 400 }
      );
    }

    // Get operation status
    const operation = operationStatusManager.getOperation(operationId);
    
    if (!operation) {
      console.log('Operation not found:', operationId);
      console.log('All available operations:', operationStatusManager.listOperations());
      return NextResponse.json(
        { error: "Operation not found", availableOperations: operationStatusManager.listOperations() },
        { status: 404 }
      );
    }

    console.log('Operation found:', operation);

    // Return status and result if completed
    return NextResponse.json({
      success: true,
      operationId: operation.id,
      type: operation.type,
      status: operation.status,
      progress: operation.progress,
      message: operation.message,
      isComplete: operation.status !== 'processing',
      startTime: operation.startTime,
      endTime: operation.endTime,
      result: operation.status === 'completed' ? operation.result : undefined,
      error: operation.status === 'failed' ? operation.error : undefined
    });
  } catch (error) {
    console.error("Error checking operation status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 