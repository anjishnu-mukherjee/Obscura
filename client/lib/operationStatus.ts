// Simple in-memory status tracking for background operations
// In production, this could be moved to Redis or database

interface OperationStatus {
  id: string;
  type: 'interrogate-suspect' | 'interrogate-witness' | 'investigate-location';
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}

// Global singleton pattern to ensure same instance across all API routes
declare global {
  var operationsMap: Map<string, OperationStatus> | undefined;
}

class OperationStatusManager {
  private operations: Map<string, OperationStatus>;

  constructor() {
    // Use global variable to ensure singleton across hot reloads and different API routes
    if (!global.operationsMap) {
      global.operationsMap = new Map<string, OperationStatus>();
      console.log('Created new global operations map');
    }
    this.operations = global.operationsMap;
  }

  createOperation(
    type: 'interrogate-suspect' | 'interrogate-witness' | 'investigate-location',
    message: string = 'Starting operation...'
  ): string {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const operation = {
      id,
      type,
      status: 'processing' as const,
      progress: 10,
      message,
      startTime: new Date()
    };
    
    this.operations.set(id, operation);
    console.log('Operation created:', id, 'Total operations:', this.operations.size);
    console.log('Global operations map size:', global.operationsMap?.size);

    return id;
  }

  updateOperation(
    id: string, 
    updates: {
      progress?: number;
      message?: string;
      status?: 'processing' | 'completed' | 'failed';
      result?: any;
      error?: string;
    }
  ): void {
    const operation = this.operations.get(id);
    if (operation) {
      Object.assign(operation, updates);
      if (updates.status === 'completed' || updates.status === 'failed') {
        operation.endTime = new Date();
      }
      console.log(`Operation ${id} updated:`, { 
        status: operation.status, 
        progress: operation.progress, 
        message: operation.message 
      });
    } else {
      console.error(`Attempted to update non-existent operation: ${id}`);
      console.log('Available operations for update:', Array.from(this.operations.keys()));
    }
  }

  getOperation(id: string): OperationStatus | null {
    console.log('Getting operation:', id);
    console.log('Available operations:', Array.from(this.operations.keys()));
    console.log('Global operations map size:', global.operationsMap?.size);
    return this.operations.get(id) || null;
  }

  // Clean up old operations (older than 1 hour)
  cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [id, operation] of this.operations.entries()) {
      if (operation.startTime < oneHourAgo) {
        this.operations.delete(id);
      }
    }
  }

  // Debug method to list all operations
  listOperations(): string[] {
    return Array.from(this.operations.keys());
  }
}

// Singleton instance
export const operationStatusManager = new OperationStatusManager();

// Clean up every 30 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    operationStatusManager.cleanup();
  }, 30 * 60 * 1000);
} 